import mongoose from "mongoose"
import { getTenantModels } from "../../config/tenantDb.js"
import { InviteToken } from "../../models/inviteToken.model.js"
import { UserDirectory } from "../../models/userDirectory.model.js"
import { Seller } from "../sellers/seller.model.js"
import { ApiError } from "../../utils/apiError.js"
import { randomToken, sha256, verifyPassword, verifyPasswordDecoy } from "../../utils/crypto.js"
import { deleteSellerImage, saveSellerImage } from "../../utils/uploads.js"
import { audit } from "../audit/audit.service.js"
import { getSellerTheme } from "../theme/theme.service.js"
import { resolveEffectivePermissions } from "../../utils/permissions.js"

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

// Generic error — never reveal whether the email exists, which tenant it
// belongs to, or which field failed.
const INVALID = () => new ApiError(401, "Invalid credentials")

function normalizeEmail(email) {
  return String(email).trim().toLowerCase()
}

async function resolveLoginDirectory(email) {
  const [resolved] = await UserDirectory.aggregate([
    { $match: { email } },
    {
      $lookup: {
        from: "sellers",
        let: { sellerId: "$sellerId" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$sellerId"] },
              status: "active",
              deletedAt: null,
            },
          },
          {
            $project: {
              businessName: 1,
              dbName: 1,
              mainStoreId: 1,
              multistoreEnabled: 1,
              ownerEmail: 1,
              profile: 1,
              status: 1,
              deletedAt: 1,
            },
          },
        ],
        as: "seller",
      },
    },
    { $unwind: "$seller" },
    { $project: { _id: 0, userId: 1, sellerId: 1, seller: 1 } },
  ])
  return resolved ?? null
}

async function recordFailedLogin({ user, req, sellerId, accountType }) {
  user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1
  if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    user.lockedUntil = new Date(Date.now() + LOCKOUT_MS)
    user.failedLoginAttempts = 0
    await audit({
      req,
      actorId: user._id,
      actorRole: accountType === "storeAdmin" ? "STORE_ADMIN" : user.role,
      sellerId,
      action: accountType === "storeAdmin" ? "storeadmin.auth.lockout" : "seller.auth.lockout",
      targetType: accountType === "storeAdmin" ? "StoreAdmin" : "StoreUser",
      targetId: user._id,
    })
  }
  await user.save()
}

// ---------------------------------------------------------------------------
// SELLER-SIDE LOGIN (store users: owner + substore admins).
// 1. master DB:  email -> UserDirectory -> sellerId (which tenant?)
// 2. master DB:  seller registry row must be active and not trashed
// 3. tenant DB:  verify the argon2 hash against the StoreUser record
// The tenant database is resolved SERVER-SIDE from the directory — the
// client never says which tenant it belongs to.
// ---------------------------------------------------------------------------
export async function verifySellerLogin({ email, password, req }) {
  const normalizedEmail = normalizeEmail(email)
  const resolved = await resolveLoginDirectory(normalizedEmail)
  if (!resolved) {
    // Anti-enumeration: spend the same argon2 time a real wrong-password attempt
    // would, so response timing can't reveal whether this email is registered.
    await verifyPasswordDecoy(password)
    throw INVALID()
  }

  const seller = resolved.seller
  seller._id = resolved.sellerId
  const { StoreUser, StoreAdmin, Role } = getTenantModels(seller.dbName)

  // The existing directory remains the single login index. The referenced id
  // must resolve to exactly one matching tenant account; client input can never
  // choose the account type, seller, tenant, role, or permissions.
  const [storeUser, storeAdmin] = await Promise.all([
    StoreUser.findOne({ _id: resolved.userId, email: normalizedEmail }).select("+passwordHash"),
    StoreAdmin.findOne({
      _id: resolved.userId,
      email: normalizedEmail,
      isDeleted: false,
      deletedAt: null,
    }).select("+passwordHash"),
  ])

  if (Boolean(storeUser) === Boolean(storeAdmin)) throw INVALID()

  const accountType = storeAdmin ? "storeAdmin" : "storeUser"
  const user = storeAdmin ?? storeUser
  if (!user.passwordHash) throw INVALID()

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new ApiError(429, "Account temporarily locked. Try again later.")
  }
  if (user.status !== "active") throw INVALID()

  let role = null
  if (accountType === "storeAdmin") {
    role = await Role.findOne({
      _id: user.roleId,
      sellerId: resolved.sellerId,
      status: "active",
      isDeleted: false,
    }).select("slug displayName permissions").lean()
    if (!role) throw INVALID()
  }

  const ok = await verifyPassword(user.passwordHash, password)
  if (!ok) {
    await recordFailedLogin({ user, req, sellerId: resolved.sellerId, accountType })
    throw INVALID()
  }

  user.failedLoginAttempts = 0
  user.lockedUntil = null
  await user.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: accountType === "storeAdmin" ? "STORE_ADMIN" : user.role,
    sellerId: resolved.sellerId,
    action: accountType === "storeAdmin" ? "storeadmin.auth.login" : "seller.auth.login",
    targetType: accountType === "storeAdmin" ? "StoreAdmin" : "StoreUser",
    targetId: user._id,
  })

  return { user, seller, accountType, role }
}

