import { z } from "zod"

// Only `name` + `price` are required on create — everything else is optional so
// the owner can save a bare product first and enrich it tab-by-tab (the six
// StoreHippo tabs all PATCH the same doc).
//
// RELATIONS accept EITHER resolved ObjectIds (the stored form) OR legacy alias
// strings; the service runs them through relation-resolver.js (docs §5) so the
// DB only ever holds ObjectIds. That is why brand/collections/categories/
// substore fields below allow strings that are not 24-hex.

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id")
const shortStr = (max) => z.string().trim().max(max)
// An alias OR an id — used by relation inputs before resolution.
const aliasOrId = z.string().trim().min(1).max(240)

// A single base64 image OR video data URL — decoded + written to disk
// server-side. Videos get a larger byte budget than images (~8 MB decoded,
// ~11 MB as a base64 string), which stays under the products body cap (12 MB).
const imageDataUrl = z
  .string()
  .regex(/^data:(image|video)\/[a-z0-9+.-]+;base64,/i, "Media must be a base64 data URL")
  .max(11 * 1024 * 1024)

const imageInput = z
  .object({
    url: shortStr(500).optional(),
    alt: shortStr(200).optional(),
    caption: shortStr(200).optional(),
    tags: z.array(shortStr(40)).max(20).optional(),
    dataUrl: imageDataUrl.optional(),
  })
  .strict()

const seo = z
  .object({
    title: shortStr(240).nullable().optional(),
    description: shortStr(1000).nullable().optional(),
    keywords: z.array(shortStr(60)).max(50).optional(),
    canonicalUrl: shortStr(500).nullable().optional(),
  })
  .strict()

const sitemap = z
  .object({
    priority: z.number().min(0).max(1).optional(),
    frequency: z.enum(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]).optional(),
    disableForBots: z.boolean().optional(),
  })
  .strict()

const specRow = z
  .object({
    label: z.string().trim().min(1).max(200),
    value: shortStr(2000).optional(),
    unit: shortStr(40).optional(),
    show: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  })
  .strict()

const specGroup = z
  .object({
    type: z.enum(["diamond", "pearl", "gemstone", "metal", "custom"]),
    displayName: shortStr(200).optional(),
    rows: z.array(specRow).max(100).optional(),
    sortOrder: z.number().int().optional(),
  })
  .strict()

const variantOption = z
  .object({ name: shortStr(120), value: shortStr(200) })
  .strict()

// Standalone ProductVariant body (own collection now). variantKey is derived
// server-side from options, so it is NOT accepted from the client.
const variantBody = z
  .object({
    price: z.number().min(0),
    comparePrice: z.number().min(0).nullable().optional(),
    sku: shortStr(120).nullable().optional(),
    barcode: shortStr(120).nullable().optional(),
    tag: shortStr(240).nullable().optional(),
    weight: z.number().min(0).nullable().optional(),
    weightUnit: z.enum(["gm", "kg", "ct", "oz", "lb"]).optional(),
    options: z.array(variantOption).max(20).optional(),
    available: z.number().int().optional(),
    inventoryManagement: z.enum(["none", "system", "external"]).optional(),
    allowOutOfStock: z.boolean().optional(),
    minLimit: z.number().min(0).nullable().optional(),
    maxLimit: z.number().min(0).nullable().optional(),
    image: shortStr(500).nullable().optional(),
    // The variant's own gallery — mix of saved { url } + fresh { dataUrl }
    // rows, decoded and written to uploads/variant/<variantId>/ server-side.
    images: z.array(imageInput).max(30).optional(),
    isDefault: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    seo: seo.optional(),
    sitemap: sitemap.optional(),
    diamondProperties: z.array(specRow).max(100).optional(),
    metalProperties: z.array(specRow).max(100).optional(),
    gemstoneProperties: z.array(specRow).max(100).optional(),
    pearlProperties: z.array(specRow).max(100).optional(),
  })
  .strict()

// Create requires a price; update is a partial (must have at least one field).
export const createVariantSchema = variantBody
export const updateVariantSchema = variantBody
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" })

