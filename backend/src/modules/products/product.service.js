import mongoose from "mongoose"
import { getTenantModels } from "../../config/tenantDb.js"
import { ApiError } from "../../utils/apiError.js"
import { deleteMetafieldDir, deleteProductImage, saveProductImage } from "../../utils/uploads.js"
import { audit } from "../audit/audit.service.js"
import { persistMetafieldImages } from "../metafields/metafieldValue.uploads.js"
import { validateValuesAgainstDefinition } from "../metafields/metafieldValue.validation.js"
import {
  deleteVariantsForProduct,
  duplicateVariantsForProduct,
  importVariantsForProduct,
} from "../productvariants/productVariant.service.js"
import { resolveRelations } from "./relation-resolver.js"

// The stored module binding for product metafields (matches the frontend's
// normalizeModule("products") -> "ms.products"). Definition-driven values are
// stored StoreHippo-style DIRECTLY on the product doc (`product.metafields`),
// validated + coerced against this module's live definition on every save.
const PRODUCT_METAFIELD_MODULE = "ms.products"

// Entity folder name used to scope this module's uploads (matches
// utils/uploads.js saveProductImage -> /uploads/product/<id>/...). Metafield
// images are nested under the same root so they are cleaned up together.
const PRODUCT_UPLOAD_OWNER = "product"

// Validate + coerce an incoming keyed metafield object against the live
// ms.products definition and return the clean, native-typed object to embed on
// the product (StoreHippo-style). STRICT behaviour ("check properly"): a value
// that fails validation BLOCKS the whole product save with a 422 listing every
// offending field — the product is never persisted with half-valid metafields.
// Return values:
//   • `undefined`  — caller did not send `metafields` (leave the stored copy
//                    untouched on update; omit on create).
//   • `{}`         — no definition exists for the module yet, so there is
//                    nothing to validate against; store an empty object.
//   • cleaned obj  — validation passed; the coerced object to embed.
// Returns { metafields, fields }:
//   • metafields — `undefined` (not sent), `{}` (no definition), or cleaned obj
//   • fields     — the live definition's fields[] (or null), needed to persist
//                  any nested base64 metafield images to disk after save.
async function buildProductMetafields({ MetafieldDefinition, parentStoreId, input }) {
  if (input === undefined) return { metafields: undefined, fields: null }
  const def = await MetafieldDefinition.findOne({
    parentStoreId,
    module: PRODUCT_METAFIELD_MODULE,
    deletedAt: null,
  }).lean()
  if (!def) return { metafields: {}, fields: null }

  const { ok, data, errors } = validateValuesAgainstDefinition(def.fields, input ?? {})
  if (!ok) {
    const detail = (errors ?? []).map((e) => `${e.path} ${e.message}`).join("; ")
    throw new ApiError(422, detail ? `Metafield validation failed: ${detail}` : "Metafield validation failed")
  }
  return { metafields: data ?? {}, fields: def.fields }
}

// All functions run AFTER loadUser: seller + tenantDbName are trusted and the
// route gate already restricted access to SELLER_SUPERADMIN. Every query is
// scoped by parentStoreId (the tenant's single main store) so one seller can
// never read or mutate another's products. Products are the central catalog
// entity: relations to Brands/Collections/Categories/Substores are stored as
// ObjectIds (resolved from aliases via relation-resolver.js) and the Option Set
// is referenced by id + snapshot (never re-modelled here).

const oid = (v) => new mongoose.Types.ObjectId(String(v))

