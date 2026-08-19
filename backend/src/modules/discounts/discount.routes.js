import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requirePermission } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import { create, getOne, list, options, remove, restore, update } from "./discount.controller.js"
import { createDiscountSchema, updateDiscountSchema } from "./discount.validation.js"


export const discountRoutes = Router()

const readGuard = [authenticate, loadUser, requirePermission("discount", "read")]
const writeGuard = [authenticate, loadUser, requirePermission("discount", "write")]

discountRoutes.get("/", ...readGuard, list)
// Paginated / searchable picker feeds — BEFORE "/:id" so "options" isn't read as an id.
discountRoutes.get("/options/:entity", ...readGuard, options)
discountRoutes.post("/", ...writeGuard, validate(createDiscountSchema, { allow: ["sellerId"] }), create)
discountRoutes.get("/:id", ...readGuard, getOne)
discountRoutes.patch("/:id", ...writeGuard, validate(updateDiscountSchema, { allow: ["sellerId"] }), update)
discountRoutes.post("/:id/restore", ...writeGuard, restore)
discountRoutes.delete("/:id", ...writeGuard, remove)
