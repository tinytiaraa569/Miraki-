import { ApiError } from "../../utils/apiError.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import {
  createDiscountDoc,
  deleteDiscountDoc,
  destroyDiscountDoc,
  getDiscount,
  listDiscounts,
  listEntityOptions,
  restoreDiscountDoc,
  updateDiscountDoc,
} from "./discount.service.js"
import { listDiscountsQuerySchema, listOptionsQuerySchema, optionEntity } from "./discount.validation.js"


const ctx = (req) => ({ seller: req.seller, tenantDbName: req.tenantDbName, user: req.user, req })

export const list = asyncHandler(async (req, res) => {
  const parsed = listDiscountsQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listDiscounts({ ...ctx(req), query: parsed.data })
  res.json(data)
})

// Lean, paginated, searchable picker feed. `entity` is a path param
// (products|categories|collections|brands|substores|sellers).
export const options = asyncHandler(async (req, res) => {
  const entity = optionEntity.safeParse(req.params.entity)
  if (!entity.success) throw new ApiError(404, "Unknown option type")
  const parsed = listOptionsQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listEntityOptions({ ...ctx(req), entity: entity.data, query: parsed.data })
  res.json(data)
})

export const getOne = asyncHandler(async (req, res) => {
  const discount = await getDiscount({ ...ctx(req), id: req.params.id })
  res.json({ discount })
})

export const create = asyncHandler(async (req, res) => {
  const discount = await createDiscountDoc({ ...ctx(req), body: req.body })
  res.status(201).json({ discount })
})

export const update = asyncHandler(async (req, res) => {
  const discount = await updateDiscountDoc({ ...ctx(req), id: req.params.id, body: req.body })
  res.json({ discount })
})

// DELETE /:id → soft delete. DELETE /:id?permanent=true → destroy.
export const remove = asyncHandler(async (req, res) => {
  const fn = req.query.permanent === "true" ? destroyDiscountDoc : deleteDiscountDoc
  const result = await fn({ ...ctx(req), id: req.params.id })
  res.json(result)
})

export const restore = asyncHandler(async (req, res) => {
  const discount = await restoreDiscountDoc({ ...ctx(req), id: req.params.id })
  res.json({ discount })
})