// Per-product option DEFINITIONS (a copy of the attached set's options[], edited
// in the product's Options & Variants tab). Mirrors the OptionSet option/value
// shape so the full structure — labels, image swatches, defaults, order — is
// persisted verbatim onto the product's `options[]`. Kept permissive
// (passthrough + `image`/`priceDelta` as any) since it's a copy of a trusted
// set that may also carry `_id`s from the source rows.
const productOptionValue = z
  .object({
    _id: z.string().optional(),
    label: shortStr(200).optional(),
    value: shortStr(200).nullable().optional(),
    image: z.any().optional(),
    priceDelta: z.any().optional(),
    sortOrder: z.number().optional(),
    isDefault: z.boolean().optional(),
    // Per-value substore scope (empty = shown in all substores).
    substoreIds: z.array(objectId).max(200).optional(),
  })
  .passthrough()

const productOption = z
  .object({
    _id: z.string().optional(),
    name: shortStr(120).optional(),
    displayName: shortStr(200).optional(),
    type: z
      .enum(["dropdown", "image", "swatch", "radio", "checkbox", "text", "textarea", "number"])
      .optional(),
    values: z.array(productOptionValue).max(500).optional(),
    minCount: z.number().optional(),
    maxCount: z.number().optional(),
    required: z.boolean().optional(),
    defaultValue: shortStr(200).nullable().optional(),
    sortOrder: z.number().optional(),
    showAlways: z.boolean().optional(),
    // Per-option substore scope (empty = shown in all substores).
    substoreIds: z.array(objectId).max(200).optional(),
  })
  .passthrough()

const inventory = z
  .object({
    management: z.enum(["none", "system", "external"]).optional(),
    available: z.number().int().optional(),
    minLimit: z.number().int().min(0).optional(),
    maxLimit: z.number().int().min(0).nullable().optional(),
    locationMode: z.enum(["default", "per_location"]).optional(),
    dimension: z
      .object({
        length: z.number().min(0).nullable().optional(),
        width: z.number().min(0).nullable().optional(),
        height: z.number().min(0).nullable().optional(),
      })
      .strict()
      .optional(),
  })
  .strict()

const media = z
  .object({
    url: shortStr(500),
    caption: shortStr(200).optional(),
    tags: shortStr(40).optional(),
    icon: shortStr(200).optional(),
  })
  .strict()

const misc = z
  .object({
    barcode: shortStr(120).nullable().optional(),
    isbn: shortStr(120).nullable().optional(),
    hsn: shortStr(120).nullable().optional(),
    sac: shortStr(120).nullable().optional(),
    upc: shortStr(120).nullable().optional(),
    gtin: shortStr(120).nullable().optional(),
    mpn: shortStr(120).nullable().optional(),
    uom: shortStr(120).nullable().optional(),
    attributes: z
      .array(z.object({ name: shortStr(120), value: shortStr(500), group: shortStr(120).optional() }).strict())
      .max(200)
      .optional(),
    features: z.array(z.object({ name: shortStr(120), value: shortStr(500) }).strict()).max(200).optional(),
    enableRfq: z.boolean().optional(),
    files: z
      .array(
        z
          .object({ url: shortStr(500), description: shortStr(500).optional(), maxDownloads: z.number().int().optional() })
          .strict(),
      )
      .max(50)
      .optional(),
    shippingCost: z.number().min(0).nullable().optional(),
    isCatalog: z.boolean().optional(),
    catalogOnly: z.boolean().optional(),
    countryOfOrigin: shortStr(120).nullable().optional(),
    googleProductCategory: shortStr(240).nullable().optional(),
    relatedProductIds: z.array(objectId).max(200).optional(),
    boughtTogetherIds: z.array(objectId).max(200).optional(),
    googleShopping: z
      .object({
        customLabel0: shortStr(200).nullable().optional(),
        customLabel1: shortStr(200).nullable().optional(),
        customLabel2: shortStr(200).nullable().optional(),
        customLabel3: shortStr(200).nullable().optional(),
        customLabel4: shortStr(200).nullable().optional(),
      })
      .strict()
      .optional(),
  })
  .strict()

