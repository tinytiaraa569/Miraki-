import mongoose from "mongoose"
import { getTenantModels } from "../../config/tenantDb.js"
import { ApiError } from "../../utils/apiError.js"
import { audit } from "../audit/audit.service.js"

// All functions run AFTER loadUser: seller + tenantDbName are trusted, and the
// route gate already restricted access to SELLER_SUPERADMIN. Every query is
// scoped by parentStoreId (the tenant's single main store) so one seller can
// never read or mutate another's metafield definitions.
//
// A Metafield Definition is a schema bound to a module, embedding a recursive
// fields[] tree. The whole definition is one document: one editor load, one
// save, one projection. See docs/METAFIELDS_SYSTEM_PLAN.md.

const oid = (v) => new mongoose.Types.ObjectId(String(v))

// Escape regex metacharacters — the search box must never become an injection.
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// Container types carry a children[] tree; only arrays carry an itemType.
const CONTAINER = new Set(["object", "array"])

const SORTS = {
  module: { module: 1 },
  "-module": { module: -1 },
  createdAt: { createdAt: 1 },
  "-createdAt": { createdAt: -1 },
  fieldCount: { fieldCount: 1, module: 1 },
  "-fieldCount": { fieldCount: -1, module: 1 },
}

// ---------------------------------------------------------------------------
// Normalize the incoming fields[] tree, recursively:
//   • coerce order to a sequential index (stable) when absent
//   • strip children[] for non-container types (string/file/etc. never nest)
//   • strip itemType unless the field is an array
//   • recurse into object / array-of-object children
// Guarantees a clean, predictable shape regardless of editor quirks.
// ---------------------------------------------------------------------------
function normalizeFields(fields = []) {
  return fields.map((f, i) => {
    const dataType = f.dataType ?? "string"
    const isContainer = CONTAINER.has(dataType)
    const isArray = dataType === "array"
    // An array of objects nests; an array of scalars does not.
    const itemIsObject = isArray && f.itemType === "object"

    const out = {
      key: String(f.key ?? "").toLowerCase(),
      label: f.label ?? "",
      dataType,
      itemType: isArray ? (f.itemType ?? null) : null,
      editType: f.editType ?? "text",
      order: Number.isFinite(f.order) ? f.order : i,
      settings: f.settings ?? {},
      children: [],
    }

    if ((dataType === "object" || itemIsObject) && Array.isArray(f.children)) {
      out.children = normalizeFields(f.children)
    } else if (isContainer && !itemIsObject && dataType === "array") {
      // array of scalars: no children.
      out.children = []
    }

    return out
  })
}

// ---------------------------------------------------------------------------
// LIST — single `$facet` aggregation: the page of rows AND the total come back
// in ONE round trip. The `$match` is the first stage so the compound index
// { parentStoreId, deletedAt, module } drives filtering + the default sort.
// Rows are projected LEAN (never the full nested fields[] payload); fieldCount
// is already denormalized on the doc so the list never walks fields[] in JS.
// ---------------------------------------------------------------------------
export async function listMetafields({ seller, tenantDbName, query }) {
  const { MetafieldDefinition } = getTenantModels(tenantDbName)

  const match = {
    parentStoreId: oid(seller.mainStoreId),
    deletedAt: query.deleted ? { $ne: null } : null,
  }
  if (query.q?.trim()) {
    match.module = { $regex: escapeRegex(query.q.trim()), $options: "i" }
  }
  if (query.status) match.isActive = query.status === "active"

  const page = query.page ?? 1
  const limit = query.limit ?? 50
  const sort = SORTS[query.sort ?? "module"]

  const [result] = await MetafieldDefinition.aggregate([
    { $match: match },
    {
      $facet: {
        rows: [
          { $sort: sort },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              module: 1,
              label: 1,
              fieldCount: 1,
              version: 1,
              isActive: 1,
              deletedAt: 1,
              updatedAt: 1,
            },
          },
        ],
        meta: [{ $count: "total" }],
      },
    },
  ]).option({ allowDiskUse: true })

  const total = result?.meta?.[0]?.total ?? 0
  return {
    rows: result?.rows ?? [],
    total,
    page,
    limit,
    pageCount: Math.max(1, Math.ceil(total / limit)),
  }
}

// Full detail for the editor.
export async function getMetafield({ seller, tenantDbName, id }) {
  const { MetafieldDefinition } = getTenantModels(tenantDbName)
  const doc = await MetafieldDefinition.findOne({ _id: id, parentStoreId: seller.mainStoreId }).lean()
  if (!doc) throw new ApiError(404, "Metafield not found")
  return doc
}

// Live definition for ONE module (e.g. "ms.categories"), used to render that
// module's value form on its record editor. Returns null (not 404) when none
// exists so the caller can show an empty state instead of erroring.
export async function getDefinitionByModule({ seller, tenantDbName, module }) {
  const { MetafieldDefinition } = getTenantModels(tenantDbName)
  const doc = await MetafieldDefinition.findOne({
    parentStoreId: oid(seller.mainStoreId),
    module,
    deletedAt: null,
    isActive: { $ne: false },
  })
    .collation({ locale: "en", strength: 2 })
    .lean()
  return doc ?? null
}

// One definition per module per tenant. Case-insensitive so ms.Categories and
// ms.categories can never both exist.
async function assertModuleFree(MetafieldDefinition, parentStoreId, module, exceptId) {
  if (!module) return
  const clash = await MetafieldDefinition.findOne({
    parentStoreId,
    module,
    deletedAt: null,
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  }).collation({ locale: "en", strength: 2 })
  if (clash) throw new ApiError(409, "A metafield for this module already exists")
}

