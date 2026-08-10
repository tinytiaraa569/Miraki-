import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requireRole } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import {
  attachOptions,
  create,
  createVariant,
  duplicate,
  generateVariants,
  getOne,
  importCatalog,
  list,
  listAllVariantsController,
  listVariants,
  options,
  remove,
  removeVariant,
  restore,
  resyncProductOptions,
  update,
  updateVariant,
} from "./product.controller.js"
import { createProductSchema, updateProductSchema } from "./product.validation.js"

// Product CRUD — owner only. Mounted at /api/seller/products (app.js), BEFORE
// the general seller router so it resolves first. Products are the central
// catalog entity; relations are stored as ObjectIds and the option set is
// referenced (never re-modelled). Literal sub-paths are registered BEFORE
// "/:id" so they aren't read as an id.
export const productRoutes = Router()

const ownerOnly = requireRole("SELLER_SUPERADMIN")
const guard = [authenticate, loadUser, ownerOnly]

// `isPublished` is a legitimate product field — allow it past the mass-assignment
// guard (schemas are strict).
const allow = ["isPublished"]

productRoutes.get("/", ...guard, list)
// Lean picker feed — BEFORE "/:id".
productRoutes.get("/options", ...guard, options)
// Global variant list (Product Variants page) — literal, BEFORE "/:id".
productRoutes.get("/variants", ...guard, listAllVariantsController)
// Bulk import — BEFORE "/:id".
productRoutes.post("/import", ...guard, importCatalog)

productRoutes.post("/", ...guard, validate(createProductSchema, { allow }), create)
productRoutes.get("/:id", ...guard, getOne)
productRoutes.patch("/:id", ...guard, validate(updateProductSchema, { allow }), update)
productRoutes.post("/:id/duplicate", ...guard, duplicate)
productRoutes.post("/:id/attach-option-set", ...guard, attachOptions)
productRoutes.post("/:id/resync-options", ...guard, resyncProductOptions)
// Variants live in their own collection — CRUD under the owning product.
// Literal/nested sub-paths BEFORE the bare "/:id/variants/:variantId".
productRoutes.post("/:id/variants/generate", ...guard, generateVariants)
productRoutes.get("/:id/variants", ...guard, listVariants)
productRoutes.post("/:id/variants", ...guard, createVariant)
productRoutes.patch("/:id/variants/:variantId", ...guard, updateVariant)
productRoutes.delete("/:id/variants/:variantId", ...guard, removeVariant)
productRoutes.post("/:id/restore", ...guard, restore)
productRoutes.delete("/:id", ...guard, remove)
