import mongoose from "mongoose"
import { getTenantModels } from "../../config/tenantDb.js"
import { ApiError } from "../../utils/apiError.js"
import { deleteCollectionImage, saveCollectionImage } from "../../utils/uploads.js"
import { audit } from "../audit/audit.service.js"
import { compileRules } from "./rule-compiler.js"

// All functions run AFTER loadUser: seller + tenantDbName are trusted, and the
// route gate already restricted access to SELLER_SUPERADMIN. Every query is
// scoped by parentStoreId (the tenant's single main store) so one seller can
// never read or mutate another's collections.
//
// Collections are either MANUAL (ordered productIds) or DYNAMIC (a rule set
// materialized into `collectionMembers`). The dynamic resolution engine has a
// HARD dependency on the forthcoming Product model — until it is registered in
// getTenantModels, `rebuildMembership`/`preview` degrade gracefully (mark the
// collection stale, report a pending count) instead of throwing. The aggregation
// pipeline is fully wired and activates automatically once Product exists.

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

// Columns the list renders — kept lean, never the full nested payload. `images`
// is sliced to the first element only; we derive the row `thumbnail` from it in
// JS below so the wire payload stays tiny. `membership.productCount` rides along
// so the list badge ("28") costs ZERO extra queries.
const LIST_SELECT = {
  name: 1,
  alias: 1,
  type: 1,
  sortOrder: 1,
  isPublished: 1,
  isActive: 1,
  isDeleted: 1,
  deletedAt: 1,
  createdAt: 1,
  updatedAt: 1,
  "membership.productCount": 1,
  "membership.isStale": 1,
  images: { $slice: 1 },
}

// The Product model is a planned dependency — resolve it defensively.
function getProductModel(tenantDbName) {
  const models = getTenantModels(tenantDbName)
  return models.Product ?? null
}

// ---------------------------------------------------------------------------
// LIST — flat, paginated, sorted. Rows + total are fetched as TWO parallel,
// index-backed queries (find + countDocuments) rather than a single $facet:
// stages inside a $facet sub-pipeline can't use indexes, which would force the
// sort + pagination in-memory. Splitting them lets the default publish-tab list
// ride the compound index { parentStoreId, isPublished, sortOrder, name }
// end-to-end for both the page and the count — same strategy proven in brands.
//   • no `q`  -> filter by the Published / Unpublished tab (`isPublished`)
//   • with `q` -> flat search (name / alias) across BOTH tabs
//   • deleted  -> the trash view (soft-deleted rows only)
// ---------------------------------------------------------------------------
// Lean picker feed — { rows:[{_id,name,alias}], total } — mirrors brands/
// categories so the shared EntityPicker can select collections on the product
// editor. `ids` resolves labels for an already-selected set (chips) without a
// full list fetch.
export async function listCollectionOptions({ seller, tenantDbName, query }) {
  const { Collection } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  if (query.ids?.length) {
    const rows = await Collection.find({
      parentStoreId,
      _id: { $in: query.ids.map((id) => oid(id)) },
    })
      .select({ _id: 1, name: 1, alias: 1 })
      .sort({ name: 1 })
      .lean()
    return { rows, total: rows.length, page: 1, limit: rows.length }
  }

  const page = query.page ?? 1
  const limit = query.limit ?? 10
  const match = { parentStoreId, deletedAt: null }
  if (query.q) {
    const rx = { $regex: escapeRegex(query.q), $options: "i" }
    match.$or = [{ name: rx }, { alias: rx }]
  }

  const [rows, total] = await Promise.all([
    Collection.find(match)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select({ _id: 1, name: 1, alias: 1 })
      .lean(),
    Collection.countDocuments(match),
  ])

  return { rows, total, page, limit }
}

