import mongoose from "mongoose"

// TENANT-DB SCHEMA: products live inside each seller's dedicated database and
// are the CENTRAL catalog entity every other module attaches to (Categories,
// Brands, Collections, Option Sets, Substores).
//
// HARD RULE (per the plan, docs/products.md): every relation is stored as an
// ObjectId reference (the real _id of the related doc) — NEVER a legacy alias
// string. Legacy StoreHippo aliases ("gifts-for-her", "jewelry", "all") are
// resolved to _id at write/import time by relation-resolver.js. The attached
// Option Set is REFERENCED by _id (optionSetId) and its options are COPIED in
// full onto the product's `options[]` (same shape as the optionsets module) so
// the product carries the complete option/value definitions on its own.
//
// One document per product holding specification groups + a derived option
// surface. VARIANTS are NOT embedded — they live in their own `productVariants`
// collection (productVariant.model.js) referenced by productId; the product
// keeps a `variantCount` rollup (recomputed by productVariant.service.js) plus
// the copied `options[]` definitions. Mirrors the brand/collection blocks: alias
// slugify in pre("validate"), soft delete, seo/sitemap/substoreIds, audit refs.

const { ObjectId, Mixed } = mongoose.Schema.Types

// --------------------------------------------------------------------------- 
// Shared sub-schemas
// ---------------------------------------------------------------------------

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, maxlength: 500 },
    alt: { type: String, trim: true, maxlength: 200, default: "" },
    caption: { type: String, trim: true, maxlength: 200, default: "" },
    // Metal/colour tags from the export ("R" / "W" / "Y" etc.) used to pick
    // the image that matches a variant's metal-colour option.
    tags: { type: [String], default: [] },
  },
  { _id: false },
)

const mediaSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, maxlength: 500, required: true },
    caption: { type: String, trim: true, maxlength: 200, default: "" },
    tags: { type: String, trim: true, maxlength: 40, default: "" },
    icon: { type: String, trim: true, maxlength: 200, default: "" },
  },
  { _id: true },
)

// A single specification row: "Diamond Weight" / "3.75" / "carat (ct)" + the
// green eye "show" toggle. Reused product-level (specGroupSchema) AND per
// variant (diamondProperties/metalProperties/...).
const specRowSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, required: true },
    value: { type: String, trim: true, default: "" },
    unit: { type: String, trim: true, default: "" },
    show: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true },
)

// "Add Specification Group" → diamond / pearl / gemstone / metal / custom.
const specGroupSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["diamond", "pearl", "gemstone", "metal", "custom"], required: true },
    displayName: { type: String, trim: true, default: "" },
    rows: { type: [specRowSchema], default: [] },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true },
)

const inventorySchema = new mongoose.Schema(
  {
    management: { type: String, enum: ["none", "system", "external"], default: "none" },
    available: { type: Number, default: 0 },
    minLimit: { type: Number, default: 1 },
    maxLimit: { type: Number, default: null },
    locationMode: { type: String, enum: ["default", "per_location"], default: "default" },
    dimension: {
      length: { type: Number, default: null },
      width: { type: Number, default: null },
      height: { type: Number, default: null },
    },
  },
  { _id: false },
)

const miscSchema = new mongoose.Schema(
  {
    barcode: { type: String, trim: true, default: null },
    isbn: { type: String, trim: true, default: null },
    hsn: { type: String, trim: true, default: null },
    sac: { type: String, trim: true, default: null },
    upc: { type: String, trim: true, default: null },
    gtin: { type: String, trim: true, default: null },
    mpn: { type: String, trim: true, default: null },
    uom: { type: String, trim: true, default: null }, // deprecated per screen; kept for import
    attributes: {
      type: [{ name: String, value: String, group: String }],
      default: [],
    },
    features: { type: [{ name: String, value: String }], default: [] },
    enableRfq: { type: Boolean, default: false },
    files: { type: [{ url: String, description: String, maxDownloads: Number }], default: [] },
    shippingCost: { type: Number, default: null },
    isCatalog: { type: Boolean, default: false }, // deprecated
    catalogOnly: { type: Boolean, default: false },
    countryOfOrigin: { type: String, trim: true, default: null },
    googleProductCategory: { type: String, trim: true, default: null },
    relatedProductIds: { type: [ObjectId], default: [] }, // ObjectId, not alias
    boughtTogetherIds: { type: [ObjectId], default: [] },
    googleShopping: {
      customLabel0: { type: String, trim: true, default: null },
      customLabel1: { type: String, trim: true, default: null },
      customLabel2: { type: String, trim: true, default: null },
      customLabel3: { type: String, trim: true, default: null },
      customLabel4: { type: String, trim: true, default: null },
    },
  },
  { _id: false },
)

