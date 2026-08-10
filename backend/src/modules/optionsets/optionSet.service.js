import mongoose from "mongoose"
import { getTenantModels } from "../../config/tenantDb.js"
import { ApiError } from "../../utils/apiError.js"
import { deleteOptionSetImage, saveOptionSetImage } from "../../utils/uploads.js"
import { audit } from "../audit/audit.service.js"

// All functions run AFTER loadUser: seller + tenantDbName are trusted, and the
// route gate already restricted access to SELLER_SUPERADMIN. Every query is
// scoped by parentStoreId (the tenant's single main store) so one seller can
// never read or mutate another's option sets.
//
// An Option Set is a reusable template embedding options[] → values[]. The whole
// set is one document: one editor load, one save, one storefront projection.
// See docs/OPTION_SETS_SYSTEM_PLAN.md.

const oid = (v) => new mongoose.Types.ObjectId(String(v))

// Escape regex metacharacters — the search box must never become an injection.
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const VALUE_BEARING = new Set(["dropdown", "image", "swatch", "radio", "checkbox"])

const SORTS = {
  name: { name: 1 },
  "-name": { name: -1 },
  createdAt: { createdAt: 1 },
  "-createdAt": { createdAt: -1 },
  optionCount: { optionCount: 1, name: 1 },
  "-optionCount": { optionCount: -1, name: 1 },
}

// ---------------------------------------------------------------------------
// LIST — single `$facet` aggregation: the page of rows AND the total come back
// in ONE round trip (§6). The $match is the first stage so the compound index
// { parentStoreId, deletedAt, name } drives filtering + the default sort. Rows
// are projected LEAN (never the full values[] payload) so the wire stays small;
// optionCount / optionSummary are already denormalized on the doc (§4 pre-save).
// Returns the stable envelope the TanStack table binds to (§6.4).
// ---------------------------------------------------------------------------
export async function listOptionSets({ seller, tenantDbName, query }) {
  const { OptionSet } = getTenantModels(tenantDbName)

  const match = {
    parentStoreId: oid(seller.mainStoreId),
    deletedAt: query.deleted ? { $ne: null } : null,
  }
  if (query.q?.trim()) {
    match.name = { $regex: escapeRegex(query.q.trim()), $options: "i" }
  }
  if (query.substore) {
    // Global sets (empty array) and sets scoped to this substore both return.
    match.$or = [{ substoreIds: { $size: 0 } }, { substoreIds: oid(query.substore) }]
  }

  const page = query.page ?? 1
  const limit = query.limit ?? 50
  const sort = SORTS[query.sort ?? "name"]

  const [result] = await OptionSet.aggregate([
    { $match: match },
    {
      $facet: {
        rows: [
          { $sort: sort },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              name: 1,
              alias: 1,
              optionCount: 1,
              optionSummary: 1,
              usageCount: 1,
              isActive: 1,
              deletedAt: 1,
              updatedAt: 1,
            },
          },
        ],
        meta: [{ $count: "total" }],
      },
    },
  ]).option({ allowDiskUse: true })

  const total = result?.meta?.[0]?.total ?? 0
  return {
    rows: result?.rows ?? [],
    total,
    page,
    limit,
    pageCount: Math.max(1, Math.ceil(total / limit)),
  }
}

// Lean picker feed for the (later) Product attach UI — id + name + option count.
export async function listOptionSetOptions({ seller, tenantDbName, query }) {
  const { OptionSet } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  // `ids` (comma-separated) → resolve labels for a known selection (picker
  // chips). Not paginated; a saved reference always gets a name back.
  const idList = (typeof query.ids === "string" ? query.ids.split(",") : Array.isArray(query.ids) ? query.ids : [])
    .map((s) => String(s).trim())
    .filter((s) => /^[a-f0-9]{24}$/i.test(s))
  if (idList.length) {
    const rows = await OptionSet.find({ parentStoreId, _id: { $in: idList.map(oid) } })
      .select({ name: 1, alias: 1, optionCount: 1 })
      .sort({ name: 1 })
      .lean()
    return { rows, total: rows.length, page: 1, limit: rows.length }
  }

  const match = { parentStoreId, deletedAt: null }
  if (query.q?.trim()) match.name = { $regex: escapeRegex(query.q.trim()), $options: "i" }

  const limit = query.limit ?? 20
  const page = query.page ?? 1

  const [rows, total] = await Promise.all([
    OptionSet.find(match)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select({ name: 1, alias: 1, optionCount: 1 })
      .lean(),
    OptionSet.countDocuments(match),
  ])
  return { rows, total, page, limit }
}

// Full detail for the editor.
export async function getOptionSet({ seller, tenantDbName, id }) {
  const { OptionSet } = getTenantModels(tenantDbName)
  const doc = await OptionSet.findOne({ _id: id, parentStoreId: seller.mainStoreId }).lean()
  if (!doc) throw new ApiError(404, "Option set not found")
  return doc
}

