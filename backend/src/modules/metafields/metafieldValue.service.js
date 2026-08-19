import mongoose from "mongoose"
import { getTenantModels } from "../../config/tenantDb.js"
import { ApiError } from "../../utils/apiError.js"
import { deleteMetafieldDir } from "../../utils/uploads.js"
import { audit } from "../audit/audit.service.js"
import { persistMetafieldImages } from "./metafieldValue.uploads.js"
import { validateValuesAgainstDefinition } from "./metafieldValue.validation.js"

// Per-record VALUE operations. All run AFTER loadUser (seller + tenantDbName
// trusted, route gate applied) and are scoped by parentStoreId so one seller
// can never read another's values. See docs/METAFIELDS_SYSTEM_PLAN.md.

const oid = (v) => new mongoose.Types.ObjectId(String(v))

// Load the live definition for a module (needed to validate + version-stamp).
async function loadDefinition(MetafieldDefinition, parentStoreId, module) {
  const def = await MetafieldDefinition.findOne({ parentStoreId, module, deletedAt: null }).lean()
  if (!def) throw new ApiError(404, `No metafield definition for module "${module}"`)
  return def
}

// ---------------------------------------------------------------------------
// GET one record's values. Straight compound-index hit on
// { parentStoreId, module, recordId } — the fastest possible read.
// ---------------------------------------------------------------------------
export async function getRecordValues({ seller, tenantDbName, module, recordId }) {
  const { MetafieldValue } = getTenantModels(tenantDbName)
  const doc = await MetafieldValue.findOne({
    parentStoreId: oid(seller.mainStoreId),
    module,
    recordId: String(recordId),
  }).lean()

  return {
    module,
    recordId: String(recordId),
    data: doc?.data ?? {},
    definitionVersion: doc?.definitionVersion ?? null,
    exists: Boolean(doc),
  }
}

// ---------------------------------------------------------------------------
// UPSERT one record's values. Validates the submitted `data` against the live
// definition (recursive), extracts geopoints for the fixed-path 2dsphere
// index, then upserts on the unique { parentStoreId, module, recordId } key so
// re-saving the same record can never create a duplicate.
// ---------------------------------------------------------------------------
export async function saveRecordValues({ seller, tenantDbName, user, module, recordId, data, req }) {
  const { MetafieldDefinition, MetafieldValue } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const def = await loadDefinition(MetafieldDefinition, parentStoreId, module)

  const { ok, data: clean, geo, errors } = validateValuesAgainstDefinition(def.fields, data)
  if (!ok) {
    throw new ApiError(422, "Metafield values failed validation", { errors })
  }

  // Write any nested base64 metafield images to disk and drop files the prior
  // saved version no longer references. Owner-scoped under the sanitized module
  // + recordId so a record's assets live together and clean up on delete.
  const prior = await MetafieldValue.findOne(
    { parentStoreId, module, recordId: String(recordId) },
    { data: 1 },
  ).lean()
  await persistMetafieldImages({
    ownerType: module,
    ownerId: String(recordId),
    fields: def.fields,
    values: clean,
    previousValues: prior?.data,
  })

  const doc = await MetafieldValue.findOneAndUpdate(
    { parentStoreId, module, recordId: String(recordId) },
    {
      $set: {
        data: clean,
        geo,
        definitionId: def._id,
        definitionVersion: def.version ?? 1,
        updatedBy: user._id,
      },
      $setOnInsert: { parentStoreId, module, recordId: String(recordId), createdBy: user._id },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean()

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.metafieldValue.saved",
    targetType: "MetafieldValue",
    targetId: doc._id,
    after: { module, recordId: String(recordId), definitionVersion: doc.definitionVersion },
  })

  return { module, recordId: String(recordId), data: doc.data, definitionVersion: doc.definitionVersion }
}

// Delete one record's values (e.g. when the owning record is deleted).
export async function deleteRecordValues({ seller, tenantDbName, user, module, recordId, req }) {
  const { MetafieldValue } = getTenantModels(tenantDbName)
  const parentStoreId = oid(seller.mainStoreId)

  const res = await MetafieldValue.deleteOne({ parentStoreId, module, recordId: String(recordId) })

  // Remove all nested metafield images for this record in one shot.
  await deleteMetafieldDir({ ownerType: module, ownerId: String(recordId) })

  if (res.deletedCount) {
    await audit({
      req,
      actorId: user._id,
      actorRole: user.role,
      sellerId: seller._id,
      action: "seller.metafieldValue.deleted",
      targetType: "MetafieldValue",
      targetId: null,
      before: { module, recordId: String(recordId) },
    })
  }
  return { ok: true, removed: res.deletedCount }
}

// ---------------------------------------------------------------------------
// RESOLVE MANY — the N+1 killer for list views. Given a module and a batch of
// recordIds, fetch ALL their values in ONE aggregation and return a plain
// { [recordId]: data } map. The $match on { parentStoreId, module, recordId
// $in } is served directly by the compound unique index.
// ---------------------------------------------------------------------------
export async function resolveManyValues({ seller, tenantDbName, module, recordIds = [] }) {
  const { MetafieldValue } = getTenantModels(tenantDbName)
  const ids = [...new Set(recordIds.map(String))]
  if (ids.length === 0) return {}

  const rows = await MetafieldValue.aggregate([
    { $match: { parentStoreId: oid(seller.mainStoreId), module, recordId: { $in: ids } } },
    { $project: { _id: 0, recordId: 1, data: 1, definitionVersion: 1 } },
  ])

  const map = {}
  for (const r of rows) map[r.recordId] = { data: r.data, definitionVersion: r.definitionVersion }
  return map
}

// ---------------------------------------------------------------------------
// REUSABLE $lookup STAGE — this is what lets any module (categories, products,
// ...) join its metafield values in ONE query instead of a second round trip.
// It uses the let + sub-pipeline form (NOT localField/foreignField) with the
// inner $match on parentStoreId + module + recordId, so the join is served by
// the compound unique index. Splice the returned stages into that module's own
// aggregation, e.g.:
//
//   Category.aggregate([
//     { $match: { ... } },
//     ...buildMetafieldLookupStage({
//        parentStoreId, module: "ms.categories",
//        localRecordIdField: "_id", as: "metafields",
//     }),
//   ])
//
// `localRecordIdField` is compared as a STRING ({ $toString }) because recordId
// is stored as a string. Result is a single embedded object (or {} when none).
// ---------------------------------------------------------------------------
export function buildMetafieldLookupStage({
  parentStoreId,
  module,
  localRecordIdField = "_id",
  as = "metafields",
}) {
  return [
    {
      $lookup: {
        from: "metafieldValues",
        let: { rid: { $toString: `$${localRecordIdField}` } },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$parentStoreId", oid(parentStoreId)] },
                  { $eq: ["$module", module] },
                  { $eq: ["$recordId", "$$rid"] },
                ],
              },
            },
          },
          { $project: { _id: 0, data: 1, definitionVersion: 1 } },
        ],
        as,
      },
    },
    // Collapse the 0-or-1 array into a single object field for easy consumption.
    { $addFields: { [as]: { $ifNull: [{ $arrayElemAt: [`$${as}.data`, 0] }, {} ] } } },
  ]
}
