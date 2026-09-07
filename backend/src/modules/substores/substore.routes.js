import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requirePermission } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import { create, getOne, list, options, remove, restore, update } from "./substore.controller.js"
import { createSubstoreSchema, updateSubstoreSchema } from "./substore.validation.js"

export const substoreRoutes = Router()

const readGuard = [authenticate, loadUser, requirePermission("substore", "read")]
const writeGuard = [authenticate, loadUser, requirePermission("substore", "write")]

substoreRoutes.get("/", ...readGuard, list)
// Lean picker feed — registered BEFORE "/:id" so "options" isn't read as an id.
substoreRoutes.get("/options", ...readGuard, options)
substoreRoutes.post("/", ...writeGuard, validate(createSubstoreSchema), create)
substoreRoutes.get("/:id", ...readGuard, getOne)
substoreRoutes.patch("/:id", ...writeGuard, validate(updateSubstoreSchema), update)
substoreRoutes.post("/:id/restore", ...writeGuard, restore)
substoreRoutes.delete("/:id", ...writeGuard, remove)