async function assertAliasFree(OptionSet, parentStoreId, alias, exceptId) {
  if (!alias) return
  const clash = await OptionSet.findOne({
    parentStoreId,
    alias,
    deletedAt: null,
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  }).collation({ locale: "en", strength: 2 })
  if (clash) throw new ApiError(409, "An option set with this alias already exists")
}

// Confirm every referenced substore actually belongs to this tenant, mirroring
// how collections validate their `substoreIds`.
async function assertSubstoresExist(tenantDbName, parentStoreId, substoreIds) {
  if (!substoreIds?.length) return
  const { Substore } = getTenantModels(tenantDbName)
  const ids = substoreIds.map((s) => oid(s))
  const count = await Substore.countDocuments({ _id: { $in: ids }, parentStoreId })
  if (count !== ids.length) throw new ApiError(400, "One or more substores are invalid")
}

// Normalize the incoming options[] payload:
//   • lowercase option `name` ("always use small case")
//   • de-dupe values[].value within an option
//   • upload image swatches (dataUrl → stored { url }) for image-type options only
//   • drop image sub-docs entirely for non-image / empty-url values
// Returns the persisted options[] shape (image sub-docs stripped to { url }).
async function normalizeOptions({ optionSetId, options, previousUrls }) {
  const keptUrls = new Set()
  const out = []

  for (const opt of options ?? []) {
    const isImage = opt.type === "image"
    const seen = new Set()
    const values = []

    for (const val of opt.values ?? []) {
      if (seen.has(val.value)) continue // de-dupe within the option
      seen.add(val.value)

      const next = {
        label: val.label,
        value: val.value,
        priceDelta: val.priceDelta ?? {},
        sortOrder: val.sortOrder ?? 0,
        isDefault: Boolean(val.isDefault),
      }

      if (isImage) {
        if (val.image?.dataUrl) {
          const url = await saveOptionSetImage({ optionSetId, dataUrl: val.image.dataUrl })
          next.image = { url }
          keptUrls.add(url)
        } else if (val.image?.url?.trim()) {
          next.image = { url: val.image.url.trim() }
          keptUrls.add(val.image.url.trim())
        }
      }
      values.push(next)
    }

    out.push({
      name: String(opt.name ?? "").toLowerCase(),
      displayName: opt.displayName ?? "",
      type: opt.type,
      values: VALUE_BEARING.has(opt.type) ? values : [],
      minCount: opt.minCount ?? 0,
      maxCount: opt.maxCount ?? 0,
      required: Boolean(opt.required),
      defaultValue: opt.defaultValue ?? null,
      sortOrder: opt.sortOrder ?? 0,
      showAlways: Boolean(opt.showAlways),
    })
  }

  // GC swatches that existed before but are no longer referenced.
  for (const url of previousUrls ?? []) {
    if (!keptUrls.has(url)) await deleteOptionSetImage({ optionSetId, publicUrl: url })
  }

  return out
}

// Collect every stored swatch url currently on a doc (for GC on update/destroy).
function collectImageUrls(doc) {
  const urls = []
  for (const opt of doc.options ?? []) {
    for (const val of opt.values ?? []) {
      if (val.image?.url) urls.push(val.image.url)
    }
  }
  return urls
}

export async function createOptionSetDoc({ seller, tenantDbName, user, body, req }) {
  const { OptionSet } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const alias =
    body.alias ||
    body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 200)
  await assertAliasFree(OptionSet, parentStoreId, alias, null)
  await assertSubstoresExist(tenantDbName, parentStoreId, body.substoreIds)

  const { options, ...rest } = body

  // Create the shell first so uploaded swatches can be foldered by its _id.
  const doc = await OptionSet.create({
    ...rest,
    alias,
    options: [],
    parentStoreId,
    createdBy: user._id,
    updatedBy: user._id,
  })

  if (options?.length) {
    doc.options = await normalizeOptions({ optionSetId: doc._id, options })
    await doc.save()
  }

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.optionSet.created",
    targetType: "OptionSet",
    targetId: doc._id,
    after: { name: doc.name, alias: doc.alias, optionCount: doc.optionCount },
  })

  return (await OptionSet.findById(doc._id).lean()) ?? doc.toObject()
}

export async function updateOptionSetDoc({ seller, tenantDbName, user, id, body, req }) {
  const { OptionSet } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await OptionSet.findOne({ _id: id, parentStoreId })
  if (!doc) throw new ApiError(404, "Option set not found")

  const before = { name: doc.name, alias: doc.alias, optionCount: doc.optionCount }

  if (body.alias || body.name) {
    const nextAlias = body.alias ?? doc.alias
    await assertAliasFree(OptionSet, parentStoreId, nextAlias, doc._id)
  }
  if (body.substoreIds) await assertSubstoresExist(tenantDbName, parentStoreId, body.substoreIds)

  const { options, ...rest } = body

  if (options) {
    const previousUrls = collectImageUrls(doc)
    doc.options = await normalizeOptions({ optionSetId: doc._id, options, previousUrls })
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
    action: "seller.optionSet.updated",
    targetType: "OptionSet",
    targetId: doc._id,
    before,
    after: { name: doc.name, alias: doc.alias, optionCount: doc.optionCount },
  })

  return (await OptionSet.findById(doc._id).lean()) ?? doc.toObject()
}

