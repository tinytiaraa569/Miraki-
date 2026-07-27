import jwt from "jsonwebtoken"
import { randomUUID } from "node:crypto"
import { env } from "../../config/env.js"
import { jwtKeys } from "../../config/keys.js"
import { Session } from "../../models/session.model.js"
import { randomToken, sha256 } from "../../utils/crypto.js"

const ACCESS_TTL = `${env.ACCESS_TOKEN_TTL_MIN}m`
const REFRESH_TTL_MS = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000

// JWT payload carries IDENTITY only: { userId, sessionId, jti }.
// NO role, NO permissions, NO sellerId/storeId — authority is re-resolved from DB on every request.
export function signAccessToken({ userId, sessionId }) {
  return jwt.sign({ userId: String(userId), sessionId, jti: randomUUID() }, jwtKeys.privateKey, {
    algorithm: "RS256",
    expiresIn: ACCESS_TTL,
  })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, jwtKeys.publicKey, { algorithms: ["RS256"] })
}

function fingerprint(req) {
  const ip = (req.ip || "").split(".").slice(0, 3).join(".") // IP subnet
  const ua = req.headers["user-agent"] || ""
  return { ipHash: sha256(ip), uaHash: sha256(ua) }
}

export async function createSession({ userId, userType, sellerId = null, req }) {
  const sessionId = randomUUID()
  const refreshToken = randomToken(32) // opaque 256-bit
  const tokenFamily = randomUUID()
  const { ipHash, uaHash } = fingerprint(req)

  await Session.create({
    sessionId,
    userId,
    userType,
    sellerId, // store users only — resolves their tenant DB server-side
    refreshTokenHash: sha256(refreshToken),
    tokenFamily,
    ipHash,
    uaHash,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  })

  const accessToken = signAccessToken({ userId, sessionId })
  return { sessionId, accessToken, refreshToken }
}

// Rotation: every refresh issues a NEW token and invalidates the old one.
// Presenting a revoked/old token → entire token family revoked (stolen-token replay detection).
export async function rotateRefreshToken({ refreshToken, req }) {
  const hash = sha256(refreshToken)
  const session = await Session.findOne({ refreshTokenHash: hash })

  if (!session) {
    // Possibly a replayed old token — try to find and revoke its family.
    return null
  }
  if (session.revoked || session.expiresAt < new Date()) {
    await Session.updateMany({ tokenFamily: session.tokenFamily }, { revoked: true })
    console.error("[server] SECURITY: refresh token replay detected, family revoked:", session.tokenFamily)
    return null
  }

  const { ipHash, uaHash } = fingerprint(req)
  if (session.uaHash !== uaHash) {
    await Session.updateMany({ tokenFamily: session.tokenFamily }, { revoked: true })
    return null
  }

  const newRefreshToken = randomToken(32)
  session.refreshTokenHash = sha256(newRefreshToken)
  session.ipHash = ipHash
  session.lastSeen = new Date()
  session.expiresAt = new Date(Date.now() + REFRESH_TTL_MS)
  await session.save()

  const accessToken = signAccessToken({ userId: session.userId, sessionId: session.sessionId })
  return { accessToken, refreshToken: newRefreshToken, session }
}

export async function killSession(sessionId) {
  await Session.deleteOne({ sessionId })
}

// Revoke the session that owns this refresh token — used by logout so the
// long-lived (7-day) session dies even when the access token has expired.
export async function killSessionByRefreshToken(refreshToken) {
  await Session.deleteOne({ refreshTokenHash: sha256(refreshToken) })
}

export async function killAllUserSessions(userId) {
  await Session.deleteMany({ userId })
}

// Revokes every session for the user EXCEPT the one performing the action —
// used after a password change so other devices are signed out.
export async function killOtherUserSessions(userId, keepSessionId) {
  await Session.deleteMany({ userId, sessionId: { $ne: keepSessionId } })
}

export function setAuthCookies(res, { accessToken, refreshToken }) {
  const base = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/",
  }
  res.cookie("access_token", accessToken, { ...base, maxAge: env.ACCESS_TOKEN_TTL_MIN * 60 * 1000 })
  res.cookie("refresh_token", refreshToken, { ...base, maxAge: REFRESH_TTL_MS })
}

export function clearAuthCookies(res) {
  res.clearCookie("access_token", { path: "/" })
  res.clearCookie("refresh_token", { path: "/" })
}
