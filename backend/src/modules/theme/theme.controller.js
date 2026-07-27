import { asyncHandler } from "../../utils/asyncHandler.js"
import { getSellerTheme, resetSellerTheme, saveSellerTheme } from "./theme.service.js"

// GET /api/seller/theme — tiny payload consumed by the Hub shell on load.
export const readTheme = asyncHandler(async (req, res) => {
  const theme = await getSellerTheme({ seller: req.seller })
  res.json(theme)
})

// PUT /api/seller/theme — owner-only full-map save (validated + allow-listed).
export const writeTheme = asyncHandler(async (req, res) => {
  const theme = await saveSellerTheme({
    seller: req.seller,
    user: req.user,
    updates: req.body,
    req,
  })
  res.json(theme)
})

// DELETE /api/seller/theme — owner-only reset back to the default theme.
export const removeTheme = asyncHandler(async (req, res) => {
  const theme = await resetSellerTheme({ seller: req.seller, user: req.user, req })
  res.json(theme)
})
