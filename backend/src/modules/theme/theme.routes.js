import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requireRole } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import { readTheme, removeTheme, writeTheme } from "./theme.controller.js"
import { saveThemeSchema } from "./theme.validation.js"

// Mounted at /api/seller/theme (BEFORE the general /api/seller router in
// app.js). Same auth chain as every other Hub route: authenticate →
// loadUser (fresh tenant re-resolution per request) → role gate.
export const themeRoutes = Router()

const storeRoles = requireRole("SELLER_SUPERADMIN", "STORE_SUPERADMIN", "STORE_ADMIN")
const ownerOnly = requireRole("SELLER_SUPERADMIN")

// Every Hub user reads the theme — it must apply for the whole team.
themeRoutes.get("/", authenticate, loadUser, storeRoles, readTheme)

// Only the owner customizes or resets it.
themeRoutes.put("/", authenticate, loadUser, ownerOnly, validate(saveThemeSchema), writeTheme)
themeRoutes.delete("/", authenticate, loadUser, ownerOnly, removeTheme)
