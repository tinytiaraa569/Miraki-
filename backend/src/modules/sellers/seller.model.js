import mongoose from "mongoose"

const sellerSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, lowercase: true, trim: true },
    // TENANT REGISTRY: name of this seller's dedicated database
    // (e.g. "tenant_unity_jewels_2a5e21c6"). ALL seller data (stores,
    // storeUsers, future products/orders) lives inside that database.
    // Immutable — a tenant's database is never renamed or reassigned.
    dbName: { type: String, required: true, immutable: true },
    ownerEmail: { type: String, required: true, lowercase: true, trim: true },
    // Business profile — editable by the seller owner from the Hub.
    // logoUrl points at a file under uploads/<sellerId>/images/ (base64
    // uploads decoded server-side, no multer).
    profile: {
      // Legacy single logo (kept for older records; new uploads use the
      // light/dark pair below). Files live at uploads/seller/<id>/logo/ —
      // ONLY the public URL is stored in the database.
      logoUrl: { type: String, default: null },
      logoLightUrl: { type: String, default: null },
      logoDarkUrl: { type: String, default: null },
      // Compact square icon shown when the Hub sidebar is collapsed.
      // logoIconUrl is the light-mode icon; logoIconDarkUrl is preferred in dark mode.
      logoIconUrl: { type: String, default: null },
      logoIconDarkUrl: { type: String, default: null },
      // Brand theming — hex colors applied to the Hub UI (sidebar, buttons).
      brandColor: { type: String, default: null, match: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i },
      accentColor: { type: String, default: null, match: /^#([0-9a-f]{3}|[0-9a-f]{6})$/i },
      phone: { type: String, default: "", trim: true, maxlength: 30 },
      website: { type: String, default: "", trim: true, maxlength: 200 },
      description: { type: String, default: "", trim: true, maxlength: 500 },
      addressLine1: { type: String, default: "", trim: true, maxlength: 200 },
      city: { type: String, default: "", trim: true, maxlength: 100 },
      state: { type: String, default: "", trim: true, maxlength: 100 },
      country: { type: String, default: "", trim: true, maxlength: 100 },
      postalCode: { type: String, default: "", trim: true, maxlength: 20 },
    },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    multistoreEnabled: { type: Boolean, default: false },
    // Set on creation inside the same transaction; treated as immutable afterwards.
    mainStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformUser", required: true },
    // Soft delete: non-null deletedAt = in trash. Hidden from all normal lists
    // and the tenant is fully locked out until restored or permanently purged.
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "PlatformUser", default: null },
  },
  { timestamps: true },
)

sellerSchema.index({ slug: 1 }, { unique: true })
sellerSchema.index({ dbName: 1 }, { unique: true })
sellerSchema.index({ status: 1, createdAt: -1 })
sellerSchema.index({ deletedAt: 1, createdAt: -1 })

export const Seller = mongoose.model("Seller", sellerSchema, "sellers")