const SORTS = {
  sortOrder: { sortOrder: 1, name: 1 },
  "-sortOrder": { sortOrder: -1, name: -1 },
  name: { name: 1 },
  "-name": { name: -1 },
  price: { price: 1, name: 1 },
  "-price": { price: -1, name: -1 },
  createdAt: { createdAt: 1 },
  "-createdAt": { createdAt: -1 },
  updatedAt: { updatedAt: 1 },
  "-updatedAt": { updatedAt: -1 },
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// Columns the list renders — lean, never the full nested payload. We keep only
// each image's `url` (projected below) so the row can power a lightweight image
// gallery; `thumbnail` (first url) + `imageCount` are derived in JS so the wire
// payload stays small while still carrying every image path.
const LIST_SELECT = {
  name: 1,
  alias: 1,
  price: 1,
  comparePrice: 1,
  sku: 1,
  isPublished: 1,
  approve: 1,
  variantCount: 1,
  sellerId: 1,
  brandId: 1,
  sortOrder: 1,
  isDeleted: 1,
  deletedAt: 1,
  createdAt: 1,
  updatedAt: 1,
  "images.url": 1,
}

// ---------------------------------------------------------------------------
// LIST — paginated, tab-filtered (Published / Unpublished / Pending Approval /
// Rejected), searchable, sortable. Rows + total run as TWO parallel index-
// backed queries (find + countDocuments) rather than a $facet, so the default
// tab list rides { parentStoreId, isDeleted, isPublished, sortOrder, name }
// end-to-end (stages inside $facet can't use indexes).
// ---------------------------------------------------------------------------
export async function listProducts({ seller, tenantDbName, query }) {
  const { Product } = getTenantModels(tenantDbName)

  const match = {
    parentStoreId: oid(seller.mainStoreId),
    deletedAt: query.deleted ? { $ne: null } : null,
  }

  const searching = Boolean(query.q?.trim())
  if (searching) {
    const rx = { $regex: escapeRegex(query.q.trim()), $options: "i" }
    match.$or = [{ name: rx }, { alias: rx }, { sku: rx }]
  } else {
    // Tabs are mutually exclusive with search (search spans all tabs).
    if (query.tab === "published") match.isPublished = true
    else if (query.tab === "unpublished") match.isPublished = false
    else if (query.tab === "pending") match.approve = "pending"
    else if (query.tab === "rejected") match.approve = "rejected"
  }

  // Relation drilldowns (category page / brand page / collection page).
  if (query.brandId) match.brandId = oid(query.brandId)
  if (query.categoryId) match.categoryIds = oid(query.categoryId)
  if (query.collectionId) match.collectionIds = oid(query.collectionId)

  const page = query.page ?? 1
  const limit = query.limit ?? 50

  const [rows, total] = await Promise.all([
    Product.aggregate([
      { $match: match },
      { $sort: SORTS[query.sort ?? "sortOrder"] },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $project: LIST_SELECT },
    ]),
    Product.countDocuments(match),
  ])

  return {
    rows: rows.map(({ images, ...r }) => {
      const urls = (images ?? []).map((img) => img?.url).filter(Boolean)
      return {
        ...r,
        thumbnail: urls[0] ?? null,
        images: urls,
        imageCount: urls.length,
      }
    }),
    total,
    page,
    limit,
    pageCount: Math.max(1, Math.ceil(total / limit)),
  }
}

// ---------------------------------------------------------------------------
// OPTIONS — ultra-lean picker feed for Related Products / Bought Together.
// ---------------------------------------------------------------------------
export async function listProductOptions({ seller, tenantDbName, query }) {
  const { Product } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  if (query.ids?.length) {
    const rows = await Product.find({ parentStoreId, _id: { $in: query.ids.map(oid) } })
      .select({ _id: 1, name: 1, alias: 1, price: 1 })
      .sort({ name: 1 })
      .lean()
    return { rows, total: rows.length, page: 1, limit: rows.length }
  }

  const page = query.page ?? 1
  const limit = query.limit ?? 10
  const match = { parentStoreId, deletedAt: null }
  if (query.q) {
    const rx = { $regex: escapeRegex(query.q), $options: "i" }
    match.$or = [{ name: rx }, { alias: rx }, { sku: rx }]
  }

  const [rows, total] = await Promise.all([
    Product.find(match)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select({ _id: 1, name: 1, alias: 1, price: 1 })
      .lean(),
    Product.countDocuments(match),
  ])

  return { rows, total, page, limit }
}

// Full detail for the 6-tab editor. Metafield values live directly on the
// product doc (`product.metafields`), so a plain scoped read returns them — no
// join needed.
export async function getProduct({ seller, tenantDbName, id }) {
  const { Product } = getTenantModels(tenantDbName)
  const doc = await Product.findOne({ _id: oid(id), parentStoreId: oid(seller.mainStoreId) }).lean()
  if (!doc) throw new ApiError(404, "Product not found")
  return doc
}

async function assertAliasFree(Product, parentStoreId, alias, exceptId) {
  if (!alias) return
  const clash = await Product.findOne({
    parentStoreId,
    alias,
    deletedAt: null,
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  }).collation({ locale: "en", strength: 2 })
  if (clash) throw new ApiError(409, "A product with this alias already exists")
}