// ---------------------------------------------------------------------------
// Option definition sub-schemas — a per-product COPY of the attached
// OptionSet's options[] (same shape as optionsets/optionSet.model.js). Stored
// on the product so the storefront + editor render every option and value
// (labels, image swatches, defaults) without loading the OptionSet doc, and so
// sellers can trim/add/reorder them per product. `image.url` is intentionally
// NOT required here (the source set may carry `{ url: "" }` placeholders).
const optionValueImageSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { _id: false },
)

const optionPriceDeltaSchema = new mongoose.Schema(
  {
    mode: { type: String, enum: ["amount", "percent"], default: "amount" },
    amount: { type: Number, default: 0 },
  },
  { _id: false },
)

const optionValueSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 200 },
    value: { type: String, trim: true, maxlength: 200 },
    image: { type: optionValueImageSchema },
    priceDelta: { type: optionPriceDeltaSchema },
    sortOrder: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
    // Per-VALUE substore scope (e.g. show "18K Gold" only in the UAE store).
    // EMPTY = shown in ALL substores (matches the product/option convention);
    // otherwise the value only appears in the listed substores.
    substoreIds: { type: [ObjectId], ref: "Substore", default: [] },
  },
  { _id: true }, // keep _id per value so the editor can address a row
)

const optionSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 120 },
    displayName: { type: String, trim: true, maxlength: 200, default: "" },
    type: {
      type: String,
      enum: ["dropdown", "image", "swatch", "radio", "checkbox", "text", "textarea", "number"],
      default: "dropdown",
    },
    values: { type: [optionValueSchema], default: [] },
    minCount: { type: Number, min: 0, default: 0 },
    maxCount: { type: Number, min: 0, default: 0 },
    required: { type: Boolean, default: false },
    defaultValue: { type: String, trim: true, maxlength: 200, default: null },
    sortOrder: { type: Number, default: 0 },
    showAlways: { type: Boolean, default: false },
    // Per-OPTION substore scope. EMPTY = this option (and its values) is shown
    // in ALL substores; otherwise the whole option only appears in the listed
    // substores. Individual values carry their own `substoreIds` for finer
    // scoping (e.g. option shown everywhere, one value only in the UAE store).
    substoreIds: { type: [ObjectId], ref: "Substore", default: [] },
  },
  { _id: true }, // keep _id per option so the editor can address a row
)

// ---------------------------------------------------------------------------
// Product schema
// ---------------------------------------------------------------------------

