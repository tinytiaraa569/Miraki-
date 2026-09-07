import mongoose from "mongoose"
import { getTenantModels } from "../../config/tenantDb.js"
import { ApiError } from "../../utils/apiError.js"
import { deleteBrandImage, saveBrandImage } from "../../utils/uploads.js"
import { audit } from "../audit/audit.service.js"

// All functions run AFTER loadUser: seller + tenantDbName are trusted, and the
// route gate already restricted access to SELLER_SUPERADMIN. Every query is
// scoped by parentStoreId (the tenant's single main store) so one seller can
// never read or mutate another's brands. Brands are FLAT — no tree, no move,
// no cascade — which makes this service simpler than categories.

const oid = (v) => new mongoose.Types.ObjectId(String(v))

const SORTS = {
  sortOrder: { sortOrder: 1, name: 1 },
  "-sortOrder": { sortOrder: -1, name: -1 },
  name: { name: 1 },
  "-name": { name: -1 },
  createdAt: { createdAt: 1 },
  "-createdAt": { createdAt: -1 },
}

// Escape regex metacharacters — the search box must never become an injection.
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// Columns the list renders — kept lean, never the full nested payload. `images`
// is sliced to the first element only; we derive the row `thumbnail` from it in
// JS below so the wire payload stays tiny.
const LIST_SELECT = {
  name: 1,
  alias: 1,
  sortOrder: 1,
  isPublished: 1,
  isActive: 1,
  isDeleted: 1,
  deletedAt: 1,
  createdAt: 1,
  updatedAt: 1,
  images: { $slice: 1 },
}

// ---------------------------------------------------------------------------
// LIST — flat, paginated, sorted. Rows + total are fetched as TWO parallel,
// index-backed queries (find + countDocuments) rather than a single $facet:
// stages inside a $facet sub-pipeline can't use indexes, which would force the
// sort + pagination in-memory. Splitting them lets the default publish-tab
// list ride the compound index { parentStoreId, isPublished, sortOrder, name }
// end-to-end for both the page and the count.
//   • no `q`  -> filter by the Published / Unpublished tab (`isPublished`)
//   • with `q` -> flat search (name / alias) across BOTH tabs
//   • deleted  -> the trash view (soft-deleted rows only)
// ---------------------------------------------------------------------------
export async function listBrands({ seller, tenantDbName, query }) {
  const { Brand } = getTenantModels(tenantDbName)

  const match = {
    parentStoreId: oid(seller.mainStoreId),
    deletedAt: query.deleted ? { $ne: null } : null,
  }

  const searching = Boolean(query.q?.trim())
  if (searching) {
    const rx = { $regex: escapeRegex(query.q.trim()), $options: "i" }
    match.$or = [{ name: rx }, { alias: rx }]
  } else if (typeof query.published === "boolean") {
    match.isPublished = query.published // Published / Unpublished tab
  }

  const page = query.page ?? 1
  const limit = query.limit ?? 50

  const [rows, total] = await Promise.all([
    Brand.find(match)
      .sort(SORTS[query.sort ?? "sortOrder"])
      .skip((page - 1) * limit)
      .limit(limit)
      .select(LIST_SELECT)
      .lean(),
    Brand.countDocuments(match),
  ])

  return {
    // Flatten the sliced image array into a single `thumbnail` url.
    rows: rows.map(({ images, ...r }) => ({ ...r, thumbnail: images?.[0]?.url ?? null })),
    total,
    page,
    limit,
  }
}

// ---------------------------------------------------------------------------
// OPTIONS — ultra-lean list for pickers/dropdowns (e.g. the collection rule
// builder's Brand value). Returns ONLY _id / name / alias for the seller's
// live (non-deleted) brands, paginated so a picker can lazy-load a page at a
// time. Never touches images / SEO / metafields, so it stays cheap.
//   • `ids` → resolve labels for a known set (selected chips). Not paginated,
//     includes soft-deleted rows so a selected value always shows a name.
//   • `q`   → case-insensitive name/alias search.
// ---------------------------------------------------------------------------
export async function listBrandOptions({ seller, tenantDbName, query }) {
  const { Brand } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  if (query.ids?.length) {
    const rows = await Brand.find({
      parentStoreId,
      _id: { $in: query.ids.map((id) => oid(id)) },
    })
      .select({ _id: 1, name: 1, alias: 1 })
      .sort({ name: 1 })
      .lean()
    return { rows, total: rows.length, page: 1, limit: rows.length }
  }

  const page = query.page ?? 1
  const limit = query.limit ?? 10
  const match = { parentStoreId, deletedAt: null }
  if (query.q) {
    const rx = { $regex: escapeRegex(query.q), $options: "i" }
    match.$or = [{ name: rx }, { alias: rx }]
  }

  const [rows, total] = await Promise.all([
    Brand.find(match)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select({ _id: 1, name: 1, alias: 1 })
      .lean(),
    Brand.countDocuments(match),
  ])

  return { rows, total, page, limit }
}

// Full detail for the editor.
export async function getBrand({ seller, tenantDbName, id }) {
  const { Brand } = getTenantModels(tenantDbName)
  const doc = await Brand.findOne({ _id: id, parentStoreId: seller.mainStoreId }).lean()
  if (!doc) throw new ApiError(404, "Brand not found")
  return doc
}

