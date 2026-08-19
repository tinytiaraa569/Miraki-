import mongoose from "mongoose"
import { getTenantModels } from "../../config/tenantDb.js"
import { ApiError } from "../../utils/apiError.js"
import { deleteCategoryImage, deleteMetafieldDir, saveCategoryImage } from "../../utils/uploads.js"
import { audit } from "../audit/audit.service.js"
import { persistMetafieldImages } from "../metafields/metafieldValue.uploads.js"
import { validateValuesAgainstDefinition } from "../metafields/metafieldValue.validation.js"

// Entity folder name used to scope this module's uploads (matches
// utils/uploads.js saveCategoryImage -> /uploads/category/<id>/...). Metafield
// images are nested under the same root so they are cleaned up together.
const CATEGORY_UPLOAD_OWNER = "category"

// The stored module binding for category metafields (matches the frontend's
// normalizeModule("categories") -> "ms.categories"). Definition-driven values
// are stored StoreHippo-style DIRECTLY on the category doc (`category
// .metafields`), validated + coerced against this module's live definition on
// every save — identical to product.service.js's buildProductMetafields.
const CATEGORY_METAFIELD_MODULE = "ms.categories"

// Validate + coerce an incoming keyed metafield object against the live
// ms.categories definition and return the clean, native-typed object to embed
// on the category. STRICT ("check properly"): a value that fails validation
// BLOCKS the whole save with a 422 listing every offending field. Returns:
//   • `undefined`  — caller did not send `metafields` (leave stored copy as-is
//                    on update; omit on create).
//   • `{}`         — no definition exists yet; nothing to validate against.
//   • cleaned obj  — validation passed; the coerced object to embed.
// Returns { metafields, fields }:
//   • metafields — `undefined` (not sent), `{}` (no definition), or cleaned obj
//   • fields     — the live definition's fields[] (or null), needed to persist
//                  any nested base64 metafield images to disk after save.
async function buildCategoryMetafields({ MetafieldDefinition, parentStoreId, input }) {
  if (input === undefined) return { metafields: undefined, fields: null }
  const def = await MetafieldDefinition.findOne({
    parentStoreId,
    module: CATEGORY_METAFIELD_MODULE,
    deletedAt: null,
  }).lean()
  if (!def) return { metafields: {}, fields: null }

  const { ok, data, errors } = validateValuesAgainstDefinition(def.fields, input ?? {})
  if (!ok) {
    const detail = (errors ?? []).map((e) => `${e.path} ${e.message}`).join("; ")
    throw new ApiError(422, detail ? `Metafield validation failed: ${detail}` : "Metafield validation failed")
  }
  return { metafields: data ?? {}, fields: def.fields }
}

// All functions run AFTER loadUser: seller + tenantDbName are trusted, and the
// route gate already restricted access to SELLER_SUPERADMIN. Every query is
// scoped by parentStoreId (the tenant's single main store) so one seller can
// never read or mutate another's tree.

const oid = (v) => new mongoose.Types.ObjectId(String(v))

const SORTS = {
  sortOrder: { sortOrder: 1, name: 1 },
  "-sortOrder": { sortOrder: -1, name: -1 },
  name: { name: 1 },
  "-name": { name: -1 },
  createdAt: { createdAt: 1 },
  "-createdAt": { createdAt: -1 },
}

// Escape regex metacharacters — the search box must never become an injection.
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// Columns the tree/list renders — kept lean, never the full nested payload.
const TREE_PROJECTION = {
  name: 1,
  alias: 1,
  parentId: 1,
  depth: 1,
  sortOrder: 1,
  status: 1,
  isActive: 1,
  childrenCount: 1,
  isDeleted: 1,
  deletedAt: 1,
  createdAt: 1,
  updatedAt: 1,
  // First image only — the row thumbnail.
  thumbnail: { $ifNull: [{ $arrayElemAt: ["$images.url", 0] }, null] },
}

