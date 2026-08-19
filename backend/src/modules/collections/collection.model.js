import mongoose from "mongoose"

// TENANT-DB SCHEMA: collections live inside each seller's dedicated database.
//
// A collection groups products two ways:
//   • MANUAL  — a hand-picked, ordered list of `productIds`.
//   • DYNAMIC — a rule set (`rules`) that resolves to products via the
//     rule-compiler → $match → materialized `collectionMembers` (see the
//     COLLECTIONS_SYSTEM_PLAN.md). Membership bookkeeping lives on `membership`.
//
// Mirrors the Brand/Category StoreHippo blocks exactly (seo, sitemap,
// metafields, substoreIds, facetGroupId, soft-delete, alias slugify, audit) and
// only adds `type`, `productIds`, `rules`, and `membership`.

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

// One rule row = the (Field / Operator / Value) triple from the filter builder.
const conditionSchema = new mongoose.Schema(
  {
    field: { type: String, enum: ["price", "brand", "categories", "option"], required: true },
    // For "option" rules we need to know WHICH option key (e.g. "metal").
    optionKey: { type: String, trim: true, maxlength: 80, default: null },
    operator: {
      type: String,
      enum: ["eq", "ne", "gt", "gte", "lt", "lte", "between", "in", "nin", "contains", "contains_all"],
      required: true,
    },
    // Mixed so a single field covers number, string, ObjectId, or array values.
    value: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false },
)

export const collectionSchema = new mongoose.Schema(
  {
    // ------------------------------------------------------------------ identity
    name: { type: String, required: true, trim: true, maxlength: 160 },
    alias: { type: String, trim: true, lowercase: true, maxlength: 200 },
    description: { type: String, maxlength: 20000, default: null }, // sanitized HTML
    images: { type: [imageSchema], default: [] },

    // Always the tenant's single MAIN store — stamped server-side.
    parentStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },

    // ------------------------------------------------------------------ type
    type: { type: String, enum: ["manual", "dynamic"], default: "manual", index: true },

    // MANUAL: ordered, hand-picked products. Array order = display order.
    productIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },

    // DYNAMIC: match = AND ("all") / OR ("any") across the conditions.
    rules: {
      match: { type: String, enum: ["all", "any"], default: "all" },
      conditions: { type: [conditionSchema], default: [] },
    },

    // ------------------------------------------------------------------ display
    sortOrder: { type: Number, default: 0 },
    defaultSortOrder: {
      type: String,
      enum: ["manual", "name_asc", "name_desc", "newest", "oldest", "price_asc", "price_desc"],
      default: "manual",
    },
    // PUBLISH STATE — the Published / Unpublished tabs filter on this. Indexed.
    isPublished: { type: Boolean, default: true, index: true },
    // Kept for parity with categories'/brands' active/inactive semantics.
    isActive: { type: Boolean, default: true },

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
    facetGroupId: { type: mongoose.Schema.Types.ObjectId, default: null },
    customFields: { type: [{ key: String, value: String }], default: [] },

    // --------------------------- dynamic membership bookkeeping (see plan §6)
    membership: {
      productCount: { type: Number, default: 0 }, // cached count for list badge (0 queries)
      lastBuiltAt: { type: Date, default: null }, // when membership was last materialized
      isStale: { type: Boolean, default: false }, // rules changed / product changed
      buildVersion: { type: Number, default: 0 }, // bumped each rebuild; scopes cache keys
    },

    // ------------------------------------------------------------------ audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },

    // --------------------------------------------------------- soft delete
    // Non-null `deletedAt` means the collection is in the "trash": hidden from
    // normal lists, restorable until permanently destroyed.
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true },
)

// Covered lookups: publish-tab list sorted; alias uniqueness; trash view.
collectionSchema.index({ parentStoreId: 1, isPublished: 1, sortOrder: 1, name: 1 })
collectionSchema.index({ parentStoreId: 1, alias: 1 }, { unique: true, sparse: true })

// Slugify alias from name when blank (identical rule to brands/categories).
collectionSchema.pre("validate", function (next) {
  if (!this.alias && this.name) {
    this.alias = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 200)
  }
  next()
})
