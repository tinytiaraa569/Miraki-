import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requireRole } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import { create, getOne, list, remove, restore, update } from "./storevariant.controller.js"
import { createStoreVariantSchema, updateStoreVariantSchema } from "./storevariant.validation.js"

// Store variant (routing rule) CRUD — owner only. Mounted at
// /api/seller/store-variants (app.js), BEFORE the general seller router.
export const storeVariantRoutes = Router()

const ownerOnly = requireRole("SELLER_SUPERADMIN")
const guard = [authenticate, loadUser, ownerOnly]

storeVariantRoutes.get("/", ...guard, list)
storeVariantRoutes.post("/", ...guard, validate(createStoreVariantSchema), create)
storeVariantRoutes.get("/:id", ...guard, getOne)
storeVariantRoutes.patch("/:id", ...guard, validate(updateStoreVariantSchema), update)
storeVariantRoutes.delete("/:id", ...guard, remove)
storeVariantRoutes.post("/:id/restore", ...guard, restore)
