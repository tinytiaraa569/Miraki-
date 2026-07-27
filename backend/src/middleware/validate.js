import { ApiError } from "../utils/apiError.js"

// Mass-assignment protection: these ownership/identity fields are ALWAYS
// stripped from client payloads before validation — they are only ever
// stamped server-side. `status` is intentionally NOT here: it is a legitimate
// field on the dedicated (superadmin-only) status-change schema, and the
// create schema is `.strict()` so an injected `status` there is rejected anyway.
const FORBIDDEN_FIELDS = ["role", "sellerId", "mainStoreId", "storeId", "isActive", "_id", "createdBy"]

// `allow` lets a specific route keep a normally-forbidden field when it is a
// legitimate payload value (e.g. the invited user's `role` on the seller
// invite endpoint — its schema restricts it to safe values anyway).
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
