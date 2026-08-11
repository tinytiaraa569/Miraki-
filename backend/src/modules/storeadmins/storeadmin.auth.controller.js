import { env } from "../../config/env.js"
import { StoreAdmin } from "./storeadmin.model.js"
import { audit } from "../audit/audit.service.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { verifyStoreAdminLogin } from "./storeadmin.service.js"
import {
  clearAuthCookies,
  createSession,
  killOtherUserSessions,
  killSession,
  killSessionByRefreshToken,
  rotateRefreshToken,
  setAuthCookies,
  verifyAccessToken,
} from "../auth/token.service.js"
import { hashPassword, verifyPassword } from "../../utils/crypto.js"
// import { beginEnrollment, signPreauthToken, verifyPreauthToken, verifyTotpCode } from "./totp.storeadmin.service.js"
import { resolveEffectivePermissions , buildMenuFromPermissions } from "../../utils/permissions.js"
import { beginEnrollment, signPreauthToken, verifyPreauthToken, verifyTotpCode } from "./totp.storeadmin.service.js"
import { getTenantModels } from "../../config/tenantDb.js"

const PREAUTH_COOKIE = "preauth_token"
const PREAUTH_PATH = "/api/seller/store-admins/auth"

function setPreauthCookie(res, token) {
  res.cookie(PREAUTH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
    path: PREAUTH_PATH,
    maxAge: 5 * 60 * 1000,
  })
}


export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const { user, seller } = await verifyStoreAdminLogin({ email, password, req })

  if (!user.twoFactorRequired && !user.totpEnabled) {
    const { accessToken, refreshToken } = await createSession({
      userId: user._id,
      userType: "storeAdmin",
      sellerId: seller._id,
      req,
    })
    setAuthCookies(res, { accessToken, refreshToken })
    return res.json({ twoFactorRequired: false })
  }

  const mode = user.totpEnabled ? "verify" : "enroll"
  setPreauthCookie(res, signPreauthToken({ userId: user._id, mode, sellerId: seller._id }))
  res.json({ twoFactorRequired: true, mode })
})

export const setup2fa = asyncHandler(async (req, res) => {
  const token = req.cookies?.[PREAUTH_COOKIE]
  if (!token) return res.status(401).json({ error: "Login step required" })
  const payload = verifyPreauthToken(token)

  const { qrDataUrl, secret } = await beginEnrollment({ userId: payload.userId, sellerId: payload.sellerId })
  res.json({ qrDataUrl, secret })
})

export const verify2fa = asyncHandler(async (req, res) => {
  const token = req.cookies?.[PREAUTH_COOKIE]
  if (!token) return res.status(401).json({ error: "Login step required" })
  const payload = verifyPreauthToken(token)

  const { code } = req.body
  const user = await verifyTotpCode({ userId: payload.userId, sellerId: payload.sellerId, code })

  await audit({
    req,
    actorId: user._id,
    actorRole: "STORE_ADMIN",
    sellerId: payload.sellerId,
    action: "auth.2fa_verified",
    targetType: "StoreAdmin",
    targetId: user._id,
  })

  const { accessToken, refreshToken } = await createSession({
    userId: user._id,
    userType: "storeAdmin",
    sellerId: payload.sellerId,
    req,
  })
  res.clearCookie(PREAUTH_COOKIE, { path: PREAUTH_PATH })
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
  const accessToken = req.cookies?.access_token
  if (accessToken) {
    try {
      const payload = verifyAccessToken(accessToken)
      if (payload?.sessionId) await killSession(payload.sessionId)
    } catch {
      // expired/tampered token — fall through to the refresh-token lookup
    }
  }

  const refreshToken = req.cookies?.refresh_token
  if (refreshToken) await killSessionByRefreshToken(refreshToken)

  clearAuthCookies(res)
  res.json({ ok: true })
})



export const me = asyncHandler(async (req, res) => {
  const user = req.user // StoreAdmin doc, attached by loadUser

  const { Role, Permission } = await getTenantModels(req.tenantDbName)

  const role = await Role.findById(user.roleId).select("displayName slug color dataAccess").lean()

  const permissions = await resolveEffectivePermissions({ Permission, role, user })
  const menu = buildMenuFromPermissions(permissions)

  res.json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: role ? { id: role._id, displayName: role.displayName, slug: role.slug, color: role.color } : null,
      dataAccess: role?.dataAccess ?? null,
    },
    menu,
    permissions: permissions.map((p) => p.key), })
})
// SETTINGS: change password. Verifies the current password, hashes the new one
// with argon2id, and revokes every OTHER session so stolen sessions die.
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body

  const user = await StoreAdmin.findById(req.user._id).select("+passwordHash")
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
  await audit({
    req,
    actorId: user._id,
    actorRole: "STORE_ADMIN", 
    action: "auth.password_changed",
    targetType: "StoreAdmin",
    targetId: user._id,
  })

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
  await audit({
    req,
    actorId: user._id,
    actorRole: "STORE_ADMIN",
    action: "auth.2fa_enabled",
    targetType: "StoreAdmin",
    targetId: user._id,
  })
  res.json({ required: true, enrolled: !!user.totpEnabled })
})

// SETTINGS: turn two-step verification OFF. Clears the enrolled secret so a
// future re-enable performs a fresh enrollment with a new QR code.
export const disableTwoFactor = asyncHandler(async (req, res) => {
  const user = req.user
  user.twoFactorRequired = false
  user.totpEnabled = false
  await StoreAdmin.updateOne(
    { _id: user._id },
    { $set: { twoFactorRequired: false, totpEnabled: false, totpSecret: null } },
  )
  await audit({
    req,
    actorId: user._id,
    actorRole: "STORE_ADMIN",
    action: "auth.2fa_disabled",
    targetType: "StoreAdmin",
    targetId: user._id,
  })
  res.json({ required: false, enrolled: false })
})