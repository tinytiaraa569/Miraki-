import jwt from "jsonwebtoken"
import QRCode from "qrcode"
import { randomUUID } from "node:crypto"
import { authenticator } from "../../utils/totp.js"
import { env } from "../../config/env.js"
import { jwtKeys, getVerifyKey } from "../../config/keys.js"
import { getTenantModels } from "../../config/tenantDb.js"
import { Seller } from "../sellers/seller.model.js"
import { ApiError } from "../../utils/apiError.js"

const TOTP_WINDOW = Number(process.env.TOTP_WINDOW) || 2
authenticator.options = { ...authenticator.options, window: TOTP_WINDOW }

const PREAUTH_TTL = "5m"
const ISSUER = "Miraki Jewels"


const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

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
    {
      algorithm: "RS256",
      expiresIn: PREAUTH_TTL,
      keyid: jwtKeys.kid,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_PREAUTH_AUDIENCE,
    },
  )
}

export function verifyPreauthToken(token) {
  const kid = jwt.decode(token, { complete: true })?.header?.kid
  const payload = jwt.verify(token, getVerifyKey(kid), {
    algorithms: ["RS256"],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_PREAUTH_AUDIENCE,
  })
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

export async function verifyTotpCode({ userId, sellerId, code, mode }) {
  const StoreAdmin = await resolveStoreAdminModel(sellerId)
  const user = await StoreAdmin.findById(userId).select("+totpSecret +lastTotpStep")
  if (!user || !user.totpSecret) throw new ApiError(401, "2FA not initialized")

  // Account-level lockout — refuse before checking the code so repeated wrong
  // codes can't be ground down on a single account.
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new ApiError(429, "Account temporarily locked. Try again later.")
  }

  // Enforce the preauth token's mode: an "enroll" token may ONLY complete a
  // first-time enrollment, and a "verify" token may ONLY be used once already
  // enrolled. This stops a token minted for one purpose being replayed for the
  // other (e.g. a verify-token being used to rebind a fresh authenticator).
  if (mode === "verify" && !user.totpEnabled) throw new ApiError(401, "Invalid verification code")
  if (mode === "enroll" && user.totpEnabled) throw new ApiError(409, "2FA already enrolled")

  const matchedStep = authenticator.verifyGetStep({ token: code, secret: user.totpSecret })
  // Replay guard: a code whose time-step was already accepted (or is older than
  // the last accepted one) is rejected even though it may still be inside the
  // drift window. A legit login always presents a NEW code, so this is
  // invisible to real users but blocks a captured-code replay.
  const replayed =
    matchedStep !== null && user.lastTotpStep != null && matchedStep <= user.lastTotpStep

  if (matchedStep === null || replayed) {
    user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCKOUT_MS)
      user.failedLoginAttempts = 0
    }
    await user.save()
    throw new ApiError(401, "Invalid verification code")
  }

  // Success — remember the accepted step (blocks replay of it and older codes),
  // clear the failure counter, and complete first-time enrollment. `enrolled`
  // tells the caller a NEW authenticator was just bound (worth alerting on).
  const enrolled = !user.totpEnabled
  user.lastTotpStep = matchedStep
  user.failedLoginAttempts = 0
  user.lockedUntil = null
  user.twoStepVerifiedAt = new Date()
  if (enrolled) user.totpEnabled = true
  await user.save()
  return { user, enrolled }
}