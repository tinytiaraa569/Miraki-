import mongoose from "mongoose"

// TENANT-DB SCHEMA: a product's variants now live in their OWN collection
// (`productVariants`) referenced by `productId` — no longer embedded in the
// product doc. This mirrors the dedicated "Product variants" admin page and
// keeps a product read small: the product carries only a derived `options[]`
// surface + a `variantCount` rollup (recomputed by productVariant.service.js),
// while the full variant rows are fetched on demand.
//
// Every row is ALSO stamped with `parentStoreId` (the tenant's single main
// store) so a variant query can never cross products or tenants, matching the
// scoping rule every other module in this tenant db follows.

const { ObjectId } = mongoose.Schema.Types

// A selected option pair on a variant: "Metal Type" -> "18K". This file OWNS
// its sub-schemas (a small, intentional duplication of the product's shapes) so
// the two models stay independent.
const variantOptionSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    value: { type: String, trim: true },
  },
  { _id: false },
)

// A variant's OWN image/media gallery. Local copy of the product's imageSchema
// shape (see product.model.js). Files are stored per-variant on disk at
// uploads/variant/<variantId>/... and only the returned URL is persisted here.
const variantImageSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, maxlength: 500 },
    alt: { type: String, trim: true, maxlength: 200, default: "" },
    caption: { type: String, trim: true, maxlength: 200, default: "" },
    tags: { type: [String], default: [] },
  },
  { _id: false },
)

// A single specification row for a variant: "Diamond Weight" / "3.75" /
// "carat (ct)" + the green eye "show" toggle. Local copy of the product's
// spec-row shape (see product.model.js specRowSchema).
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

export const productVariantSchema = new mongoose.Schema(
  {
    // ------------------------------------------------------------- ownership
    productId: { type: ObjectId, ref: "Product", required: true, index: true },
    // Tenant safety — the single main store; a variant can never leak across
    // products/tenants.
    parentStoreId: { type: ObjectId, ref: "Store", required: true, index: true },

    // --------------------------------------------------------------- pricing
    price: { type: Number, min: 0, required: true },
    comparePrice: { type: Number, min: 0, default: null },
    sku: { type: String, trim: true, maxlength: 120 },
    barcode: { type: String, trim: true, maxlength: 120, default: null },
    // Free-form tag field (mirrors the product's General-tab "Tag").
    tag: { type: String, trim: true, maxlength: 240, default: null },
    // Shipping weight for this specific variant.
    weight: { type: Number, min: 0, default: null },
    weightUnit: { type: String, enum: ["gm", "kg", "ct", "oz", "lb"], default: "gm" },

    // --------------------------------------------------------------- options
    options: { type: [variantOptionSchema], default: [] },
    // Deterministic key built from option VALUES in a stable order, e.g.
    // "10K|0.50". Used for diff-on-regenerate (never clobber edited rows).
    variantKey: { type: String, trim: true },

    // ------------------------------------------------------------- inventory
    available: { type: Number, default: 0 },
    inventoryManagement: { type: String, enum: ["none", "system", "external"], default: "none" },
    // Let this variant be ordered even when out of stock.
    allowOutOfStock: { type: Boolean, default: false },
    // Per-order purchase limits for this variant.
    minLimit: { type: Number, min: 0, default: null },
    maxLimit: { type: Number, min: 0, default: null },

    // --------------------------------------------------------------- display
    // Legacy single-image path (kept for back-compat with existing rows).
    image: { type: String, trim: true, default: null },
    // The variant's OWN gallery (uploads/variant/<variantId>/...).
    images: { type: [variantImageSchema], default: [] },
    // Marks the variant selected by default on the storefront. Only one per
    // product should be true (enforced in productVariant.service.js).
    isDefault: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },

    // --------------------------------------------------------- SEO / sitemap
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
      // "No Index" toggle on the SEO screen.
      disableForBots: { type: Boolean, default: false },
    },

    // ------------------------------------------------------- specifications
    diamondProperties: { type: [specRowSchema], default: [] },
    metalProperties: { type: [specRowSchema], default: [] },
    gemstoneProperties: { type: [specRowSchema], default: [] },
    pearlProperties: { type: [specRowSchema], default: [] },
  },
  { timestamps: true },
)

// List a product's variants in order (Product variants page + product read).
productVariantSchema.index({ parentStoreId: 1, productId: 1, sortOrder: 1 })
// Diff-on-regenerate + guard against duplicate combinations per product.
productVariantSchema.index({ parentStoreId: 1, productId: 1, variantKey: 1 }, { unique: true })
productVariantSchema.index({ parentStoreId: 1, sku: 1 }, { sparse: true })
