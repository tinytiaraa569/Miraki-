import mongoose from "mongoose"

// TENANT-DB SCHEMA: brands live inside each seller's dedicated database.
//
// FLAT list (no hierarchy) — unlike categories there is NO parentId/ancestors/
// depth/childrenCount and NO /move. The Published / Unpublished tabs filter on
// a single indexed boolean `isPublished`. Only `name` is required; everything
// else is optional so an owner can save a bare brand first and enrich it later.

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, maxlength: 500 },
    alt: { type: String, trim: true, maxlength: 200, default: "" },
  },
  { _id: false },
)

const metafieldSchema = new mongoose.Schema(
  {
    key: { type: String, trim: true, maxlength: 80 },
    value: { type: String, trim: true, maxlength: 2000 },
    type: { type: String, enum: ["text", "number", "boolean", "json", "url"], default: "text" },
  },
  { _id: false },
)

export const brandSchema = new mongoose.Schema(
  {
    // ------------------------------------------------------------------ identity
    name: { type: String, required: true, trim: true, maxlength: 160 },
    alias: { type: String, trim: true, lowercase: true, maxlength: 200 },
    description: { type: String, maxlength: 8000, default: null },
    images: { type: [imageSchema], default: [] },

    // ------------------------------------------------------------------ display
    sortOrder: { type: Number, default: 0 },
    defaultSortOrder: {
      type: String,
      enum: ["manual", "name_asc", "name_desc", "newest", "oldest", "price_asc", "price_desc"],
      default: "manual",
    },
    // PUBLISH STATE — the Published / Unpublished tabs filter on this. Indexed.
    isPublished: { type: Boolean, default: true, index: true },
    // Kept for parity with categories' active/inactive semantics (optional use).
    isActive: { type: Boolean, default: true },

    // Always the tenant's single MAIN store — stamped server-side.
    parentStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },

    // ------------------------------------------------------- StoreHippo blocks
    seo: {
      title: { type: String, trim: true, maxlength: 200, default: null },
      description: { type: String, trim: true, maxlength: 500, default: null },
      keywords: { type: [String], default: [] },
      canonicalUrl: { type: String, trim: true, maxlength: 500, default: null },
    },
    sitemap: {
      priority: { type: Number, min: 0, max: 1, default: 0.5 },
      frequency: {
        type: String,
        enum: ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"],
        default: "weekly",
      },
      disableForBots: { type: Boolean, default: false },
    },
    metafields: { type: [metafieldSchema], default: [] },
    // Empty = visible in ALL substores; otherwise restricted to these substores.
    substoreIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },

    // ------------------------------------------------- brand-specific refs
    // Free references for now (no hard FK). Wire to real pickers later.
    brandOwnerIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    facetGroupId: { type: mongoose.Schema.Types.ObjectId, default: null },

    customFields: { type: [{ key: String, value: String }], default: [] },

    // ------------------------------------------------------------------ audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },

    // --------------------------------------------------------- soft delete
    // Non-null `deletedAt` means the brand is in the "trash": hidden from normal
    // lists, restorable until permanently destroyed.
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true },
)

// Covered lookups: publish-tab list sorted, alias uniqueness, trash view.
brandSchema.index({ parentStoreId: 1, isPublished: 1, sortOrder: 1, name: 1 })
brandSchema.index({ parentStoreId: 1, alias: 1 }, { unique: true, sparse: true })

// Slugify alias from name when blank (identical rule to categories/substores).
brandSchema.pre("validate", function (next) {
  if (!this.alias && this.name) {
    this.alias = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 200)
  }
  next()
})
