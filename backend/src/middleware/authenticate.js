import { Session } from "../models/session.model.js"
import { ApiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { verifyAccessToken } from "../modules/auth/token.service.js"

// Verify JWT RS256 signature AND that the session is still alive in the DB.
// Suspending a user / killing a session takes effect on the very next request.
export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.access_token
  if (!token) throw new ApiError(401, "Not authenticated")

  let payload
  try {
    payload = verifyAccessToken(token)
  } catch {
    throw new ApiError(401, "Not authenticated")
  }

  const session = await Session.findOne({ sessionId: payload.sessionId, revoked: false })
  if (!session || session.expiresAt < new Date()) throw new ApiError(401, "Session expired")

  session.lastSeen = new Date()
  session.save().catch(() => {})

  // sellerId comes from the server-side session record — never from the client.
  req.auth = {
    userId: payload.userId,
    sessionId: payload.sessionId,
    userType: session.userType,
    sellerId: session.sellerId || null,
  }
  next()
})
