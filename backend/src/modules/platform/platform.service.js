import mongoose from "mongoose"
import { cacheInvalidate } from "../../config/redis.js"
import { InviteToken } from "../../models/inviteToken.model.js"
import { PlatformUser } from "../../models/platformUser.model.js"
import { ApiError } from "../../utils/apiError.js"
import { hashPassword, randomToken, sha256 } from "../../utils/crypto.js"
import { audit } from "../audit/audit.service.js"
import { AuditLog } from "../audit/auditLog.model.js"
import { killAllUserSessions } from "../auth/token.service.js"
import { dropTenantDb, getTenantModels, makeTenantDbName } from "../../config/tenantDb.js"
import { UserDirectory } from "../../models/userDirectory.model.js"
import { Seller } from "../sellers/seller.model.js"
import { UPLOADS_ROOT } from "../../utils/uploads.js"
import { rm } from "node:fs/promises"
import path from "node:path"

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

// SINGLE MONGODB TRANSACTION spanning the MASTER DB and the seller's brand-new
// DEDICATED TENANT DATABASE (`tenant_<slug>_<hash>` — same cluster, same
// client, so one session covers both):
//   master:  1. seller registry row (with its dbName)  4. single-use invite token
//   tenant:  2. MAIN store  3. SELLER_SUPERADMIN user
// Any step fails → whole transaction rolls back (no orphan sellers, no orphan
// tenant data).
export async function createSellerWithMainStore({ businessName, ownerEmail, multistoreEnabled, actor, req }) {
  const slug = slugify(businessName)
  if (!slug) throw new ApiError(400, "Invalid business name")

  const existing = await Seller.findOne({ slug })
  if (existing) throw new ApiError(409, "A seller with this business name already exists")

  // One login email = one tenant, platform-wide (directory has a unique index;
  // this pre-check just returns a friendlier error than a raw E11000).
  const emailTaken = await UserDirectory.findOne({ email: ownerEmail.toLowerCase() })
  if (emailTaken) throw new ApiError(409, "This owner email is already in use by another seller")

  // The dedicated database for this seller — created lazily by MongoDB on
  // first write inside the transaction below.
  const dbName = makeTenantDbName(slug)
  const { Store, StoreUser } = getTenantModels(dbName)

  const session = await mongoose.startSession()
  let result
  try {
    result = await session.withTransaction(async () => {
      // MASTER DB: tenant registry row.
      const [seller] = await Seller.create(
        [{ businessName, slug, dbName, ownerEmail, multistoreEnabled, createdBy: actor._id }],
        { session },
      )

      // TENANT DB: the seller's own database gets its MAIN store.
      const [mainStore] = await Store.create(
        [
          {
            sellerId: seller._id,
            type: "MAIN",
            name: `${businessName} — Main Store`,
            isDeletable: false,
            parentId: null,
          },
        ],
        { session },
      )

      seller.mainStoreId = mainStore._id
      await seller.save({ session })

      // TENANT DB: owner account. Scope chain stamped SERVER-SIDE from the
      // transaction context, never from the request body.
      const [owner] = await StoreUser.create(
        [
          {
            sellerId: seller._id,
            mainStoreId: mainStore._id,
            storeId: null,
            role: "SELLER_SUPERADMIN",
            email: ownerEmail,
            status: "invited",
            createdBy: actor._id,
            createdByModel: "PlatformUser",
          },
        ],
        { session },
      )

      // MASTER DB: email -> tenant directory row, so seller-side login can
      // resolve which tenant database this user's credentials live in.
      await UserDirectory.create(
        [{ email: ownerEmail, sellerId: seller._id, userId: owner._id }],
        { session },
      )

      // MASTER DB: invite token carries sellerId so activation can resolve
      // which tenant database the target user lives in.
      const inviteToken = randomToken(32)
      await InviteToken.create(
        [
          {
            tokenHash: sha256(inviteToken),
            targetUserId: owner._id,
            sellerId: seller._id,
            purpose: "activation",
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          },
        ],
        { session },
      )

      return { seller, mainStore, owner, inviteToken }
    })
  } finally {
    await session.endSession()
  }

  await audit({
    req,
    actorId: actor._id,
    actorRole: actor.role,
    sellerId: result.seller._id,
    action: "platform.seller.created",
    targetType: "Seller",
    targetId: result.seller._id,
    after: { businessName, ownerEmail, multistoreEnabled },
  })

  // New seller + new audit entry → drop both cached lists.
  await Promise.all([cacheInvalidate("cache:platform:sellers:"), cacheInvalidate("cache:platform:audit:")])

  // In production, the invite token is emailed to the owner — never returned to the client.
  // Returned here in dev only so the activation flow can be tested end-to-end.
  return result
}