// ---------------------------------------------------------------------------
// LIST — lazy, one node level at a time (N-level tree).
//   • no `q`      -> direct children of `parentId` (null => roots)
//   • with `q`    -> flat search across ALL levels (name / alias)
// Single aggregation round-trip; projects only the columns the tree needs and
// adds `hasChildren` so the client can draw the expand chevron for free.
// ---------------------------------------------------------------------------
export async function listCategories({ seller, tenantDbName, query }) {
  const { Category } = getTenantModels(tenantDbName)

  const match = {
    parentStoreId: oid(seller.mainStoreId),
    deletedAt: query.deleted ? { $ne: null } : null,
  }

  const searching = Boolean(query.q?.trim())
  if (searching) {
    const rx = { $regex: escapeRegex(query.q.trim()), $options: "i" }
    match.$or = [{ name: rx }, { alias: rx }]
  } else if (query.flat) {
    // Flat: every category across all levels (for the parent / move picker).
    // No parentId filter — the client builds the tree from parentId itself.
  } else {
    // Lazy: only the requested level. "null"/"root"/absent => top level.
    const p = query.parentId
    match.parentId = p && p !== "null" && p !== "root" ? oid(p) : null
  }
  if (query.status) match.status = query.status

  const page = query.page ?? 1
  const limit = query.limit ?? (searching || query.flat ? 500 : 200)

  const [result] = await Category.aggregate([
    { $match: match },
    { $sort: SORTS[query.sort ?? "sortOrder"] },
    {
      $facet: {
        rows: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { $project: TREE_PROJECTION },
          { $addFields: { hasChildren: { $gt: ["$childrenCount", 0] } } },
        ],
        total: [{ $count: "n" }],
      },
    },
  ])

  return {
    rows: result?.rows ?? [],
    total: result?.total?.[0]?.n ?? 0,
    page,
    limit,
    parentId: searching ? null : (query.parentId ?? null),
  }
}

// Full detail for the edit sheet.
export async function getCategory({ seller, tenantDbName, id }) {
  const { Category } = getTenantModels(tenantDbName)
  const doc = await Category.findOne({ _id: id, parentStoreId: seller.mainStoreId }).lean()
  if (!doc) throw new ApiError(404, "Category not found")
  return doc
}

// ---------------------------------------------------------------------------
// OPTIONS — ultra-lean flat list for pickers/dropdowns (e.g. the collection
// rule builder's Categories value). Returns ONLY _id / name / alias across ALL
// tree levels, paginated so a picker can lazy-load a page at a time.
//   • `ids` → resolve labels for a known set (selected chips). Not paginated,
//     includes soft-deleted rows so a selected value always shows a name.
//   • `q`   → case-insensitive name/alias search.
// ---------------------------------------------------------------------------
export async function listCategoryOptions({ seller, tenantDbName, query }) {
  const { Category } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  if (query.ids?.length) {
    const rows = await Category.find({
      parentStoreId,
      _id: { $in: query.ids.map((id) => oid(id)) },
    })
      .select({ _id: 1, name: 1, alias: 1, ancestors: 1 })
      .sort({ name: 1 })
      .lean()

    // Resolve ancestor names so each row can carry a full breadcrumb `path`
    // (root -> self). Existing products store bare category ids; without the
    // path the field would render each category as a flat, single-segment row.
    const ancestorIds = [
      ...new Set(rows.flatMap((r) => (r.ancestors ?? []).map((a) => String(a)))),
    ]
    const nameById = new Map(rows.map((r) => [String(r._id), r.name]))
    if (ancestorIds.length) {
      const ancestorRows = await Category.find({
        parentStoreId,
        _id: { $in: ancestorIds.map((id) => oid(id)) },
      })
        .select({ _id: 1, name: 1 })
        .lean()
      for (const a of ancestorRows) nameById.set(String(a._id), a.name)
    }

    const withPath = rows.map((r) => ({
      _id: r._id,
      name: r.name,
      alias: r.alias,
      path: [
        ...(r.ancestors ?? []).map((a) => nameById.get(String(a))).filter(Boolean),
        r.name,
      ],
    }))
    return { rows: withPath, total: withPath.length, page: 1, limit: withPath.length }
  }

  const page = query.page ?? 1
  const limit = query.limit ?? 10
  const match = { parentStoreId, deletedAt: null }
  if (query.q) {
    const rx = { $regex: escapeRegex(query.q), $options: "i" }
    match.$or = [{ name: rx }, { alias: rx }]
  }

  const [rows, total] = await Promise.all([
    Category.find(match)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select({ _id: 1, name: 1, alias: 1 })
      .lean(),
    Category.countDocuments(match),
  ])

  return { rows, total, page, limit }
}

// Ancestor chain (root -> parent) for breadcrumbs, in order.
export async function getAncestors({ seller, tenantDbName, id }) {
  const { Category } = getTenantModels(tenantDbName)
  const doc = await Category.findOne(
    { _id: id, parentStoreId: seller.mainStoreId },
    { ancestors: 1 },
  ).lean()
  if (!doc) throw new ApiError(404, "Category not found")
  if (!doc.ancestors?.length) return []

  const rows = await Category.find(
    { _id: { $in: doc.ancestors }, parentStoreId: seller.mainStoreId },
    { name: 1, alias: 1 },
  ).lean()
  const byId = new Map(rows.map((r) => [String(r._id), r]))
  // Preserve ancestor order (root first).
  return doc.ancestors.map((aid) => byId.get(String(aid))).filter(Boolean)
}