// DUPLICATE — clone a set (StoreHippo "duplicate"). Copies options/values but
// re-uploads swatches into the new set's folder so the two never share files.
export async function duplicateOptionSetDoc({ seller, tenantDbName, user, id, req }) {
  const { OptionSet } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const src = await OptionSet.findOne({ _id: id, parentStoreId, deletedAt: null }).lean()
  if (!src) throw new ApiError(404, "Option set not found")

  // Find a free "<name> (copy)" alias.
  const baseName = `${src.name} (copy)`
  let alias = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 200)
  let suffix = 1
  while (await OptionSet.findOne({ parentStoreId, alias, deletedAt: null }).collation({ locale: "en", strength: 2 })) {
    suffix += 1
    alias = `${alias}-${suffix}`.slice(0, 200)
  }

  const clone = await OptionSet.create({
    name: baseName.slice(0, 160),
    displayName: src.displayName ?? "",
    alias,
    parentStoreId,
    substoreIds: src.substoreIds ?? [],
    options: [],
    isActive: src.isActive !== false,
    createdBy: user._id,
    updatedBy: user._id,
  })

  // Re-map source options into the create payload shape and re-upload swatches
  // (a source url is copied by reference here, then re-anchored on save; because
  // we pass { url } it is retained as-is, but under the clone's own doc).
  const remapped = (src.options ?? []).map((opt) => ({
    name: opt.name,
    displayName: opt.displayName,
    type: opt.type,
    minCount: opt.minCount,
    maxCount: opt.maxCount,
    required: opt.required,
    defaultValue: opt.defaultValue,
    sortOrder: opt.sortOrder,
    showAlways: opt.showAlways,
    values: (opt.values ?? []).map((v) => ({
      label: v.label,
      value: v.value,
      priceDelta: v.priceDelta ?? {},
      sortOrder: v.sortOrder ?? 0,
      isDefault: Boolean(v.isDefault),
      ...(opt.type === "image" && v.image?.url ? { image: { url: v.image.url } } : {}),
    })),
  }))
  clone.options = await normalizeOptions({ optionSetId: clone._id, options: remapped })
  await clone.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.optionSet.duplicated",
    targetType: "OptionSet",
    targetId: clone._id,
    before: { sourceId: src._id, name: src.name },
    after: { name: clone.name, alias: clone.alias },
  })

  return (await OptionSet.findById(clone._id).lean()) ?? clone.toObject()
}

// SOFT DELETE — move the single doc into the trash.
export async function deleteOptionSetDoc({ seller, tenantDbName, user, id, req }) {
  const { OptionSet } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await OptionSet.findOne({ _id: id, parentStoreId, deletedAt: null })
  if (!doc) throw new ApiError(404, "Option set not found")

  doc.isDeleted = true
  doc.deletedAt = new Date()
  doc.deletedBy = user._id
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.optionSet.deleted",
    targetType: "OptionSet",
    targetId: doc._id,
    before: { name: doc.name, alias: doc.alias },
    after: { isDeleted: true },
  })

  return { ok: true, id: doc._id, isDeleted: true }
}

// RESTORE — bring a trashed set back; re-check alias uniqueness.
export async function restoreOptionSetDoc({ seller, tenantDbName, user, id, req }) {
  const { OptionSet } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await OptionSet.findOne({ _id: id, parentStoreId, deletedAt: { $ne: null } })
  if (!doc) throw new ApiError(404, "Deleted option set not found")

  await assertAliasFree(OptionSet, parentStoreId, doc.alias, doc._id)

  doc.isDeleted = false
  doc.deletedAt = null
  doc.deletedBy = null
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.optionSet.restored",
    targetType: "OptionSet",
    targetId: doc._id,
    after: { name: doc.name, alias: doc.alias },
  })

  return doc.toObject()
}

// PERMANENT DELETE — irreversible, only on an already-trashed set. Removes the
// doc and all its uploaded swatches. Blocked while products still reference it.
export async function destroyOptionSetDoc({ seller, tenantDbName, user, id, req }) {
  const { OptionSet } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const doc = await OptionSet.findOne({ _id: id, parentStoreId, deletedAt: { $ne: null } }).lean()
  if (!doc) throw new ApiError(404, "Deleted option set not found — soft delete it first")
  if ((doc.usageCount ?? 0) > 0) {
    throw new ApiError(409, "This option set is still attached to products — detach it first")
  }

  for (const url of collectImageUrls(doc)) {
    await deleteOptionSetImage({ optionSetId: doc._id, publicUrl: url })
  }
  await OptionSet.deleteOne({ _id: doc._id, parentStoreId })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.optionSet.destroyed",
    targetType: "OptionSet",
    targetId: doc._id,
    before: { name: doc.name, alias: doc.alias },
  })

  return { ok: true, removed: 1 }
}
