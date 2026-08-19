import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser } from "../../middleware/loadUser.js"
import { loginLimiter } from "../../middleware/rateLimiter.js"
import { validate } from "../../middleware/validate.js"
import {
  setup2fa,
  verify2fa,
  refresh,
  logout,
  me,
  changePassword,
  twoFactorStatus,
  enableTwoFactor,
  disableTwoFactor,
} from "./storeadmin.auth.controller.js"

import { totpSchema, changePasswordSchema } from "../auth/auth.validation.js"

export const storeAdminAuthRoutes = Router()

const requireSession = [authenticate, loadUser]

// Step 2a — enrollment QR (first login only). Gated by the preauth cookie.
// loginLimiter: the 2FA step is a brute-force surface, so cap it per-IP
// (10 / 15 min) — same as the platform auth flow. Normal use (one setup +
// one verify per login) is nowhere near the cap, so the process is unchanged.
storeAdminAuthRoutes.post("/2fa/setup", loginLimiter, setup2fa)

// Step 2b — verify the 6-digit code, issue the real session.
storeAdminAuthRoutes.post("/2fa/verify", loginLimiter, validate(totpSchema), verify2fa)

storeAdminAuthRoutes.post("/refresh", refresh)


// logout must revoke the session even with an expired/invalid access token.
storeAdminAuthRoutes.post("/logout", logout)

storeAdminAuthRoutes.get("/me", ...requireSession, me)

storeAdminAuthRoutes.post(
  "/change-password",
  ...requireSession,
  validate(changePasswordSchema),
  changePassword
)

storeAdminAuthRoutes.get("/2fa/status", ...requireSession, twoFactorStatus)
storeAdminAuthRoutes.post("/2fa/enable", ...requireSession, enableTwoFactor)
storeAdminAuthRoutes.post("/2fa/disable", ...requireSession, disableTwoFactor)
