import { ApiError } from "../utils/apiError.js"


const FORBIDDEN_FIELDS = ["role", "sellerId", "mainStoreId", "storeId", "isActive", "_id", "createdBy"]


export const validate = (schema, { allow = [] } = {}) => (req, _res, next) => {
  const body = { ...req.body }
  for (const field of FORBIDDEN_FIELDS) {
    if (!allow.includes(field)) delete body[field]
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    return next(new ApiError(400, result.error.issues[0]?.message ?? "Invalid request"))
  }
  req.body = result.data
  next()
}
