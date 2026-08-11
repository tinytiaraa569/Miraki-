import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requireRole } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import { create, getOne, list, update } from "./storeAdmin.controller.js"
import { createStoreAdminSchema, listStoreAdminsQuerySchema, updateStoreAdminSchema } from "./storeAdmin.validation.js"

export const storeAdminRoutes = Router()

const ownerOnly = requireRole("SELLER_SUPERADMIN")
const guard = [authenticate, loadUser, ownerOnly]

//api/seller/store-admins/

storeAdminRoutes.get("/",...guard, validate(listStoreAdminsQuerySchema), list)
storeAdminRoutes.post("/", ...guard, validate(createStoreAdminSchema), create)
storeAdminRoutes.get("/:id",...guard,getOne);
storeAdminRoutes.patch("/:id",...guard,validate(updateStoreAdminSchema), update);