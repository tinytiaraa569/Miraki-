import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requireRole } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import { create, getOne, list, remove, restore, update } from "./substore.controller.js"
import { createSubstoreSchema, updateSubstoreSchema } from "./substore.validation.js"

// Substore CRUD — owner only. Mounted at /api/seller/substores (app.js),
// BEFORE the general seller router so it resolves first. The service
// additionally enforces the platform-controlled multistoreEnabled flag.
export const substoreRoutes = Router()

const ownerOnly = requireRole("SELLER_SUPERADMIN")
const guard = [authenticate, loadUser, ownerOnly]

substoreRoutes.get("/", ...guard, list)
substoreRoutes.post("/", ...guard, validate(createSubstoreSchema), create)
substoreRoutes.get("/:id", ...guard, getOne)
substoreRoutes.patch("/:id", ...guard, validate(updateSubstoreSchema), update)
substoreRoutes.post("/:id/restore", ...guard, restore)
substoreRoutes.delete("/:id", ...guard, remove)
