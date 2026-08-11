import { getTenantModels } from "../../config/tenantDb.js";
import { ApiError } from "../../utils/apiError.js";
import { hashPassword } from "../../utils/crypto.js";
import { audit } from "../audit/audit.service.js";
import { Seller } from "../sellers/seller.model.js";

import { StoreAdmin } from "./storeadmin.model.js";
import { verifyPassword } from "../../utils/crypto.js";

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000


const INVALID = (code = "INVALID_CREDENTIALS") => {
  const err = new ApiError(401, "Invalid credentials")
  err.code = code
  return err
}

export async function verifyStoreAdminLogin({ email, password, req }) {
  const normalizedEmail = email.toLowerCase()

  const sellers = await Seller.find({ status: "active", deletedAt: null })
    .select("_id dbName")
    .lean()

  let seller = null
  let user = null

  for (const candidate of sellers) {
    const { StoreAdmin } = getTenantModels(candidate.dbName)
    const match = await StoreAdmin.findOne({
      email: normalizedEmail,
      isDeleted: false,
    }).select("+passwordHash")

    if (match) {
      seller = candidate
      user = match
      break
    }
  }

  if (!seller || !user || !user.passwordHash) throw INVALID("ACCOUNT_NOT_FOUND")

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new ApiError(429, "Account temporarily locked. Try again later.")
  }
  if (user.status !== "active") throw INVALID()

  const ok = await verifyPassword(user.passwordHash, password)
  if (!ok) {
    user.failedLoginAttempts += 1
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCKOUT_MS)
      user.failedLoginAttempts = 0
      await audit({
        req,
        actorId: user._id,
        actorRole: "STORE_ADMIN",
        sellerId: seller._id,
        action: "storeadmin.auth.lockout",
        targetType: "StoreAdmin",
        targetId: user._id,
      })
    }
    await user.save()
    throw INVALID()
  }

  user.failedLoginAttempts = 0
  user.lockedUntil = null
  await user.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: "STORE_ADMIN",
    sellerId: seller._id,
    // action: "storeadmin.auth.login",
    targetType: "StoreAdmin",
    targetId: user._id,
  })

  return { user, seller }
}

// export async function verifyStoreAdminLogin({ email, password, req }) {
//   const seller = await Seller.findOne({ deletedAt: null })
//   if (!seller) throw INVALID("USER_NOT_FOUND")

//   console.log(seller)

//   const { StoreAdmin } = await getTenantModels(seller.dbName)
//   const user = await StoreAdmin.findOne({ email: email.toLowerCase(), isDeleted: false }).select("+passwordHash")
//   console.log(await StoreAdmin.findOne({ email: email.toLowerCase()}) ,true)
//   console.log(email)

//   if (!user) throw INVALID("USER_NOT_FOUND")

//   if (user.lockedUntil && user.lockedUntil > new Date()) {
//     throw new ApiError(429, "Account temporarily locked. Try again later.")
//   }
//   if (user.status !== "active") throw INVALID()

//   const ok = await verifyPassword(user.passwordHash, password)
//   if (!ok) {
//     user.failedLoginAttempts += 1
//     if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
//       user.lockedUntil = new Date(Date.now() + LOCKOUT_MS)
//       user.failedLoginAttempts = 0
//       await audit({ req, actorId: user._id, actorRole: "STORE_ADMIN", action: "auth.lockout", targetType: "StoreAdmin", targetId: user._id })
//     }
//     await user.save()
//     throw INVALID()
//   }

//   user.failedLoginAttempts = 0
//   user.lockedUntil = null
//   await user.save()

//   await audit({ req, actorId: user._id, actorRole: "STORE_ADMIN", action: "auth.login", targetType: "StoreAdmin", targetId: user._id })
//   return { user, seller }
// }

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

  const email = body.email.toLowerCase();
  const existing = await StoreAdmin.exists({ email });
  if (existing)
    throw new ApiError(409, "A store admin with this email already exists");

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
    const nextEmail = email.toLowerCase();
    if (nextEmail !== doc.email) {
      const existing = await StoreAdmin.exists({
        email: nextEmail,
        _id: { $ne: doc._id },
      });
      if (existing)
        throw new ApiError(409, "A store admin with this email already exists");
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

  await doc.save();

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
