import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requireRole } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import { create, getOne, list, options, remove, restore, update } from "./brand.controller.js"
import { createBrandSchema, updateBrandSchema } from "./brand.validation.js"

// Brand CRUD — owner only. Mounted at /api/seller/brands (app.js), BEFORE the
// general seller router so it resolves first. Brands are a FLAT list split by
// publish state — there is no tree and no /move endpoint.
export const brandRoutes = Router()

const ownerOnly = requireRole("SELLER_SUPERADMIN")
const guard = [authenticate, loadUser, ownerOnly]

// `isActive` / `isPublished` are normally stripped as a mass-assignment guard,
// but they're legitimate brand fields — allow them through (schemas are strict).
brandRoutes.get("/", ...guard, list)
// Lean picker feed — registered BEFORE "/:id" so "options" isn't read as an id.
brandRoutes.get("/options", ...guard, options)
brandRoutes.post("/", ...guard, validate(createBrandSchema, { allow: ["isActive", "isPublished"] }), create)
brandRoutes.get("/:id", ...guard, getOne)
brandRoutes.patch("/:id", ...guard, validate(updateBrandSchema, { allow: ["isActive", "isPublished"] }), update)
brandRoutes.post("/:id/restore", ...guard, restore)
brandRoutes.delete("/:id", ...guard, remove)
