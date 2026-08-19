import mongoose from "mongoose"

const userDirectorySchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    // References either a StoreUser or StoreAdmin in the resolved tenant DB.
    // Account type is derived server-side by exact _id + email lookup.
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true },
)

// One login email maps to exactly one tenant across the whole platform.
userDirectorySchema.index({ email: 1 }, { unique: true })
userDirectorySchema.index({ sellerId: 1 })

export const UserDirectory = mongoose.model("UserDirectory", userDirectorySchema, "userDirectory")
