import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requireRole } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import { ancestors, create, getOne, list, move, options, remove, restore, update } from "./category.controller.js"
import { createCategorySchema, moveCategorySchema, updateCategorySchema } from "./category.validation.js"

// Category CRUD — owner only. Mounted at /api/seller/categories (app.js),
// BEFORE the general seller router so it resolves first. Categories form an
// N-level tree, fetched lazily one level at a time.
export const categoryRoutes = Router()

const ownerOnly = requireRole("SELLER_SUPERADMIN")
const guard = [authenticate, loadUser, ownerOnly]

// `isActive` is normally stripped as a mass-assignment guard, but it's a
// legitimate category field — allow it through here (schemas are .strict()).
categoryRoutes.get("/", ...guard, list)
// Lean picker feed — registered BEFORE "/:id" so "options" isn't read as an id.
categoryRoutes.get("/options", ...guard, options)
categoryRoutes.post("/", ...guard, validate(createCategorySchema, { allow: ["isActive"] }), create)
categoryRoutes.get("/:id", ...guard, getOne)
categoryRoutes.get("/:id/ancestors", ...guard, ancestors)
categoryRoutes.patch("/:id", ...guard, validate(updateCategorySchema, { allow: ["isActive"] }), update)
categoryRoutes.patch("/:id/move", ...guard, validate(moveCategorySchema), move)
categoryRoutes.post("/:id/restore", ...guard, restore)
categoryRoutes.delete("/:id", ...guard, remove)
