import { ApiError } from "../../utils/apiError.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import {
  createSubstoreDoc,
  deleteSubstoreDoc,
  destroySubstoreDoc,
  getSubstore,
  listSubstoreOptions,
  listSubstores,
  restoreSubstoreDoc,
  updateSubstoreDoc,
} from "./substore.service.js"
import { listSubstoreOptionsQuerySchema, listSubstoresQuerySchema } from "./substore.validation.js"

const ctx = (req) => ({ seller: req.seller, tenantDbName: req.tenantDbName, user: req.user, req })

export const list = asyncHandler(async (req, res) => {
  const parsed = listSubstoresQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listSubstores({ ...ctx(req), query: parsed.data })
  res.json(data)
})

// Lean picker feed — only _id/name/alias, paginated for lazy-loading dropdowns.
export const options = asyncHandler(async (req, res) => {
  const parsed = listSubstoreOptionsQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listSubstoreOptions({ ...ctx(req), query: parsed.data })
  res.json(data)
})

export const getOne = asyncHandler(async (req, res) => {
  const substore = await getSubstore({ ...ctx(req), id: req.params.id })
  res.json({ substore })
})

export const create = asyncHandler(async (req, res) => {
  const substore = await createSubstoreDoc({ ...ctx(req), body: req.body })
  res.status(201).json({ substore })
})

export const update = asyncHandler(async (req, res) => {
  const substore = await updateSubstoreDoc({ ...ctx(req), id: req.params.id, body: req.body })
  res.json({ substore })
})

// DELETE /:id → soft delete (trash). DELETE /:id?permanent=true → destroy.
export const remove = asyncHandler(async (req, res) => {
  const fn = req.query.permanent === "true" ? destroySubstoreDoc : deleteSubstoreDoc
  const result = await fn({ ...ctx(req), id: req.params.id })
  res.json(result)
})

export const restore = asyncHandler(async (req, res) => {
  const substore = await restoreSubstoreDoc({ ...ctx(req), id: req.params.id })
  res.json({ substore })
})
