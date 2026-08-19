import mongoose from "mongoose";

export const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 50,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (v) {
          return this.discountType !== "percentage" || v <= 100;
        },
        message: "Percentage discount cannot exceed 100",
      },
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    usageLimit: { type: Number, default: null, min: 0 },
    usageLimitPerUser: { type: Number, default: null, min: 0 },
    usageCount: { type: Number, default: 0, min: 0 }, // total used count

    usageCountPerUser: [
      {
        _id: false,
        userId: { type: mongoose.Schema.Types.ObjectId, required: true },
        count: { type: Number, default: 0, min: 0 },
      },
    ],
    minPurchaseAmount: { type: Number, default: null, min: 0 },
    maxDiscountAmount: { type: Number, default: null, min: 0 },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    substoreIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Substore" }],
    conditions: [
      {
        type: { type: String, enum: ["category", "collection", "brand"] },
        valueIds: [{ type: mongoose.Schema.Types.ObjectId, required: true }],
        operator: {
          type: String,
          enum: ["equal", "not_equal"],
          default: "equal",
        },
      },
    ],

    status: { type: String, enum: ["active", "inactive"], default: "active" },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true },
);

couponSchema.index(
  { sellerId: 1, code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
couponSchema.index({ "usageCountPerUser.userId": 1 });
