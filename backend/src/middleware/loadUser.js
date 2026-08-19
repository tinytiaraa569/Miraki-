import { getTenantModels } from "../config/tenantDb.js"
import { PlatformUser } from "../models/platformUser.model.js"
import { Seller } from "../modules/sellers/seller.model.js"
import { ApiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { resolveEffectivePermissions } from "../utils/permissions.js"

function normalizeRoleName(value) {
  if (!value) return null
  const normalized = String(value).trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_")
  return normalized.replace(/^_+|_+$/g, "") || null
}

export const loadUser = asyncHandler(async (req, _res, next) => {
  const { userId, userType, sellerId } = req.auth

  let user
  if (userType === "platform") {
    user = await PlatformUser.findById(userId)
  } else if (userType === "store" || userType === "storeAdmin") {
    if (!sellerId) throw new ApiError(403, "Forbidden")

    const seller = await Seller.findById(sellerId).lean()
    if (!seller || seller.status !== "active" || seller.deletedAt) {
      throw new ApiError(403, "Forbidden")
    }

    const { StoreUser, StoreAdmin, Role, Permission } = getTenantModels(seller.dbName)
    user = userType === "storeAdmin"
      ? await StoreAdmin.findById(userId)
      : await StoreUser.findById(userId)

    if (!user || (userType === "storeAdmin" && (user.isDeleted || user.deletedAt))) {
      throw new ApiError(403, "Forbidden")
    }

    if (userType === "storeAdmin") {
      const role = await Role.findById(user.roleId).select("slug displayName permissions status isDeleted").lean()
      if (!role || role.status !== "active" || role.isDeleted) {
        throw new ApiError(403, "Forbidden")
      }
      const canonicalRole = normalizeRoleName(role?.slug || role?.displayName || "STORE_ADMIN")
      user.role = canonicalRole || "STORE_ADMIN"
      user.roleId = user.roleId
      user.permissions = (await resolveEffectivePermissions({ Permission, role, user })).map((p) => p.key)
    } else {
      user.role = normalizeRoleName(user.role) || "STORE_ADMIN"
      user.permissions = Array.isArray(user.permissionPolicy?.permissions)
        ? user.permissionPolicy.permissions
        : []
    }

    req.seller = seller
    req.tenantDbName = seller.dbName
  } else {
    throw new ApiError(403, "Forbidden")
  }

  if (!user || user.status !== "active") throw new ApiError(403, "Forbidden")

  req.user = user
  req.userType = userType
  next()
})

// Deny-by-default role gate.
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(403, "Forbidden"))

  // StoreAdmin role slugs are seller-defined labels, not trusted account
  // roles. StoreAdmin authorization must always go through permissions.
  if (req.userType === "storeAdmin") {
    return next(new ApiError(403, "Forbidden"))
  }

  const allowed = new Set(roles.map((role) => normalizeRoleName(role)))
  const accountRole = normalizeRoleName(req.user.role)

  if (accountRole && allowed.has(accountRole)) {
    return next()
  }

  return next(new ApiError(403, "Forbidden"))
}

// Allow StoreUser with hard-coded roles OR StoreAdmin with any active assigned role.
// Used for baseline Hub shell endpoints (/seller/me, /seller/hub, /seller/branding).
export const requireStoreAccess = (...additionalRoles) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(403, "Forbidden"))

  // StoreUser: check against hard-coded roles + any additional roles passed
  const allowedRoles = new Set(["SELLER_SUPERADMIN", "STORE_SUPERADMIN", "STORE_ADMIN", ...additionalRoles].map(normalizeRoleName))
  const accountRole = normalizeRoleName(req.user.role)
  if (accountRole && allowedRoles.has(accountRole)) {
    return next()
  }

  // StoreAdmin: allow if they have an active roleId (validated in loadUser)
  if (req.userType === "storeAdmin" && req.user.roleId) {
    return next()
  }

  return next(new ApiError(403, "Forbidden"))
}

// Permission-based gate: require a specific permission key (e.g., "product.read", "order.write").
// Owner (SELLER_SUPERADMIN) bypasses all permission checks.
export const requirePermission = (module, action) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(403, "Forbidden"))

  // StoreUser accounts are trusted seller-side accounts. Permission records
  // are only used to restrict StoreAdmin accounts with assigned roles.
  if (req.userType === "store") {
    return next()
  }

  // Owner bypass (kept for callers that do not expose req.userType).
  const accountRole = normalizeRoleName(req.user.role)
  if (accountRole === "SELLER_SUPERADMIN") {
    return next()
  }

  const requiredKey = `${module}.${action}`.toLowerCase()
  const userPermissions = new Set(
    (Array.isArray(req.user.permissions) ? req.user.permissions : []).map((p) => p.toLowerCase())
  )

  // Check exact permission or wildcard manage permission for the module
  const hasPermission =
    userPermissions.has(requiredKey) ||
    userPermissions.has(`${module}.manage`) ||
    userPermissions.has("*")

  if (hasPermission) {
    return next()
  }

  return next(new ApiError(403, "Forbidden"))
}
