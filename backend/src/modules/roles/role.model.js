import mongoose from "mongoose";

export const roleSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    displayName: { type: String, required: true, trim: true, maxlength: 120 },
    slug: {type: String,required: true,trim: true,lowercase: true,maxlength: 80,},
    description: { type: String, trim: true, maxlength: 500, default: "" },

    // UI accent color for badges/avatars, eg "#EC4899"
    color: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 7,
      default: "#6B7280",
    },

    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],

    status: { type: String, enum: ["active", "inactive"], default: "active" },
    isSystem: { type: Boolean, default: false },

    // Scope of records a user with this role can see/act on. Optional — a role
    // may leave this unset (blank) until an admin explicitly chooses.
    dataAccess: {
      type: String,
      enum: ["own_substore", "multiple_substores", "all_substores"],
    },

    // view all store data but manage own store data?
    // view speific store but manage own store data ?
    // manage all selected store ?
    // manage all stores?

    otherSubstoreAccess: {
      type: String,
      enum: ["view_only", "permission_based"],
      default: "view_only",
    },

    substoreIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Substore" }],

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true },
);

// One slug per seller (every seller can have its own "admin" slug)
roleSchema.index({ sellerId: 1, slug: 1 }, { unique: true });
roleSchema.index({ sellerId: 1, isDeleted: 1 });
// roleSchema.index({ substoreIds: 1 });

roleSchema.pre("validate", function (next) {
  if (!this.slug && this.displayName) {
    this.slug = this.displayName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }
  next();
});
