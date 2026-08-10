import { getTenantModels } from "../config/tenantDb.js"
import { PlatformUser } from "../models/platformUser.model.js"
import { Seller } from "../modules/sellers/seller.model.js"
import { ApiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"


export const loadUser = asyncHandler(async (req, _res, next) => {
  const { userId, userType, sellerId } = req.auth

  let user
  if (userType === "platform") {
    user = await PlatformUser.findById(userId)
  } else {
    
    if (!sellerId) throw new ApiError(403, "Forbidden")

    const seller = await Seller.findById(sellerId).lean()
    if (!seller || seller.status !== "active" || seller.deletedAt) {
      throw new ApiError(403, "Forbidden")
    }

    const { StoreUser } = getTenantModels(seller.dbName)
    user = await StoreUser.findById(userId)
    req.seller = seller
    req.tenantDbName = seller.dbName
  }

  if (!user || user.status !== "active") throw new ApiError(403, "Forbidden")

  req.user = user
  req.userType = userType
  next()
})

// Deny-by-default role gate.
export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, "Forbidden"))
  }
  next()
}
