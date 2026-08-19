import { ApiError } from "../../utils/apiError.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import {
  createCouponDoc,
  deleteCouponDoc,
  destroyCouponDoc,
  getCoupon,
  listCoupons,
  listCouponUsage,
  redeemCouponDoc,
  restoreCouponDoc,
  updateCouponDoc,
} from "./coupon.service.js"
import {
  createCouponSchema,
  listCouponsQuerySchema,
  listCouponUsageQuerySchema,
  redeemCouponSchema,
  updateCouponSchema,
} from "./coupon.validation.js"

const ctx = (req) => ({ seller: req.seller, tenantDbName: req.tenantDbName, user: req.user, req })

export const list = asyncHandler(async (req, res) => {
  const parsed = listCouponsQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listCoupons({ ...ctx(req), query: parsed.data })
  res.json(data)
})

export const getOne = asyncHandler(async (req, res) => {
  const coupon = await getCoupon({ ...ctx(req), id: req.params.id })
  res.json({ coupon })
})

export const usage = asyncHandler(async (req, res) => {
  const parsed = listCouponUsageQuerySchema.safeParse(req.query)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid query")
  const data = await listCouponUsage({ ...ctx(req), id: req.params.id, query: parsed.data })
  res.json(data)
})

export const create = asyncHandler(async (req, res) => {
  const parsed = createCouponSchema.safeParse(req.body)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid coupon payload")
  const coupon = await createCouponDoc({ ...ctx(req), body: parsed.data })
  res.status(201).json({ coupon })
})

export const update = asyncHandler(async (req, res) => {
  const parsed = updateCouponSchema.safeParse(req.body)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid coupon payload")
  const coupon = await updateCouponDoc({ ...ctx(req), id: req.params.id, body: parsed.data })
  res.json({ coupon })
})

export const remove = asyncHandler(async (req, res) => {
  // ?permanent=true hard-deletes a coupon that is already in the trash.
  const fn = req.query.permanent === "true" ? destroyCouponDoc : deleteCouponDoc
  const result = await fn({ ...ctx(req), id: req.params.id })
  res.json(result)
})

export const restore = asyncHandler(async (req, res) => {
  const coupon = await restoreCouponDoc({ ...ctx(req), id: req.params.id })
  res.json({ coupon })
})

export const redeem = asyncHandler(async (req, res) => {
  const parsed = redeemCouponSchema.safeParse(req.body)
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Invalid redemption payload")
  const result = await redeemCouponDoc({
    tenantDbName: req.tenantDbName,
    id: req.params.id,
    userId: parsed.data.userId,
    cartTotal: parsed.data.cartTotal,
  })
  res.json(result)
})