// Dashboard stats: ONE aggregation returns every seller count the overview
// needs ($group by status over non-deleted rows), instead of the client
// firing a separate request per stat card.
export async function getSellerStats() {
  const rows = await Seller.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ])
  const byStatus = Object.fromEntries(rows.map((r) => [r._id, r.count]))
  const active = byStatus.active ?? 0
  const suspended = byStatus.suspended ?? 0
  return { total: active + suspended, active, suspended }
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// Single optimized aggregation pipeline: $match (uses the compound indexes) →
// $facet runs the paginated $sort/$skip/$limit and the total $count in ONE
// database round-trip instead of two separate queries.
export async function listSellers({ page = 1, limit = 20, status, deleted = false, q }) {
  // deleted=true → trash view (only soft-deleted); otherwise deleted rows are always hidden.
  const match = deleted ? { deletedAt: { $ne: null } } : { deletedAt: null }
  if (status && !deleted) match.status = status
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i")
    match.$or = [{ businessName: rx }, { ownerEmail: rx }, { slug: rx }]
  }

  // Stable sort: tiebreak on _id so pages never overlap or skip rows.
  const sort = deleted ? { deletedAt: -1, _id: -1 } : { createdAt: -1, _id: -1 }
  const skip = (page - 1) * limit

  const [result] = await Seller.aggregate([
    { $match: match },
    {
      $facet: {
        items: [
          { $sort: sort },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              businessName: 1,
              slug: 1,
              dbName: 1,
              ownerEmail: 1,
              status: 1,
              multistoreEnabled: 1,
              mainStoreId: 1,
              createdAt: 1,
              updatedAt: 1,
              deletedAt: 1,
            },
          },
        ],
        meta: [{ $count: "total" }],
      },
    },
  ])

  const items = result?.items ?? []
  const total = result?.meta?.[0]?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))
  return {
    items,
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}

// Full detail view for the platform "seller details" modal: the master
// registry row (incl. business profile + logo) PLUS live tenant data
// (stores with MAIN/SUB type, user count) in ONE response. Tenant queries
// are best-effort — a trashed tenant may already have its DB dropped.
export async function getSellerDetails({ sellerId }) {
  const seller = await Seller.findById(sellerId).lean()
  if (!seller) throw new ApiError(404, "Seller not found")

  let stores = []
  let userCount = null
  try {
    const { Store, StoreUser } = getTenantModels(seller.dbName)
    ;[stores, userCount] = await Promise.all([
      Store.find({}).sort({ type: 1, createdAt: 1 }).select("name type parentId isDeletable createdAt").lean(),
      StoreUser.countDocuments({}),
    ])
  } catch {
    // tenant DB unreachable — return registry data alone
  }

  return { seller, stores, userCount }
}

export async function updateSeller({ sellerId, updates, actor, req }) {
  const seller = await Seller.findById(sellerId)
  if (!seller || seller.deletedAt) throw new ApiError(404, "Seller not found")

  const before = {
    businessName: seller.businessName,
    ownerEmail: seller.ownerEmail,
    multistoreEnabled: seller.multistoreEnabled,
  }

  if (updates.businessName && updates.businessName !== seller.businessName) {
    const slug = slugify(updates.businessName)
    if (!slug) throw new ApiError(400, "Invalid business name")
    const clash = await Seller.findOne({ slug, _id: { $ne: seller._id } })
    if (clash) throw new ApiError(409, "A seller with this business name already exists")
    seller.businessName = updates.businessName
    seller.slug = slug
  }
  if (updates.ownerEmail !== undefined && updates.ownerEmail.toLowerCase() !== seller.ownerEmail) {
    const newEmail = updates.ownerEmail.toLowerCase()
    const taken = await UserDirectory.findOne({ email: newEmail })
    if (taken) throw new ApiError(409, "This owner email is already in use")
    // Keep the login directory + tenant-DB owner account in sync.
    const { StoreUser } = getTenantModels(seller.dbName)
    const owner = await StoreUser.findOne({ role: "SELLER_SUPERADMIN", email: seller.ownerEmail })
    if (owner) {
      await UserDirectory.updateOne({ userId: owner._id }, { email: newEmail })
      owner.email = newEmail
      await owner.save()
    }
    seller.ownerEmail = newEmail
  }
  if (updates.multistoreEnabled !== undefined) seller.multistoreEnabled = updates.multistoreEnabled

  await seller.save()

  await audit({
    req,
    actorId: actor._id,
    actorRole: actor.role,
    sellerId: seller._id,
    action: "platform.seller.updated",
    targetType: "Seller",
    targetId: seller._id,
    before,
    after: {
      businessName: seller.businessName,
      ownerEmail: seller.ownerEmail,
      multistoreEnabled: seller.multistoreEnabled,
    },
  })

  await Promise.all([cacheInvalidate("cache:platform:sellers:"), cacheInvalidate("cache:platform:audit:")])
  return seller
}

