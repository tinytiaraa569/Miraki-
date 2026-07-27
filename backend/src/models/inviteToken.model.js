import mongoose from "mongoose"

const inviteTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true }, // SHA-256, never plaintext
    targetUserId: { type: mongoose.Schema.Types.ObjectId, required: true },
    // Which tenant the target user lives in (null = platform-side token).
    // Activation resolves: token.sellerId -> Seller (master) -> tenant DB -> StoreUser.
    sellerId: { type: mongoose.Schema.Types.ObjectId, default: null },
    purpose: { type: String, enum: ["activation"], default: "activation" },
    consumed: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
)

inviteTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const InviteToken = mongoose.model("InviteToken", inviteTokenSchema, "inviteTokens")
