import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser } from "../../middleware/loadUser.js"
import { loginLimiter } from "../../middleware/rateLimiter.js"
import { validate } from "../../middleware/validate.js"
import {
  changePassword,
  disableTwoFactor,
  enableTwoFactor,
  login,
  logout,
  me,
  refresh,
  setup2fa,
  twoFactorStatus,
  verify2fa,
} from "./auth.controller.js"
import { changePasswordSchema, loginSchema, totpSchema } from "./auth.validation.js"

export const authRoutes = Router()

authRoutes.post("/login", loginLimiter, validate(loginSchema), login)
// 2FA endpoints only accept the short-lived pre-auth cookie (checked in controller).
authRoutes.post("/2fa/setup", loginLimiter, setup2fa)
authRoutes.post("/2fa/verify", loginLimiter, validate(totpSchema), verify2fa)
// 2FA settings — require a full authenticated session (post-login).
authRoutes.get("/2fa/status", authenticate, loadUser, twoFactorStatus)
authRoutes.post("/2fa/enable", authenticate, loadUser, enableTwoFactor)
authRoutes.post("/2fa/disable", authenticate, loadUser, disableTwoFactor)
// Change password — requires a full authenticated session; rate-limited to slow brute force.
authRoutes.post("/password", loginLimiter, authenticate, loadUser, validate(changePasswordSchema), changePassword)
authRoutes.post("/refresh", refresh)
// Logout is intentionally unauthenticated: it must succeed even with an
// expired access token, otherwise cookies/sessions survive the "sign out".
authRoutes.post("/logout", logout)
authRoutes.get("/me", authenticate, loadUser, me)