// Turn incoming image rows (mix of saved { url } + fresh { dataUrl }) into the
// stored [{ url, alt, caption, tags }] shape, writing base64 payloads to disk.
async function persistImages({ productId, images }) {
  const out = []
  for (const img of images ?? []) {
    if (img.dataUrl) {
      const url = await saveProductImage({ productId, dataUrl: img.dataUrl })
      out.push({ url, alt: img.alt ?? "", caption: img.caption ?? "", tags: img.tags ?? [] })
    } else if (img.url) {
      out.push({ url: img.url, alt: img.alt ?? "", caption: img.caption ?? "", tags: img.tags ?? [] })
    }
  }
  return out
}

// Pull the relation inputs out of a body and resolve them to ObjectIds. Returns
// { resolved, rest } where `rest` has NO relation keys (they were consumed).
async function resolveBodyRelations({ tenantDbName, parentStoreId, body }) {
  const relationKeys = [
    "brandId",
    "brand",
    "collectionIds",
    "collections",
    "categoryIds",
    "categories",
    "substoreIds",
    "substore",
    "optionSetId",
    "optionSet",
    "sellerId",
    "seller",
  ]
  const raw = {}
  const rest = {}
  for (const [k, v] of Object.entries(body)) {
    if (relationKeys.includes(k)) raw[k] = v
    else rest[k] = v
  }
  const resolved = Object.keys(raw).length
    ? await resolveRelations({ tenantDbName, parentStoreId, raw })
    : { warnings: [] }
  return { resolved, rest }
}

// Keep only valid ObjectId-shaped ids from a substore scope array so a stray/
// non-id entry can never throw a Mongoose cast error at save time. EMPTY (or an
// all-invalid) array means "shown in ALL substores".
function normalizeSubstoreIds(ids) {
  if (!Array.isArray(ids)) return []
  return ids
    .map((v) => (v == null ? "" : String(v)))
    .filter((v) => /^[a-f0-9]{24}$/i.test(v))
    .map(oid)
}

// Copy an option set's options[] onto the product VERBATIM — the full
// definition (name / displayName / type / values[] with labels, image swatches,
// priceDelta, defaults, order) exactly as the set (or the seller's per-product
// edit) holds it, so every option value "goes as is" onto the product. Trusted
// input (a copy of the tenant's own set); we normalize shape only.
//
// Substore scoping (set in the Options & Variants tab) is preserved at BOTH
// levels: `option.substoreIds` scopes the whole option and `value.substoreIds`
// scopes a single value (e.g. show "18K Gold" only in the UAE store). EMPTY =
// visible in all substores.
function copyOptionDefinitions(options = []) {
  return (Array.isArray(options) ? options : []).map((o) => ({
    name: o.name,
    displayName: o.displayName ?? "",
    type: o.type ?? "dropdown",
    values: (o.values ?? []).map((v) => ({
      label: v.label,
      value: v.value,
      ...(v.image ? { image: { url: v.image.url ?? "" } } : {}),
      ...(v.priceDelta ? { priceDelta: v.priceDelta } : {}),
      sortOrder: v.sortOrder ?? 0,
      isDefault: v.isDefault ?? false,
      substoreIds: normalizeSubstoreIds(v.substoreIds),
    })),
    minCount: o.minCount ?? 0,
    maxCount: o.maxCount ?? 0,
    required: o.required ?? false,
    defaultValue: o.defaultValue ?? null,
    sortOrder: o.sortOrder ?? 0,
    showAlways: o.showAlways ?? false,
    substoreIds: normalizeSubstoreIds(o.substoreIds),
  }))
}

// Load an option set (scoped + live) and return the reference id + a full copy
// of its options[] to stamp onto the product. Reuses the existing optionsets
// module — no re-modelling. There is no version/snapshot: the product's
// options[] IS the definition.
async function buildOptionSetAttachment({ OptionSet, parentStoreId, optionSetId }) {
  const set = await OptionSet.findOne({ _id: optionSetId, parentStoreId, deletedAt: null }).lean()
  if (!set) throw new ApiError(404, "Option set not found")
  return {
    optionSetId: set._id,
    options: copyOptionDefinitions(set.options ?? []),
  }
}

