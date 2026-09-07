import jwt from "jsonwebtoken"
import QRCode from "qrcode"
import { randomUUID } from "node:crypto"
import { authenticator } from "../../utils/totp.js"
import { env } from "../../config/env.js"
import { jwtKeys, getVerifyKey } from "../../config/keys.js"
import { PlatformUser } from "../../models/platformUser.model.js"
import { ApiError } from "../../utils/apiError.js"

// Clock-drift tolerance in 30s steps. window:2 => accepts codes within ±60s,
// which absorbs normal phone/server clock differences. Tunable via TOTP_WINDOW
// (e.g. 3 => ±90s) for environments with looser clocks. Merge (don't overwrite)
// so step/digits defaults survive; otherwise the otpauth URI would emit
// digits=undefined&period=undefined and authenticator apps reject the QR.
const TOTP_WINDOW = Number(process.env.TOTP_WINDOW) || 2
authenticator.options = { ...authenticator.options, window: TOTP_WINDOW }

const PREAUTH_TTL = "5m"
const ISSUER = "Platform Admin"

// Pre-auth token: proves the password step succeeded, but grants NO API access.
// It is only accepted by /auth/2fa/* endpoints (purpose claim is checked).
export function signPreauthToken({ userId, mode }) {
  return jwt.sign(
    { userId: String(userId), purpose: "2fa-preauth", mode, jti: randomUUID() },
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
  if (payload.purpose !== "2fa-preauth") throw new ApiError(401, "Invalid pre-auth token")
  return payload
}

// First login: generate a secret and QR for enrollment. Secret is persisted
// immediately but totpEnabled stays false until the first valid code is presented.
export async function beginEnrollment(userId) {
  const user = await PlatformUser.findById(userId).select("+totpSecret")
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

// Verify a code. On successful ENROLLMENT verification, flips totpEnabled to true.
export async function verifyTotpCode({ userId, code }) {
  const user = await PlatformUser.findById(userId).select("+totpSecret")
  if (!user || !user.totpSecret) throw new ApiError(401, "2FA not initialized")

  const valid = authenticator.verify({ token: code, secret: user.totpSecret })
  if (!valid) throw new ApiError(401, "Invalid verification code")

  if (!user.totpEnabled) {
    user.totpEnabled = true
    await user.save()
  }
  return user
}
