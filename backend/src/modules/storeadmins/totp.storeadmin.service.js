import jwt from "jsonwebtoken"
import QRCode from "qrcode"
import { randomUUID } from "node:crypto"
import { authenticator } from "../../utils/totp.js"
import { jwtKeys } from "../../config/keys.js"
import { getTenantModels } from "../../config/tenantDb.js"
import { Seller } from "../sellers/seller.model.js"
import { ApiError } from "../../utils/apiError.js"

const TOTP_WINDOW = Number(process.env.TOTP_WINDOW) || 2
authenticator.options = { ...authenticator.options, window: TOTP_WINDOW }

const PREAUTH_TTL = "5m"
const ISSUER = "Seller Hub"

// Separate "purpose" claim (2fa-preauth-store, not 2fa-preauth) so a
// pre-auth token minted here can never be replayed against the platform
// 2FA endpoints, or vice versa — the two token spaces don't overlap.
export function signPreauthToken({ userId, mode, sellerId }) {
  return jwt.sign(
    {
      userId: String(userId),
      sellerId: String(sellerId),
      purpose: "2fa-preauth-store",
      mode,
      jti: randomUUID(),
    },
    jwtKeys.privateKey,
    { algorithm: "RS256", expiresIn: PREAUTH_TTL },
  )
}

export function verifyPreauthToken(token) {
  const payload = jwt.verify(token, jwtKeys.publicKey, { algorithms: ["RS256"] })
  if (payload.purpose !== "2fa-preauth-store") throw new ApiError(401, "Invalid pre-auth token")
  return payload
}

async function resolveStoreAdminModel(sellerId) {
  const seller = await Seller.findById(sellerId).lean()
  if (!seller) throw new ApiError(401, "Invalid pre-auth token")
  const { StoreAdmin } = getTenantModels(seller.dbName)
  return StoreAdmin
}

export async function beginEnrollment({ userId, sellerId }) {
  const StoreAdmin = await resolveStoreAdminModel(sellerId)
  const user = await StoreAdmin.findById(userId).select("+totpSecret")
  if (!user) throw new ApiError(401, "Invalid pre-auth token")
  if (user.totpEnabled) throw new ApiError(409, "2FA already enrolled")

  if (!user.totpSecret) {
    user.totpSecret = authenticator.generateSecret()
    await user.save()
  }

  const otpauthUrl = authenticator.keyuri(user.email, ISSUER, user.totpSecret)
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 240 })
  return { qrDataUrl, secret: user.totpSecret }
}

export async function verifyTotpCode({ userId, sellerId, code }) {
  const StoreAdmin = await resolveStoreAdminModel(sellerId)
  const user = await StoreAdmin.findById(userId).select("+totpSecret")
  if (!user || !user.totpSecret) throw new ApiError(401, "2FA not initialized")

  const valid = authenticator.verify({ token: code, secret: user.totpSecret })
  if (!valid) throw new ApiError(401, "Invalid verification code")

  if (!user.totpEnabled) {
    user.totpEnabled = true
    await user.save()
  }
  return user
}