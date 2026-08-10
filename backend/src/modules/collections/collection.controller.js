import { ApiError } from "../../utils/apiError.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import {
  createCollectionDoc,
  deleteCollectionDoc,
  destroyCollectionDoc,
  getCollection,
  listCollectionOptions,
  listCollections,
  previewRules,
  rebuildCollectionDoc,
  restoreCollectionDoc,
  updateCollectionDoc,
} from "./collection.service.js"
import {
  listCollectionOptionsQuerySchema,
  listCollectionsQuerySchema,
  previewCollectionSchema,
} from "./collection.validation.js"

const ctx = (req) => ({ seller: req.seller, tenantDbName: req.tenantDbName, user: req.user, req })

export const list = asyncHandler(async (req, res) => {
  const parsed = listCollectionsQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listCollections({ ...ctx(req), query: parsed.data })
  res.json(data)
})

// Lean picker feed — only _id/name/alias, paginated for lazy dropdowns.
export const options = asyncHandler(async (req, res) => {
  const parsed = listCollectionOptionsQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listCollectionOptions({ ...ctx(req), query: parsed.data })
  res.json(data)
})

export const getOne = asyncHandler(async (req, res) => {
  const collection = await getCollection({ ...ctx(req), id: req.params.id })
  res.json({ collection })
})

export const create = asyncHandler(async (req, res) => {
  const collection = await createCollectionDoc({ ...ctx(req), body: req.body })
  res.status(201).json({ collection })
})

export const update = asyncHandler(async (req, res) => {
  const collection = await updateCollectionDoc({ ...ctx(req), id: req.params.id, body: req.body })
  res.json({ collection })
})

// POST /:id/rebuild → manual "Rebuild now" re-materialize.
export const rebuild = asyncHandler(async (req, res) => {
  const result = await rebuildCollectionDoc({ ...ctx(req), id: req.params.id })
  res.json(result)
})

// POST /preview → compile rules + count matching products (no write).
export const preview = asyncHandler(async (req, res) => {
  const parsed = previewCollectionSchema.safeParse(req.body)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid rules")
  const result = await previewRules({ ...ctx(req), rules: parsed.data.rules })
  res.json(result)
})

// DELETE /:id → soft delete. DELETE /:id?permanent=true → destroy.
export const remove = asyncHandler(async (req, res) => {
  const fn = req.query.permanent === "true" ? destroyCollectionDoc : deleteCollectionDoc
  const result = await fn({ ...ctx(req), id: req.params.id })
  res.json(result)
})

export const restore = asyncHandler(async (req, res) => {
  const collection = await restoreCollectionDoc({ ...ctx(req), id: req.params.id })
  res.json({ collection })
})
