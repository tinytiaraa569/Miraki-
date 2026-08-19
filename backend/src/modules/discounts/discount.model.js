import mongoose from "mongoose"


const { ObjectId, Mixed } = mongoose.Schema.Types


const conditionItemSchema = new mongoose.Schema(
  {
    field: { type: String, trim: true, maxlength: 80, required: true },
    operator: { type: String, trim: true, maxlength: 40, default: "eq" },
    value: { type: Mixed, default: null },
  },
  { _id: false },
)

export const discountSchema = new mongoose.Schema(
  {
    // ------------------------------------------------------------------ identity
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 500, default: "" },

    // Always the tenant's single MAIN store — stamped server-side.
    parentStoreId: { type: ObjectId, ref: "Store", required: true, index: true },

    // ------------------------------------------------------------------ rule type
    ruleType: {
      type: String,
      enum: ["product", "order", "bogo_auto_add"],
      default: "product",
      index: true,
    },

    // ------------------------------------------------- product / order discount
    amountType: { type: String, enum: ["flat", "percentage"], default: "flat" },
    amountValue: { type: Number, min: 0, default: 0 },
    applyOn: { type: String, enum: ["all", "conditional"], default: "all" },
    conditions: {
      match: { type: String, enum: ["all", "any"], default: "all" },
      items: { type: [conditionItemSchema], default: [] },
    },
    // Caps the discount amount for a PERCENTAGE discount (null = no cap).
    maxDiscount: { type: Number, min: 0, default: null },

    // ------------------------------------------------------ bogo / auto-add gift
    productGroup: {
      type: String,
      enum: ["product", "collection", "category", "brand"],
      default: "collection",
    },
    sourceItemId: { type: ObjectId, default: null },
    sourceMinQuantity: { type: Number, min: 0, default: null },
    sourceMinTotal: { type: Number, min: 0, default: null },
    discountLabel: { type: String, trim: true, maxlength: 160, default: "" },
    discountMessage: { type: String, trim: true, maxlength: 300, default: "" },
    freeProductConfig: { type: String, enum: ["single", "multiple"], default: "single" },
    freeProductIds: { type: [ObjectId], default: [] },
    // Public URL of the persisted gift image (never the base64 bytes).
    giftImage: { type: String, trim: true, maxlength: 500, default: null },
    giftHeading: { type: String, trim: true, maxlength: 160, default: "" },
    giftMessage: { type: String, trim: true, maxlength: 300, default: "" },

    // ------------------------------------------------------------------ shared
    // Empty = applies in ALL substores; otherwise restricted to these substores.
    substoreIds: { type: [ObjectId], default: [] },
    maxUsage: { type: Number, min: 0, default: null }, // null = unlimited
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    // Restrict the discount to a specific seller/vendor (null = all).
    sellerId: { type: ObjectId, default: null, index: true },
    enabled: { type: Boolean, default: true, index: true },
    timesUsed: { type: Number, min: 0, default: 0 }, // usage counter (read-only in UI)

    // ------------------------------------------------------------------ audit
    createdBy: { type: ObjectId, default: null },
    updatedBy: { type: ObjectId, default: null },

    // --------------------------------------------------------- soft delete
    // Non-null `deletedAt` = the discount is in the "trash": hidden from normal
    // lists, restorable until permanently destroyed.
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: ObjectId, default: null },
  },
  { timestamps: true },
)

// Covered lookups: Enabled/Disabled tab list sorted newest-first; trash view.
discountSchema.index({ parentStoreId: 1, deletedAt: 1, enabled: 1, createdAt: -1 })
discountSchema.index({ parentStoreId: 1, deletedAt: 1, createdAt: -1 })
