import mongoose from "mongoose"
import { getTenantModels } from "../../config/tenantDb.js"
import { ApiError } from "../../utils/apiError.js"
import { audit } from "../audit/audit.service.js"

const SORTS = {
  displayName: { displayName: 1 },
  "-displayName": { displayName: -1 },
  createdAt: { createdAt: 1 },
  "-createdAt": { createdAt: -1 },
}

// if (isSystem: true) that it can't be
// renamed away, re-scoped, or removed — only their permission set can move.
function assertNotSystemLocked(doc, action) {
  if (doc.isSystem && action !== "editPermissions") {
    throw new ApiError(403, "System roles cannot be modified or deleted. Adjust permissions instead.")
  }
}

async function assertPermissionsExist(Permission, ids = []) {
  if (!ids.length) return
  const count = await Permission.countDocuments({ _id: { $in: ids } })
  if (count !== ids.length) throw new ApiError(400, "One or more permissions are invalid")
}

async function assertSubstoresExist(Substore, seller, ids = []) {
  if (!ids.length) return
  const count = await Substore.countDocuments({ _id: { $in: ids }, parentStoreId: seller.mainStoreId })
  if (count !== ids.length) throw new ApiError(400, "One or more substores are invalid")
}

function assertMultistore(seller) {
  if (!seller.multistoreEnabled) {
    throw new ApiError(403, "Multistore is not enabled for this seller. Contact the platform administrator.")
  }
}

// LIST — filter + sort + paginate + total, with $lookups resolving
// permission count and substore names so the table can render
// "3 permissions" / "Oman, UAE" without N+1 queries from the client.

