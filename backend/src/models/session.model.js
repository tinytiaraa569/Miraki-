import mongoose from "mongoose"

const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    // userType: { type: String, enum: ["platform", "store"], required: true },
    userType: { type: String, enum: ["platform", "store", "storeAdmin"], required: true },
    // Store users only: which tenant they belong to (null for platform users).
    // Lets loadUser resolve the right tenant DATABASE without trusting the client.
    sellerId: { type: mongoose.Schema.Types.ObjectId, default: null },
    refreshTokenHash: { type: String, required: true },
    // The immediately-previous, already-consumed refresh-token hash. Presenting
    // a token that matches THIS is a replay of a rotated-away token → the whole
    // family is treated as compromised (reuse detection in rotateRefreshToken).
    prevRefreshTokenHash: { type: String, default: null },
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

// The current refresh-token hash is unique (256-bit random, so collisions are
// impossible) — a hard integrity guard against accidental duplication. The
// previous hash is sparse-indexed so reuse detection stays a fast lookup.
sessionSchema.index({ refreshTokenHash: 1 }, { unique: true })
sessionSchema.index({ prevRefreshTokenHash: 1 }, { sparse: true })

export const Session = mongoose.model("Session", sessionSchema, "sessions")