export async function createProductDoc({ seller, tenantDbName, user, body, req }) {
  const { Product, OptionSet, MetafieldDefinition } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const alias =
    body.alias ||
    body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 240)
  await assertAliasFree(Product, parentStoreId, alias, null)

  const { resolved, rest } = await resolveBodyRelations({ tenantDbName, parentStoreId, body })
  const { images, options: bodyOptions, metafields: bodyMetafields, ...fields } = rest
  const { warnings, optionSetId, ...relations } = resolved

  // Validate + coerce the keyed metafield object against the live definition
  // and embed it on the product (StoreHippo-style). STRICT: an invalid value
  // throws a 422 and blocks the create (see buildProductMetafields).
  const { metafields: cleanMetafields, fields: metafieldFields } = await buildProductMetafields({
    MetafieldDefinition,
    parentStoreId,
    input: bodyMetafields,
  })

  // Resolve the option set attachment up-front (if one was supplied) — this
  // copies the set's full options[] onto the product.
  let attachment = {}
  let options = []
  if (optionSetId) {
    ;({ options, ...attachment } = await buildOptionSetAttachment({ OptionSet, parentStoreId, optionSetId }))
  }

  // Client-sent options (the seller's per-product add / remove / reorder from
  // the Options & Variants tab) win over the set's pristine copy so exactly what
  // the seller sees is stored on the product.
  if (Array.isArray(bodyOptions)) {
    options = copyOptionDefinitions(bodyOptions)
  }

  // Create first to get the _id used as the image folder name. The product
  // carries its full option DEFINITIONS in options[] (copied from the set or the
  // seller's edit); variants, when generated later, do not overwrite them.
  const doc = await Product.create({
    ...fields,
    ...relations,
    ...attachment,
    options,
    ...(cleanMetafields !== undefined ? { metafields: cleanMetafields } : {}),
    alias,
    images: [],
    parentStoreId,
    createdBy: user._id,
    updatedBy: user._id,
  })

  let needsSave = false
  if (images?.length) {
    doc.images = await persistImages({ productId: doc._id, images })
    needsSave = true
  }

  // Write any nested base64 metafield images to disk (now that we have the _id
  // for the folder) and swap the data URLs for the stored /uploads/... paths.
  if (cleanMetafields && metafieldFields) {
    await persistMetafieldImages({
      ownerType: PRODUCT_UPLOAD_OWNER,
      ownerId: doc._id,
      fields: metafieldFields,
      values: doc.metafields,
    })
    doc.markModified("metafields")
    needsSave = true
  }

  if (needsSave) await doc.save()

  if (attachment.optionSetId) {
    await OptionSet.updateOne({ _id: attachment.optionSetId, parentStoreId }, { $inc: { usageCount: 1 } })
  }

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.product.created",
    targetType: "Product",
    targetId: doc._id,
    after: { name: doc.name, alias: doc.alias, price: doc.price, isPublished: doc.isPublished },
  })

  return { product: doc.toObject(), warnings }
}

