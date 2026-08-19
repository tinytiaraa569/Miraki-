import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requirePermission } from "../../middleware/loadUser.js"
import { validate } from "../../middleware/validate.js"
import {
  create,
  getOne,
  list,
  options,
  preview,
  rebuild,
  remove,
  restore,
  update,
} from "./collection.controller.js"
import { createCollectionSchema, updateCollectionSchema } from "./collection.validation.js"

// Collection CRUD — permission-based for reads, owner-only for writes.
// Mounted at /api/seller/collections (app.js), BEFORE the general seller router.
export const collectionRoutes = Router()

const readGuard = [authenticate, loadUser, requirePermission("collection", "read")]
const writeGuard = [authenticate, loadUser, requirePermission("collection", "write")]

// `isActive` / `isPublished` are normally stripped as a mass-assignment guard,
// but they're legitimate collection fields — allow them through (schemas strict).
collectionRoutes.get("/", ...readGuard, list)
// Lean picker feed — BEFORE "/:id" so it isn't read as an id.
collectionRoutes.get("/options", ...readGuard, options)
collectionRoutes.post("/preview", ...readGuard, preview)
collectionRoutes.post("/", ...writeGuard, validate(createCollectionSchema, { allow: ["isActive", "isPublished"] }), create)
collectionRoutes.get("/:id", ...readGuard, getOne)
collectionRoutes.patch("/:id", ...writeGuard, validate(updateCollectionSchema, { allow: ["isActive", "isPublished"] }), update)
collectionRoutes.post("/:id/rebuild", ...writeGuard, rebuild)
collectionRoutes.post("/:id/restore", ...writeGuard, restore)
collectionRoutes.delete("/:id", ...writeGuard, remove)