function sellerIdentityPayload(seller) {
  return {
    id: seller._id,
    businessName: seller.businessName,
    multistoreEnabled: seller.multistoreEnabled,
    mainStoreId: seller.mainStoreId,
    profile: seller.profile ?? {},
  }
}

export async function buildHubBootstrap({ user, seller, accountType, role = null }) {
  let permissionPromise = Promise.resolve(["*"])
  let rolePromise = Promise.resolve(role)

  if (accountType === "storeAdmin") {
    const { Role, Permission } = getTenantModels(seller.dbName)
    rolePromise = role
      ? Promise.resolve(role)
      : Role.findOne({
          _id: user.roleId,
          sellerId: seller._id,
          status: "active",
          isDeleted: false,
        }).select("slug displayName permissions").lean().exec()

    permissionPromise = rolePromise.then(async (activeRole) => {
      if (!activeRole) throw new ApiError(403, "Forbidden")
      const permissions = await resolveEffectivePermissions({ Permission, role: activeRole, user })
      return permissions.map((permission) => permission.key)
    })
  }

  const [activeRole, permissions, branding, theme] = await Promise.all([
    rolePromise,
    permissionPromise,
    getSellerBranding({ seller }),
    getSellerTheme({ seller }),
  ])

  const isStoreAdmin = accountType === "storeAdmin"
  const isOwner = !isStoreAdmin && user.role === "SELLER_SUPERADMIN"
  const identity = {
    accountType,
    user: isStoreAdmin
      ? {
          id: user._id,
          name: user.name,
          email: user.email,
          role: activeRole?.slug ?? activeRole?.displayName ?? "store_admin",
          roleId: user.roleId,
        }
      : { id: user._id, email: user.email, role: user.role, storeId: user.storeId },
    seller: sellerIdentityPayload(seller),
    scope: isStoreAdmin ? "permission-based" : isOwner ? "all-stores" : "single-store",
    menu: isStoreAdmin ? [] : isOwner ? ["overview", "stores", "team", "profile"] : ["overview"],
    permissions,
  }

  return { identity, branding, theme }
}

// ---------------------------------------------------------------------------
// HUB DATA — everything below runs AFTER loadUser, which already resolved
// req.seller + req.tenantDbName from the session and verified the tenant is
// active. Queries run inside the tenant's own database.
// ---------------------------------------------------------------------------

