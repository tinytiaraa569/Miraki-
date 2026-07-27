import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { cache } from "../../middleware/cache.js"
import { loadUser, requireRole } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import {
  createSeller,
  deleteSeller,
  deleteSellerPermanent,
  getAudit,
  getSellerById,
  getSellers,
  getStats,
  getSuperadmins,
  patchSeller,
  patchSellerStatus,
  patchSuperadminStatus,
  patchSuperadminTwoFactor,
  postRestoreSeller,
  postSuperadmin,
} from "./platform.controller.js"
import {
  createSellerSchema,
  createSuperadminSchema,
  sellerStatusSchema,
  superadminStatusSchema,
  superadminTwoFactorSchema,
  updateSellerSchema,
} from "./platform.validation.js"

export const platformRoutes = Router()

// Full chain on every route: authenticate → loadUser (fresh from DB) → role gate → validate.
platformRoutes.use(authenticate, loadUser, requireRole("PLATFORM_SUPERADMIN"))

// Cache runs AFTER auth — unauthenticated requests never touch or read the cache.
platformRoutes.post("/sellers", validate(createSellerSchema), createSeller)
platformRoutes.get("/sellers", cache("platform:sellers"), getSellers)
// Dashboard counts — shares the sellers cache namespace so seller mutations invalidate it too.
platformRoutes.get("/stats", cache("platform:sellers"), getStats)
// Detail view (modal) — uncached: includes live tenant store/user data.
platformRoutes.get("/sellers/:id", getSellerById)
platformRoutes.patch("/sellers/:id/status", validate(sellerStatusSchema), patchSellerStatus)
// Edit seller details (name/email/multistore). Zod strict — no scope/status injection.
platformRoutes.patch("/sellers/:id", validate(updateSellerSchema), patchSeller)
// Soft delete → trash (recoverable). Sessions killed, tenant locked out.
platformRoutes.delete("/sellers/:id", deleteSeller)
// Restore from trash.
platformRoutes.post("/sellers/:id/restore", postRestoreSeller)
// Permanent delete — ONLY allowed from trash (soft delete first, by design).
platformRoutes.delete("/sellers/:id/permanent", deleteSellerPermanent)
platformRoutes.get("/audit", cache("platform:audit", 30), getAudit)

// Superadmin management — uncached (list includes caller-specific selfId).
platformRoutes.get("/superadmins", getSuperadmins)
platformRoutes.post("/superadmins", validate(createSuperadminSchema), postSuperadmin)
platformRoutes.patch("/superadmins/:id/status", validate(superadminStatusSchema), patchSuperadminStatus)
platformRoutes.patch("/superadmins/:id/two-factor", validate(superadminTwoFactorSchema), patchSuperadminTwoFactor)
