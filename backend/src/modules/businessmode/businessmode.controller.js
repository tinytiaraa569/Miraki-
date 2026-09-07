import { asyncHandler } from "../../utils/asyncHandler.js"
import { getBusinessMode, updateBusinessModeDoc } from "./businessmode.service.js"

const ctx = (req) => ({ seller: req.seller, tenantDbName: req.tenantDbName, user: req.user, req })



export const getOne = asyncHandler(async (req, res) => {
  const businessMode = await getBusinessMode({ ...ctx(req) })
  res.json({ businessMode })
})

export const update = asyncHandler(async (req, res) => {
  const businessMode = await updateBusinessModeDoc({ ...ctx(req), body: req.body })
  res.json({ businessMode })
})