// Soft delete: mark trashed, kill every live session in the tenant, and
// suspend all its users so nobody can log in while the seller sits in trash.
export async function softDeleteSeller({ sellerId, actor, req }) {
  const seller = await Seller.findById(sellerId)
  if (!seller || seller.deletedAt) throw new ApiError(404, "Seller not found")

  seller.deletedAt = new Date()
  seller.deletedBy = actor._id
  await seller.save()

  // Tenant lockout happens inside the seller's OWN database.
  const { StoreUser } = getTenantModels(seller.dbName)
  const users = await StoreUser.find({}).select("_id").lean()
  await Promise.all(users.map((u) => killAllUserSessions(u._id)))
  await StoreUser.updateMany({ status: "active" }, { status: "suspended" })

  await audit({
    req,
    actorId: actor._id,
    actorRole: actor.role,
    sellerId: seller._id,
    action: "platform.seller.soft_deleted",
    targetType: "Seller",
    targetId: seller._id,
    before: { deletedAt: null },
    after: { deletedAt: seller.deletedAt },
  })

  await Promise.all([cacheInvalidate("cache:platform:sellers:"), cacheInvalidate("cache:platform:audit:")])
  return seller
}

// Restore from trash: un-trash the seller and reactivate its users.
export async function restoreSeller({ sellerId, actor, req }) {
  const seller = await Seller.findById(sellerId)
  if (!seller || !seller.deletedAt) throw new ApiError(404, "Deleted seller not found")

  const before = { deletedAt: seller.deletedAt }
  seller.deletedAt = null
  seller.deletedBy = null
  await seller.save()

  const { StoreUser } = getTenantModels(seller.dbName)
  await StoreUser.updateMany({ status: "suspended" }, { status: "active" })

  await audit({
    req,
    actorId: actor._id,
    actorRole: actor.role,
    sellerId: seller._id,
    action: "platform.seller.restored",
    targetType: "Seller",
    targetId: seller._id,
    before,
    after: { deletedAt: null },
  })

  await Promise.all([cacheInvalidate("cache:platform:sellers:"), cacheInvalidate("cache:platform:audit:")])
  return seller
}

// Permanent delete: only allowed FROM TRASH (two-step: soft delete first).
// Purges the master records in one transaction, then DROPS THE ENTIRE TENANT
// DATABASE — clean purge, nothing orphaned anywhere.
export async function hardDeleteSeller({ sellerId, actor, req }) {
  const seller = await Seller.findById(sellerId)
  if (!seller) throw new ApiError(404, "Seller not found")
  if (!seller.deletedAt) {
    throw new ApiError(400, "Seller must be moved to trash before permanent deletion")
  }

  // Kill any lingering sessions before the purge (users live in the tenant DB).
  const { StoreUser } = getTenantModels(seller.dbName)
  const users = await StoreUser.find({}).select("_id").lean()
  await Promise.all(users.map((u) => killAllUserSessions(u._id)))

  // MASTER DB cleanup in one transaction (dropDatabase cannot join a txn).
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      await InviteToken.deleteMany({ sellerId: seller._id }, { session })
      await UserDirectory.deleteMany({ sellerId: seller._id }, { session })
      await Seller.deleteOne({ _id: seller._id }, { session })
    })
  } finally {
    await session.endSession()
  }

  // Drop the seller's dedicated database — stores, users, and every future
  // collection vanish in a single operation.
  await dropTenantDb(seller.dbName)

  // Purge the seller's uploaded files (logo etc.) from disk — best effort.
  await rm(path.join(UPLOADS_ROOT, String(seller._id)), { recursive: true, force: true }).catch(() => {})

  await audit({
    req,
    actorId: actor._id,
    actorRole: actor.role,
    sellerId: seller._id,
    action: "platform.seller.hard_deleted",
    targetType: "Seller",
    targetId: seller._id,
    before: { businessName: seller.businessName, ownerEmail: seller.ownerEmail },
    after: null,
  })

  await Promise.all([cacheInvalidate("cache:platform:sellers:"), cacheInvalidate("cache:platform:audit:")])
  return { ok: true }
}