export async function getHubOverview({ seller, tenantDbName, user, userType }) {
  const { Store, StoreUser, Role } = getTenantModels(tenantDbName)

  const isOwner = user.role === "SELLER_SUPERADMIN"
  const isStoreAdmin = userType === "storeAdmin"

  // Determine store access based on role dataAccess
  let storeMatch = {}
  if (isOwner) {
    storeMatch = {}
  } else if (isStoreAdmin && user.roleId) {
    // For StoreAdmin, check their role's dataAccess
    const role = await Role.findById(user.roleId).select("dataAccess substoreIds").lean()
    if (role?.dataAccess === "all_substores") {
      storeMatch = {}
    } else if (role?.dataAccess === "multiple_substores" && role.substoreIds?.length) {
      storeMatch = { _id: { $in: role.substoreIds } }
    } else {
      // own_substore or default: only their assigned store
      storeMatch = { _id: user.storeId ?? seller.mainStoreId }
    }
  } else {
    // StoreUser (non-owner): only their assigned store
    storeMatch = { _id: user.storeId ?? seller.mainStoreId }
  }

  // Aggregation pipelines: project ONLY the fields the Hub renders (no
  // timestamps/audit/internal fields over the wire) and compute the substore
  // count inside the database instead of filtering arrays in Node.
  const [storeRows, teamAgg] = await Promise.all([
    Store.aggregate([
      { $match: storeMatch },
      { $sort: { type: 1, createdAt: 1 } },
      {
        $facet: {
          stores: [{ $project: { name: 1, type: 1, parentId: 1, isDeletable: 1, createdAt: 1 } }],
          counts: [{ $group: { _id: "$type", n: { $sum: 1 } } }],
        },
      },
    ]),
    (isOwner || isStoreAdmin) ? StoreUser.aggregate([{ $count: "n" }]) : Promise.resolve(null),
  ])

  const { stores = [], counts = [] } = storeRows[0] ?? {}
  const subStores = counts.find((c) => c._id === "SUB")?.n ?? 0

  return {
    seller: {
      id: seller._id,
      businessName: seller.businessName,
      multistoreEnabled: seller.multistoreEnabled,
      mainStoreId: seller.mainStoreId,
      profile: seller.profile ?? {},
    },
    stats: {
      totalStores: stores.length,
      subStores,
      teamMembers: (isOwner || isStoreAdmin) ? (teamAgg?.[0]?.n ?? 0) : null,
    },
    stores,
  }
}

// ---------------------------------------------------------------------------
// BRANDING — tiny aggregation-backed payload consumed by the Hub shell on
// every load. $project returns ONLY what the sidebar/theme needs, so the
// query stays covered and the response stays a few hundred bytes.
// ---------------------------------------------------------------------------
export async function getSellerBranding({ seller }) {
  const [row] = await Seller.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(String(seller._id)) } },
    {
      $project: {
        _id: 0,
        businessName: 1,
        // Fall back to the legacy single logo so old records keep working.
        logoLightUrl: { $ifNull: ["$profile.logoLightUrl", "$profile.logoUrl"] },
        logoDarkUrl: "$profile.logoDarkUrl",
        logoIconUrl: "$profile.logoIconUrl",
        logoIconDarkUrl: "$profile.logoIconDarkUrl",
        brandColor: "$profile.brandColor",
        accentColor: "$profile.accentColor",
      },
    },
  ])
  return row ?? {}
}

// Create a SUBSTORE — owner only, and only when the platform enabled
// multistore for this seller. Substores are OPTIONAL: single-store sellers
// simply keep working against their MAIN store.
export async function createSubstore({ seller, tenantDbName, user, name, req }) {
  if (user.role !== "SELLER_SUPERADMIN") throw new ApiError(403, "Only the owner can create substores")
  if (!seller.multistoreEnabled) {
    throw new ApiError(403, "Multistore is not enabled for this seller. Contact the platform administrator.")
  }

  const { Store } = getTenantModels(tenantDbName)

  const clash = await Store.findOne({ name: name.trim() }).collation({ locale: "en", strength: 2 })
  if (clash) throw new ApiError(409, "A store with this name already exists")

  const store = await Store.create({
    sellerId: seller._id,
    type: "SUB",
    name: name.trim(),
    parentId: seller.mainStoreId,
    isDeletable: true,
  })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.store.created",
    targetType: "Store",
    targetId: store._id,
    after: { name: store.name, type: "SUB" },
  })

  return store
}

