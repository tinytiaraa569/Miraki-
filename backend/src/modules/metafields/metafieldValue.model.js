import mongoose from "mongoose"

// TENANT-DB SCHEMA: the per-record VALUES entered against a metafield
// definition. Definitions (metafield.model.js) say "the ms.categories module
// HAS these fields"; VALUES say "the category `Rings` saved THIS data into
// them". Kept in a SEPARATE collection so the base module documents stay lean
// and the schema can change without migrating every record.
//
//   definition : one per module  (ms.categories)          -> metafieldDefinitions
//   value      : one per record  (category `Rings` id)     -> metafieldValues
//
// The hot access key is { parentStoreId, module, recordId } — the exact shape
// of the resolving $lookup — so it is a compound UNIQUE index (one value doc
// per record per module). See docs/METAFIELDS_SYSTEM_PLAN.md.

// A single geopoint pulled out of `data` during validation and flattened here
// so a FIXED-PATH 2dsphere index can serve geo queries. `data` itself is Mixed
// (its shape is dynamic per definition) and cannot carry a 2dsphere index, so
// every geopoint field's value is mirrored into geo[] as { path, point }.
const geoEntrySchema = new mongoose.Schema(
  {
    // Dot-path of the field inside `data`, e.g. "store_location" or
    // "branches.0.location" — lets a query know which field matched.
    path: { type: String, required: true },
    point: {
      type: { type: String, enum: ["Point"], default: "Point" },
      // GeoJSON order: [longitude, latitude].
      coordinates: { type: [Number], required: true },
    },
  },
  { _id: false },
)

export const metafieldValueSchema = new mongoose.Schema(
  {
    // Tenant scope — the seller's single main store. Stamped server-side.
    parentStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },

    // The bound module, e.g. "ms.categories" (matches the definition).
    module: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 },

    // The specific record these values belong to (a category / product id).
    // Stored as a STRING so the compound key has one stable type regardless of
    // whether the owning module uses ObjectIds, slugs, or numeric ids.
    recordId: { type: String, required: true, trim: true, maxlength: 120 },

    // Which definition + schema version this data was entered against, so a
    // later schema change is detectable (data can be re-validated / migrated).
    definitionId: { type: mongoose.Schema.Types.ObjectId, ref: "MetafieldDefinition", default: null },
    definitionVersion: { type: Number, default: 1 },

    // The actual nested values, shape dictated by the definition's fields[].
    data: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Flattened geopoints for the fixed-path 2dsphere index (see above).
    geo: { type: [geoEntrySchema], default: [] },

    // ------------------------------------------------------------ audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true, minimize: false },
)

// The exact key every read/write uses — one value doc per record per module.
metafieldValueSchema.index({ parentStoreId: 1, module: 1, recordId: 1 }, { unique: true })
// Fixed-path geo index: geo queries hit geo.point, never the dynamic `data`.
metafieldValueSchema.index({ parentStoreId: 1, module: 1, "geo.point": "2dsphere" })
