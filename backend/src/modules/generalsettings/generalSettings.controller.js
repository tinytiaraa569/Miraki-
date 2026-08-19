import { asyncHandler } from "../../utils/asyncHandler.js"
import { getGeneralSettings, updateGeneralSettings } from "./generalSettings.service.js"

const ctx = (req) => ({ seller: req.seller, tenantDbName: req.tenantDbName, user: req.user, req })

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await getGeneralSettings(ctx(req))
  res.json({ settings })
})

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await updateGeneralSettings(ctx(req), req.body)
  res.json({ settings })
})
