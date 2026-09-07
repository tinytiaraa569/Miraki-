import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requirePermission } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import { ancestors, create, getOne, list, move, options, remove, restore, update } from "./category.controller.js"
import { createCategorySchema, moveCategorySchema, updateCategorySchema } from "./category.validation.js"

// Category CRUD — permission-based for reads, owner-only for writes.
// Mounted at /api/seller/categories (app.js), BEFORE the general seller router.
export const categoryRoutes = Router()

const readGuard = [authenticate, loadUser, requirePermission("product_category", "read")]
const writeGuard = [authenticate, loadUser, requirePermission("product_category", "write")]

// `isActive` is normally stripped as a mass-assignment guard, but it's a
// legitimate category field — allow it through here (schemas are .strict()).
categoryRoutes.get("/", ...readGuard, list)
// Lean picker feed — registered BEFORE "/:id" so "options" isn't read as an id.
categoryRoutes.get("/options", ...readGuard, options)
categoryRoutes.post("/", ...writeGuard, validate(createCategorySchema, { allow: ["isActive"] }), create)
categoryRoutes.get("/:id", ...readGuard, getOne)
categoryRoutes.get("/:id/ancestors", ...readGuard, ancestors)
categoryRoutes.patch("/:id", ...writeGuard, validate(updateCategorySchema, { allow: ["isActive"] }), update)
categoryRoutes.patch("/:id/move", ...writeGuard, validate(moveCategorySchema), move)
categoryRoutes.post("/:id/restore", ...writeGuard, restore)
categoryRoutes.delete("/:id", ...writeGuard, remove)
