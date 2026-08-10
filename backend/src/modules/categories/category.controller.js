import { ApiError } from "../../utils/apiError.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import {
  createCategoryDoc,
  deleteCategoryDoc,
  destroyCategoryDoc,
  getAncestors,
  getCategory,
  listCategories,
  listCategoryOptions,
  moveCategoryDoc,
  restoreCategoryDoc,
  updateCategoryDoc,
} from "./category.service.js"
import { listCategoriesQuerySchema, listCategoryOptionsQuerySchema } from "./category.validation.js"

const ctx = (req) => ({ seller: req.seller, tenantDbName: req.tenantDbName, user: req.user, req })

export const list = asyncHandler(async (req, res) => {
  const parsed = listCategoriesQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listCategories({ ...ctx(req), query: parsed.data })
  res.json(data)
})

// Lean picker feed — only _id/name/alias, paginated for lazy-loading dropdowns.
export const options = asyncHandler(async (req, res) => {
  const parsed = listCategoryOptionsQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listCategoryOptions({ ...ctx(req), query: parsed.data })
  res.json(data)
})

export const getOne = asyncHandler(async (req, res) => {
  const category = await getCategory({ ...ctx(req), id: req.params.id })
  res.json({ category })
})

export const ancestors = asyncHandler(async (req, res) => {
  const ancestors = await getAncestors({ ...ctx(req), id: req.params.id })
  res.json({ ancestors })
})

export const create = asyncHandler(async (req, res) => {
  const category = await createCategoryDoc({ ...ctx(req), body: req.body })
  res.status(201).json({ category })
})

export const update = asyncHandler(async (req, res) => {
  const category = await updateCategoryDoc({ ...ctx(req), id: req.params.id, body: req.body })
  res.json({ category })
})

export const move = asyncHandler(async (req, res) => {
  const category = await moveCategoryDoc({ ...ctx(req), id: req.params.id, parentId: req.body.parentId })
  res.json({ category })
})

// DELETE /:id → soft delete (cascade to trash). DELETE /:id?permanent=true → destroy.
export const remove = asyncHandler(async (req, res) => {
  const fn = req.query.permanent === "true" ? destroyCategoryDoc : deleteCategoryDoc
  const result = await fn({ ...ctx(req), id: req.params.id })
  res.json(result)
})

export const restore = asyncHandler(async (req, res) => {
  const category = await restoreCategoryDoc({ ...ctx(req), id: req.params.id })
  res.json({ category })
})
