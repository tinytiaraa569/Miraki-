import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requirePermission } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import { create, getOne, list, update } from "./storeadmin.controller.js"
import { createStoreAdminSchema, listStoreAdminsQuerySchema, updateStoreAdminSchema } from "./storeadmin.validation.js"

export const storeAdminRoutes = Router()

const readGuard = [authenticate, loadUser, requirePermission("store_admin", "read")]
const writeGuard = [authenticate, loadUser, requirePermission("store_admin", "write")]

//api/seller/store-admins/

storeAdminRoutes.get("/", ...readGuard, validate(listStoreAdminsQuerySchema), list)
storeAdminRoutes.post("/", ...writeGuard, validate(createStoreAdminSchema), create)
storeAdminRoutes.get("/:id", ...readGuard, getOne)
storeAdminRoutes.patch("/:id", ...writeGuard, validate(updateStoreAdminSchema), update)
