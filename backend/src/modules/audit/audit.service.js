import { AuditLog } from "./auditLog.model.js"

export async function audit({ req, actorId = null, actorRole = null, sellerId = null, storeId = null, action, targetType = null, targetId = null, before = null, after = null }) {
  try {
    await AuditLog.create({
      actorId,
      actorRole,
      sellerId,
      storeId,
      action,
      targetType,
      targetId,
      before,
      after,
      ip: req?.ip ?? null,
      userAgent: req?.headers?.["user-agent"]?.slice(0, 256) ?? null,
    })
  } catch (err) {
    // Audit failures must never break the request path, but must be visible.
    console.error("[server] audit write failed:", err.message)
  }
}