// Resolve a live parent (or null for root) and return the tree fields a child
// inherits. Guards against attaching to a trashed / foreign parent.
async function resolveParent(Category, parentStoreId, parentId) {
  if (!parentId) return { parentId: null, ancestors: [], depth: 0 }
  const parent = await Category.findOne(
    { _id: parentId, parentStoreId, deletedAt: null },
    { ancestors: 1 },
  ).lean()
  if (!parent) throw new ApiError(400, "Parent category not found")
  return {
    parentId: oid(parentId),
    ancestors: [...(parent.ancestors ?? []), oid(parentId)],
    depth: (parent.ancestors?.length ?? 0) + 1,
  }
}

async function assertAliasFree(Category, parentStoreId, alias, exceptId) {
  if (!alias) return
  const clash = await Category.findOne({
    parentStoreId,
    alias,
    deletedAt: null,
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  }).collation({ locale: "en", strength: 2 })
  if (clash) throw new ApiError(409, "A category with this alias already exists")
}

// Turn incoming image rows (mix of saved { url } + fresh { dataUrl }) into the
// stored [{ url, alt }] shape, writing any base64 payloads to disk first.
async function persistImages({ sellerId, categoryId, images }) {
  const out = []
  for (const img of images ?? []) {
    if (img.dataUrl) {
      const url = await saveCategoryImage({ categoryId, dataUrl: img.dataUrl })
      out.push({ url, alt: img.alt ?? "" })
    } else if (img.url) {
      out.push({ url: img.url, alt: img.alt ?? "" })
    }
  }
  return out
}

export async function createCategoryDoc({ seller, tenantDbName, user, body, req }) {
  const { Category, MetafieldDefinition } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const tree = await resolveParent(Category, parentStoreId, body.parentId)

  // Derive alias up-front so the clash check matches the stored value.
  const alias =
    body.alias ||
    body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 200)
  await assertAliasFree(Category, parentStoreId, alias, null)

  const { images, parentId, metafields, ...rest } = body

  // Validate + coerce the keyed metafield object against the live definition
  // and embed it on the category (StoreHippo-style). STRICT: an invalid value
  // throws a 422 and blocks the create (see buildCategoryMetafields).
  const { metafields: cleanMetafields, fields: metafieldFields } = await buildCategoryMetafields({
    MetafieldDefinition,
    parentStoreId,
    input: metafields,
  })

  // Create first to get the _id used as the image folder name.
  const doc = await Category.create({
    ...rest,
    ...(cleanMetafields !== undefined ? { metafields: cleanMetafields } : {}),
    alias,
    ...tree,
    images: [],
    parentStoreId,
    createdBy: user._id,
    updatedBy: user._id,
  })

  let needsSave = false
  if (images?.length) {
    doc.images = await persistImages({ sellerId: seller._id, categoryId: doc._id, images })
    needsSave = true
  }

  // Write any nested base64 metafield images to disk (now that we have the _id
  // for the folder) and swap the data URLs for the stored /uploads/... paths.
  if (cleanMetafields && metafieldFields) {
    await persistMetafieldImages({
      ownerType: CATEGORY_UPLOAD_OWNER,
      ownerId: doc._id,
      fields: metafieldFields,
      values: doc.metafields,
    })
    doc.markModified("metafields")
    needsSave = true
  }

  if (needsSave) await doc.save()

  // Keep the parent's denormalized child counter in sync.
  if (tree.parentId) {
    await Category.updateOne({ _id: tree.parentId }, { $inc: { childrenCount: 1 } })
  }

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.category.created",
    targetType: "Category",
    targetId: doc._id,
    after: { name: doc.name, alias: doc.alias, depth: doc.depth },
  })

  return doc.toObject()
}

