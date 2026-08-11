import mongoose from "mongoose"

const userDirectorySchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true }, // StoreUser _id inside the tenant DB
  },
  { timestamps: true },
)

// One login email maps to exactly one tenant across the whole platform.
userDirectorySchema.index({ email: 1 }, { unique: true })
userDirectorySchema.index({ sellerId: 1 })

export const UserDirectory = mongoose.model("UserDirectory", userDirectorySchema, "userDirectory")