export async function listRoles({ seller, tenantDbName, query }) {
  assertMultistore(seller)
  
  const { Role } = getTenantModels(tenantDbName)

  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const match = {
    sellerId: seller._id,
    deletedAt: query.deleted ? { $ne: null } : null,
  }
  if (query.q) {
    match.displayName = { $regex: query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" }
  }
  if (query.status) match.status = query.status
  if (query.dataAccess) match.dataAccess = query.dataAccess

  const [result] = await Role.aggregate([
    { $match: match },
    { $sort: SORTS[query.sort ?? "displayName"] },
    {
      $facet: {
        rows: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          // {
          //   $lookup: {
          //     from: "substores",
          //     localField: "substoreIds",
          //     foreignField: "_id",
          //     pipeline: [{ $project: { name: 1, alias: 1 } }],
          //     as: "substores",
          //   },
          // },
          {
            $project: {
              displayName: 1,
              slug: 1,
              description: 1,
              color: 1,
              status: 1,
              isSystem: 1,
              dataAccess: 1,
              otherSubstoreAccess: 1,
              // substores: 1,
              permissionCount: { $size: { $ifNull: ["$permissions", []] } },
            //   isDeleted: 1,
            //   deletedAt: 1,
            //   createdAt: 1,
            //   updatedAt: 1,
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

export async function getRole({ seller, tenantDbName, id }) {
  const { Role } = getTenantModels(tenantDbName)
  const doc = await Role.findOne({ _id: id, sellerId: seller._id })
    // .populate("permissions", "name key")
    .populate("permissions", "name key module action label sortOrder")
    // .populate("substoreIds", "name alias")
    .lean()
  if (!doc) throw new ApiError(404, "Role not found")
  return doc
}

export async function createRoleDoc({ seller, tenantDbName, user, body, req }) {
  const { Role, Permission, 
    Substore
   } = getTenantModels(tenantDbName)

  await assertPermissionsExist(Permission, body.permissions)
  // if (body.dataAccess === "multiple_substores") {
  //   if (!body.substoreIds?.length) throw new ApiError(400, "Select at least one substore")
  //   await assertSubstoresExist(Substore, seller, body.substoreIds)
  // }
  
      if (body.substoreIds?.length) {
    await assertSubstoresExist(Substore, seller, body.substoreIds)
      }

  const doc = await Role.create({
    ...body,
    sellerId: seller._id,
    isSystem: false,
    createdBy: user._id,
    updatedBy: user._id,
  })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.role.created",
    targetType: "Role",
    targetId: doc._id,
    after: { displayName: doc.displayName, slug: doc.slug },
  })

  return doc.toObject()
}

export async function updateRoleDoc({ seller, tenantDbName, user, id, body, req }) {
  const { Role, Permission, 
    Substore
   } = getTenantModels(tenantDbName)

  const doc = await Role.findOne({ _id: id, sellerId: seller._id })
  if (!doc) throw new ApiError(404, "Role not found")

  const { permissions, 
    substoreIds,
     dataAccess, ...rest } = body
  const editingOnlyPermissions =
    permissions !== undefined &&
    substoreIds === undefined &&
    dataAccess === undefined &&
    Object.keys(rest).length === 0

  assertNotSystemLocked(doc, editingOnlyPermissions ? "editPermissions" : "edit")

  const before = { displayName: doc.displayName, status: doc.status }

  if (permissions) {
    await assertPermissionsExist(Permission, permissions)
    doc.permissions = permissions.map((p) => new mongoose.Types.ObjectId(String(p)))
  }

  // const nextDataAccess = dataAccess ?? doc.dataAccess
  // if (substoreIds || dataAccess) {
  //   if (nextDataAccess === "multiple_substores") {
  //     const ids = substoreIds ?? doc.substoreIds
  //     if (!ids?.length) throw new ApiError(400, "Select at least one substore")
  //     await assertSubstoresExist(Substore, seller, ids)
  //     doc.substoreIds = ids.map((s) => new mongoose.Types.ObjectId(String(s)))
  //   } else {
  //     doc.substoreIds = []
  //   }
  // }


  
  if (dataAccess) doc.dataAccess = dataAccess

  for (const [key, value] of Object.entries(rest)) doc[key] = value
  doc.updatedBy = user._id

  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.role.updated",
    targetType: "Role",
    targetId: doc._id,
    before,
    after: { displayName: doc.displayName, status: doc.status },
  })

  return doc.toObject()
}

// soft delete — moves the role to the trash. Users still holding this role
// keep it until reassigned; the trash view can restore it.
export async function deleteRoleDoc({ seller, tenantDbName, user, id, req }) {
  const { Role } = getTenantModels(tenantDbName)

  const doc = await Role.findOne({ _id: id, sellerId: seller._id, deletedAt: null })
  if (!doc) throw new ApiError(404, "Role not found")

  assertNotSystemLocked(doc, "delete")

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
    action: "seller.role.deleted",
    targetType: "Role",
    targetId: doc._id,
    before: { displayName: doc.displayName },
    after: { isDeleted: true },
  })

  return { ok: true, id: doc._id, isDeleted: true }
}

// Restore - brings a trashed role back into the active set.
export async function restoreRoleDoc({ seller, tenantDbName, user, id, req }) {
  const { Role } = getTenantModels(tenantDbName)

  const doc = await Role.findOne({ _id: id, sellerId: seller._id, deletedAt: { $ne: null } })
  if (!doc) throw new ApiError(404, "Deleted role not found")

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
    action: "seller.role.restored",
    targetType: "Role",
    targetId: doc._id,
    after: { displayName: doc.displayName, isDeleted: false },
  })

  return doc.toObject()
}

// permanent delete/destroy — only allowed from the trash (soft delete first).
export async function destroyRoleDoc({ seller, tenantDbName, user, id, req }) {
  const { Role } = getTenantModels(tenantDbName)

  const doc = await Role.findOne({ _id: id, sellerId: seller._id, deletedAt: { $ne: null } })
  if (!doc) throw new ApiError(404, "Deleted role not found — soft delete it first")

  assertNotSystemLocked(doc, "destroy")

  await doc.deleteOne()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.role.destroyed",
    targetType: "Role",
    targetId: doc._id,
    before: { displayName: doc.displayName },
  })

  return { ok: true, id: doc._id, destroyed: true }
}