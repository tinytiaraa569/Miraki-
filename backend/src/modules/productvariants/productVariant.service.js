import mongoose from "mongoose"
import { getTenantModels } from "../../config/tenantDb.js"
import { ApiError } from "../../utils/apiError.js"
import { deleteVariantImage, saveVariantImage } from "../../utils/uploads.js"
import { audit } from "../audit/audit.service.js"
import { buildVariantKey, generateVariants } from "./variant-generator.js"

// Variants live in their OWN `productVariants` collection referenced by
// productId (see productVariant.model.js). This service owns every variant
// mutation and, after each one, recomputes the parent product's derived
// options[] surface + variantCount rollup (recomputeProductSurface) — the job
// the old product pre("save") hook used to do. Everything is scoped by
// parentStoreId (the tenant's single main store) AND productId so a variant can
// never leak across products or tenants.

const oid = (v) => new mongoose.Types.ObjectId(String(v))

// Fields a client may set on a single-variant create/update. Ownership/identity
// (productId, parentStoreId, variantKey) is always derived server-side.
const VARIANT_FIELDS = [
  "price",
  "comparePrice",
  "sku",
  "barcode",
  "tag",
  "weight",
  "weightUnit",
  "options",
  "available",
  "inventoryManagement",
  "allowOutOfStock",
  "minLimit",
  "maxLimit",
  "image",
  "isDefault",
  "sortOrder",
  "seo",
  "sitemap",
  "diamondProperties",
  "metalProperties",
  "gemstoneProperties",
  "pearlProperties",
]

// Turn incoming variant image rows (mix of saved { url } + fresh { dataUrl })
// into the persisted shape: fresh data URLs are decoded + written to disk under
// uploads/variant/<variantId>/ and replaced with their returned { url }; saved
// rows are kept as-is. Mirrors product.service.js persistImages.
async function persistVariantImages({ productId, variantId, images }) {
  const out = []
  for (const img of images ?? []) {
    if (img.dataUrl) {
      const url = await saveVariantImage({ productId, variantId, dataUrl: img.dataUrl })
      out.push({ url, alt: img.alt ?? "", caption: img.caption ?? "", tags: img.tags ?? [] })
    } else if (img.url) {
      out.push({ url: img.url, alt: img.alt ?? "", caption: img.caption ?? "", tags: img.tags ?? [] })
    }
  }
  return out
}

// Only one variant per product may be the default. When a row is flagged
// isDefault, clear the flag on every OTHER variant of the same product.
async function clearOtherDefaults({ ProductVariant, parentStoreId, productId, keepId }) {
  await ProductVariant.updateMany(
    { parentStoreId, productId, _id: { $ne: keepId }, isDefault: true },
    { $set: { isDefault: false } },
  )
}

// Rebuild the product's variantCount + variants[] back-reference from its
// variant rows. Called after every mutation. Accepts already-resolved models so
// callers that already opened the tenant db don't reopen it.
// NOTE: the product's options[] is the copied option DEFINITION (set on
// attach/edit in product.service.js), NOT derived from variants — so this
// function intentionally leaves options[] untouched.
export async function recomputeProductSurface({ Product, ProductVariant, parentStoreId, productId }) {
  const variants = await ProductVariant.find({ parentStoreId, productId })
    .select({ _id: 1, sortOrder: 1 })
    .sort({ sortOrder: 1, _id: 1 })
    .lean()

  const variantRefs = variants.map((v) => v._id)

  await Product.updateOne(
    { _id: productId, parentStoreId },
    { $set: { variantCount: variants.length, variants: variantRefs } },
  )
  return { variantCount: variants.length, variants: variantRefs }
}

// Ensure the product exists in this tenant/store and return it (lean).
async function assertProduct(Product, parentStoreId, id) {
  const doc = await Product.findOne({ _id: id, parentStoreId }).select({ _id: 1, price: 1 }).lean()
  if (!doc) throw new ApiError(404, "Product not found")
  return doc
}

