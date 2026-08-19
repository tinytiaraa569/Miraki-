import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requirePermission } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import {
  create,
  duplicate,
  getOne,
  list,
  options,
  remove,
  restore,
  update,
} from "./optionSet.controller.js"
import { createOptionSetSchema, updateOptionSetSchema } from "./optionSet.validation.js"

// Option Set CRUD — permission-based for reads, owner-only for writes.
// Mounted at /api/seller/option-sets (app.js), BEFORE the general seller router.
export const optionSetRoutes = Router()

const readGuard = [authenticate, loadUser, requirePermission("option_set", "read")]
const writeGuard = [authenticate, loadUser, requirePermission("option_set", "write")]

// `isActive` is stripped as a mass-assignment guard by default, but it's a
// legitimate option-set field — allow it through (schemas are strict).
const allow = ["isActive"]

// /options is a lean picker feed — MUST be registered before /:id so it isn't
// captured as an id param.
optionSetRoutes.get("/options", ...readGuard, options)

optionSetRoutes.get("/", ...readGuard, list)
optionSetRoutes.post("/", ...writeGuard, validate(createOptionSetSchema, { allow }), create)
optionSetRoutes.get("/:id", ...readGuard, getOne)
optionSetRoutes.patch("/:id", ...writeGuard, validate(updateOptionSetSchema, { allow }), update)
optionSetRoutes.post("/:id/duplicate", ...writeGuard, duplicate)
optionSetRoutes.post("/:id/restore", ...writeGuard, restore)
optionSetRoutes.delete("/:id", ...writeGuard, remove)
