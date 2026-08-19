import mongoose, { Schema } from "mongoose";

//for store admins permissions

export const permissionSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    key: { type: String, trim: true, lowercase: true, maxlength: 100, required: true },
    action: { type: String, trim: true, lowercase: true, maxlength: 20, default: null },
    category: { type: String, trim: true, lowercase: true, maxlength: 80, default: null },

    description: { type: String, default: "", trim: true, maxlength: 500 },
    
    isActive: { type: Boolean, default: false },
    isSystem: { type: Boolean, default: false, index: true },
    label: { type: String, trim: true, maxlength: 80, default: null },
    module: { type: String, trim: true, lowercase: true, maxlength: 80, default: null },
    sortOrder: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

//  one (key, action, category) combination per seller
permissionSchema.index(
  { sellerId: 1, key: 1, action: 1, category: 1 },
  { unique: true },
);

// active permissions grouped by module
permissionSchema.index({ sellerId: 1, module: 1, isActive: 1 });

export default mongoose.models.Permission || mongoose.model("Permission", permissionSchema);
