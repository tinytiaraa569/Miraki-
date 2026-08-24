import mongoose from "mongoose";

const { ObjectId, Mixed } = mongoose.Schema.Types;


const conditionItemSchema = new mongoose.Schema(
  {
    // field: { type: String, trim: true, maxlength: 80, required: true }, 
      field:{type: String,enum: ["cart_total", "cart_item_count", "product_quantity","product", "category", "collection", "brand"],required:true},

    operator: { type: String, trim: true, maxlength: 40, required: true }, 
    values: { type: [Mixed], default: [] }, 
  },
  { _id: false },
);

export const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true, maxlength: 50 },
    name: { type: String, trim: true, maxlength: 160, default: "" },
    description: { type: String, trim: true, maxlength: 5000, default: "" }, 

    enabled: { type: Boolean, default: true, index: true },

    conditions: { type: [conditionItemSchema], default: [] },

    showAdvanceSettings: { type: Boolean, default: false },

    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },

    
    maxUsage: { type: Number, default: null, min: 0 }, 
    maxUsagePerUser: { type: Number, default: null, min: 0 }, 
    minOrderAmount: { type: Number, default: null, min: 0 },
    maxDiscount: { type: Number, default: null, min: 0 },

    isPrivate: { type: Boolean, default: false, index: true }, 

    discountType: { type: String, enum: ["percentage", "fixed"], required: true },
    amount: { type: Number, required: true, min: 0 },
    encryptedAmount: { type: String, default: null }, 

    mainStoreId: { type: ObjectId, ref: "Store", required: true, index: true },
    sellerId: { type: ObjectId, ref: "Seller", required: true, index: true },
    substoreIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Substore" }], // empty means all substores 

    currentUsage: { type: Number, default: 0, min: 0 }, 
    usageByUser: [
      {
        _id: false,
        userId: { type: ObjectId, required: true },
        email: { type: String },
        count: { type: Number, default: 0, min: 0 },
      },
    ],
    createdBy: { type: ObjectId, default: null },
    updatedBy: { type: ObjectId, default: null },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: ObjectId, default: null },
  },
  { timestamps: true },
);

couponSchema.index(
  { sellerId: 1, code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
couponSchema.index({ mainStoreId: 1, deletedAt: 1, enabled: 1, createdAt: -1 });
couponSchema.index({ sellerId: 1, deletedAt: 1, createdAt: -1 });