export async function updateProductDoc({ seller, tenantDbName, user, id, body, req }) {
  const { Product, OptionSet, MetafieldDefinition } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await Product.findOne({ _id: id, parentStoreId })
  if (!doc) throw new ApiError(404, "Product not found")

  const before = { name: doc.name, alias: doc.alias, price: doc.price, isPublished: doc.isPublished }

  if (body.alias || body.name) {
    const nextAlias = body.alias ?? doc.alias
    await assertAliasFree(Product, parentStoreId, nextAlias, doc._id)
  }

  const { resolved, rest } = await resolveBodyRelations({ tenantDbName, parentStoreId, body })
  const { images, options: bodyOptions, metafields: bodyMetafields, ...fields } = rest
  const { warnings, optionSetId, ...relations } = resolved

  // Validate + coerce the keyed metafield object and embed it on the product.
  // STRICT: an invalid value throws a 422 and blocks the update. `undefined`
  // (field not sent) leaves the stored metafields untouched.
  const { metafields: cleanMetafields, fields: metafieldFields } = await buildProductMetafields({
    MetafieldDefinition,
    parentStoreId,
    input: bodyMetafields,
  })
  if (cleanMetafields !== undefined) {
    const previousMetafields = doc.metafields // capture before overwrite for orphan cleanup
    doc.metafields = cleanMetafields
    // Persist nested base64 metafield images to disk and drop any files the
    // previous version referenced but this save no longer does.
    if (metafieldFields) {
      await persistMetafieldImages({
        ownerType: PRODUCT_UPLOAD_OWNER,
        ownerId: doc._id,
        fields: metafieldFields,
        values: doc.metafields,
        previousValues: previousMetafields,
      })
    }
    doc.markModified("metafields") // Mixed type — Mongoose can't auto-detect the change
  }

  // Handle an option-set change (attach / replace / detach) with usageCount
  // bookkeeping. Changing the set copies its full options[] onto the product.
  if (optionSetId !== undefined) {
    const prevId = doc.optionSetId ? String(doc.optionSetId) : null
    const nextId = optionSetId ? String(optionSetId) : null
    if (nextId !== prevId) {
      if (prevId) {
        await OptionSet.updateOne({ _id: doc.optionSetId, parentStoreId }, { $inc: { usageCount: -1 } })
      }
      if (optionSetId) {
        const attachment = await buildOptionSetAttachment({ OptionSet, parentStoreId, optionSetId })
        doc.optionSetId = attachment.optionSetId
        doc.options = attachment.options
        await OptionSet.updateOne({ _id: optionSetId, parentStoreId }, { $inc: { usageCount: 1 } })
      } else {
        doc.optionSetId = null
        doc.options = []
      }
    }
  }

  // Persist per-product option edits (from the Options & Variants tab) verbatim.
  // Runs AFTER the optionSetId block so a client edit always wins over the
  // freshly-attached set's pristine copy.
  if (Array.isArray(bodyOptions)) {
    doc.options = copyOptionDefinitions(bodyOptions)
  }

  if (images) {
    const keptUrls = new Set(images.filter((i) => i.url).map((i) => i.url))
    for (const old of doc.images ?? []) {
      if (old.url && !keptUrls.has(old.url)) {
        await deleteProductImage({ productId: doc._id, publicUrl: old.url })
      }
    }
    doc.images = await persistImages({ productId: doc._id, images })
  }

  for (const [key, value] of Object.entries(relations)) doc[key] = value
  for (const [key, value] of Object.entries(fields)) doc[key] = value
  doc.updatedBy = user._id
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.product.updated",
    targetType: "Product",
    targetId: doc._id,
    before,
    after: { name: doc.name, alias: doc.alias, price: doc.price, isPublished: doc.isPublished },
  })

  return { product: doc.toObject(), warnings }
}

// Attach / replace the option set + snapshot (POST /:id/attach-option-set).
export async function attachOptionSet({ seller, tenantDbName, user, id, optionSetId, req }) {
  const { Product, OptionSet } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await Product.findOne({ _id: id, parentStoreId })
  if (!doc) throw new ApiError(404, "Product not found")

  const attachment = await buildOptionSetAttachment({ OptionSet, parentStoreId, optionSetId: oid(optionSetId) })

  const prevId = doc.optionSetId ? String(doc.optionSetId) : null
  if (prevId && prevId !== String(attachment.optionSetId)) {
    await OptionSet.updateOne({ _id: doc.optionSetId, parentStoreId }, { $inc: { usageCount: -1 } })
  }
  if (prevId !== String(attachment.optionSetId)) {
    await OptionSet.updateOne({ _id: attachment.optionSetId, parentStoreId }, { $inc: { usageCount: 1 } })
  }

  doc.optionSetId = attachment.optionSetId
  // Copy the set's full options[] onto the product (definition, not variant-derived).
  doc.options = attachment.options
  doc.updatedBy = user._id
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.product.optionSetAttached",
    targetType: "Product",
    targetId: doc._id,
    after: { optionSetId: String(attachment.optionSetId) },
  })

  return doc.toObject()
}

// Refresh the snapshot from the live OptionSet (POST /:id/resync-options).
export async function resyncOptions({ seller, tenantDbName, user, id }) {
  const { Product, OptionSet } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await Product.findOne({ _id: id, parentStoreId })
  if (!doc) throw new ApiError(404, "Product not found")
  if (!doc.optionSetId) throw new ApiError(400, "No option set attached")

  const attachment = await buildOptionSetAttachment({ OptionSet, parentStoreId, optionSetId: doc.optionSetId })
  // Refresh the product's options[] from the live set.
  doc.options = attachment.options
  doc.updatedBy = user._id
  await doc.save()

  return doc.toObject()
}