export async function createMetafieldDoc({ seller, tenantDbName, user, body, req }) {
  const { MetafieldDefinition } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  await assertModuleFree(MetafieldDefinition, parentStoreId, body.module, null)

  const doc = await MetafieldDefinition.create({
    module: body.module,
    label: body.label ?? "",
    description: body.description ?? "",
    fields: normalizeFields(body.fields),
    isActive: body.isActive !== false,
    version: 1,
    parentStoreId,
    createdBy: user._id,
    updatedBy: user._id,
  })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.metafield.created",
    targetType: "MetafieldDefinition",
    targetId: doc._id,
    after: { module: doc.module, fieldCount: doc.fieldCount },
  })

  return (await MetafieldDefinition.findById(doc._id).lean()) ?? doc.toObject()
}

export async function updateMetafieldDoc({ seller, tenantDbName, user, id, body, req }) {
  const { MetafieldDefinition } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await MetafieldDefinition.findOne({ _id: id, parentStoreId })
  if (!doc) throw new ApiError(404, "Metafield not found")

  const before = { module: doc.module, fieldCount: doc.fieldCount, version: doc.version }

  if (body.label !== undefined) doc.label = body.label
  if (body.description !== undefined) doc.description = body.description
  if (body.isActive !== undefined) doc.isActive = body.isActive

  // A fields[] change is a schema change — renormalize and bump the version so
  // saved values (phase 2) can record which schema they were entered against.
  if (body.fields !== undefined) {
    doc.fields = normalizeFields(body.fields)
    doc.version = (doc.version ?? 1) + 1
  }

  doc.updatedBy = user._id
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.metafield.updated",
    targetType: "MetafieldDefinition",
    targetId: doc._id,
    before,
    after: { module: doc.module, fieldCount: doc.fieldCount, version: doc.version },
  })

  return (await MetafieldDefinition.findById(doc._id).lean()) ?? doc.toObject()
}

// DUPLICATE — clone a definition onto a new, free module name ("<module>_copy").
export async function duplicateMetafieldDoc({ seller, tenantDbName, user, id, req }) {
  const { MetafieldDefinition } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const src = await MetafieldDefinition.findOne({ _id: id, parentStoreId, deletedAt: null }).lean()
  if (!src) throw new ApiError(404, "Metafield not found")

  // Find a free "<module>_copy" (then _copy2, _copy3, ...) module name.
  let module = `${src.module}_copy`
  let suffix = 1
  while (
    await MetafieldDefinition.findOne({ parentStoreId, module, deletedAt: null }).collation({
      locale: "en",
      strength: 2,
    })
  ) {
    suffix += 1
    module = `${src.module}_copy${suffix}`
  }

  const clone = await MetafieldDefinition.create({
    module: module.slice(0, 120),
    label: src.label ?? "",
    description: src.description ?? "",
    fields: normalizeFields(src.fields),
    isActive: src.isActive !== false,
    version: 1,
    parentStoreId,
    createdBy: user._id,
    updatedBy: user._id,
  })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.metafield.duplicated",
    targetType: "MetafieldDefinition",
    targetId: clone._id,
    before: { sourceId: src._id, module: src.module },
    after: { module: clone.module },
  })

  return (await MetafieldDefinition.findById(clone._id).lean()) ?? clone.toObject()
}

// SOFT DELETE — move the single doc into the trash.
export async function deleteMetafieldDoc({ seller, tenantDbName, user, id, req }) {
  const { MetafieldDefinition } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await MetafieldDefinition.findOne({ _id: id, parentStoreId, deletedAt: null })
  if (!doc) throw new ApiError(404, "Metafield not found")

  doc.isDeleted = true
  doc.deletedAt = new Date()
  doc.deletedBy = user._id
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.metafield.deleted",
    targetType: "MetafieldDefinition",
    targetId: doc._id,
    before: { module: doc.module },
    after: { isDeleted: true },
  })

  return { ok: true, id: doc._id, isDeleted: true }
}

// RESTORE — bring a trashed definition back; re-check module uniqueness.
export async function restoreMetafieldDoc({ seller, tenantDbName, user, id, req }) {
  const { MetafieldDefinition } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await MetafieldDefinition.findOne({ _id: id, parentStoreId, deletedAt: { $ne: null } })
  if (!doc) throw new ApiError(404, "Deleted metafield not found")

  await assertModuleFree(MetafieldDefinition, parentStoreId, doc.module, doc._id)

  doc.isDeleted = false
  doc.deletedAt = null
  doc.deletedBy = null
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.metafield.restored",
    targetType: "MetafieldDefinition",
    targetId: doc._id,
    after: { module: doc.module },
  })

  return doc.toObject()
}

// PERMANENT DELETE — irreversible, only on an already-trashed definition.
export async function destroyMetafieldDoc({ seller, tenantDbName, user, id, req }) {
  const { MetafieldDefinition } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await MetafieldDefinition.findOne({ _id: id, parentStoreId, deletedAt: { $ne: null } }).lean()
  if (!doc) throw new ApiError(404, "Deleted metafield not found — soft delete it first")

  await MetafieldDefinition.deleteOne({ _id: doc._id, parentStoreId })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.metafield.destroyed",
    targetType: "MetafieldDefinition",
    targetId: doc._id,
    before: { module: doc.module },
  })

  return { ok: true, removed: 1 }
}