export async function listCollections({ seller, tenantDbName, query }) {
  const { Collection } = getTenantModels(tenantDbName)

  const match = {
    parentStoreId: oid(seller.mainStoreId),
    deletedAt: query.deleted ? { $ne: null } : null,
  }

  const searching = Boolean(query.q?.trim())
  if (searching) {
    const rx = { $regex: escapeRegex(query.q.trim()), $options: "i" }
    match.$or = [{ name: rx }, { alias: rx }]
  } else if (typeof query.published === "boolean") {
    match.isPublished = query.published // Published / Unpublished tab
  }

  const page = query.page ?? 1
  const limit = query.limit ?? 50

  const [rows, total] = await Promise.all([
    Collection.find(match)
      .sort(SORTS[query.sort ?? "sortOrder"])
      .skip((page - 1) * limit)
      .limit(limit)
      .select(LIST_SELECT)
      .lean(),
    Collection.countDocuments(match),
  ])

  return {
    rows: rows.map(({ images, membership, ...r }) => ({
      ...r,
      thumbnail: images?.[0]?.url ?? null,
      productCount: membership?.productCount ?? 0,
      isStale: Boolean(membership?.isStale),
    })),
    total,
    page,
    limit,
  }
}

// Full detail for the editor.
export async function getCollection({ seller, tenantDbName, id }) {
  const { Collection } = getTenantModels(tenantDbName)
  const doc = await Collection.findOne({ _id: id, parentStoreId: seller.mainStoreId }).lean()
  if (!doc) throw new ApiError(404, "Collection not found")
  return doc
}

async function assertAliasFree(Collection, parentStoreId, alias, exceptId) {
  if (!alias) return
  const clash = await Collection.findOne({
    parentStoreId,
    alias,
    deletedAt: null,
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  }).collation({ locale: "en", strength: 2 })
  if (clash) throw new ApiError(409, "A collection with this alias already exists")
}

