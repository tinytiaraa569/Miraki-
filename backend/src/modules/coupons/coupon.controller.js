import { ApiError } from "../../utils/apiError.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import {
  createCouponDoc,
  deleteCouponDoc,
  destroyCouponDoc,
  duplicateCouponDoc,
  bulkDeleteCouponDoc,
  toggleCouponDoc,
  getCoupon,
  listCoupons,
  listCouponUsage,
  listEntityOptions,
  restoreCouponDoc,
  updateCouponDoc,
  redeemCouponDoc,
} from "./coupon.service.js"
import {
  applyCouponSchema,
  bulkDeleteCouponSchema,
  createCouponSchema,
  listCouponsQuerySchema,
  listOptionQuerySchema,
  optionEntity,
  updateCouponSchema,
} from "./coupon.validation.js"

const ctx = (req) => ({ seller: req.seller, tenantDbName: req.tenantDbName, user: req.user, req })

export const list = asyncHandler(async (req, res) => {
  const parsed = listCouponsQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listCoupons({ ...ctx(req), query: parsed.data })
  // res.json({ success: true, rows: data.rows, total: data.total, page: data.page, limit: data.limit })
  res.json(data)

})

export const getOne = asyncHandler(async (req, res) => {
  const coupon = await getCoupon({ ...ctx(req), id: req.params.id })
  res.json(coupon)
})

export const usage = asyncHandler(async (req, res) => {
  const data = await listCouponUsage({ ...ctx(req), id: req.params.id, query: req.query })
  res.json(data)
})

export const options = asyncHandler(async (req, res) => {
  const entity = optionEntity.safeParse(req.params.entity)
  if (!entity.success) throw new ApiError(404, "Unknown option type")
  const parsed = listOptionQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listEntityOptions({ ...ctx(req), entity: entity.data, query: parsed.data })
  res.json(data)
})

export const create = asyncHandler(async (req, res) => {
  const parsed = createCouponSchema.safeParse(req.body)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid coupon payload")
  const coupon = await createCouponDoc({ ...ctx(req), body: parsed.data })
  res.status(201).json({ success: true, data: coupon })
})

export const update = asyncHandler(async (req, res) => {
  const parsed = updateCouponSchema.safeParse(req.body)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid coupon payload")
  const coupon = await updateCouponDoc({ ...ctx(req), id: req.params.id, body: parsed.data })
  res.json({ success: true, data: coupon })
})

export const toggle = asyncHandler(async (req, res) => {
  const result = await toggleCouponDoc({ ...ctx(req), id: req.params.id })
  res.json({ success: true, data: result })
})

export const duplicate = asyncHandler(async (req, res) => {
  const coupon = await duplicateCouponDoc({ ...ctx(req), id: req.params.id })
  res.status(201).json({ success: true, data: coupon })
})

export const remove = asyncHandler(async (req, res) => {
  const fn = req.query.permanent === "true" ? destroyCouponDoc : deleteCouponDoc
  const result = await fn({ ...ctx(req), id: req.params.id })
  res.json({ success: true, ...result })
})

export const bulkRemove = asyncHandler(async (req, res) => {
  const parsed = bulkDeleteCouponSchema.safeParse(req.body)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid payload")
  const result = await bulkDeleteCouponDoc({ ...ctx(req), ids: parsed.data.ids })
  res.json(result)
})

export const restore = asyncHandler(async (req, res) => {
  const coupon = await restoreCouponDoc({ ...ctx(req), id: req.params.id })
  res.json({ success: true, data: coupon })
})

export const redeem = asyncHandler(async (req, res) => {
  const parsed = applyCouponSchema.safeParse(req.body)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid payload")
  const result = await redeemCouponDoc({ seller: req.seller, tenantDbName: req.tenantDbName, body: parsed.data })
  res.json({ success: true, ...result })
})