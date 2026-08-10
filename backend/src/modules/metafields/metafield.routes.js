import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requireRole } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import { create, duplicate, getDefinition, getOne, list, remove, restore, update } from "./metafield.controller.js"
import {
  getValues,
  putValues,
  removeValues,
  resolveValues,
} from "./metafieldValue.controller.js"
import { createMetafieldSchema, updateMetafieldSchema } from "./metafield.validation.js"

// Metafield CRUD — owner only. Mounted at /api/seller/metafields (app.js),
// BEFORE the general seller router so it resolves first. A metafield definition
// is a schema bound to a module (ms.categories, ms.products, ...), embedding a
// recursive fields[] tree. The whole definition saves in one POST/PATCH.
export const metafieldRoutes = Router()

const ownerOnly = requireRole("SELLER_SUPERADMIN")
const guard = [authenticate, loadUser, ownerOnly]

// `isActive` is stripped as a mass-assignment guard by default, but it's a
// legitimate metafield field — allow it through (schemas are strict).
const allow = ["isActive"]

// ----------------------------------------------------------- DEFINITIONS
metafieldRoutes.get("/", ...guard, list)
metafieldRoutes.post("/", ...guard, validate(createMetafieldSchema, { allow }), create)

// -------------------------------------------------------------- VALUES
// Per-record values, keyed by the bound module (e.g. "ms.categories"). These
// deeper 3-segment paths are declared BEFORE the single-segment /:id routes so
// "values" is never swallowed as a definition id. The `data` shape is dynamic
// (defined by the metafield), so it is validated in the service against the
// live definition rather than by a static route schema.
// The live definition for a module (2 segments, so it never collides with the
// single-segment /:id below). Powers the schema-driven value form.
metafieldRoutes.get("/:module/definition", ...guard, getDefinition)

metafieldRoutes.post("/:module/values/resolve", ...guard, resolveValues)
metafieldRoutes.get("/:module/values/:recordId", ...guard, getValues)
metafieldRoutes.put("/:module/values/:recordId", ...guard, putValues)
metafieldRoutes.delete("/:module/values/:recordId", ...guard, removeValues)

// ------------------------------------------------- DEFINITIONS (by id)
metafieldRoutes.get("/:id", ...guard, getOne)
metafieldRoutes.patch("/:id", ...guard, validate(updateMetafieldSchema, { allow }), update)
metafieldRoutes.post("/:id/duplicate", ...guard, duplicate)
metafieldRoutes.post("/:id/restore", ...guard, restore)
metafieldRoutes.delete("/:id", ...guard, remove)