// NOTE: Cartesian variant generation moved to productVariant.service.js
// (generateProductVariants) — variants now live in the productVariants
// collection, not on the product doc.

// Clone a product (POST /:id/duplicate) — copies all fields, resets identity.
export async function duplicateProductDoc({ seller, tenantDbName, user, id, req }) {
  const { Product, ProductVariant, OptionSet } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const src = await Product.findOne({ _id: id, parentStoreId }).lean()
  if (!src) throw new ApiError(404, "Product not found")

  // Unique alias: "<alias>-copy", "-copy-2", ... until free.
  const base = `${src.alias || "product"}-copy`
  let alias = base
  let n = 1
  // eslint-disable-next-line no-await-in-loop
  while (await Product.findOne({ parentStoreId, alias }).select("_id").lean()) {
    n += 1
    alias = `${base}-${n}`
  }

  const {
    _id,
    createdAt,
    updatedAt,
    images, // don't reuse the same image folder — start clean
    ...rest
  } = src

  const doc = await Product.create({
    ...rest,
    name: `${src.name} (Copy)`,
    alias,
    images: [],
    isPublished: false,
    approve: "pending",
    parentStoreId,
    createdBy: user._id,
    updatedBy: user._id,
  })

  // Copy the source's variants onto the new product id (the clone already
  // carries the source's options[]/variantCount via ...rest above).
  await duplicateVariantsForProduct({ ProductVariant, parentStoreId, fromId: src._id, toId: doc._id })

  if (doc.optionSetId) {
    await OptionSet.updateOne({ _id: doc.optionSetId, parentStoreId }, { $inc: { usageCount: 1 } })
  }

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.product.duplicated",
    targetType: "Product",
    targetId: doc._id,
    after: { name: doc.name, alias: doc.alias, sourceId: String(src._id) },
  })

  return doc.toObject()
}

// SOFT DELETE — move into the trash. Decrements the attached set's usageCount so
// it isn't wrongly counted as in-use while trashed.
export async function deleteProductDoc({ seller, tenantDbName, user, id, req }) {
  const { Product } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await Product.findOne({ _id: id, parentStoreId, deletedAt: null })
  if (!doc) throw new ApiError(404, "Product not found")

  doc.isDeleted = true
  doc.deletedAt = new Date()
  doc.deletedBy = user._id
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.product.deleted",
    targetType: "Product",
    targetId: doc._id,
    before: { name: doc.name, alias: doc.alias },
    after: { isDeleted: true },
  })

  return { ok: true, id: doc._id, isDeleted: true }
}

// RESTORE — bring a trashed product back; fails if its alias now clashes.
export async function restoreProductDoc({ seller, tenantDbName, user, id, req }) {
  const { Product } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await Product.findOne({ _id: id, parentStoreId, deletedAt: { $ne: null } })
  if (!doc) throw new ApiError(404, "Deleted product not found")

  await assertAliasFree(Product, parentStoreId, doc.alias, doc._id)

  doc.isDeleted = false
  doc.deletedAt = null
  doc.deletedBy = null
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.product.restored",
    targetType: "Product",
    targetId: doc._id,
    after: { name: doc.name, alias: doc.alias },
  })

  return doc.toObject()
}

// PERMANENT DELETE — irreversible, only on an already-trashed product. Cleans up
// uploaded images and releases the option set's usageCount.
export async function destroyProductDoc({ seller, tenantDbName, user, id, req }) {
  const { Product, ProductVariant, OptionSet } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await Product.findOne({ _id: id, parentStoreId, deletedAt: { $ne: null } }).lean()
  if (!doc) throw new ApiError(404, "Deleted product not found — soft delete it first")

  for (const img of doc.images ?? []) {
    if (img.url) await deleteProductImage({ productId: doc._id, publicUrl: img.url })
  }

  // Remove all nested metafield images for this product in one shot.
  await deleteMetafieldDir({ ownerType: PRODUCT_UPLOAD_OWNER, ownerId: doc._id })

  if (doc.optionSetId) {
    await OptionSet.updateOne({ _id: doc.optionSetId, parentStoreId }, { $inc: { usageCount: -1 } })
  }

  // Variants cascade with their product.
  await deleteVariantsForProduct({ ProductVariant, parentStoreId, productId: doc._id })

  await Product.deleteOne({ _id: doc._id, parentStoreId })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.product.destroyed",
    targetType: "Product",
    targetId: doc._id,
    before: { name: doc.name, alias: doc.alias },
  })

  return { ok: true, removed: 1 }
}

