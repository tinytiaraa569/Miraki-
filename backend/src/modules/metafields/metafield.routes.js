import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requirePermission } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import { create, duplicate, getDefinition, getOne, list, remove, restore, update } from "./metafield.controller.js"
import {
  getValues,
  putValues,
  removeValues,
  resolveValues,
} from "./metafieldValue.controller.js"
import { createMetafieldSchema, updateMetafieldSchema } from "./metafield.validation.js"

// Metafield CRUD — permission-based for reads, owner-only for writes.
// Mounted at /api/seller/metafields (app.js), BEFORE the general seller router.
export const metafieldRoutes = Router()

const readGuard = [authenticate, loadUser, requirePermission("metafield", "read")]
const writeGuard = [authenticate, loadUser, requirePermission("metafield", "write")]

// `isActive` is stripped as a mass-assignment guard by default, but it's a
// legitimate metafield field — allow it through (schemas are strict).
const allow = ["isActive"]

// ----------------------------------------------------------- DEFINITIONS
metafieldRoutes.get("/", ...readGuard, list)
metafieldRoutes.post("/", ...writeGuard, validate(createMetafieldSchema, { allow }), create)

// -------------------------------------------------------------- VALUES
// Per-record values, keyed by the bound module (e.g. "ms.categories"). These
// deeper 3-segment paths are declared BEFORE the single-segment /:id routes so
// "values" is never swallowed as a definition id. The `data` shape is dynamic
// (defined by the metafield), so it is validated in the service against the
// live definition rather than by a static route schema.
// The live definition for a module (2 segments, so it never collides with the
// single-segment /:id below). Powers the schema-driven value form.
metafieldRoutes.get("/:module/definition", ...readGuard, getDefinition)

metafieldRoutes.post("/:module/values/resolve", ...readGuard, resolveValues)
metafieldRoutes.get("/:module/values/:recordId", ...readGuard, getValues)
metafieldRoutes.put("/:module/values/:recordId", ...writeGuard, putValues)
metafieldRoutes.delete("/:module/values/:recordId", ...writeGuard, removeValues)

// ------------------------------------------------- DEFINITIONS (by id)
metafieldRoutes.get("/:id", ...readGuard, getOne)
metafieldRoutes.patch("/:id", ...writeGuard, validate(updateMetafieldSchema, { allow }), update)
metafieldRoutes.post("/:id/duplicate", ...writeGuard, duplicate)
metafieldRoutes.post("/:id/restore", ...writeGuard, restore)
metafieldRoutes.delete("/:id", ...writeGuard, remove)
