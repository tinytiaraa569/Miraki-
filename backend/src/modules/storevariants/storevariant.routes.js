import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requirePermission } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import { create, getOne, list, remove, restore, update } from "./storevariant.controller.js"
import { createStoreVariantSchema, updateStoreVariantSchema } from "./storevariant.validation.js"

// Store variant (routing rule) CRUD — permission-based for reads, owner-only for writes.
// Mounted at /api/seller/store-variants (app.js), BEFORE the general seller router.
export const storeVariantRoutes = Router()

const readGuard = [authenticate, loadUser, requirePermission("store_variant", "read")]
const writeGuard = [authenticate, loadUser, requirePermission("store_variant", "write")]

storeVariantRoutes.get("/", ...readGuard, list)
storeVariantRoutes.post("/", ...writeGuard, validate(createStoreVariantSchema), create)
storeVariantRoutes.get("/:id", ...readGuard, getOne)
storeVariantRoutes.patch("/:id", ...writeGuard, validate(updateStoreVariantSchema), update)
storeVariantRoutes.delete("/:id", ...writeGuard, remove)
storeVariantRoutes.post("/:id/restore", ...writeGuard, restore)
