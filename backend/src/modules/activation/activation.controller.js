import { ApiError } from "../../utils/apiError.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { activateAccount, verifyActivationToken } from "./activation.service.js"
import { verifyTokenSchema } from "./activation.validation.js"

export const verifyToken = asyncHandler(async (req, res) => {
  const parsed = verifyTokenSchema.safeParse({ token: req.query.token })
  if (!parsed.success) throw new ApiError(410, "This activation link is invalid or has expired")

  const info = await verifyActivationToken(parsed.data.token)
  res.json(info)
})

export const activate = asyncHandler(async (req, res) => {
  const result = await activateAccount({
    rawToken: req.body.token,
    password: req.body.password,
    req,
  })
  res.json({ activated: true, ...result })
})