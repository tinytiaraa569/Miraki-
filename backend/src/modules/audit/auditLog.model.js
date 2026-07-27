import mongoose from "mongoose"

// Append-only: no update/delete routes exist for this collection.
const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, default: null },
    actorRole: { type: String, default: null },
    sellerId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, default: null },
    action: { type: String, required: true, index: true },
    targetType: { type: String, default: null },
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

auditLogSchema.index({ createdAt: -1 })

export const AuditLog = mongoose.model("AuditLog", auditLogSchema, "auditLogs")