// Turn incoming image rows (mix of saved { url } + fresh { dataUrl }) into the
// stored [{ url, alt }] shape, writing any base64 payloads to disk first.
async function persistImages({ collectionId, images }) {
  const out = []
  for (const img of images ?? []) {
    if (img.dataUrl) {
      const url = await saveCollectionImage({ collectionId, dataUrl: img.dataUrl })
      out.push({ url, alt: img.alt ?? "" })
    } else if (img.url) {
      out.push({ url: img.url, alt: img.alt ?? "" })
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// MEMBERSHIP MATERIALIZATION — the core optimization (plan §6).
// Runs when a dynamic collection is created/edited (and can be re-run manually).
// ONE aggregation filters products by the compiled rules, projects only the sort
// keys, and $merges straight into collectionMembers tagged with the next
// buildVersion; the collection doc then flips atomically to that version and the
// old one is GC'd. Manual collections write their productIds directly.
// ---------------------------------------------------------------------------
export async function rebuildMembership({ tenantDbName, seller, collectionId }) {
  const { Collection, CollectionMember } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const col = await Collection.findOne({ _id: collectionId, parentStoreId })
  if (!col) return { ok: false, reason: "not_found" }

  const nextVersion = (col.membership?.buildVersion ?? 0) + 1

  // ---- MANUAL: materialize the hand-picked, ordered ids directly. ----------
  if (col.type === "manual") {
    const ids = (col.productIds ?? []).map((id) => oid(id))
    if (ids.length) {
      const docs = ids.map((productId, index) => ({
        parentStoreId,
        collectionId: col._id,
        productId,
        buildVersion: nextVersion,
        position: index, // preserve manual display order
      }))
      await CollectionMember.insertMany(docs, { ordered: false })
    }
    await finalizeBuild({ Collection, CollectionMember, col, parentStoreId, nextVersion, count: ids.length })
    return { ok: true, productCount: ids.length }
  }

  // ---- DYNAMIC: needs the Product model. Degrade gracefully until it lands. -
  const Product = getProductModel(tenantDbName)
  if (!Product) {
    // Flag stale so a rebuild runs automatically once Products exist.
    await Collection.updateOne(
      { _id: col._id },
      { $set: { "membership.isStale": true, "membership.productCount": 0 } },
    )
    return { ok: false, reason: "products_pending" }
  }

  const compiled = compileRules(col.rules)
  const match = compiled.__none ? { _id: null } : compiled

  await Product.aggregate([
    { $match: { parentStoreId, isDeleted: false, ...match } },
    {
      $project: {
        _id: 0,
        parentStoreId: 1,
        collectionId: { $literal: col._id },
        productId: "$_id",
        buildVersion: { $literal: nextVersion },
        sortName: { $toLower: "$name" },
        price: "$price",
        createdAt: "$createdAt",
        position: { $literal: 0 },
      },
    },
    { $merge: { into: "collectionMembers", whenMatched: "replace", whenNotMatched: "insert" } },
  ]).option({ allowDiskUse: true })

  const productCount = await CollectionMember.countDocuments({
    parentStoreId,
    collectionId: col._id,
    buildVersion: nextVersion,
  })
  await finalizeBuild({ Collection, CollectionMember, col, parentStoreId, nextVersion, count: productCount })
  return { ok: true, productCount }
}

// Atomically flip to the new version, then GC every older version.
async function finalizeBuild({ Collection, CollectionMember, col, parentStoreId, nextVersion, count }) {
  await Collection.updateOne(
    { _id: col._id },
    {
      $set: {
        "membership.buildVersion": nextVersion,
        "membership.productCount": count,
        "membership.lastBuiltAt": new Date(),
        "membership.isStale": false,
      },
    },
  )
  await CollectionMember.deleteMany({
    parentStoreId,
    collectionId: col._id,
    buildVersion: { $lt: nextVersion },
  })
}

// PREVIEW — the editor's live "N products match" indicator. Compiles the rules
// and counts against products WITHOUT materializing. Returns a pending flag when
// the Product model isn't registered yet so the UI can show an informative note.
export async function previewRules({ seller, tenantDbName, rules }) {
  const parentStoreId = oid(seller.mainStoreId)
  const Product = getProductModel(tenantDbName)
  if (!Product) return { count: 0, productsPending: true }

  const compiled = compileRules(rules)
  if (compiled.__none) return { count: 0, productsPending: false }

  const count = await Product.countDocuments({ parentStoreId, isDeleted: false, ...compiled })
  return { count, productsPending: false }
}

// Whether a mutation touched anything that changes membership.
function membershipInputsChanged(body) {
  return (
    body.type !== undefined ||
    body.rules !== undefined ||
    body.productIds !== undefined
  )
}

export async function createCollectionDoc({ seller, tenantDbName, user, body, req }) {
  const { Collection } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const alias =
    body.alias ||
    body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 200)
  await assertAliasFree(Collection, parentStoreId, alias, null)

  const { images, ...rest } = body

  const doc = await Collection.create({
    ...rest,
    alias,
    images: [],
    parentStoreId,
    createdBy: user._id,
    updatedBy: user._id,
  })

  if (images?.length) {
    doc.images = await persistImages({ collectionId: doc._id, images })
    await doc.save()
  }

  // Materialize membership so the list badge + storefront reads are ready.
  await rebuildMembership({ tenantDbName, seller, collectionId: doc._id })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.collection.created",
    targetType: "Collection",
    targetId: doc._id,
    after: { name: doc.name, alias: doc.alias, type: doc.type, isPublished: doc.isPublished },
  })

  return (await Collection.findById(doc._id).lean()) ?? doc.toObject()
}

