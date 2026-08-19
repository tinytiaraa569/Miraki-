import mongoose from "mongoose"
import { getTenantModels } from "../../config/tenantDb.js"
import { ApiError } from "../../utils/apiError.js"
import { deleteSellerImage, saveSellerImage } from "../../utils/uploads.js"
import { audit } from "../audit/audit.service.js"



const oid = (v) => new mongoose.Types.ObjectId(String(v))
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const SORTS = {
  "-createdAt": { createdAt: -1, _id: -1 },
  createdAt: { createdAt: 1, _id: 1 },
  name: { name: 1, _id: 1 },
  "-name": { name: -1, _id: -1 },
}


const LIST_PROJECT = {
  name: 1,
  ruleType: 1,
  amountType: 1,
  amountValue: 1,
  enabled: 1,
  timesUsed: 1,
  isDeleted: 1,
  deletedAt: 1,
  createdAt: 1,
  updatedAt: 1,
}

function toDate(v) {
  if (v === undefined) return undefined
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}


async function resolveGiftImage({ seller, incoming, previous }) {
  if (typeof incoming === "string" && incoming.startsWith("data:")) {
    const url = await saveSellerImage({ sellerId: String(seller._id), dataUrl: incoming, folder: "discounts" })
    if (previous && previous !== url) {
      await deleteSellerImage({ sellerId: String(seller._id), publicUrl: previous })
    }
    return url
  }
  if (typeof incoming === "string" && incoming.length) return incoming // kept saved url
  if (previous) await deleteSellerImage({ sellerId: String(seller._id), publicUrl: previous }) // cleared
  return null
}


function mapBody(body) {
  const out = {}
  for (const [k, v] of Object.entries(body)) {
    if (k === "giftImage") continue
    if (k === "startDate" || k === "endDate") {
      out[k] = toDate(v)
      continue
    }
    if (k === "sellerId" || k === "sourceItemId") {
      out[k] = v ? oid(v) : null
      continue
    }
    out[k] = v
  }
  // "single" free-product config keeps at most one gift product.
  if (out.freeProductConfig === "single" && Array.isArray(out.freeProductIds)) {
    out.freeProductIds = out.freeProductIds.slice(0, 1)
  }
  return out
}


export async function listDiscounts({ seller, tenantDbName, query }) {
  const { Discount } = getTenantModels(tenantDbName)

  const match = {
    parentStoreId: oid(seller.mainStoreId),
    deletedAt: query.deleted ? { $ne: null } : null,
  }

  const searching = Boolean(query.q?.trim())
  if (searching) {
    const rx = { $regex: escapeRegex(query.q.trim()), $options: "i" }
    match.$or = [{ name: rx }, { description: rx }]
  } else if (typeof query.enabled === "boolean") {
    match.enabled = query.enabled
  }

  const page = query.page ?? 1
  const limit = query.limit ?? 50
  const sort = SORTS[query.sort ?? "-createdAt"]

  const [result] = await Discount.aggregate([
    { $match: match },
    {
      $facet: {
        rows: [{ $sort: sort }, { $skip: (page - 1) * limit }, { $limit: limit }, { $project: LIST_PROJECT }],
        total: [{ $count: "n" }],
      },
    },
  ])

  return {
    rows: result?.rows ?? [],
    total: result?.total?.[0]?.n ?? 0,
    page,
    limit,
  }
}

// Full detail for the editor.
export async function getDiscount({ seller, tenantDbName, id }) {
  const { Discount } = getTenantModels(tenantDbName)
  const doc = await Discount.findOne({ _id: id, parentStoreId: oid(seller.mainStoreId) }).lean()
  if (!doc) throw new ApiError(404, "Discount not found")
  return doc
}

export async function createDiscountDoc({ seller, tenantDbName, user, body, req }) {
  const { Discount } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const fields = mapBody(body)
  const isBogo = (fields.ruleType ?? "product") === "bogo_auto_add"
  const giftImage = isBogo ? await resolveGiftImage({ seller, incoming: body.giftImage, previous: null }) : null

  const doc = await Discount.create({
    ...fields,
    giftImage,
    parentStoreId,
    createdBy: user._id,
    updatedBy: user._id,
  })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.discount.created",
    targetType: "Discount",
    targetId: doc._id,
    after: { name: doc.name, ruleType: doc.ruleType, enabled: doc.enabled },
  })

  return (await Discount.findById(doc._id).lean()) ?? doc.toObject()
}

export async function updateDiscountDoc({ seller, tenantDbName, user, id, body, req }) {
  const { Discount } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await Discount.findOne({ _id: id, parentStoreId })
  if (!doc) throw new ApiError(404, "Discount not found")

  const before = { name: doc.name, ruleType: doc.ruleType, enabled: doc.enabled }

  const fields = mapBody(body)
  for (const [key, value] of Object.entries(fields)) doc[key] = value

  const nextRuleType = fields.ruleType ?? doc.ruleType
  if (nextRuleType === "bogo_auto_add") {
    // Only touch the gift image when the client actually sent the field.
    if (body.giftImage !== undefined) {
      doc.giftImage = await resolveGiftImage({ seller, incoming: body.giftImage, previous: doc.giftImage })
    }
  } else if (doc.giftImage) {
    // Non-bogo discounts carry no gift — clean up any previously saved image.
    await deleteSellerImage({ sellerId: String(seller._id), publicUrl: doc.giftImage })
    doc.giftImage = null
  }

  doc.updatedBy = user._id
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.discount.updated",
    targetType: "Discount",
    targetId: doc._id,
    before,
    after: { name: doc.name, ruleType: doc.ruleType, enabled: doc.enabled },
  })

  return (await Discount.findById(doc._id).lean()) ?? doc.toObject()
}

