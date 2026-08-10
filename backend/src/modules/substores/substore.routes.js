import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requireRole } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import { create, getOne, list, options, remove, restore, update } from "./substore.controller.js"
import { createSubstoreSchema, updateSubstoreSchema } from "./substore.validation.js"


export const substoreRoutes = Router()

const ownerOnly = requireRole("SELLER_SUPERADMIN")
const guard = [authenticate, loadUser, ownerOnly]

substoreRoutes.get("/", ...guard, list)
// Lean picker feed — registered BEFORE "/:id" so "options" isn't read as an id.
substoreRoutes.get("/options", ...guard, options)
substoreRoutes.post("/", ...guard, validate(createSubstoreSchema), create)
substoreRoutes.get("/:id", ...guard, getOne)
substoreRoutes.patch("/:id", ...guard, validate(updateSubstoreSchema), update)
substoreRoutes.post("/:id/restore", ...guard, restore)
substoreRoutes.delete("/:id", ...guard, remove)
