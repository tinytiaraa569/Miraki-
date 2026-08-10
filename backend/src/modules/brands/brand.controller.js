import { ApiError } from "../../utils/apiError.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import {
  createBrandDoc,
  deleteBrandDoc,
  destroyBrandDoc,
  getBrand,
  listBrandOptions,
  listBrands,
  restoreBrandDoc,
  updateBrandDoc,
} from "./brand.service.js"
import { listBrandOptionsQuerySchema, listBrandsQuerySchema } from "./brand.validation.js"

const ctx = (req) => ({ seller: req.seller, tenantDbName: req.tenantDbName, user: req.user, req })

export const list = asyncHandler(async (req, res) => {
  const parsed = listBrandsQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listBrands({ ...ctx(req), query: parsed.data })
  res.json(data)
})

// Lean picker feed — only _id/name/alias, paginated for lazy-loading dropdowns.
export const options = asyncHandler(async (req, res) => {
  const parsed = listBrandOptionsQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listBrandOptions({ ...ctx(req), query: parsed.data })
  res.json(data)
})

export const getOne = asyncHandler(async (req, res) => {
  const brand = await getBrand({ ...ctx(req), id: req.params.id })
  res.json({ brand })
})

export const create = asyncHandler(async (req, res) => {
  const brand = await createBrandDoc({ ...ctx(req), body: req.body })
  res.status(201).json({ brand })
})

export const update = asyncHandler(async (req, res) => {
  const brand = await updateBrandDoc({ ...ctx(req), id: req.params.id, body: req.body })
  res.json({ brand })
})

// DELETE /:id → soft delete. DELETE /:id?permanent=true → destroy.
export const remove = asyncHandler(async (req, res) => {
  const fn = req.query.permanent === "true" ? destroyBrandDoc : deleteBrandDoc
  const result = await fn({ ...ctx(req), id: req.params.id })
  res.json(result)
})

export const restore = asyncHandler(async (req, res) => {
  const brand = await restoreBrandDoc({ ...ctx(req), id: req.params.id })
  res.json({ brand })
})
