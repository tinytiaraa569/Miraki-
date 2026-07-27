import mongoose from "mongoose"

// TENANT-DB SCHEMA: store users live inside each seller's dedicated database
// (`tenant_<slug>_<hash>`), never in the master platform DB.
// Models are only created through getTenantModels() in config/tenantDb.js —
// this file exports the SCHEMA, not a default-connection model.
export const storeUserSchema = new mongoose.Schema(
  {
    // Scope chain — ALWAYS stamped server-side from the creator's session, never from the request body.
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    mainStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", default: null }, // null = main-store level
    role: {
      type: String,
      enum: ["SELLER_SUPERADMIN", "STORE_SUPERADMIN", "STORE_ADMIN"],
      required: true,
    },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null, select: false }, // null until activation
    twoStepEnabled: { type: Boolean, default: false },
    otpChannel: { type: String, enum: ["email", "sms"], default: "email" },
    permissionPolicy: {
      permissions: { type: [String], default: [] },
      attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    status: { type: String, enum: ["invited", "active", "suspended"], default: "invited" },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, required: true }, // full chain auditability
    createdByModel: { type: String, enum: ["PlatformUser", "StoreUser"], required: true },
  },
  { timestamps: true },
)

// Email unique per tenant database (one DB = one seller, so this is per-seller).
storeUserSchema.index({ email: 1 }, { unique: true })
