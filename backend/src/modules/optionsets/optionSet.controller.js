import { ApiError } from "../../utils/apiError.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import {
  createOptionSetDoc,
  deleteOptionSetDoc,
  destroyOptionSetDoc,
  duplicateOptionSetDoc,
  getOptionSet,
  listOptionSetOptions,
  listOptionSets,
  restoreOptionSetDoc,
  updateOptionSetDoc,
} from "./optionSet.service.js"
import { listOptionSetsQuerySchema } from "./optionSet.validation.js"

const ctx = (req) => ({ seller: req.seller, tenantDbName: req.tenantDbName, user: req.user, req })

export const list = asyncHandler(async (req, res) => {
  const parsed = listOptionSetsQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listOptionSets({ ...ctx(req), query: parsed.data })
  res.json(data)
})

// Lean picker feed for the Product attach UI. Registered BEFORE /:id.
export const options = asyncHandler(async (req, res) => {
  const data = await listOptionSetOptions({ ...ctx(req), query: req.query })
  res.json(data)
})

export const getOne = asyncHandler(async (req, res) => {
  const optionSet = await getOptionSet({ ...ctx(req), id: req.params.id })
  res.json({ optionSet })
})

export const create = asyncHandler(async (req, res) => {
  const optionSet = await createOptionSetDoc({ ...ctx(req), body: req.body })
  res.status(201).json({ optionSet })
})

export const update = asyncHandler(async (req, res) => {
  const optionSet = await updateOptionSetDoc({ ...ctx(req), id: req.params.id, body: req.body })
  res.json({ optionSet })
})

export const duplicate = asyncHandler(async (req, res) => {
  const optionSet = await duplicateOptionSetDoc({ ...ctx(req), id: req.params.id })
  res.status(201).json({ optionSet })
})

// DELETE /:id → soft delete. DELETE /:id?permanent=true → destroy.
export const remove = asyncHandler(async (req, res) => {
  const fn = req.query.permanent === "true" ? destroyOptionSetDoc : deleteOptionSetDoc
  const result = await fn({ ...ctx(req), id: req.params.id })
  res.json(result)
})

export const restore = asyncHandler(async (req, res) => {
  const optionSet = await restoreOptionSetDoc({ ...ctx(req), id: req.params.id })
  res.json({ optionSet })
})
