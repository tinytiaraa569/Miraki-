import { PlatformUser } from "../../models/platformUser.model.js"
import { ApiError } from "../../utils/apiError.js"
import { verifyPassword, verifyPasswordDecoy } from "../../utils/crypto.js"
import { audit } from "../audit/audit.service.js"

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

// Generic error — never reveal which field failed.
const INVALID = () => new ApiError(401, "Invalid credentials")

export async function verifyPlatformLogin({ email, password, req }) {
  const user = await PlatformUser.findOne({ email: email.toLowerCase() }).select("+passwordHash")

  if (!user) {
    // Anti-enumeration: equalize timing with the real wrong-password path so
    // response time can't reveal whether this email is registered.
    await verifyPasswordDecoy(password)
    throw INVALID()
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new ApiError(429, "Account temporarily locked. Try again later.")
  }
  if (user.status !== "active") throw INVALID()

  const ok = await verifyPassword(user.passwordHash, password)
  if (!ok) {
    user.failedLoginAttempts += 1
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCKOUT_MS)
      user.failedLoginAttempts = 0
      await audit({ req, actorId: user._id, actorRole: user.role, action: "auth.lockout", targetType: "PlatformUser", targetId: user._id })
    }
    await user.save()
    throw INVALID()
  }

  user.failedLoginAttempts = 0
  user.lockedUntil = null
  await user.save()

  await audit({ req, actorId: user._id, actorRole: user.role, action: "auth.login", targetType: "PlatformUser", targetId: user._id })
  return user
}
