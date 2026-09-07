import mongoose from "mongoose"
import { getTenantModels } from "../../config/tenantDb.js"
import { ApiError } from "../../utils/apiError.js"
import { audit } from "../audit/audit.service.js"

function assertMultistore(seller) {
  if (!seller.multistoreEnabled) {
    throw new ApiError(403, "Multistore is not enabled for this seller. Contact the platform administrator.")
  }
}

const SORTS = {
  sortOrder: { sortOrder: 1, createdAt: 1 },
  "-sortOrder": { sortOrder: -1, createdAt: -1 },
  name: { name: 1 },
  "-name": { name: -1 },
  createdAt: { createdAt: 1 },
  "-createdAt": { createdAt: -1 },
}

// ---------------------------------------------------------------------------
// LIST — one aggregation: filter + sort + paginate + total, PLUS a $lookup
// that resolves the linked substore's name/alias so the table can render
// "substore: oman" without N+1 queries from the client.
// ---------------------------------------------------------------------------
export async function listStoreVariants({ seller, tenantDbName, query }) {
  assertMultistore(seller)
  const { StoreVariant } = getTenantModels(tenantDbName)

  const page = query.page ?? 1
  const limit = query.limit ?? 20
  // Trash view lists only soft-deleted rows; normal view hides them.
  const match = { deletedAt: query.deleted ? { $ne: null } : null }
  if (query.q) {
    match.name = { $regex: query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" }
  }
  if (query.status) match.status = query.status

  const [result] = await StoreVariant.aggregate([
    { $match: match },
    { $sort: SORTS[query.sort ?? "sortOrder"] },
    {
      $facet: {
        rows: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $lookup: {
              from: "substores",
              localField: "action.substoreId",
              foreignField: "_id",
              pipeline: [{ $project: { name: 1, alias: 1 } }],
              as: "substore",
            },
          },
          { $unwind: { path: "$substore", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              name: 1,
              sortOrder: 1,
              status: 1,
              conditions: 1,
              action: 1,
              substore: 1,
              isDeleted: 1,
              deletedAt: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
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
  }
}

export async function getStoreVariant({ seller, tenantDbName, id }) {
  assertMultistore(seller)
  const { StoreVariant } = getTenantModels(tenantDbName)
  const doc = await StoreVariant.findById(id).lean()
  if (!doc) throw new ApiError(404, "Store variant not found")
  return doc
}

// action.substoreId (when set) must resolve to a substore under the
// tenant's MAIN store — cross-tenant references are structurally impossible
// (separate DBs), but a stale/foreign id would still break the resolver.

async function resolveAction(Substore, seller, action = {}) {
  const resolved = { ...action }
  if (resolved.substoreId) {
    const sub = await Substore.findOne({ _id: resolved.substoreId, parentStoreId: seller.mainStoreId })
      .select("_id")
      .lean()
    if (!sub) throw new ApiError(400, "Linked substore not found")
    resolved.substoreId = new mongoose.Types.ObjectId(String(resolved.substoreId))
  } else if (resolved.substoreId === "" || resolved.substoreId === null) {
    resolved.substoreId = null
  }
  return resolved
}

export async function createStoreVariantDoc({ seller, tenantDbName, user, body, req }) {
  assertMultistore(seller)
  const { StoreVariant, Substore } = getTenantModels(tenantDbName)

  const action = body.action ? await resolveAction(Substore, seller, body.action) : undefined

  const doc = await StoreVariant.create({
    ...body,
    ...(action !== undefined ? { action } : {}),
    createdBy: user._id,
    updatedBy: user._id,
  })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.storevariant.created",
    targetType: "StoreVariant",
    targetId: doc._id,
    after: { name: doc.name, status: doc.status },
  })

  return doc.toObject()
}

export async function updateStoreVariantDoc({ seller, tenantDbName, user, id, body, req }) {
  assertMultistore(seller)
  const { StoreVariant, Substore } = getTenantModels(tenantDbName)

  const doc = await StoreVariant.findById(id)
  if (!doc) throw new ApiError(404, "Store variant not found")

  const before = { name: doc.name, status: doc.status }

  const { conditions, action, ...rest } = body

  if (conditions) {
    doc.conditions = { ...(doc.conditions?.toObject?.() ?? doc.conditions ?? {}), ...conditions }
  }
  if (action) {
    const resolved = await resolveAction(Substore, seller, action)
    doc.action = { ...(doc.action?.toObject?.() ?? doc.action ?? {}), ...resolved }
  }
  for (const [key, value] of Object.entries(rest)) doc[key] = value
  doc.updatedBy = user._id

  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.storevariant.updated",
    targetType: "StoreVariant",
    targetId: doc._id,
    before,
    after: { name: doc.name, status: doc.status },
  })

  return doc.toObject()
}

// SOFT DELETE — moves the variant to the trash. The resolver and normal lists
// skip it, but it stays restorable from the "Show deleted" view.
export async function deleteStoreVariantDoc({ seller, tenantDbName, user, id, req }) {
  assertMultistore(seller)
  const { StoreVariant } = getTenantModels(tenantDbName)

  const doc = await StoreVariant.findOne({ _id: id, deletedAt: null })
  if (!doc) throw new ApiError(404, "Store variant not found")

  doc.isDeleted = true
  doc.deletedAt = new Date()
  doc.deletedBy = user._id
  doc.updatedBy = user._id
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.storevariant.deleted",
    targetType: "StoreVariant",
    targetId: doc._id,
    before: { name: doc.name },
    after: { isDeleted: true },
  })

  return { ok: true, id: doc._id, isDeleted: true }
}

// RESTORE — brings a trashed variant back into the active rule set.
export async function restoreStoreVariantDoc({ seller, tenantDbName, user, id, req }) {
  assertMultistore(seller)
  const { StoreVariant } = getTenantModels(tenantDbName)

  const doc = await StoreVariant.findOne({ _id: id, deletedAt: { $ne: null } })
  if (!doc) throw new ApiError(404, "Deleted store variant not found")

  doc.isDeleted = false
  doc.deletedAt = null
  doc.deletedBy = null
  doc.updatedBy = user._id
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.storevariant.restored",
    targetType: "StoreVariant",
    targetId: doc._id,
    after: { name: doc.name, isDeleted: false },
  })

  return doc.toObject()
}

// PERMANENT DESTROY — only allowed from the trash (soft delete first).
export async function destroyStoreVariantDoc({ seller, tenantDbName, user, id, req }) {
  assertMultistore(seller)
  const { StoreVariant } = getTenantModels(tenantDbName)

  const doc = await StoreVariant.findOne({ _id: id, deletedAt: { $ne: null } })
  if (!doc) throw new ApiError(404, "Deleted store variant not found — soft delete it first")

  await doc.deleteOne()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.storevariant.destroyed",
    targetType: "StoreVariant",
    targetId: doc._id,
    before: { name: doc.name },
  })

  return { ok: true, id: doc._id, destroyed: true }
}
