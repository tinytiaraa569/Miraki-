import { getTenantModels } from "../../config/tenantDb.js"
import { InviteToken } from "../../models/inviteToken.model.js"
import { ApiError } from "../../utils/apiError.js"
import { hashPassword, sha256 } from "../../utils/crypto.js"
import { audit } from "../audit/audit.service.js"
import { Seller } from "../sellers/seller.model.js"


const INVALID = () => new ApiError(410, "This activation link is invalid or has expired")

// TENANT RESOLUTION: token (master) -> token.sellerId -> Seller registry row
// (master) -> seller.dbName -> StoreUser inside the seller's OWN database.
async function resolveTenantUser(token) {
  if (!token.sellerId) return null

  const seller = await Seller.findById(token.sellerId).lean()
  if (!seller || seller.status !== "active" || seller.deletedAt) return null

  const { StoreUser } = getTenantModels(seller.dbName)
  const user = await StoreUser.findById(token.targetUserId)
  if (!user || user.status !== "invited") return null

  return { seller, user }
}

async function findLiveToken(rawToken) {
  const token = await InviteToken.findOne({
    tokenHash: sha256(rawToken),
    purpose: "activation",
    consumed: false,
    expiresAt: { $gt: new Date() },
  }).lean()
  return token
}

// GET /api/activate/verify — non-consuming preview so the UI can show who is
// activating before they type a password. Returns only non-sensitive fields.
export async function verifyActivationToken(rawToken) {
  const token = await findLiveToken(rawToken)
  if (!token) throw INVALID()

  const resolved = await resolveTenantUser(token)
  if (!resolved) throw INVALID()

  return {
    email: resolved.user.email,
    businessName: resolved.seller.businessName,
    role: resolved.user.role,
    expiresAt: token.expiresAt,
  }
}

// POST /api/activate — consumes the token and sets the first password.
export async function activateAccount({ rawToken, password, req }) {
  // ATOMIC single-use consume: findOneAndUpdate flips consumed false→true in
  // one operation, so two concurrent requests with the same token can never
  // both succeed — the second one matches nothing and fails.
  const token = await InviteToken.findOneAndUpdate(
    {
      tokenHash: sha256(rawToken),
      purpose: "activation",
      consumed: false,
      expiresAt: { $gt: new Date() },
    },
    { $set: { consumed: true } },
    { new: true },
  ).lean()
  if (!token) throw INVALID()

  const resolved = await resolveTenantUser(token)
  if (!resolved) throw INVALID()

  const { seller, user } = resolved
  user.passwordHash = await hashPassword(password)
  user.status = "active"
  user.passwordChangedAt = new Date()
  await user.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: user.sellerId,
    action: "seller.owner.activated",
    targetType: "StoreUser",
    targetId: user._id,
    after: { status: "active", email: user.email },
  })

  return { email: user.email, businessName: seller.businessName }
}