// Invite a substore admin. Reuses the platform invite/activation flow —
// the token row lives in the master DB and carries sellerId so /activate
// resolves the right tenant database.
export async function inviteStoreUser({ seller, tenantDbName, user, storeId, email, role, req }) {
  if (user.role !== "SELLER_SUPERADMIN") throw new ApiError(403, "Only the owner can invite users")
  if (!["STORE_SUPERADMIN", "STORE_ADMIN"].includes(role)) throw new ApiError(400, "Invalid role")

  const { Store, StoreUser } = getTenantModels(tenantDbName)

  const store = await Store.findById(storeId)
  if (!store) throw new ApiError(404, "Store not found")

  const normalizedEmail = email.trim().toLowerCase()
  const emailTaken = await UserDirectory.findOne({ email: normalizedEmail })
  if (emailTaken) throw new ApiError(409, "This email is already in use")

  const session = await mongoose.startSession()
  let result
  try {
    result = await session.withTransaction(async () => {
      const [invited] = await StoreUser.create(
        [
          {
            sellerId: seller._id,
            mainStoreId: seller.mainStoreId,
            storeId: store._id,
            role,
            email: normalizedEmail,
            status: "invited",
            createdBy: user._id,
            createdByModel: "StoreUser",
          },
        ],
        { session },
      )

      await UserDirectory.create([{ email: normalizedEmail, sellerId: seller._id, userId: invited._id }], { session })

      const inviteToken = randomToken(32)
      await InviteToken.create(
        [
          {
            tokenHash: sha256(inviteToken),
            targetUserId: invited._id,
            sellerId: seller._id,
            purpose: "activation",
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          },
        ],
        { session },
      )

      return { invited, inviteToken }
    })
  } finally {
    await session.endSession()
  }

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.user.invited",
    targetType: "StoreUser",
    targetId: result.invited._id,
    after: { email: normalizedEmail, role, storeId: store._id },
  })

  // Dev only: returned so the flow can be tested; production emails it.
  return result
}

// ---------------------------------------------------------------------------
// SELLER PROFILE — business details + logo. The logo arrives as a base64
// data URL in the JSON body and is written to uploads/<sellerId>/images/
// by utils/uploads.js (no multer anywhere).
// ---------------------------------------------------------------------------
const PROFILE_FIELDS = [
  "phone",
  "website",
  "description",
  "addressLine1",
  "city",
  "state",
  "country",
  "postalCode",
]

export async function updateSellerProfile({ seller, user, updates, req }) {
  if (user.role !== "SELLER_SUPERADMIN") throw new ApiError(403, "Only the owner can edit the business profile")

  // Re-fetch as a full document (loadUser attaches a lean object).
  const doc = await Seller.findById(seller._id)
  if (!doc) throw new ApiError(404, "Seller not found")

  const before = { profile: JSON.parse(JSON.stringify(doc.profile ?? {})) }

  for (const field of PROFILE_FIELDS) {
    if (updates[field] !== undefined) doc.profile[field] = String(updates[field])
  }

  // Brand colors — hex string sets, empty/null clears back to default theme.
  for (const colorField of ["brandColor", "accentColor"]) {
    if (updates[colorField] !== undefined) {
      doc.profile[colorField] = updates[colorField] ? String(updates[colorField]).toLowerCase() : null
    }
  }

  // Light/dark logos — base64 arrives in JSON, file is written to
  // uploads/seller/<sellerId>/logo/ and ONLY the URL is stored in Mongo.
  // Replacing or removing a logo also deletes the old file from disk.
  const logoSlots = [
    { data: "logoLightBase64", remove: "removeLogoLight", field: "logoLightUrl" },
    { data: "logoDarkBase64", remove: "removeLogoDark", field: "logoDarkUrl" },
    { data: "logoIconBase64", remove: "removeLogoIcon", field: "logoIconUrl" },
    { data: "logoIconDarkBase64", remove: "removeLogoIconDark", field: "logoIconDarkUrl" },
  ]
  for (const slot of logoSlots) {
    if (updates[slot.data]) {
      const oldUrl = doc.profile[slot.field]
      doc.profile[slot.field] = await saveSellerImage({ sellerId: doc._id, dataUrl: updates[slot.data], folder: "logo" })
      if (oldUrl) await deleteSellerImage({ sellerId: doc._id, publicUrl: oldUrl })
    } else if (updates[slot.remove] === true && doc.profile[slot.field]) {
      await deleteSellerImage({ sellerId: doc._id, publicUrl: doc.profile[slot.field] })
      doc.profile[slot.field] = null
    }
  }
  // Migration: once a light logo exists the legacy single logoUrl is retired.
  if (updates.logoLightBase64 && doc.profile.logoUrl) {
    await deleteSellerImage({ sellerId: doc._id, publicUrl: doc.profile.logoUrl })
    doc.profile.logoUrl = null
  }

  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: doc._id,
    action: "seller.profile.updated",
    targetType: "Seller",
    targetId: doc._id,
    before,
    after: { profile: doc.profile },
  })

  return doc.profile
}
