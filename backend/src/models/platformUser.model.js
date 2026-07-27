import mongoose from "mongoose"

// Platform superadmins. The FIRST one is seeded from ENV at boot (isOriginal: true)
// and can never be suspended. Additional superadmins are created via the
// authenticated /platform/superadmins API by an existing superadmin.
const platformUserSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["PLATFORM_SUPERADMIN"],
      required: true,
      default: "PLATFORM_SUPERADMIN",
    },
    name: { type: String, trim: true, maxlength: 120, default: "" },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    // Marks the ENV-seeded account. Protected: cannot be suspended.
    isOriginal: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformUser", default: null },
    // TOTP 2FA — enabled by default, but can be turned off from Settings.
    // When twoFactorRequired is false, login skips the code step entirely.
    // totpSecret is stored encrypted-at-rest by MongoDB volume encryption and never selected by default.
    totpSecret: { type: String, default: null, select: false },
    totpEnabled: { type: Boolean, default: false },
    twoFactorRequired: { type: Boolean, default: true },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

platformUserSchema.index({ email: 1 }, { unique: true })

export const PlatformUser = mongoose.model("PlatformUser", platformUserSchema, "platformUsers")
