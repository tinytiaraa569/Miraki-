import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requireRole } from "../../middleware/loadUser.js"
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

// Option Set CRUD — owner only. Mounted at /api/seller/option-sets (app.js),
// BEFORE the general seller router so it resolves first. An option set is a
// named group of options (each with its own values) attached to products.
// The whole nested document is saved in one POST/PATCH round trip.
export const optionSetRoutes = Router()

const ownerOnly = requireRole("SELLER_SUPERADMIN")
const guard = [authenticate, loadUser, ownerOnly]

// `isActive` is stripped as a mass-assignment guard by default, but it's a
// legitimate option-set field — allow it through (schemas are strict).
const allow = ["isActive"]

// /options is a lean picker feed — MUST be registered before /:id so it isn't
// captured as an id param.
optionSetRoutes.get("/options", ...guard, options)

optionSetRoutes.get("/", ...guard, list)
optionSetRoutes.post("/", ...guard, validate(createOptionSetSchema, { allow }), create)
optionSetRoutes.get("/:id", ...guard, getOne)
optionSetRoutes.patch("/:id", ...guard, validate(updateOptionSetSchema, { allow }), update)
optionSetRoutes.post("/:id/duplicate", ...guard, duplicate)
optionSetRoutes.post("/:id/restore", ...guard, restore)
optionSetRoutes.delete("/:id", ...guard, remove)