// SOFT DELETE — move the single doc into the trash (restorable).
export async function deleteDiscountDoc({ seller, tenantDbName, user, id, req }) {
  const { Discount } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await Discount.findOne({ _id: id, parentStoreId, deletedAt: null })
  if (!doc) throw new ApiError(404, "Discount not found")

  doc.isDeleted = true
  doc.deletedAt = new Date()
  doc.deletedBy = user._id
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.discount.deleted",
    targetType: "Discount",
    targetId: doc._id,
    before: { name: doc.name },
    after: { isDeleted: true },
  })

  return { ok: true, id: doc._id, isDeleted: true }
}

// RESTORE — bring a trashed discount back.
export async function restoreDiscountDoc({ seller, tenantDbName, user, id, req }) {
  const { Discount } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await Discount.findOne({ _id: id, parentStoreId, deletedAt: { $ne: null } })
  if (!doc) throw new ApiError(404, "Deleted discount not found")

  doc.isDeleted = false
  doc.deletedAt = null
  doc.deletedBy = null
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.discount.restored",
    targetType: "Discount",
    targetId: doc._id,
    after: { name: doc.name },
  })

  return doc.toObject()
}

// PERMANENT DELETE — irreversible, only on an already-trashed discount. Removes
// the doc and its uploaded gift image.
export async function destroyDiscountDoc({ seller, tenantDbName, user, id, req }) {
  const { Discount } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await Discount.findOne({ _id: id, parentStoreId, deletedAt: { $ne: null } }).lean()
  if (!doc) throw new ApiError(404, "Deleted discount not found — soft delete it first")

  if (doc.giftImage) await deleteSellerImage({ sellerId: String(seller._id), publicUrl: doc.giftImage })
  await Discount.deleteOne({ _id: doc._id, parentStoreId })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.discount.destroyed",
    targetType: "Discount",
    targetId: doc._id,
    before: { name: doc.name },
  })

  return { ok: true, removed: 1 }
}


const ENTITY_CONFIG = {
  products: { model: "Product", project: { _id: 1, name: 1, alias: 1, price: 1 }, search: ["name", "alias", "sku"] },
  categories: { model: "Category", project: { _id: 1, name: 1, alias: 1 }, search: ["name", "alias"] },
  collections: { model: "Collection", project: { _id: 1, name: 1, alias: 1 }, search: ["name", "alias"] },
  brands: { model: "Brand", project: { _id: 1, name: 1, alias: 1 }, search: ["name", "alias"] },
  substores: { model: "Substore", project: { _id: 1, name: 1, alias: 1 }, search: ["name", "alias"] },
}

export async function listEntityOptions({ seller, tenantDbName, entity, query }) {
  if (entity === "sellers") return listSellerOptions({ seller, tenantDbName, query })

  const cfg = ENTITY_CONFIG[entity]
  if (!cfg) throw new ApiError(404, "Unknown option type")

  const Model = getTenantModels(tenantDbName)[cfg.model]
  if (!Model) throw new ApiError(404, "Unknown option type")
  const parentStoreId = oid(seller.mainStoreId)

  // Resolve an already-selected set → labels for chips (no pagination).
  if (query.ids?.length) {
    const rows = await Model.aggregate([
      { $match: { parentStoreId, _id: { $in: query.ids.map((id) => oid(id)) } } },
      { $sort: { name: 1 } },
      { $project: cfg.project },
    ])
    return { rows, total: rows.length, page: 1, limit: rows.length }
  }

  const page = query.page ?? 1
  const limit = query.limit ?? 10
  const match = { parentStoreId, deletedAt: null }
  if (query.q) {
    const rx = { $regex: escapeRegex(query.q), $options: "i" }
    match.$or = cfg.search.map((f) => ({ [f]: rx }))
  }

  const [result] = await Model.aggregate([
    { $match: match },
    {
      $facet: {
        rows: [{ $sort: { name: 1 } }, { $skip: (page - 1) * limit }, { $limit: limit }, { $project: cfg.project }],
        total: [{ $count: "n" }],
      },
    },
  ])

  return { rows: result?.rows ?? [], total: result?.total?.[0]?.n ?? 0, page, limit }
}


async function listSellerOptions({ seller, tenantDbName, query }) {
  const { Product } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  if (query.ids?.length) {
    const ids = query.ids.map((id) => oid(id))
    return {
      rows: ids.map((id) => ({ _id: id, name: String(id) })),
      total: ids.length,
      page: 1,
      limit: ids.length,
    }
  }

  const page = query.page ?? 1
  const limit = query.limit ?? 10

  const [result] = await Product.aggregate([
    { $match: { parentStoreId, deletedAt: null, sellerId: { $ne: null } } },
    { $group: { _id: "$sellerId" } },
    {
      $facet: {
        rows: [
          { $sort: { _id: 1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { $project: { _id: 1, name: { $toString: "$_id" } } },
        ],
        total: [{ $count: "n" }],
      },
    },
  ])

  return { rows: result?.rows ?? [], total: result?.total?.[0]?.n ?? 0, page, limit }
}
