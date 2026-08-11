import { env } from "../../config/env.js"
import { PlatformUser } from "../../models/platformUser.model.js"
import { audit } from "../audit/audit.service.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { verifyPlatformLogin } from "./auth.service.js"
import {
  clearAuthCookies,
  createSession,
  killOtherUserSessions,
  killSession,
  killSessionByRefreshToken,
  rotateRefreshToken,
  setAuthCookies,
  verifyAccessToken,
} from "./token.service.js"
import { hashPassword, verifyPassword } from "../../utils/crypto.js"
import { beginEnrollment, signPreauthToken, verifyPreauthToken, verifyTotpCode } from "./totp.service.js"

const PREAUTH_COOKIE = "preauth_token"

function setPreauthCookie(res, token) {
  res.cookie(PREAUTH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/api/auth",
    maxAge: 5 * 60 * 1000,
  })
}

// STEP 1: password. Hands off to the 2FA step when two-step verification is
// enabled; when it has been disabled in Settings, a session is issued directly.
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const user = await verifyPlatformLogin({ email, password, req })

  if (!user.twoFactorRequired && !user.totpEnabled) {
    const { accessToken, refreshToken } = await createSession({
      userId: user._id,
      userType: "platform",
      req,
    })
    setAuthCookies(res, { accessToken, refreshToken })
    return res.json({ twoFactorRequired: false })
  }

  const mode = user.totpEnabled ? "verify" : "enroll"
  setPreauthCookie(res, signPreauthToken({ userId: user._id, mode }))
  res.json({ twoFactorRequired: true, mode })
})

// STEP 2a (first login only): return QR + secret for authenticator enrollment.
export const setup2fa = asyncHandler(async (req, res) => {
  const token = req.cookies?.[PREAUTH_COOKIE]
  if (!token) return res.status(401).json({ error: "Login step required" })
  const payload = verifyPreauthToken(token)

  const { qrDataUrl, secret } = await beginEnrollment(payload.userId)
  res.json({ qrDataUrl, secret })
})

// STEP 2b: verify the 6-digit code → real session. Consumes the pre-auth cookie.
export const verify2fa = asyncHandler(async (req, res) => {
  const token = req.cookies?.[PREAUTH_COOKIE]
  if (!token) return res.status(401).json({ error: "Login step required" })
  const payload = verifyPreauthToken(token)

  const { code } = req.body
  const user = await verifyTotpCode({ userId: payload.userId, code })

  await audit({ req, actorId: user._id, actorRole: user.role, action: "auth.2fa_verified", targetType: "PlatformUser", targetId: user._id })

  const { accessToken, refreshToken } = await createSession({
    userId: user._id,
    userType: "platform",
    req,
  })
  res.clearCookie(PREAUTH_COOKIE, { path: "/api/auth" })
  setAuthCookies(res, { accessToken, refreshToken })
  res.json({ ok: true })
})

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refresh_token
  if (!token) return res.status(401).json({ error: "Not authenticated" })

  const rotated = await rotateRefreshToken({ refreshToken: token, req })
  if (!rotated) {
    clearAuthCookies(res)
    return res.status(401).json({ error: "Session expired" })
  }
  setAuthCookies(res, { accessToken: rotated.accessToken, refreshToken: rotated.refreshToken })
  res.json({ ok: true })
})

export const logout = asyncHandler(async (req, res) => {
  // 1) Revoke the session referenced by the access token (if still decodable).
  const accessToken = req.cookies?.access_token
  if (accessToken) {
    try {
      const payload = verifyAccessToken(accessToken)
      if (payload?.sessionId) await killSession(payload.sessionId)
    } catch {
      // expired/tampered token — fall through to the refresh-token lookup
    }
  }

  // 2) Revoke the session referenced by the refresh token. This is the one
  // that matters most: it is what would silently re-authenticate the browser
  // for up to 7 days if left alive.
  const refreshToken = req.cookies?.refresh_token
  if (refreshToken) await killSessionByRefreshToken(refreshToken)

  // 3) Always clear cookies, no matter what happened above.
  clearAuthCookies(res)
  res.json({ ok: true })
})

// Identity + permitted menu — the SERVER decides what the UI shows.
export const me = asyncHandler(async (req, res) => {
  const user = req.user
  const menu =
    user.role === "PLATFORM_SUPERADMIN"
      ? ["sellers", "audit"]
      : []
  res.json({
    user: { id: user._id, email: user.email, role: user.role },
    menu,
  })
})


export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body

  const user = await PlatformUser.findById(req.user._id).select("+passwordHash")
  if (!user) return res.status(401).json({ error: "Not authenticated" })

  const ok = await verifyPassword(user.passwordHash, currentPassword)
  if (!ok) return res.status(400).json({ error: "Current password is incorrect" })

  if (currentPassword === newPassword) {
    return res.status(400).json({ error: "New password must be different from the current one" })
  }

  user.passwordHash = await hashPassword(newPassword)
  user.passwordChangedAt = new Date()
  await user.save()

  await killOtherUserSessions(user._id, req.auth.sessionId)
  await audit({ req, actorId: user._id, actorRole: user.role, action: "auth.password_changed", targetType: "PlatformUser", targetId: user._id })

  res.json({ ok: true })
})

// SETTINGS: two-step verification status for the signed-in user.
export const twoFactorStatus = asyncHandler(async (req, res) => {
  const user = req.user
  res.json({ required: user.twoFactorRequired !== false, enrolled: !!user.totpEnabled })
})

// SETTINGS: turn two-step verification ON. Enrollment (QR scan) happens at the
// next sign-in — the login flow detects totpEnabled=false and serves the QR.
export const enableTwoFactor = asyncHandler(async (req, res) => {
  const user = req.user
  user.twoFactorRequired = true
  await user.save()
  await audit({ req, actorId: user._id, actorRole: user.role, action: "auth.2fa_enabled", targetType: "PlatformUser", targetId: user._id })
  res.json({ required: true, enrolled: !!user.totpEnabled })
})

// SETTINGS: turn two-step verification OFF. Clears the enrolled secret so a
// future re-enable performs a fresh enrollment with a new QR code.
export const disableTwoFactor = asyncHandler(async (req, res) => {
  const user = req.user
  user.twoFactorRequired = false
  user.totpEnabled = false
  await PlatformUser.updateOne({ _id: user._id }, { $set: { twoFactorRequired: false, totpEnabled: false, totpSecret: null } })
  await audit({ req, actorId: user._id, actorRole: user.role, action: "auth.2fa_disabled", targetType: "PlatformUser", targetId: user._id })
  res.json({ required: false, enrolled: false })
})