// LIST a product's variants (Product variants page + product read).
export async function listProductVariants({ seller, tenantDbName, id }) {
  const { Product, ProductVariant } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)
  await assertProduct(Product, parentStoreId, id)

  const rows = await ProductVariant.find({ parentStoreId, productId: oid(id) })
    .sort({ sortOrder: 1, _id: 1 })
    .lean()
  return { rows, total: rows.length }
}

// GLOBAL list for the dedicated "Product Variants" admin page. Unlike
// listProductVariants (one product), this returns EVERY variant across all of
// the tenant's products, newest first, via an aggregation pipeline that joins
// the parent product for its name / sku / first image so each row shows which
// product it belongs to. Scoped by parentStoreId so it can never cross tenants.
export async function listAllVariants({ seller, tenantDbName, query }) {
  const { ProductVariant } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const skip = (page - 1) * limit

  const sortKey = query.sort ?? "-createdAt"
  const dir = sortKey.startsWith("-") ? -1 : 1
  const field = sortKey.replace(/^-/, "")
  const sortStage = { [field]: dir, _id: dir }

  const match = { parentStoreId }
  if (query.productId) match.productId = oid(query.productId)

  const pipeline = [
    { $match: match },
    { $sort: sortStage },
    // Join the owning product for display context (name / sku / thumbnail).
    {
      $lookup: {
        from: "products",
        let: { pid: "$productId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$pid"] } } },
          { $project: { name: 1, sku: 1, thumbnail: { $first: "$images.url" } } },
        ],
        as: "product",
      },
    },
    { $addFields: { product: { $first: "$product" } } },
  ]

  // Optional search across product name/sku and the variant's own sku +
  // selected option values. Runs AFTER the lookup so product fields are visible.
  if (query.q?.trim()) {
    const rx = new RegExp(query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
    pipeline.push({
      $match: {
        $or: [
          { "product.name": rx },
          { "product.sku": rx },
          { sku: rx },
          { "options.value": rx },
        ],
      },
    })
  }

  pipeline.push({
    $facet: {
      rows: [
        { $skip: skip },
        { $limit: limit },
        {
          $project: {
            productId: 1,
            price: 1,
            comparePrice: 1,
            sku: 1,
            options: 1,
            variantKey: 1,
            available: 1,
            inventoryManagement: 1,
            image: 1,
            images: 1,
            isDefault: 1,
            sortOrder: 1,
            createdAt: 1,
            updatedAt: 1,
            productName: "$product.name",
            productSku: "$product.sku",
            productThumbnail: "$product.thumbnail",
          },
        },
      ],
      total: [{ $count: "count" }],
    },
  })

  const [agg] = await ProductVariant.aggregate(pipeline)
  const rows = agg?.rows ?? []
  const total = agg?.total?.[0]?.count ?? 0

  return { rows, total, page, limit, pageCount: Math.max(1, Math.ceil(total / limit)) }
}

