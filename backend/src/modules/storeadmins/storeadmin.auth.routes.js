import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import { loginLimiter } from "../../middleware/rateLimiter.js"
import {
  login,
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

import { loginSchema,totpSchema,changePasswordSchema } from "../auth/auth.validation.js"

export const storeAdminAuthRoutes = Router()

const requireSession = [authenticate, loadUser]

// api/seller/store-admins/auth/

storeAdminAuthRoutes.post("/login", loginLimiter, validate(loginSchema), login)

// Step 2a — enrollment QR (first login only). Gated by the preauth cookie
storeAdminAuthRoutes.post("/2fa/setup", setup2fa)

// Step 2b — verify the 6-digit code, issue the real session.
storeAdminAuthRoutes.post("/2fa/verify", validate(totpSchema), verify2fa)

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