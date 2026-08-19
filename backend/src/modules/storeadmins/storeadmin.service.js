import { getTenantModels } from "../../config/tenantDb.js";
import { ApiError } from "../../utils/apiError.js";
import { hashPassword } from "../../utils/crypto.js";
import { audit } from "../audit/audit.service.js";
import { UserDirectory } from "../../models/userDirectory.model.js";
import { killAllUserSessions } from "../auth/token.service.js";

const PUBLIC_FIELDS =
  "name email status roleId substoreIds overridePermissions twoFactorRequired totpEnabled createdAt updatedAt";

const SORTS = {
  displayName: { displayName: 1 },
  "-displayName": { displayName: -1 },
  createdAt: { createdAt: 1 },
  "-createdAt": { createdAt: -1 },
};


async function assertValidAssignments({
  Role,
  Store,
  seller,
  roleId,
  substoreIds,
}) {
  const role = await Role.findOne({
    _id: roleId,
    sellerId: seller._id,
    isDeleted: false,
  })
    .select("dataAccess")
    .lean();
  if (!role) throw new ApiError(400, "Role not found");

  if (role.dataAccess === "all_substores") {
    return { role, substoreIds: [] };
  }

  // if (!substoreIds?.length)
  //   throw new ApiError(400, "At least one store is required for this role");
  // const matchCount = await Store.countDocuments({ _id: { $in: substoreIds }, sellerId: seller._id })
  // if (matchCount !== substoreIds.length) throw new ApiError(400, "One or more stores are invalid")

  return { role, substoreIds };
}



export async function listStoreAdmins({ seller, tenantDbName, query }) {
  const { StoreAdmin } = getTenantModels(tenantDbName);

  const {
    q,
    status,
    roleId,
    substoreId,
    includeDeleted,
    page,
    limit,
    sortBy,
    sortOrder,
  } = query;

  const match = { sellerId: seller._id };
  if (!includeDeleted) match.isDeleted = false;
  if (status) match.status = status;
  if (roleId) match.roleId = roleId;
  if (substoreId) match.substoreIds = substoreId;
  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    match.$or = [
      { name: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
    ];
  }

  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [result] = await StoreAdmin.aggregate([
    { $match: match },
    { $sort: SORTS[query.sort ?? "createdAt"] },
    {
      $facet: {
        rows: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $lookup: {
              from: "roles",
              localField: "roleId",
              foreignField: "_id",
              pipeline: [{ $project: { displayName: 1, slug: 1, color: 1 } }],
              as: "role",
            },
          },
          { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "substores",
              localField: "substoreIds",
              foreignField: "_id",
              pipeline: [{ $project: { name: 1, alias: 1 } }],
              as: "substores",
            },
          },
          {
            $project: {
              name: 1,
              email: 1,
              status: 1,
              twoFactorRequired: 1,
              totpEnabled: 1,
              role: 1,
              substores: 1,
              // overridePermissions: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
        total: [{ $count: "n" }],
      },
    },
  ]);

  // const total = result?.total?.[0]?.n ?? 0

  // return {
  //   items: result?.rows ?? [],
  //   pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  // }

  return {
    rows: result?.rows ?? [],
    total: result?.total?.[0]?.n ?? 0,
    page,
    limit,
  };
}

export async function getStoreAdmin({ seller, tenantDbName, id }) {
  const { StoreAdmin } = getTenantModels(tenantDbName);
  const doc = await StoreAdmin.findOne({ _id: id, sellerId: seller._id })
    .populate("roleId", "displayName slug color")
    .populate("substoreIds", "name alias")
    .lean();
  if (!doc) throw new ApiError(404, "StoreAdmin not found");
  return doc;
}

