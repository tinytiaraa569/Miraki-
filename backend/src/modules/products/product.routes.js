import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requirePermission } from "../../middleware/loadUser.js"
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

// Product CRUD — permission-based for reads, owner-only for writes.
// Mounted at /api/seller/products (app.js), BEFORE the general seller router.
export const productRoutes = Router()

const readGuard = [authenticate, loadUser, requirePermission("product", "read")]
const writeGuard = [authenticate, loadUser, requirePermission("product", "write")]

// `isPublished` is a legitimate product field — allow it past the mass-assignment
// guard (schemas are strict).
const allow = ["isPublished"]

productRoutes.get("/", ...readGuard, list)
// Lean picker feed — BEFORE "/:id".
productRoutes.get("/options", ...readGuard, options)
// Global variant list (Product Variants page) — literal, BEFORE "/:id".
productRoutes.get("/variants", ...readGuard, listAllVariantsController)
// Bulk import — BEFORE "/:id".
productRoutes.post("/import", ...writeGuard, importCatalog)

productRoutes.post("/", ...writeGuard, validate(createProductSchema, { allow }), create)
productRoutes.get("/:id", ...readGuard, getOne)
productRoutes.patch("/:id", ...writeGuard, validate(updateProductSchema, { allow }), update)
productRoutes.post("/:id/duplicate", ...writeGuard, duplicate)
productRoutes.post("/:id/attach-option-set", ...writeGuard, attachOptions)
productRoutes.post("/:id/resync-options", ...writeGuard, resyncProductOptions)
// Variants live in their own collection — CRUD under the owning product.
// Literal/nested sub-paths BEFORE the bare "/:id/variants/:variantId".
productRoutes.post("/:id/variants/generate", ...writeGuard, generateVariants)
productRoutes.get("/:id/variants", ...readGuard, listVariants)
productRoutes.post("/:id/variants", ...writeGuard, createVariant)
productRoutes.patch("/:id/variants/:variantId", ...writeGuard, updateVariant)
productRoutes.delete("/:id/variants/:variantId", ...writeGuard, removeVariant)
productRoutes.post("/:id/restore", ...writeGuard, restore)
productRoutes.delete("/:id", ...writeGuard, remove)
