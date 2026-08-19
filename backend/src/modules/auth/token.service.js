import jwt from "jsonwebtoken"
import { randomUUID } from "node:crypto"
import { env } from "../../config/env.js"
import { jwtKeys, getVerifyKey } from "../../config/keys.js"
import { Session } from "../../models/session.model.js"
import { randomToken, sha256 } from "../../utils/crypto.js"

const ACCESS_TTL = `${env.ACCESS_TOKEN_TTL_MIN}m`
const REFRESH_TTL_MS = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
// Pinned onto every access token and enforced on verify, so a token is only
// ever accepted by THIS service for THIS purpose (a preauth token, which
// carries a different audience, can never be replayed as an access token).
const JWT_ISSUER = env.JWT_ISSUER
const JWT_AUDIENCE = env.JWT_AUDIENCE

// JWT payload is cryptographically bound to the exact session identity. If the
// session userType or sellerId changes, the token becomes invalid because the
// server compares the JWT claims against the DB-backed session before accepting it.
export function signAccessToken({ userId, sessionId, userType, sellerId = null }) {
  return jwt.sign(
    {
      userId: String(userId),
      sessionId,
      userType,
      sellerId: sellerId ? String(sellerId) : null,
      jti: randomUUID(),
    },
    jwtKeys.privateKey,
    {
      algorithm: "RS256",
      expiresIn: ACCESS_TTL,
      keyid: jwtKeys.kid,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    },
  )
}

export function verifyAccessToken(token) {
  // Pick the verification key by the token's `kid` header (supports rotation),
  // then verify signature + issuer + audience.
  const kid = jwt.decode(token, { complete: true })?.header?.kid
  return jwt.verify(token, getVerifyKey(kid), {
    algorithms: ["RS256"],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  })
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

  const accessToken = signAccessToken({ userId, sessionId, userType, sellerId })
  return { sessionId, accessToken, refreshToken }
}

// Rotation: every refresh issues a NEW token and remembers the consumed one as
// `prevRefreshTokenHash`. Presenting the CURRENT token rotates normally;
// presenting an already-consumed (previous) token means the token was replayed
// — the whole family is revoked (stolen-token reuse detection). An unknown
// token that matches neither is simply rejected.
export async function rotateRefreshToken({ refreshToken, req }) {
  const hash = sha256(refreshToken)
  const session = await Session.findOne({ refreshTokenHash: hash })

  if (!session) {
    // Not the current token. If it matches a PREVIOUS (rotated-away) hash, a
    // consumed refresh token is being replayed → treat the family as
    // compromised and revoke every session in it. Otherwise it's just unknown.
    const replayed = await Session.findOne({ prevRefreshTokenHash: hash })
    if (replayed) {
      await Session.updateMany({ tokenFamily: replayed.tokenFamily }, { revoked: true })
      console.error("[server] SECURITY: refresh token reuse detected, family revoked:", replayed.tokenFamily)
    }
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
  // Remember the token we're consuming so a later replay of it is DETECTED
  // (found by prevRefreshTokenHash) rather than silently missing.
  session.prevRefreshTokenHash = session.refreshTokenHash
  session.refreshTokenHash = sha256(newRefreshToken)
  session.ipHash = ipHash
  session.lastSeen = new Date()
  session.expiresAt = new Date(Date.now() + REFRESH_TTL_MS)
  await session.save()

  const accessToken = signAccessToken({
    userId: session.userId,
    sessionId: session.sessionId,
    userType: session.userType,
    sellerId: session.sellerId,
  })
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
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SECURE ? "strict" : "lax",
    path: "/",
  }
  res.cookie("access_token", accessToken, { ...base, maxAge: env.ACCESS_TOKEN_TTL_MIN * 60 * 1000 })
  res.cookie("refresh_token", refreshToken, { ...base, maxAge: REFRESH_TTL_MS })
}

export function clearAuthCookies(res) {
  res.clearCookie("access_token", { path: "/" })
  res.clearCookie("refresh_token", { path: "/" })
}