export async function createStoreAdmin({seller,tenantDbName,actor,body, req}) {
  const { StoreAdmin, Role, Store } = getTenantModels(tenantDbName);

  const email = body.email.trim().toLowerCase();
  const [existing, directoryEntry] = await Promise.all([
    StoreAdmin.exists({ email }),
    UserDirectory.exists({ email }),
  ]);
  if (existing || directoryEntry) {
    throw new ApiError(409, "This email is already in use");
  }

  // await assertValidAssignments({ Role, Store, seller, roleId: body.roleId, substoreIds: body.substoreIds })

  const { substoreIds } = await assertValidAssignments({
    Role,
    Store,
    seller,
    roleId: body.roleId,
    substoreIds: body.substoreIds,
  });

  const passwordHash = await hashPassword(body.password);

  const admin = await StoreAdmin.create({
      sellerId: seller._id,
      name: body.name,
      email,
      passwordHash,
      twoFactorRequired: body.twoFactorRequired ?? true,
      roleId: body.roleId,
      overridePermissions: {
        grant: body.overridePermissions?.grant ?? [],
        revoke: body.overridePermissions?.revoke ?? [],
      },
      substoreIds,
      status: body.status ?? "active",
      createdBy: actor._id,
    });

  try {
    await UserDirectory.create({ email, sellerId: seller._id, userId: admin._id });
  } catch (error) {
    await StoreAdmin.deleteOne({ _id: admin._id });
    if (error?.code === 11000) throw new ApiError(409, "This email is already in use");
    throw error;
  }

  await audit({
    req,
    actorId: actor._id,
    actorRole: actor.role,
    sellerId: seller._id,
    action: "seller.storeadmin.created",
    targetType: "StoreAdmin",
    targetId: admin._id,
    after: {
      email: admin.email,
      roleId: admin.roleId,
      status: admin.status,
      twoFactorRequired: admin.twoFactorRequired,
    },
  });

  return StoreAdmin.findById(admin._id).select(PUBLIC_FIELDS).lean();
}

export async function updateStoreAdmin({ seller, tenantDbName, actor, id, body, req }) {
  const { StoreAdmin, Role, Store } = getTenantModels(tenantDbName);

  const doc = await StoreAdmin.findOne({ _id: id, sellerId: seller._id });
  if (!doc) throw new ApiError(404, "Store Admin not found");

  const {
    name,
    email,
    roleId,
    substoreIds,
    status,
    twoFactorRequired,
    overridePermissions,
  } = body;

  const before = {
    name: doc.name,
    email: doc.email,
    roleId: doc.roleId,
    status: doc.status,
  };

  // Email change — re-check uniqueness excluding self
  if (email !== undefined) {
    const nextEmail = email.trim().toLowerCase();
    if (nextEmail !== doc.email) {
      const [existing, directoryEntry] = await Promise.all([
        StoreAdmin.exists({ email: nextEmail, _id: { $ne: doc._id } }),
        UserDirectory.exists({ email: nextEmail, userId: { $ne: doc._id } }),
      ]);
      if (existing || directoryEntry) throw new ApiError(409, "This email is already in use");
      doc.email = nextEmail;
    }
  }

  // Role/substore change — revalidate together, since a role's dataAccess
  // determines whether substoreIds is required at all
  if (roleId !== undefined || substoreIds !== undefined) {
    const { substoreIds: nextSubstoreIds } = await assertValidAssignments({
      Role,
      Store,
      seller,
      roleId: roleId ?? doc.roleId,
      substoreIds: substoreIds ?? doc.substoreIds,
    });
    if (roleId !== undefined) doc.roleId = roleId;
    doc.substoreIds = nextSubstoreIds;
  }

  if (name !== undefined) doc.name = name;
  if (status !== undefined) doc.status = status;
  if (twoFactorRequired !== undefined) doc.twoFactorRequired = twoFactorRequired;

  if (overridePermissions !== undefined) {
    doc.overridePermissions = {
      grant: overridePermissions.grant ?? doc.overridePermissions.grant,
      revoke: overridePermissions.revoke ?? doc.overridePermissions.revoke,
    };
  }

  const oldEmail = before.email;
  await doc.save();

  try {
    await UserDirectory.findOneAndUpdate(
      { userId: doc._id, sellerId: seller._id },
      { $set: { email: doc.email, sellerId: seller._id, userId: doc._id } },
      { upsert: true },
    );
  } catch (error) {
    doc.email = oldEmail;
    await doc.save();
    if (error?.code === 11000) throw new ApiError(409, "This email is already in use");
    throw error;
  }

  if (status === "suspended") {
    await killAllUserSessions(doc._id);
  }

  await audit({
    req,
    actorId: actor._id,
    actorRole: actor.role,
    sellerId: seller._id,
    action: "seller.storeadmin.updated",
    targetType: "StoreAdmin",
    targetId: doc._id,
    before,
    after: {
      name: doc.name,
      email: doc.email,
      roleId: doc.roleId,
      status: doc.status,
    },
  });

  return StoreAdmin.findById(doc._id).select(PUBLIC_FIELDS).lean();
}
