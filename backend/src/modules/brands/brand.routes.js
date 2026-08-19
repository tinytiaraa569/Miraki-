import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requirePermission } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import { create, getOne, list, options, remove, restore, update } from "./brand.controller.js"
import { createBrandSchema, updateBrandSchema } from "./brand.validation.js"

// Brand CRUD — permission-based for reads, owner-only for writes.
// Mounted at /api/seller/brands (app.js), BEFORE the general seller router.
export const brandRoutes = Router()

const readGuard = [authenticate, loadUser, requirePermission("brand", "read")]
const writeGuard = [authenticate, loadUser, requirePermission("brand", "write")]

// `isActive` / `isPublished` are normally stripped as a mass-assignment guard,
// but they're legitimate brand fields — allow them through (schemas are strict).
brandRoutes.get("/", ...readGuard, list)
// Lean picker feed — registered BEFORE "/:id" so "options" isn't read as an id.
brandRoutes.get("/options", ...readGuard, options)
brandRoutes.post("/", ...writeGuard, validate(createBrandSchema, { allow: ["isActive", "isPublished"] }), create)
brandRoutes.get("/:id", ...readGuard, getOne)
brandRoutes.patch("/:id", ...writeGuard, validate(updateBrandSchema, { allow: ["isActive", "isPublished"] }), update)
brandRoutes.post("/:id/restore", ...writeGuard, restore)
brandRoutes.delete("/:id", ...writeGuard, remove)
