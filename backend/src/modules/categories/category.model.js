import mongoose from "mongoose"

const { Mixed } = mongoose.Schema.Types

// TENANT-DB SCHEMA: categories live inside each seller's dedicated database.
//
// N-LEVEL TREE (StoreHippo-style). A category can nest to any depth. The tree
// is stored with a MATERIALIZED-ANCESTORS model so subtree / cascade / move
// operations stay a single indexed query — no recursion, no regex on a path
// string:
//
//   parentId      -> direct parent (null = root / level 0)
//   ancestors[]   -> ObjectIds from ROOT down to the direct parent, in order
//   depth         -> ancestors.length (0 for roots)
//   childrenCount -> denormalized count of DIRECT, non-deleted children
//
// `childrenCount` is what powers lazy loading on the client: the tree draws an
// expand chevron purely from this number, with zero extra requests. Expanding
// a node then fetches only its direct children (parentId = <id>), repeatable
// to any depth.
//
// Only `name` is required; everything else is optional so an owner can save a
// bare category first and enrich it later — matching the substore add-form.

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, maxlength: 500 },
    alt: { type: String, trim: true, maxlength: 200, default: "" },
  },
  { _id: false },
)

export const categorySchema = new mongoose.Schema(
  {
    // ------------------------------------------------------------------ identity
    name: { type: String, required: true, trim: true, maxlength: 160 },
    alias: { type: String, trim: true, lowercase: true, maxlength: 200 },
    description: { type: String, maxlength: 8000, default: null },
    images: { type: [imageSchema], default: [] },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },

    // Always the tenant's single MAIN store — stamped server-side.
    parentStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },

    // ---------------------------------------------------------------- tree shape
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    // Root -> ... -> direct parent. Empty for a root category.
    ancestors: { type: [mongoose.Schema.Types.ObjectId], default: [], index: true },
    depth: { type: Number, default: 0, index: true },
    childrenCount: { type: Number, default: 0 },

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
    // Definition-driven custom fields (the ms.categories Metafields), stored
    // StoreHippo-style DIRECTLY on the category as a keyed object with native-
    // typed values, e.g. { show_engagement_rings: 1, engagement_rings: [{ title,
    // image, sort_order }], collections_option: "..." }. Keyed by the metafield
    // `key`; the value's type follows the field's dataType (nested object arrays
    // are stored as arrays of objects). Validated + coerced against the live
    // definition on every create/update in category.service.js (see
    // buildCategoryMetafields). Mixed because the key set is dynamic — the
    // service calls markModified.
    metafields: { type: Mixed, default: () => ({}) },
    // Empty = visible in ALL substores; otherwise restricted to these substores.
    substoreIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    defaultSortOrder: {
      type: String,
      enum: ["manual", "name_asc", "name_desc", "newest", "oldest", "price_asc", "price_desc"],
      default: "manual",
    },
    widget: { type: String, trim: true, maxlength: 120, default: null },
    customFields: { type: [{ key: String, value: String }], default: [] },

    // ------------------------------------------------------------------ audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },

    // ------------------------------------------------------------------ soft delete
    // Non-null `deletedAt` means the category is in the "trash": hidden from
    // normal lists, restorable until permanently destroyed. Cascade-aware —
    // deleting a node trashes its whole subtree together.
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true },
)

// Covered lookups: siblings of a parent, sorted; subtree scans; alias lookups.
categorySchema.index({ parentStoreId: 1, parentId: 1, sortOrder: 1, name: 1 })
categorySchema.index({ parentStoreId: 1, ancestors: 1 })
categorySchema.index({ parentStoreId: 1, alias: 1 }, { unique: true, sparse: true })
// Metafield keys are dynamic, so a wildcard index keeps metafield filters
// (e.g. { "metafields.show_engagement_rings": 1 }) fast at scale.
categorySchema.index({ parentStoreId: 1, "metafields.$**": 1 })

// Slugify alias from name when blank (same rule as substores).
categorySchema.pre("validate", function (next) {
  if (!this.alias && this.name) {
    this.alias = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 200)
  }
  next()
})