// ---------------------------------------------------------------------------
// BULK IMPORT — legacy StoreHippo export rows → resolved products. Aliases are
// resolved to ObjectIds (relation-resolver.js); unknown aliases are skipped and
// reported. `upsert` re-runs safely by matching on alias.
// ---------------------------------------------------------------------------
export async function importProducts({ seller, tenantDbName, user, products, upsert, req }) {
  const { Product, ProductVariant, OptionSet } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const report = { created: 0, updated: 0, skipped: 0, warnings: [] }

  for (const raw of products) {
    // eslint-disable-next-line no-await-in-loop
    try {
      const alias =
        raw.alias ||
        (raw.name || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .slice(0, 240)
      if (!raw.name || alias === "") {
        report.skipped += 1
        report.warnings.push(`row skipped (missing name): ${JSON.stringify(raw).slice(0, 80)}`)
        continue
      }

      // eslint-disable-next-line no-await-in-loop
      const resolved = await resolveRelations({ tenantDbName, parentStoreId, raw })
      const { warnings, optionSetId, ...relations } = resolved
      if (warnings?.length) report.warnings.push(...warnings.map((w) => `${alias}: ${w}`))

      let attachment = {}
      if (optionSetId) {
        // eslint-disable-next-line no-await-in-loop
        const set = await OptionSet.findOne({ _id: optionSetId, parentStoreId, deletedAt: null }).lean()
        if (set) {
          attachment = {
            optionSetId: set._id,
            optionSetVersion: set.updatedAt ? new Date(set.updatedAt).getTime() : 0,
            optionSetSnapshot: { name: set.name, displayName: set.displayName, options: set.options ?? [] },
          }
        } else {
          report.warnings.push(`${alias}: option set ${optionSetId} not found`)
        }
      }

      const payload = {
        name: raw.name,
        alias,
        description: raw.description ?? null,
        price: Number(raw.price) || 0,
        comparePrice: raw.compare_price != null ? Number(raw.compare_price) : null,
        sku: raw.sku ?? null,
        isPublished: raw.published !== undefined ? Boolean(raw.published) : true,
        sortOrder: Number(raw.sort_order) || 0,
        approve: raw.approve ?? "approved",
        ...relations,
        ...attachment,
        parentStoreId,
        updatedBy: user._id,
      }

      const variants2 = Array.isArray(raw.variants2) ? raw.variants2 : []

      // eslint-disable-next-line no-await-in-loop
      const existing = upsert ? await Product.findOne({ parentStoreId, alias }) : null
      if (existing) {
        Object.assign(existing, payload)
        // eslint-disable-next-line no-await-in-loop
        await existing.save()
        // Re-runnable import: replace this product's variants wholesale.
        // eslint-disable-next-line no-await-in-loop
        await deleteVariantsForProduct({ ProductVariant, parentStoreId, productId: existing._id })
        // eslint-disable-next-line no-await-in-loop
        await importVariantsForProduct({
          ProductVariant,
          Product,
          parentStoreId,
          productId: existing._id,
          variants: variants2,
        })
        report.updated += 1
      } else {
        payload.createdBy = user._id
        // eslint-disable-next-line no-await-in-loop
        const doc = await Product.create(payload)
        if (doc.optionSetId) {
          // eslint-disable-next-line no-await-in-loop
          await OptionSet.updateOne({ _id: doc.optionSetId, parentStoreId }, { $inc: { usageCount: 1 } })
        }
        // eslint-disable-next-line no-await-in-loop
        await importVariantsForProduct({
          ProductVariant,
          Product,
          parentStoreId,
          productId: doc._id,
          variants: variants2,
        })
        report.created += 1
      }
    } catch (err) {
      report.skipped += 1
      report.warnings.push(`import error: ${err.message}`)
    }
  }

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.product.imported",
    targetType: "Product",
    targetId: null,
    after: { created: report.created, updated: report.updated, skipped: report.skipped },
  })

  return report
}
