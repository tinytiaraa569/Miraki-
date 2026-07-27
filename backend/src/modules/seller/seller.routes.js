import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requireRole } from "../../middleware/loadUser.js"
import { loginLimiter } from "../../middleware/rateLimiter.js"
import { validate } from "../../middleware/validate.js"
import { addStoreUser, addSubstore, branding, hubOverview, saveProfile, sellerLogin, sellerMe } from "./seller.controller.js"
import {
  createSubstoreSchema,
  inviteUserSchema,
  sellerLoginSchema,
  updateProfileSchema,
} from "./seller.validation.js"

export const sellerRoutes = Router()

// Public: seller-side login. The tenant database is resolved SERVER-SIDE
// from the master email directory — the client never names its tenant.
sellerRoutes.post("/auth/login", loginLimiter, validate(sellerLoginSchema), sellerLogin)

// Everything below: authenticate → loadUser (re-resolves seller + tenant DB
// fresh on EVERY request, kicks suspended/trashed tenants mid-session) →
// role gate. A platform session hitting these routes fails the role gate.
const storeRoles = requireRole("SELLER_SUPERADMIN", "STORE_SUPERADMIN", "STORE_ADMIN")
const ownerOnly = requireRole("SELLER_SUPERADMIN")

sellerRoutes.get("/me", authenticate, loadUser, storeRoles, sellerMe)
sellerRoutes.get("/hub", authenticate, loadUser, storeRoles, hubOverview)
// Branding micro-payload (aggregation $project — logos + colors only).
sellerRoutes.get("/branding", authenticate, loadUser, storeRoles, branding)

// Substores are OPTIONAL — the service additionally enforces the
// platform-controlled multistoreEnabled flag. MAIN store always exists.
sellerRoutes.post("/stores", authenticate, loadUser, ownerOnly, validate(createSubstoreSchema), addSubstore)

// Invite a substore admin into a specific store. `role` is allow-listed
// through the sanitizer because it's a legitimate payload field here; the
// schema restricts it to STORE_SUPERADMIN | STORE_ADMIN.
sellerRoutes.post(
  "/stores/:storeId/users",
  authenticate,
  loadUser,
  ownerOnly,
  validate(inviteUserSchema, { allow: ["role"] }),
  addStoreUser,
)

// Business profile incl. base64 logo upload (larger JSON limit scoped in app.js).
sellerRoutes.patch("/profile", authenticate, loadUser, ownerOnly, validate(updateProfileSchema), saveProfile)
