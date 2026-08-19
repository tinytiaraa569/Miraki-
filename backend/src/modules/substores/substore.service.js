import mongoose from "mongoose"
import { getTenantModels } from "../../config/tenantDb.js"
import { ApiError } from "../../utils/apiError.js"
import { deleteSellerImage, saveSellerImage } from "../../utils/uploads.js"
import { audit } from "../audit/audit.service.js"

// All functions run AFTER loadUser: seller + tenantDbName are trusted,
// and the route gate already restricted access to SELLER_SUPERADMIN.

function assertMultistore(seller) {
  if (!seller.multistoreEnabled) {
    throw new ApiError(403, "Multistore is not enabled for this seller. Contact the platform administrator.")
  }
}

const SORTS = {
  sortOrder: { sortOrder: 1, createdAt: 1 },
  "-sortOrder": { sortOrder: -1, createdAt: -1 },
  name: { name: 1 },
  "-name": { name: -1 },
  createdAt: { createdAt: 1 },
  "-createdAt": { createdAt: -1 },
}

// ---------------------------------------------------------------------------
// LIST — single aggregation round-trip: filter + sort + paginate + total,
// projecting ONLY the columns the table renders (no heavy nested payloads).
// ---------------------------------------------------------------------------
export async function listSubstores({ seller, tenantDbName, query }) {
  assertMultistore(seller)
  const { Substore } = getTenantModels(tenantDbName)

  const page = query.page ?? 1
  const limit = query.limit ?? 20
  const match = {
    parentStoreId: new mongoose.Types.ObjectId(String(seller.mainStoreId)),
    // Trash view lists only soft-deleted rows; normal view hides them.
    deletedAt: query.deleted ? { $ne: null } : null,
  }
  if (query.q) {
    // Escape regex metacharacters — the search box must never become a regex injection.
    match.name = { $regex: query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" }
  }
  if (query.status) match.status = query.status

  const [result] = await Substore.aggregate([
    { $match: match },
    { $sort: SORTS[query.sort ?? "sortOrder"] },
    {
      $facet: {
        rows: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              name: 1,
              alias: 1,
              sortOrder: 1,
              status: 1,
              isDefault: 1,
              countryCodes: 1,
              // Effective currency: explicit substore currency, else the
              // substore settings' default — so the list/pickers always get one.
              currency: { $ifNull: ["$currency", "$settings.defaultCurrency"] },
              defaultLanguage: { $ifNull: ["$defaultLanguage", "$settings.defaultLanguage"] },
              maintenanceMode: 1,
              logoUrl: "$settings.logoUrl",
              storeName: "$settings.storeName",
              isDeleted: 1,
              deletedAt: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
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

// ---------------------------------------------------------------------------
// OPTIONS — ultra-lean list for pickers/dropdowns. Returns ONLY _id, name and
// alias for the seller's live (non-deleted, active) substores, paginated so a
// picker can lazy-load 5 at a time. Deliberately touches no nested settings /
// SEO / analytics payloads, so it stays cheap even with many substores.
// ---------------------------------------------------------------------------
export async function listSubstoreOptions({ seller, tenantDbName, query }) {
  assertMultistore(seller)
  const { Substore } = getTenantModels(tenantDbName)

  const parentStoreId = new mongoose.Types.ObjectId(String(seller.mainStoreId))

  // ID lookup — resolve labels for a known set (e.g. the substores already
  // attached to a brand). Not paginated and includes soft-deleted rows so a
  // selected chip always shows a readable name. Still scoped to this seller.
  if (query.ids?.length) {
    const rows = await Substore.find({
      parentStoreId,
      _id: { $in: query.ids.map((id) => new mongoose.Types.ObjectId(id)) },
    })
      .select({ _id: 1, name: 1, alias: 1 })
      .sort({ name: 1 })
      .lean()
    return { rows, total: rows.length, page: 1, limit: rows.length }
  }

  const page = query.page ?? 1
  const limit = query.limit ?? 5
  const match = {
    parentStoreId,
    deletedAt: null,
  }
  if (query.q) {
    match.name = { $regex: query.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" }
  }

  const [result] = await Substore.aggregate([
    { $match: match },
    { $sort: { name: 1 } },
    {
      $facet: {
        rows: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          { $project: { _id: 1, name: 1, alias: 1 } },
        ],
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

export async function getSubstore({ seller, tenantDbName, id }) {
  assertMultistore(seller)
  const { Substore } = getTenantModels(tenantDbName)
  const doc = await Substore.findOne({ _id: id, parentStoreId: seller.mainStoreId }).lean()
  if (!doc) throw new ApiError(404, "Substore not found")
  return doc
}

// Base64 image slots inside `settings` → written to uploads/, URL persisted.
const IMAGE_SLOTS = [
  { data: "logoBase64", remove: "removeLogo", field: "logoUrl" },
  { data: "mobileLogoBase64", remove: "removeMobileLogo", field: "mobileLogoUrl" },
  { data: "faviconBase64", remove: "removeFavicon", field: "faviconUrl" },
]

async function applySettingsImages({ sellerId, incomingSettings, currentSettings }) {
  const resolved = { ...incomingSettings }
  for (const slot of IMAGE_SLOTS) {
    if (resolved[slot.data]) {
      const oldUrl = currentSettings?.[slot.field]
      resolved[slot.field] = await saveSellerImage({ sellerId, dataUrl: resolved[slot.data], folder: "substore" })
      if (oldUrl) await deleteSellerImage({ sellerId, publicUrl: oldUrl })
    } else if (resolved[slot.remove] === true && currentSettings?.[slot.field]) {
      await deleteSellerImage({ sellerId, publicUrl: currentSettings[slot.field] })
      resolved[slot.field] = null
    }
    delete resolved[slot.data]
    delete resolved[slot.remove]
  }
  return resolved
}

// Only one default substore per parent — flipping one on flips the rest off.
async function clearOtherDefaults(Substore, parentStoreId, exceptId) {
  await Substore.updateMany(
    { parentStoreId, isDefault: true, ...(exceptId ? { _id: { $ne: exceptId } } : {}) },
    { $set: { isDefault: false } },
  )
}

export async function createSubstoreDoc({ seller, tenantDbName, user, body, req }) {
  assertMultistore(seller)
  const { Substore } = getTenantModels(tenantDbName)

  const clash = await Substore.findOne({
    parentStoreId: seller.mainStoreId,
    name: body.name.trim(),
    deletedAt: null,
  }).collation({
    locale: "en",
    strength: 2,
  })
  if (clash) throw new ApiError(409, "A substore with this name already exists")

  const settings = body.settings
    ? await applySettingsImages({ sellerId: seller._id, incomingSettings: body.settings, currentSettings: null })
    : undefined

  if (body.isDefault === true) await clearOtherDefaults(Substore, seller.mainStoreId, null)

  const doc = await Substore.create({
    ...body,
    ...(settings ? { settings } : {}),
    assignedSellerId: body.assignedSellerId || null,
    parentStoreId: seller.mainStoreId,
    createdBy: user._id,
    updatedBy: user._id,
  })

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.substore.created",
    targetType: "Substore",
    targetId: doc._id,
    after: { name: doc.name, alias: doc.alias, status: doc.status },
  })

  return doc.toObject()
}

export async function updateSubstoreDoc({ seller, tenantDbName, user, id, body, req }) {
  assertMultistore(seller)
  const { Substore } = getTenantModels(tenantDbName)

  const doc = await Substore.findOne({ _id: id, parentStoreId: seller.mainStoreId })
  if (!doc) throw new ApiError(404, "Substore not found")

  const before = { name: doc.name, alias: doc.alias, status: doc.status }

  if (body.name) {
    const clash = await Substore.findOne({
      _id: { $ne: doc._id },
      parentStoreId: seller.mainStoreId,
      name: body.name.trim(),
      deletedAt: null,
    }).collation({ locale: "en", strength: 2 })
    if (clash) throw new ApiError(409, "A substore with this name already exists")
  }

  const { settings: incomingSettings, ...rest } = body

  if (incomingSettings) {
    const resolved = await applySettingsImages({
      sellerId: seller._id,
      incomingSettings,
      currentSettings: doc.settings,
    })
    // Merge: unspecified settings keys keep their stored values.
    doc.settings = { ...(doc.settings?.toObject?.() ?? doc.settings ?? {}), ...resolved }
  }

  for (const [key, value] of Object.entries(rest)) {
    if (key === "launchDate") {
      doc.launchDate = value ? new Date(value) : null
    } else if (key === "assignedSellerId") {
      doc.assignedSellerId = value || null
    } else {
      doc[key] = value
    }
  }
  doc.updatedBy = user._id

  if (body.isDefault === true) await clearOtherDefaults(Substore, seller.mainStoreId, doc._id)

  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.substore.updated",
    targetType: "Substore",
    targetId: doc._id,
    before,
    after: { name: doc.name, alias: doc.alias, status: doc.status },
  })

  return doc.toObject()
}

// SOFT DELETE — moves the substore to the trash. Variants are detached
// immediately (a hidden substore must not receive traffic), but uploaded
// assets are kept so a restore brings everything back intact.
export async function deleteSubstoreDoc({ seller, tenantDbName, user, id, req }) {
  assertMultistore(seller)
  const { Substore, StoreVariant } = getTenantModels(tenantDbName)

  const doc = await Substore.findOne({ _id: id, parentStoreId: seller.mainStoreId, deletedAt: null })
  if (!doc) throw new ApiError(404, "Substore not found")

  // Detach any variants pointing at this substore (they become settings-only).
  await StoreVariant.updateMany({ "action.substoreId": doc._id }, { $set: { "action.substoreId": null } })

  doc.isDeleted = true
  doc.deletedAt = new Date()
  doc.deletedBy = user._id
  doc.isDefault = false // a trashed substore can never be the default
  doc.updatedBy = user._id
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.substore.deleted",
    targetType: "Substore",
    targetId: doc._id,
    before: { name: doc.name, alias: doc.alias },
    after: { isDeleted: true },
  })

  return { ok: true, id: doc._id, isDeleted: true }
}

// RESTORE — brings a soft-deleted substore back. If its name now clashes
// with a live substore (created while it sat in the trash), restore fails.
export async function restoreSubstoreDoc({ seller, tenantDbName, user, id, req }) {
  assertMultistore(seller)
  const { Substore } = getTenantModels(tenantDbName)

  const doc = await Substore.findOne({ _id: id, parentStoreId: seller.mainStoreId, deletedAt: { $ne: null } })
  if (!doc) throw new ApiError(404, "Deleted substore not found")

  const clash = await Substore.findOne({
    _id: { $ne: doc._id },
    parentStoreId: seller.mainStoreId,
    name: doc.name,
    deletedAt: null,
  }).collation({ locale: "en", strength: 2 })
  if (clash) throw new ApiError(409, "A live substore with this name already exists — rename it first")

  doc.isDeleted = false
  doc.deletedAt = null
  doc.deletedBy = null
  doc.updatedBy = user._id
  await doc.save()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.substore.restored",
    targetType: "Substore",
    targetId: doc._id,
    after: { name: doc.name, alias: doc.alias },
  })

  return doc.toObject()
}

// PERMANENT DELETE — irreversible. Only allowed on substores already in the
// trash, and cleans up uploaded assets before removing the row.
export async function destroySubstoreDoc({ seller, tenantDbName, user, id, req }) {
  assertMultistore(seller)
  const { Substore } = getTenantModels(tenantDbName)

  const doc = await Substore.findOne({ _id: id, parentStoreId: seller.mainStoreId, deletedAt: { $ne: null } })
  if (!doc) throw new ApiError(404, "Deleted substore not found — soft delete it first")

  for (const field of ["logoUrl", "mobileLogoUrl", "faviconUrl"]) {
    if (doc.settings?.[field]) await deleteSellerImage({ sellerId: seller._id, publicUrl: doc.settings[field] })
  }

  await doc.deleteOne()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.substore.destroyed",
    targetType: "Substore",
    targetId: doc._id,
    before: { name: doc.name, alias: doc.alias },
  })

  return { ok: true }
}