export async function updateCollectionDoc({ seller, tenantDbName, user, id, body, req }) {
  const { Collection } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await Collection.findOne({ _id: id, parentStoreId })
  if (!doc) throw new ApiError(404, "Collection not found")

  const before = { name: doc.name, alias: doc.alias, type: doc.type, isPublished: doc.isPublished }

  if (body.alias || body.name) {
    const nextAlias = body.alias ?? doc.alias
    await assertAliasFree(Collection, parentStoreId, nextAlias, doc._id)
  }

  const { images, ...rest } = body

  if (images) {
    const keptUrls = new Set(images.filter((i) => i.url).map((i) => i.url))
    for (const old of doc.images ?? []) {
      if (old.url && !keptUrls.has(old.url)) {
        await deleteCollectionImage({ collectionId: doc._id, publicUrl: old.url })
      }
    }
    doc.images = await persistImages({ collectionId: doc._id, images })
  }

  for (const [key, value] of Object.entries(rest)) {
    doc[key] = value
  }
  doc.updatedBy = user._id
  await doc.save()

  // Re-materialize only when the membership inputs actually changed.
  if (membershipInputsChanged(body)) {
    await rebuildMembership({ tenantDbName, seller, collectionId: doc._id })
  }

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.collection.updated",
    targetType: "Collection",
    targetId: doc._id,
    before,
    after: { name: doc.name, alias: doc.alias, type: doc.type, isPublished: doc.isPublished },
  })

  return (await Collection.findById(doc._id).lean()) ?? doc.toObject()
}

// Manual "Rebuild now" — recompute membership on demand.
export async function rebuildCollectionDoc({ seller, tenantDbName, user, id, req }) {
  const { Collection } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await Collection.findOne({ _id: id, parentStoreId, deletedAt: null })
  if (!doc) throw new ApiError(404, "Collection not found")

  const result = await rebuildMembership({ tenantDbName, seller, collectionId: doc._id })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.collection.rebuilt",
    targetType: "Collection",
    targetId: doc._id,
    after: { productCount: result.productCount ?? 0, reason: result.reason ?? "ok" },
  })

  return result
}

// SOFT DELETE — move the single doc into the trash. Membership rows are left in
// place (cheap) and GC'd on permanent delete; they're unreachable while trashed.
export async function deleteCollectionDoc({ seller, tenantDbName, user, id, req }) {
  const { Collection } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await Collection.findOne({ _id: id, parentStoreId, deletedAt: null })
  if (!doc) throw new ApiError(404, "Collection not found")

  doc.isDeleted = true
  doc.deletedAt = new Date()
  doc.deletedBy = user._id
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.collection.deleted",
    targetType: "Collection",
    targetId: doc._id,
    before: { name: doc.name, alias: doc.alias },
    after: { isDeleted: true },
  })

  return { ok: true, id: doc._id, isDeleted: true }
}

// RESTORE — bring a trashed collection back; re-check alias uniqueness.
export async function restoreCollectionDoc({ seller, tenantDbName, user, id, req }) {
  const { Collection } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await Collection.findOne({ _id: id, parentStoreId, deletedAt: { $ne: null } })
  if (!doc) throw new ApiError(404, "Deleted collection not found")

  await assertAliasFree(Collection, parentStoreId, doc.alias, doc._id)

  doc.isDeleted = false
  doc.deletedAt = null
  doc.deletedBy = null
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.collection.restored",
    targetType: "Collection",
    targetId: doc._id,
    after: { name: doc.name, alias: doc.alias },
  })

  return doc.toObject()
}

// PERMANENT DELETE — irreversible, only on an already-trashed collection.
// Removes the doc, its uploaded images, and all materialized membership rows.
export async function destroyCollectionDoc({ seller, tenantDbName, user, id, req }) {
  const { Collection, CollectionMember } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await Collection.findOne({ _id: id, parentStoreId, deletedAt: { $ne: null } }).lean()
  if (!doc) throw new ApiError(404, "Deleted collection not found — soft delete it first")

  for (const img of doc.images ?? []) {
    if (img.url) await deleteCollectionImage({ collectionId: doc._id, publicUrl: img.url })
  }

  await CollectionMember.deleteMany({ parentStoreId, collectionId: doc._id })
  await Collection.deleteOne({ _id: doc._id, parentStoreId })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.collection.destroyed",
    targetType: "Collection",
    targetId: doc._id,
    before: { name: doc.name, alias: doc.alias },
  })

  return { ok: true, removed: 1 }
}
