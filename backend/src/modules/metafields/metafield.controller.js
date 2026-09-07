import { ApiError } from "../../utils/apiError.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import {
  createMetafieldDoc,
  deleteMetafieldDoc,
  destroyMetafieldDoc,
  duplicateMetafieldDoc,
  getDefinitionByModule,
  getMetafield,
  listMetafields,
  restoreMetafieldDoc,
  updateMetafieldDoc,
} from "./metafield.service.js"
import { listMetafieldsQuerySchema } from "./metafield.validation.js"

const ctx = (req) => ({ seller: req.seller, tenantDbName: req.tenantDbName, user: req.user, req })

export const list = asyncHandler(async (req, res) => {
  const parsed = listMetafieldsQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listMetafields({ ...ctx(req), query: parsed.data })
  res.json(data)
})

export const getOne = asyncHandler(async (req, res) => {
  const metafield = await getMetafield({ ...ctx(req), id: req.params.id })
  res.json({ metafield })
})

// GET /:module/definition — the live definition for a module, or null. Powers
// the schema-driven value form on a record editor (e.g. the Category editor).
export const getDefinition = asyncHandler(async (req, res) => {
  const metafield = await getDefinitionByModule({ ...ctx(req), module: req.params.module })
  res.json({ metafield })
})

export const create = asyncHandler(async (req, res) => {
  const metafield = await createMetafieldDoc({ ...ctx(req), body: req.body })
  res.status(201).json({ metafield })
})

export const update = asyncHandler(async (req, res) => {
  const metafield = await updateMetafieldDoc({ ...ctx(req), id: req.params.id, body: req.body })
  res.json({ metafield })
})

export const duplicate = asyncHandler(async (req, res) => {
  const metafield = await duplicateMetafieldDoc({ ...ctx(req), id: req.params.id })
  res.status(201).json({ metafield })
})

// DELETE /:id → soft delete (trash). DELETE /:id?permanent=true → destroy.
export const remove = asyncHandler(async (req, res) => {
  const fn = req.query.permanent === "true" ? destroyMetafieldDoc : deleteMetafieldDoc
  const result = await fn({ ...ctx(req), id: req.params.id })
  res.json(result)
})

export const restore = asyncHandler(async (req, res) => {
  const metafield = await restoreMetafieldDoc({ ...ctx(req), id: req.params.id })
  res.json({ metafield })
})