export async function updateCategoryDoc({ seller, tenantDbName, user, id, body, req }) {
  const { Category, MetafieldDefinition } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await Category.findOne({ _id: id, parentStoreId })
  if (!doc) throw new ApiError(404, "Category not found")

  const before = { name: doc.name, alias: doc.alias, status: doc.status }

  if (body.alias || body.name) {
    const nextAlias = body.alias ?? doc.alias
    await assertAliasFree(Category, parentStoreId, nextAlias, doc._id)
  }

  const { images, metafields, ...rest } = body

  // Validate + coerce the keyed metafield object and embed it on the category.
  // STRICT: an invalid value throws a 422 and blocks the update. `undefined`
  // (field not sent) leaves the stored metafields untouched.
  const { metafields: cleanMetafields, fields: metafieldFields } = await buildCategoryMetafields({
    MetafieldDefinition,
    parentStoreId,
    input: metafields,
  })
  if (cleanMetafields !== undefined) {
    const previousMetafields = doc.metafields // capture before overwrite for orphan cleanup
    doc.metafields = cleanMetafields
    // Persist nested base64 metafield images to disk and drop any files the
    // previous version referenced but this save no longer does.
    if (metafieldFields) {
      await persistMetafieldImages({
        ownerType: CATEGORY_UPLOAD_OWNER,
        ownerId: doc._id,
        fields: metafieldFields,
        values: doc.metafields,
        previousValues: previousMetafields,
      })
    }
    doc.markModified("metafields") // Mixed type — tell mongoose it changed
  }

  if (images) {
    // Remove files that are no longer referenced, then persist the new set.
    const keptUrls = new Set(images.filter((i) => i.url).map((i) => i.url))
    for (const old of doc.images ?? []) {
      if (old.url && !keptUrls.has(old.url)) {
        await deleteCategoryImage({ categoryId: doc._id, publicUrl: old.url })
      }
    }
    doc.images = await persistImages({ sellerId: seller._id, categoryId: doc._id, images })
  }

  for (const [key, value] of Object.entries(rest)) {
    doc[key] = value
  }
  doc.updatedBy = user._id
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.category.updated",
    targetType: "Category",
    targetId: doc._id,
    before,
    after: { name: doc.name, alias: doc.alias, status: doc.status },
  })

  return doc.toObject()
}

// MOVE / REPARENT — recompute ancestors + depth for the node AND rewrite every
// descendant, with a cycle guard (a node can never become its own descendant).
export async function moveCategoryDoc({ seller, tenantDbName, user, id, parentId, req }) {
  const { Category } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const node = await Category.findOne({ _id: id, parentStoreId, deletedAt: null })
  if (!node) throw new ApiError(404, "Category not found")

  const oldParentId = node.parentId ? String(node.parentId) : null
  const nextParentId = parentId ? String(parentId) : null
  if (oldParentId === nextParentId) return node.toObject() // no-op

  // Cycle guard: cannot move into itself or any of its own descendants.
  if (nextParentId) {
    if (nextParentId === String(node._id)) {
      throw new ApiError(400, "A category cannot be its own parent")
    }
    const target = await Category.findOne(
      { _id: parentId, parentStoreId, deletedAt: null },
      { ancestors: 1 },
    ).lean()
    if (!target) throw new ApiError(400, "Target parent not found")
    if ((target.ancestors ?? []).some((a) => String(a) === String(node._id))) {
      throw new ApiError(400, "Cannot move a category into its own subtree")
    }
  }

  const tree = await resolveParent(Category, parentStoreId, parentId)
  const oldAncestors = node.ancestors ?? []
  const oldDepth = node.depth

  // 1) Rewrite the node itself.
  node.parentId = tree.parentId
  node.ancestors = tree.ancestors
  node.depth = tree.depth
  node.updatedBy = user._id
  await node.save()

  // 2) Rewrite every descendant: swap the old ancestor prefix (root..old node
  //    position) for the node's new ancestor chain, and shift depth by the
  //    delta. Done in-memory per doc so both arrays stay correct at any depth.
  const depthDelta = tree.depth - oldDepth
  const descendants = await Category.find(
    { parentStoreId, ancestors: node._id },
    { ancestors: 1, depth: 1 },
  ).lean()

  if (descendants.length) {
    const newPrefix = [...tree.ancestors, node._id]
    const ops = descendants.map((d) => {
      // Everything from the node downward keeps its tail after the node id.
      const idx = d.ancestors.findIndex((a) => String(a) === String(node._id))
      const tail = idx >= 0 ? d.ancestors.slice(idx + 1) : []
      return {
        updateOne: {
          filter: { _id: d._id },
          update: { $set: { ancestors: [...newPrefix, ...tail], depth: d.depth + depthDelta } },
        },
      }
    })
    await Category.bulkWrite(ops)
  }

  // 3) Fix both parents' child counters.
  if (oldParentId) await Category.updateOne({ _id: oldParentId }, { $inc: { childrenCount: -1 } })
  if (tree.parentId) await Category.updateOne({ _id: tree.parentId }, { $inc: { childrenCount: 1 } })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.category.moved",
    targetType: "Category",
    targetId: node._id,
    before: { parentId: oldParentId, depth: oldDepth },
    after: { parentId: nextParentId, depth: tree.depth },
  })

  return node.toObject()
}

