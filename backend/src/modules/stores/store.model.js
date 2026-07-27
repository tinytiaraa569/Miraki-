import mongoose from "mongoose"

// TENANT-DB SCHEMA: stores live inside each seller's dedicated database
// (`tenant_<slug>_<hash>`), never in the master platform DB.
// Models are only created through getTenantModels() in config/tenantDb.js —
// this file exports the SCHEMA, not a default-connection model.
export const storeSchema = new mongoose.Schema(
  {
    // Kept for auditability/back-reference to the master registry; physical
    // isolation is now the database itself, not this field.
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    type: { type: String, enum: ["MAIN", "SUB"], required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    countryCode: { type: String, default: null },
    currency: { type: String, default: "USD" },
    language: { type: String, default: "en" },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", default: null },
    isDeletable: { type: Boolean, default: true },
  },
  { timestamps: true },
)

// Exactly one MAIN store per seller — structural guarantee, not just a check.
storeSchema.index({ sellerId: 1, type: 1 }, { unique: true, partialFilterExpression: { type: "MAIN" } })

// Server-side delete guard for MAIN stores.
storeSchema.pre("deleteOne", { document: true, query: false }, function (next) {
  if (this.type === "MAIN") return next(new Error("MAIN store cannot be deleted"))
  next()
})