// CARTESIAN generation (POST /:id/variants/generate). Diffs into the
// productVariants collection by variantKey: keeps edited prices/skus for
// surviving combos, inserts new ones, deletes combos no longer present.
export async function generateProductVariants({ seller, tenantDbName, user, id, matrix, basePrice, maxCombos, req }) {
  const { Product, ProductVariant } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)
  const product = await assertProduct(Product, parentStoreId, id)
  const productId = oid(id)

  const existing = await ProductVariant.find({ parentStoreId, productId }).lean()

  // Defensive guard (StoreHippo semantics): "Show always" options are
  // storefront-only add-ons and must NEVER be baked into product-level
  // variants. Drop any matrix key whose product option is flagged showAlways —
  // even if a stale or hand-crafted matrix was posted — so the rule holds
  // server-side regardless of the client. assertProduct only selects _id/price,
  // so fetch the option definitions here.
  const optionDoc = await Product.findOne({ _id: productId, parentStoreId })
    .select({ options: 1 })
    .lean()
  const showAlwaysNames = new Set(
    (optionDoc?.options ?? []).filter((o) => o?.showAlways).map((o) => o.name),
  )
  const cleanMatrix = Object.fromEntries(
    Object.entries(matrix ?? {}).filter(([name]) => !showAlwaysNames.has(name)),
  )

  // Pure generator merges edited values for surviving keys and returns plain
  // objects (each with a deterministic variantKey).
  const desired = generateVariants({
    matrix: cleanMatrix,
    basePrice: basePrice ?? product.price ?? 0,
    maxCombos: maxCombos ?? 1000,
    existing,
  })

  const desiredKeys = new Set(desired.map((v) => v.variantKey))
  const staleKeys = existing.map((v) => v.variantKey).filter((k) => !desiredKeys.has(k))

  const ops = desired.map((v, i) => {
    const { _id, productId: _p, parentStoreId: _s, createdAt, updatedAt, ...fields } = v
    return {
      updateOne: {
        filter: { parentStoreId, productId, variantKey: v.variantKey },
        update: {
          $set: { ...fields, sortOrder: v.sortOrder ?? i, parentStoreId, productId },
        },
        upsert: true,
      },
    }
  })
  if (staleKeys.length) {
    ops.push({ deleteMany: { filter: { parentStoreId, productId, variantKey: { $in: staleKeys } } } })
  }
  if (ops.length) await ProductVariant.bulkWrite(ops, { ordered: false })

  const surface = await recomputeProductSurface({ Product, ProductVariant, parentStoreId, productId })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.product.variantsGenerated",
    targetType: "Product",
    targetId: productId,
    after: { variantCount: surface.variantCount },
  })

  return listProductVariants({ seller, tenantDbName, id })
}

// CREATE a single variant (POST /:id/variants).
export async function createVariant({ seller, tenantDbName, user, id, body, req }) {
  const { Product, ProductVariant } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)
  await assertProduct(Product, parentStoreId, id)
  const productId = oid(id)

  const fields = {}
  for (const k of VARIANT_FIELDS) if (body[k] !== undefined) fields[k] = body[k]
  const variantKey = buildVariantKey(fields.options)

  const clash = await ProductVariant.findOne({ parentStoreId, productId, variantKey }).select("_id").lean()
  if (clash) throw new ApiError(409, "A variant with this option combination already exists")

  // Create first so the row has an _id — variant images are written to
  // uploads/variant/<variantId>/, so they need the id before they can persist.
  const doc = await ProductVariant.create({ ...fields, variantKey, productId, parentStoreId })
  if (body.images !== undefined) {
    doc.images = await persistVariantImages({ productId, variantId: doc._id, images: body.images })
    await doc.save()
  }
  if (doc.isDefault) {
    await clearOtherDefaults({ ProductVariant, parentStoreId, productId, keepId: doc._id })
  }
  await recomputeProductSurface({ Product, ProductVariant, parentStoreId, productId })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.product.variantCreated",
    targetType: "ProductVariant",
    targetId: doc._id,
    after: { productId: String(productId), variantKey },
  })

  return doc.toObject()
}

// UPDATE a single variant (PATCH /:id/variants/:variantId).
export async function updateVariant({ seller, tenantDbName, user, id, variantId, body, req }) {
  const { Product, ProductVariant } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)
  const productId = oid(id)

  const doc = await ProductVariant.findOne({ _id: variantId, parentStoreId, productId })
  if (!doc) throw new ApiError(404, "Variant not found")

  for (const k of VARIANT_FIELDS) if (body[k] !== undefined) doc[k] = body[k]
  if (body.options !== undefined) {
    const variantKey = buildVariantKey(body.options)
    if (variantKey !== doc.variantKey) {
      const clash = await ProductVariant.findOne({
        parentStoreId,
        productId,
        variantKey,
        _id: { $ne: doc._id },
      })
        .select("_id")
        .lean()
      if (clash) throw new ApiError(409, "A variant with this option combination already exists")
      doc.variantKey = variantKey
    }
  }

  // Reconcile the gallery: delete files that were dropped, then persist the new
  // set (fresh data URLs -> uploads/variant/<variantId>/, saved URLs kept).
  if (body.images !== undefined) {
    const keptUrls = new Set((body.images ?? []).filter((i) => i.url).map((i) => i.url))
    for (const old of doc.images ?? []) {
      if (old?.url && !keptUrls.has(old.url)) {
        await deleteVariantImage({ productId, variantId: doc._id, publicUrl: old.url })
      }
    }
    doc.images = await persistVariantImages({ productId, variantId: doc._id, images: body.images })
  }

  await doc.save()
  if (doc.isDefault) {
    await clearOtherDefaults({ ProductVariant, parentStoreId, productId, keepId: doc._id })
  }
  await recomputeProductSurface({ Product, ProductVariant, parentStoreId, productId })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.product.variantUpdated",
    targetType: "ProductVariant",
    targetId: doc._id,
    after: { productId: String(productId), variantKey: doc.variantKey },
  })

  return doc.toObject()
}

