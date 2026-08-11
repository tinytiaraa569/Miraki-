import { getTenantModels } from "../../config/tenantDb.js"
import { ApiError } from "../../utils/apiError.js"
import { audit } from "../audit/audit.service.js"

const SORTS = {
  sortOrder: { sortOrder: 1, createdAt: 1 },
  "-sortOrder": { sortOrder: -1, createdAt: -1 },
  label: { label: 1 },
  "-label": { label: -1 },
  createdAt: { createdAt: 1 },
  "-createdAt": { createdAt: -1 },
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Structural identity fields — locked once a permission is system-owned.
const SYSTEM_LOCKED_FIELDS = ["key", "action", "category", "module"]

function isDuplicateKeyError(err) {
  return err?.code === 11000
}


// normal request path but guards any caller that hits the service directly.
function sanitizeBody(body) {
  const { sellerId, isSystem, ...rest } = body
  return rest
}

// LIST — filter + sort + paginate + total in one aggregation.

export async function listPermissions({ seller, tenantDbName, query }) {
  const { Permission } = getTenantModels(tenantDbName)
const page = Number(query.page) || 1
const limit = Number(query.limit) || 20

  const match = { sellerId: seller._id }
  if (query.module) match.module = query.module
  if (query.category) match.category = query.category
  if (query.action) match.action = query.action
  if (typeof query.isActive === "boolean") match.isActive = query.isActive
  if (typeof query.isSystem === "boolean") match.isSystem = query.isSystem
  if (query.q) {
    const re = { $regex: escapeRegex(query.q), $options: "i" }
    match.$or = [{ label: re }, { key: re }, { description: re }]
  }

  const [result] = await Permission.aggregate([
    { $match: match },
    { $sort: SORTS[query.sort ?? "sortOrder"] },
    {
      $facet: {
        rows: [{ $skip: (page - 1) * limit }, 
          { $limit: limit }],
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

export async function getPermission({ seller, tenantDbName, id }) {
  const { Permission } = getTenantModels(tenantDbName)
  const doc = await Permission.findOne({ _id: id, sellerId: seller._id }).lean()
  if (!doc) throw new ApiError(404, "Permission not found")
  return doc
}

export async function createPermissionDoc({ seller, tenantDbName, user, body, req }) {
  const { Permission } = getTenantModels(tenantDbName)
  const safeBody = sanitizeBody(body)

  try {
    const doc = await Permission.create({
      ...safeBody,
      sellerId: seller._id,
      isSystem: false,
      createdBy: user._id,
    })

    await audit({
      req,
      actorId: user._id,
      actorRole: user.role,
      sellerId: seller._id,
      action: "seller.permission.created",
      targetType: "Permission",
      targetId: doc._id,
      after: { key: doc.key, action: doc.action, category: doc.category },
    })

    return doc.toObject()
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new ApiError(409, "A permission with this key/action/category already exists for this seller")
    }
    throw err
  }
}

export async function updatePermissionDoc({ seller, tenantDbName, user, id, body, req }) {
  const { Permission } = getTenantModels(tenantDbName)
  const safeBody = sanitizeBody(body)

  const doc = await Permission.findOne({ _id: id, sellerId: seller._id })
  if (!doc) throw new ApiError(404, "Permission not found")

  if (doc.isSystem) {
    const lockedFieldTouched = SYSTEM_LOCKED_FIELDS.some((f) => f in safeBody)
    if (lockedFieldTouched) {
      throw new ApiError(403, "System permissions cannot have their key, action, category, or module changed")
    }
  }

  const before = { key: doc.key, action: doc.action, category: doc.category, isActive: doc.isActive }

  for (const [key, value] of Object.entries(safeBody)) doc[key] = value

  try {
    await doc.save()
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new ApiError(409, "A permission with this key/action/category already exists for this seller")
    }
    throw err
  }

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.permission.updated",
    targetType: "Permission",
    targetId: doc._id,
    before,
    after: { key: doc.key, action: doc.action, category: doc.category, isActive: doc.isActive },
  })

  return doc.toObject()
}

// HARD DELETE — permissions have no trash; system permissions can't be removed.
export async function deletePermissionDoc({ seller, tenantDbName, user, id, req }) {
  const { Permission } = getTenantModels(tenantDbName)

  const doc = await Permission.findOne({ _id: id, sellerId: seller._id })
  if (!doc) throw new ApiError(404, "Permission not found")

  if (doc.isSystem) {
    throw new ApiError(403, "System permissions cannot be deleted")
  }

  await doc.deleteOne()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.permission.deleted",
    targetType: "Permission",
    targetId: doc._id,
    before: { key: doc.key, action: doc.action, category: doc.category },
  })

  return { ok: true, id: doc._id, deleted: true }
}

export async function bulkDeletePermissionDocs({ seller, tenantDbName, user, ids, req }) {
  const { Permission } = getTenantModels(tenantDbName)

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new ApiError(400, "No permission ids provided")
  }

  const docs = await Permission.find({ _id: { $in: ids }, sellerId: seller._id })

  const foundIds = docs.map((d) => String(d._id))
  const notFoundIds = ids.filter((id) => !foundIds.includes(String(id)))

  const systemDocs = docs.filter((d) => d.isSystem)
  const deletableDocs = docs.filter((d) => !d.isSystem)

  if (deletableDocs.length === 0) {
    throw new ApiError(403, "No deletable permissions found (system permissions cannot be deleted)")
  }

  const deletableIds = deletableDocs.map((d) => d._id)

  await Permission.deleteMany({ _id: { $in: deletableIds } })

  await Promise.all(
    deletableDocs.map((doc) =>
      audit({
        req,
        actorId: user._id,
        actorRole: user.role,
        sellerId: seller._id,
        action: "seller.permission.deleted",
        targetType: "Permission",
        targetId: doc._id,
        before: { key: doc.key, action: doc.action, category: doc.category },
      })
    )
  )

  return {
    ok: true,
    deletedCount: deletableDocs.length,
    deletedIds: deletableIds,
    skipped: {
      system: systemDocs.map((d) => ({ id: d._id, key: d.key })),
      notFound: notFoundIds,
    },
  }
}