export async function setSellerStatus({ sellerId, status, actor, req }) {
  const seller = await Seller.findById(sellerId)
  if (!seller || seller.deletedAt) throw new ApiError(404, "Seller not found")

  const before = { status: seller.status }
  seller.status = status
  await seller.save()

  const { StoreUser } = getTenantModels(seller.dbName)
  if (status === "suspended") {
    // Suspending kills ALL live sessions of every user in the tenant immediately.
    const users = await StoreUser.find({}).select("_id").lean()
    await Promise.all(users.map((u) => killAllUserSessions(u._id)))
    await StoreUser.updateMany({ status: "active" }, { status: "suspended" })
  } else if (status === "active") {
    await StoreUser.updateMany({ status: "suspended" }, { status: "active" })
  }

  await audit({
    req,
    actorId: actor._id,
    actorRole: actor.role,
    sellerId: seller._id,
    action: `platform.seller.${status}`,
    targetType: "Seller",
    targetId: seller._id,
    before,
    after: { status },
  })

  // Status changed + new audit entry → drop both cached lists.
  await Promise.all([cacheInvalidate("cache:platform:sellers:"), cacheInvalidate("cache:platform:audit:")])

  return seller
}

// ---------------------------------------------------------------------------
// Platform superadmin management.
// All superadmins are equal: any of them can create/suspend/toggle 2FA for
// others — but never for themselves, and the original seeded account can
// never be suspended.
// ---------------------------------------------------------------------------

const SUPERADMIN_PUBLIC_FIELDS = "name email status isOriginal totpEnabled twoFactorRequired createdAt updatedAt"

export async function listSuperadmins() {
  const items = await PlatformUser.find({ role: "PLATFORM_SUPERADMIN" })
    .select(SUPERADMIN_PUBLIC_FIELDS)
    .sort({ createdAt: 1 })
    .lean()
  return { items, total: items.length }
}

export async function createSuperadmin({ name, email, password, actor, req }) {
  const existing = await PlatformUser.findOne({ email: email.toLowerCase() })
  if (existing) throw new ApiError(409, "A superadmin with this email already exists")

  const passwordHash = await hashPassword(password)
  const user = await PlatformUser.create({
    role: "PLATFORM_SUPERADMIN",
    name: name || "",
    email,
    passwordHash,
    createdBy: actor._id,
  })

  await audit({
    req,
    actorId: actor._id,
    actorRole: actor.role,
    action: "platform.superadmin.created",
    targetType: "PlatformUser",
    targetId: user._id,
    after: { email: user.email, name: user.name },
  })

  await cacheInvalidate("cache:platform:audit:")
  return user
}

export async function setSuperadminStatus({ targetId, status, actor, req }) {
  if (String(actor._id) === String(targetId)) {
    throw new ApiError(400, "You cannot change your own status")
  }

  const user = await PlatformUser.findById(targetId)
  if (!user || user.role !== "PLATFORM_SUPERADMIN") throw new ApiError(404, "Superadmin not found")
  if (user.isOriginal && status === "suspended") {
    throw new ApiError(403, "The original superadmin account cannot be suspended")
  }

  const before = { status: user.status }
  user.status = status
  await user.save()

  if (status === "suspended") {
    // Kill all live sessions of the suspended superadmin immediately.
    await killAllUserSessions(user._id)
  }

  await audit({
    req,
    actorId: actor._id,
    actorRole: actor.role,
    action: `platform.superadmin.${status}`,
    targetType: "PlatformUser",
    targetId: user._id,
    before,
    after: { status },
  })

  await cacheInvalidate("cache:platform:audit:")
  return user
}

export async function setSuperadminTwoFactor({ targetId, required, actor, req }) {
  if (String(actor._id) === String(targetId)) {
    throw new ApiError(400, "Manage your own two-step verification from Settings")
  }

  const user = await PlatformUser.findById(targetId).select("+totpSecret")
  if (!user || user.role !== "PLATFORM_SUPERADMIN") throw new ApiError(404, "Superadmin not found")

  const before = { twoFactorRequired: user.twoFactorRequired, totpEnabled: user.totpEnabled }
  user.twoFactorRequired = required
  if (!required) {
    // Turning 2FA off clears the enrolled authenticator so a future
    // re-enable forces a fresh TOTP setup.
    user.totpSecret = null
    user.totpEnabled = false
  }
  await user.save()

  await audit({
    req,
    actorId: actor._id,
    actorRole: actor.role,
    action: `platform.superadmin.twofactor.${required ? "on" : "off"}`,
    targetType: "PlatformUser",
    targetId: user._id,
    before,
    after: { twoFactorRequired: required },
  })

  await cacheInvalidate("cache:platform:audit:")
  return user
}

export async function listAuditLogs({ page = 1, limit = 30, sellerId, action }) {
  const filter = {}
  if (sellerId) filter.sellerId = sellerId
  if (action) filter.action = { $regex: `^${action.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}` }

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ])
  return { items, total, page, limit }
}