export const productSchema = new mongoose.Schema(
  {
    // ------------------------------------------------------------- identity
    name: { type: String, required: true, trim: true, maxlength: 240 },
    alias: { type: String, trim: true, lowercase: true, maxlength: 240 },
    description: { type: String, maxlength: 60000, default: null }, // sanitized HTML
    images: { type: [imageSchema], default: [] },

    // Always the tenant's single MAIN store — stamped server-side.
    parentStoreId: { type: ObjectId, ref: "Store", required: true, index: true },

    // ------------------------------------------------- RELATIONS (ObjectId!)
    // Resolved from legacy aliases at write/import time. NEVER store aliases.
    brandId: { type: ObjectId, ref: "Brand", default: null, index: true },
    collectionIds: { type: [ObjectId], ref: "Collection", default: [] },
    categoryIds: { type: [ObjectId], ref: "Category", default: [] }, // leaf categories
    // Empty = ALL substores (matches Category/Brand/Collection convention).
    // The "all" sentinel from the export maps to [] here — never a substore id.
    substoreIds: { type: [ObjectId], ref: "Substore", default: [] },
    // Denormalized ancestor union of categoryIds so storefront category pages
    // match a product placed on a leaf without re-walking the tree.
    categoryAncestorIds: { type: [ObjectId], default: [] },

    // -------------------------------------------------------------- pricing
    price: { type: Number, required: true, min: 0, index: true }, // default/base price
    comparePrice: { type: Number, min: 0, default: null },
    sku: { type: String, trim: true, maxlength: 120, default: null },
    tax: { type: String, trim: true, default: "default" },
    productTaxCode: { type: String, trim: true, maxlength: 40, default: null },
    weight: { type: Number, min: 0, default: null },
    weightUnit: { type: String, enum: ["gm", "kg", "ct", "oz", "lb"], default: "gm" },

    // -------------------------------------------------------------- display
    isPublished: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
    tag: { type: String, trim: true, default: null }, // free "Tag" field (General tab)
    tags: { type: [String], default: [] }, // Miscellaneous tags[]

    // --------------------------------------------------------- option set ref
    // See docs/products.md §7. The product REFERENCES the shared OptionSet by id
    // AND stores a full, product-level COPY of its options in `options[]` (same
    // shape as OptionSet.options — name / displayName / type / values[] with
    // labels + image swatches + defaults). This is the single source of truth
    // for the product's options; there is no separate version/snapshot field.
    // Sellers may trim / add / reorder these per product without mutating the
    // shared set. `optionSetId` records which set the copy came from.
    optionSetId: { type: ObjectId, ref: "OptionSet", default: null },
    options: { type: [optionSchema], default: [] },
    // Rollup of how many ProductVariant rows this product has, so the list +
    // Collections index never need to join the variants collection.
    variantCount: { type: Number, default: 0 },
    // Explicit list of every ProductVariant _id belonging to this product. The
    // variant docs still live in their own `productVariants` collection keyed
    // by productId — this array is a denormalized back-reference so the product
    // carries the id of each of its variants (100 variants => 100 ObjectIds).
    // Kept in sync (alongside variantCount) by productVariant.service.js
    // recomputeProductSurface after every variant mutation. Use `.populate
    // ("variants")` to hydrate the full variant docs when needed.
    variants: { type: [ObjectId], ref: "ProductVariant", default: [] },

    // --------------------------------------------------- embedded (non-variant)
    specifications: { type: [specGroupSchema], default: [] },
    // Definition-driven custom fields (the ms.products Metafields), stored
    // StoreHippo-style DIRECTLY on the product as a keyed object with native-
    // typed values, e.g. { ring_size: "6", check_budget: 1, gender:
    // ["male","female"], age_group: "infants" }. Keyed by the metafield `key`;
    // the value's type follows the field's dataType (multi-value widgets store
    // ARRAYS). Validated + coerced against the live definition on every
    // create/update in product.service.js (see buildProductMetafields). Mixed
    // because the key set is dynamic — the service calls markModified.
    metafields: { type: Mixed, default: () => ({}) },
    media: { type: [mediaSchema], default: [] },

    // ------------------------------------------------------- SEO / sitemap
    seo: {
      title: { type: String, trim: true, maxlength: 240, default: null },
      description: { type: String, trim: true, maxlength: 1000, default: null },
      keywords: { type: [String], default: [] },
      canonicalUrl: { type: String, trim: true, maxlength: 500, default: null },
    },
    sitemap: {
      priority: { type: Number, min: 0, max: 1, default: 0.5 },
      frequency: {
        type: String,
        enum: ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"],
        default: "daily",
      },
      disableForBots: { type: Boolean, default: false },
    },

    // ---------------------------------------------------------- inventory
    inventory: { type: inventorySchema, default: () => ({}) },

    // ------------------------------------------------------ miscellaneous
    misc: { type: miscSchema, default: () => ({}) },

    // ------------------------------------------------------------- seller
    sellerId: { type: ObjectId, default: null, index: true }, // already an id in the export
    approve: { type: String, enum: ["approved", "pending", "rejected"], default: "pending", index: true },

    // ------------------------------------------------------------- audit
    createdBy: { type: ObjectId, default: null },
    updatedBy: { type: ObjectId, default: null },

    // -------------------------------------------------------- soft delete
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: ObjectId, default: null },
  },
  { timestamps: true },
)

// ---------------------------------------------------------------------------
// Indexes — cover every admin tab + every Collections/Categories/Brands filter
// target so those modules never re-walk a product (docs/products.md §4.9).
// ---------------------------------------------------------------------------
productSchema.index({ parentStoreId: 1, isDeleted: 1, isPublished: 1, sortOrder: 1, name: 1 })
productSchema.index({ parentStoreId: 1, approve: 1, isDeleted: 1, updatedAt: -1 })
productSchema.index({ parentStoreId: 1, alias: 1 }, { unique: true, sparse: true })
productSchema.index({ parentStoreId: 1, isDeleted: 1, price: 1 })
productSchema.index({ parentStoreId: 1, isDeleted: 1, brandId: 1 })
productSchema.index({ parentStoreId: 1, isDeleted: 1, categoryIds: 1 })
productSchema.index({ parentStoreId: 1, isDeleted: 1, collectionIds: 1 })
productSchema.index({ parentStoreId: 1, isDeleted: 1, "options.name": 1, "options.values.value": 1 })
productSchema.index({ parentStoreId: 1, substoreIds: 1, isDeleted: 1 })
productSchema.index({ parentStoreId: 1, updatedAt: 1 })
productSchema.index({ parentStoreId: 1, sku: 1 }, { sparse: true })
// Metafield keys are dynamic, so a wildcard index keeps metafield filters
// (e.g. { "metafields.gender": "female" }) fast even at 100k+ products.
productSchema.index({ parentStoreId: 1, "metafields.$**": 1 })

// Slugify alias from name when blank (identical rule to brands/categories).
productSchema.pre("validate", function (next) {
  if (!this.alias && this.name) {
    this.alias = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 240)
  }
  next()
})