async function assertAliasFree(Brand, parentStoreId, alias, exceptId) {
  if (!alias) return
  const clash = await Brand.findOne({
    parentStoreId,
    alias,
    deletedAt: null,
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  }).collation({ locale: "en", strength: 2 })
  if (clash) throw new ApiError(409, "A brand with this alias already exists")
}

// Turn incoming image rows (mix of saved { url } + fresh { dataUrl }) into the
// stored [{ url, alt }] shape, writing any base64 payloads to disk first.
async function persistImages({ brandId, images }) {
  const out = []
  for (const img of images ?? []) {
    if (img.dataUrl) {
      const url = await saveBrandImage({ brandId, dataUrl: img.dataUrl })
      out.push({ url, alt: img.alt ?? "" })
    } else if (img.url) {
      out.push({ url: img.url, alt: img.alt ?? "" })
    }
  }
  return out
}

export async function createBrandDoc({ seller, tenantDbName, user, body, req }) {
  const { Brand } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  // Derive alias up-front so the clash check matches the stored value.
  const alias =
    body.alias ||
    body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 200)
  await assertAliasFree(Brand, parentStoreId, alias, null)

  const { images, ...rest } = body

  // Create first to get the _id used as the image folder name.
  const doc = await Brand.create({
    ...rest,
    alias,
    images: [],
    parentStoreId,
    createdBy: user._id,
    updatedBy: user._id,
  })

  if (images?.length) {
    doc.images = await persistImages({ brandId: doc._id, images })
    await doc.save()
  }

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.brand.created",
    targetType: "Brand",
    targetId: doc._id,
    after: { name: doc.name, alias: doc.alias, isPublished: doc.isPublished },
  })

  return doc.toObject()
}

export async function updateBrandDoc({ seller, tenantDbName, user, id, body, req }) {
  const { Brand } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await Brand.findOne({ _id: id, parentStoreId })
  if (!doc) throw new ApiError(404, "Brand not found")

  const before = { name: doc.name, alias: doc.alias, isPublished: doc.isPublished }

  if (body.alias || body.name) {
    const nextAlias = body.alias ?? doc.alias
    await assertAliasFree(Brand, parentStoreId, nextAlias, doc._id)
  }

  const { images, ...rest } = body

  if (images) {
    // Remove files that are no longer referenced, then persist the new set.
    const keptUrls = new Set(images.filter((i) => i.url).map((i) => i.url))
    for (const old of doc.images ?? []) {
      if (old.url && !keptUrls.has(old.url)) {
        await deleteBrandImage({ brandId: doc._id, publicUrl: old.url })
      }
    }
    doc.images = await persistImages({ brandId: doc._id, images })
  }

  for (const [key, value] of Object.entries(rest)) {
    doc[key] = value
  }
  doc.updatedBy = user._id
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.brand.updated",
    targetType: "Brand",
    targetId: doc._id,
    before,
    after: { name: doc.name, alias: doc.alias, isPublished: doc.isPublished },
  })

  return doc.toObject()
}

// SOFT DELETE — flat, no cascade. Just move the single doc into the trash.
export async function deleteBrandDoc({ seller, tenantDbName, user, id, req }) {
  const { Brand } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await Brand.findOne({ _id: id, parentStoreId, deletedAt: null })
  if (!doc) throw new ApiError(404, "Brand not found")

  doc.isDeleted = true
  doc.deletedAt = new Date()
  doc.deletedBy = user._id
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.brand.deleted",
    targetType: "Brand",
    targetId: doc._id,
    before: { name: doc.name, alias: doc.alias },
    after: { isDeleted: true },
  })

  return { ok: true, id: doc._id, isDeleted: true }
}

// RESTORE — bring a trashed brand back. Fails if its alias now clashes with a
// live brand (created while it sat in the trash).
export async function restoreBrandDoc({ seller, tenantDbName, user, id, req }) {
  const { Brand } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await Brand.findOne({ _id: id, parentStoreId, deletedAt: { $ne: null } })
  if (!doc) throw new ApiError(404, "Deleted brand not found")

  await assertAliasFree(Brand, parentStoreId, doc.alias, doc._id)

  doc.isDeleted = false
  doc.deletedAt = null
  doc.deletedBy = null
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.brand.restored",
    targetType: "Brand",
    targetId: doc._id,
    after: { name: doc.name, alias: doc.alias },
  })

  return doc.toObject()
}

// PERMANENT DELETE — irreversible, only on an already-trashed brand. Removes
// the single doc and cleans up its uploaded images.
export async function destroyBrandDoc({ seller, tenantDbName, user, id, req }) {
  const { Brand } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await Brand.findOne({ _id: id, parentStoreId, deletedAt: { $ne: null } }).lean()
  if (!doc) throw new ApiError(404, "Deleted brand not found — soft delete it first")

  for (const img of doc.images ?? []) {
    if (img.url) await deleteBrandImage({ brandId: doc._id, publicUrl: img.url })
  }

  await Brand.deleteOne({ _id: doc._id, parentStoreId })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.brand.destroyed",
    targetType: "Brand",
    targetId: doc._id,
    before: { name: doc.name, alias: doc.alias },
  })

  return { ok: true, removed: 1 }
}