const productBody = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(240),
    alias: shortStr(240).optional(),
    description: z.string().max(60000).nullable().optional(),
    images: z.array(imageInput).max(30).optional(),

    // Relations — ids OR legacy aliases (resolver §5). `substore` accepts the
    // "all" sentinel too; the resolver collapses it to [] (all substores).
    brandId: z.union([objectId, z.null()]).optional(),
    brand: z.union([aliasOrId, z.null()]).optional(),
    collectionIds: z.array(objectId).max(200).optional(),
    collections: z.array(aliasOrId).max(200).optional(),
    categoryIds: z.array(objectId).max(200).optional(),
    categories: z.array(aliasOrId).max(200).optional(),
    substoreIds: z.array(objectId).max(200).optional(),
    substore: z.array(aliasOrId).max(200).optional(),

    price: z.number().min(0),
    comparePrice: z.number().min(0).nullable().optional(),
    sku: shortStr(120).nullable().optional(),
    tax: shortStr(80).optional(),
    productTaxCode: shortStr(40).nullable().optional(),
    weight: z.number().min(0).nullable().optional(),
    weightUnit: z.enum(["gm", "kg", "ct", "oz", "lb"]).optional(),

    isPublished: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    tag: shortStr(200).nullable().optional(),
    tags: z.array(shortStr(80)).max(100).optional(),

    optionSetId: z.union([objectId, z.null()]).optional(),
    optionSet: z.union([objectId, z.null()]).optional(), // export alias for optionSetId (already an id)
    // Full option DEFINITIONS copied from the set (and optionally edited per
    // product) — persisted verbatim onto the product's options[].
    options: z.array(productOption).max(50).optional(),

    specifications: z.array(specGroup).max(50).optional(),
    // StoreHippo-style keyed metafield object: { <key>: <native value> }. The
    // per-field type/rule check happens in the service against the live
    // ms.products definition, so accept any value shape here (string, number,
    // boolean, or array for multi-value widgets).
    metafields: z.record(z.string().max(80), z.any()).optional(),
    media: z.array(media).max(50).optional(),

    seo: seo.optional(),
    sitemap: sitemap.optional(),
    inventory: inventory.optional(),
    misc: misc.optional(),

    sellerId: z.union([objectId, z.null()]).optional(),
    seller: z.union([objectId, z.null()]).optional(), // export alias for sellerId (already an id)
    approve: z.enum(["approved", "pending", "rejected"]).optional(),
  })
  .strict()

export const createProductSchema = productBody

export const updateProductSchema = productBody
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" })

// Attach / replace the option set on a product (POST /:id/attach-option-set).
export const attachOptionSetSchema = z.object({ optionSetId: objectId }).strict()

// Cartesian variant generation input (POST /:id/variants/generate).
export const generateVariantsSchema = z
  .object({
    // name -> allowed values, e.g. { "Metal Type": ["10K","14K"], "Carat Weight": ["0.50"] }
    matrix: z.record(z.string().trim().min(1).max(120), z.array(shortStr(200)).min(1).max(100)),
    basePrice: z.number().min(0).optional(),
    // Hard cap to guard against runaway combination counts.
    maxCombos: z.number().int().min(1).max(5000).optional(),
  })
  .strict()

// Bulk import of legacy export rows (POST /import).
export const importProductsSchema = z
  .object({
    products: z.array(z.record(z.string(), z.any())).min(1).max(2000),
    // Upsert by alias when true (re-runnable import); otherwise insert only.
    upsert: z.boolean().optional(),
  })
  .strict()

// Lean picker feed (GET /options) — for Related Products / Bought Together.
export const listProductOptionsQuerySchema = z
  .object({
    q: z.string().trim().max(240).optional(),
    page: z.coerce.number().int().min(1).max(10000).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    ids: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined))
      .refine((arr) => !arr || arr.every((id) => /^[a-f0-9]{24}$/i.test(id)), { message: "Invalid id" }),
  })
  .strict()

// Global "Product Variants" page query — every variant across all products,
// latest first, searchable by product name / sku / variant option value.
export const listAllVariantsQuerySchema = z
  .object({
    q: z.string().trim().max(240).optional(),
    productId: objectId.optional(),
    sort: z
      .enum(["createdAt", "-createdAt", "updatedAt", "-updatedAt", "price", "-price"])
      .optional(),
    page: z.coerce.number().int().min(1).max(100000).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .strict()

// List query — tabs (published/unpublished/pending/rejected), search, sort, trash.
export const listProductsQuerySchema = z
  .object({
    tab: z.enum(["published", "unpublished", "pending", "rejected", "all"]).optional(),
    q: z.string().trim().max(240).optional(),
    deleted: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    // Filter by a resolved relation id (used by category/brand/collection drilldowns).
    brandId: objectId.optional(),
    categoryId: objectId.optional(),
    collectionId: objectId.optional(),
    sort: z
      .enum(["sortOrder", "-sortOrder", "name", "-name", "price", "-price", "createdAt", "-createdAt", "updatedAt", "-updatedAt"])
      .optional(),
    page: z.coerce.number().int().min(1).max(100000).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .strict()
