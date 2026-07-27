import { ApiError } from "../utils/apiError.js"
import { audit } from "../modules/audit/audit.service.js"

export function errorHandler(err, req, res, _next) {
  const status = err instanceof ApiError ? err.status : 500
  const message = err instanceof ApiError ? err.message : "Internal server error"

  if (status === 401 || status === 403) {
    // Every rejection is audit-logged with actor and route.
    audit({
      req,
      actorId: req.user?._id ?? null,
      actorRole: req.user?.role ?? null,
      action: `security.rejected.${status}`,
      targetType: "route",
      after: { method: req.method, path: req.originalUrl },
    })
  }

  if (status === 500) console.error("[server] unhandled error:", err)
  res.status(status).json({ error: message })
}