// DELETE a single variant (DELETE /:id/variants/:variantId).
export async function deleteVariant({ seller, tenantDbName, user, id, variantId, req }) {
  const { Product, ProductVariant } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)
  const productId = oid(id)

  const doc = await ProductVariant.findOne({ _id: variantId, parentStoreId, productId })
  if (!doc) throw new ApiError(404, "Variant not found")

  // Best-effort cleanup of this variant's uploaded gallery files.
  for (const img of doc.images ?? []) {
    if (img?.url) await deleteVariantImage({ productId, variantId: doc._id, publicUrl: img.url })
  }

  await ProductVariant.deleteOne({ _id: doc._id, parentStoreId, productId })
  const surface = await recomputeProductSurface({ Product, ProductVariant, parentStoreId, productId })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.product.variantDeleted",
    targetType: "ProductVariant",
    targetId: doc._id,
    before: { productId: String(productId), variantKey: doc.variantKey },
  })

  return { ok: true, id: doc._id, variantCount: surface.variantCount }
}

// Hard-delete every variant of a product — used by product permanent-delete.
export async function deleteVariantsForProduct({ ProductVariant, parentStoreId, productId }) {
  const res = await ProductVariant.deleteMany({ parentStoreId, productId })
  return res.deletedCount ?? 0
}

// Copy a source product's variants onto a new productId — used by product
// duplicate. Returns the number of variants copied.
export async function duplicateVariantsForProduct({ ProductVariant, parentStoreId, fromId, toId }) {
  const src = await ProductVariant.find({ parentStoreId, productId: fromId }).lean()
  if (!src.length) return 0
  const clones = src.map(({ _id, createdAt, updatedAt, ...v }) => ({
    ...v,
    productId: toId,
    parentStoreId,
  }))
  await ProductVariant.insertMany(clones, { ordered: false })
  return clones.length
}

// Seed variants from a legacy `variants2[]` import row onto a product, then
// recompute its surface. Skips rows without a price.
export async function importVariantsForProduct({ ProductVariant, Product, parentStoreId, productId, variants }) {
  const rows = Array.isArray(variants) ? variants : []
  const docs = []
  const seen = new Set()
  for (const raw of rows) {
    const price = Number(raw?.price)
    if (!Number.isFinite(price)) continue
    const options = Array.isArray(raw.options) ? raw.options : []
    const variantKey = raw.variantKey || buildVariantKey(options)
    if (seen.has(variantKey)) continue // dedupe within a single import row
    seen.add(variantKey)
    docs.push({
      productId,
      parentStoreId,
      price,
      comparePrice: raw.comparePrice != null ? Number(raw.comparePrice) : null,
      sku: raw.sku ?? null,
      options,
      variantKey,
      available: Number(raw.available) || 0,
      inventoryManagement: raw.inventoryManagement ?? "none",
      image: raw.image ?? null,
      diamondProperties: raw.diamondProperties ?? [],
      metalProperties: raw.metalProperties ?? [],
      gemstoneProperties: raw.gemstoneProperties ?? [],
      pearlProperties: raw.pearlProperties ?? [],
    })
  }
  if (docs.length) await ProductVariant.insertMany(docs, { ordered: false })
  await recomputeProductSurface({ Product, ProductVariant, parentStoreId, productId })
  return docs.length
}