// SOFT DELETE — cascade the whole subtree (node + all descendants) into the
// trash in one update, and decrement the parent's child counter.
export async function deleteCategoryDoc({ seller, tenantDbName, user, id, req }) {
  const { Category } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const node = await Category.findOne({ _id: id, parentStoreId, deletedAt: null })
  if (!node) throw new ApiError(404, "Category not found")

  const now = new Date()
  await Category.updateMany(
    {
      parentStoreId,
      deletedAt: null,
      $or: [{ _id: node._id }, { ancestors: node._id }],
    },
    { $set: { isDeleted: true, deletedAt: now, deletedBy: user._id } },
  )

  if (node.parentId) {
    await Category.updateOne({ _id: node.parentId }, { $inc: { childrenCount: -1 } })
  }

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.category.deleted",
    targetType: "Category",
    targetId: node._id,
    before: { name: node.name, alias: node.alias },
    after: { isDeleted: true },
  })

  return { ok: true, id: node._id, isDeleted: true }
}

// RESTORE — bring a trashed subtree back. Fails if the node's alias now clashes
// with a live category (created while it sat in the trash).
export async function restoreCategoryDoc({ seller, tenantDbName, user, id, req }) {
  const { Category } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const node = await Category.findOne({ _id: id, parentStoreId, deletedAt: { $ne: null } })
  if (!node) throw new ApiError(404, "Deleted category not found")

  await assertAliasFree(Category, parentStoreId, node.alias, node._id)

  // If the parent is gone/trashed, restore the node as a root so it never
  // dangles under a missing parent.
  let parentAlive = false
  if (node.parentId) {
    const parent = await Category.findOne(
      { _id: node.parentId, parentStoreId, deletedAt: null },
      { _id: 1 },
    ).lean()
    parentAlive = Boolean(parent)
  }

  await Category.updateMany(
    { parentStoreId, deletedAt: { $ne: null }, $or: [{ _id: node._id }, { ancestors: node._id }] },
    { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
  )

  if (!parentAlive && node.parentId) {
    // Detach: promote the restored node to a root and reindex its subtree.
    node.parentId = null
    node.ancestors = []
    const depthDelta = -node.depth
    node.depth = 0
    await node.save()
    const descendants = await Category.find(
      { parentStoreId, ancestors: node._id },
      { ancestors: 1, depth: 1 },
    ).lean()
    if (descendants.length) {
      const ops = descendants.map((d) => {
        const idx = d.ancestors.findIndex((a) => String(a) === String(node._id))
        const tail = idx >= 0 ? d.ancestors.slice(idx + 1) : []
        return {
          updateOne: {
            filter: { _id: d._id },
            update: { $set: { ancestors: [node._id, ...tail], depth: d.depth + depthDelta } },
          },
        }
      })
      await Category.bulkWrite(ops)
    }
  } else if (parentAlive) {
    await Category.updateOne({ _id: node.parentId }, { $inc: { childrenCount: 1 } })
  }

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.category.restored",
    targetType: "Category",
    targetId: node._id,
    after: { name: node.name, alias: node.alias },
  })

  return node.toObject()
}

// PERMANENT DELETE — irreversible, only on an already-trashed subtree. Removes
// the node + all descendants and cleans up their uploaded images.
export async function destroyCategoryDoc({ seller, tenantDbName, user, id, req }) {
  const { Category } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const node = await Category.findOne({ _id: id, parentStoreId, deletedAt: { $ne: null } })
  if (!node) throw new ApiError(404, "Deleted category not found — soft delete it first")

  const subtree = await Category.find(
    { parentStoreId, $or: [{ _id: node._id }, { ancestors: node._id }] },
    { _id: 1, images: 1 },
  ).lean()

  for (const c of subtree) {
    for (const img of c.images ?? []) {
      if (img.url) await deleteCategoryImage({ categoryId: c._id, publicUrl: img.url })
    }
    // Remove all nested metafield images for this category in one shot.
    await deleteMetafieldDir({ ownerType: CATEGORY_UPLOAD_OWNER, ownerId: c._id })
  }

  await Category.deleteMany({
    parentStoreId,
    $or: [{ _id: node._id }, { ancestors: node._id }],
  })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.category.destroyed",
    targetType: "Category",
    targetId: node._id,
    before: { name: node.name, alias: node.alias, subtreeSize: subtree.length },
  })

  return { ok: true, removed: subtree.length }
}
