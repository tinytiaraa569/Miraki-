import mongoose from "mongoose"

const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    userType: { type: String, enum: ["platform", "store"], required: true },
    // Store users only: which tenant they belong to (null for platform users).
    // Lets loadUser resolve the right tenant DATABASE without trusting the client.
    sellerId: { type: mongoose.Schema.Types.ObjectId, default: null },
    refreshTokenHash: { type: String, required: true },
    tokenFamily: { type: String, required: true, index: true },
    revoked: { type: Boolean, default: false },
    ipHash: { type: String, required: true },
    uaHash: { type: String, required: true },
    lastSeen: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
)

// TTL index — expired sessions are auto-cleaned.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const Session = mongoose.model("Session", sessionSchema, "sessions")
