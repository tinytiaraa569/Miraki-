import { Router } from "express"
import { authenticate } from "../../middleware/authenticate.js"
import { loadUser, requireRole } from "../../middleware/loadUser.js"
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

// Collection CRUD — owner only. Mounted at /api/seller/collections (app.js),
// BEFORE the general seller router so it resolves first. A collection is either
// MANUAL (ordered productIds) or DYNAMIC (a rule set materialized into
// collectionMembers). There is no /move — collections are a flat list.
export const collectionRoutes = Router()

const ownerOnly = requireRole("SELLER_SUPERADMIN")
const guard = [authenticate, loadUser, ownerOnly]

// `isActive` / `isPublished` are normally stripped as a mass-assignment guard,
// but they're legitimate collection fields — allow them through (schemas strict).
collectionRoutes.get("/", ...guard, list)
// Lean picker feed — BEFORE "/:id" so it isn't read as an id.
collectionRoutes.get("/options", ...guard, options)
collectionRoutes.post("/preview", ...guard, preview)
collectionRoutes.post("/", ...guard, validate(createCollectionSchema, { allow: ["isActive", "isPublished"] }), create)
collectionRoutes.get("/:id", ...guard, getOne)
collectionRoutes.patch("/:id", ...guard, validate(updateCollectionSchema, { allow: ["isActive", "isPublished"] }), update)
collectionRoutes.post("/:id/rebuild", ...guard, rebuild)
collectionRoutes.post("/:id/restore", ...guard, restore)
collectionRoutes.delete("/:id", ...guard, remove)
