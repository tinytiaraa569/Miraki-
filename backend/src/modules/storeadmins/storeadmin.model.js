import mongoose from "mongoose";

export const storeAdminSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    name: { type: String, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null, select: false },

    twoFactorRequired: { type: Boolean, default: true },
    totpEnabled: { type: Boolean, default: false },      //  has enrollment actually completed
    totpSecret: { type: String, default: null, select: false },
    twoStepVerifiedAt: { type: Date, default: null },

    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
    overridePermissions: {
      grant: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
      revoke: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
    },

    substoreIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Substore", required: true }],

    status: { type: String, enum: ["invited", "active", "suspended"], default: "invited" },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

storeAdminSchema.index({ email: 1 }, { unique: true });

export const StoreAdmin = mongoose.model("StoreAdmin",storeAdminSchema,"storeadmins")