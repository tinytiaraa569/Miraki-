import mongoose from "mongoose"

// TENANT-DB SCHEMA: option sets live inside each seller's dedicated database.
//
// An Option Set is a REUSABLE template (e.g. "Gemstone Solitaire Pendant") that
// defines which options exist on a product and what values are allowed. It
// embeds `options[]`, and each option embeds `values[]`, so the whole set is a
// single document — one editor load, one save, one storefront projection (no
// $lookup, no N+1). Mirrors the Brand/Collection StoreHippo blocks (alias
// slugify, soft-delete, audit). See docs/OPTION_SETS_SYSTEM_PLAN.md §4.

// Image swatch for image-type values.
// IMPORTANT: store ONLY `url` — no `alt`, no other fields. The raw StoreHippo
// export carries `image: { url: "" }` on every value (even dropdowns); we do NOT
// replicate that. An `image` sub-document is persisted ONLY when the option's
// type is `image` AND a non-empty url exists (enforced in pre("save") below).
const valueImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { _id: false },
)

// Optional price adjustment applied when this value is selected.
const priceDeltaSchema = new mongoose.Schema(
  {
    mode: { type: String, enum: ["amount", "percent"], default: "amount" },
    amount: { type: Number, default: 0 }, // may be negative (discount)
  },
  { _id: false },
)

// One VALUE row (Label / Value / Image) — a choice inside an option.
const optionValueSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 200 },
    value: { type: String, required: true, trim: true, maxlength: 200 },
    // Omitted by default (NOT `null`) — so non-image values store no `image`
    // key. Only set for image-type options; stripped again in pre("save") if
    // the option type is not `image` or the url is empty.
    image: { type: valueImageSchema },
    priceDelta: { type: priceDeltaSchema, default: () => ({}) },
    sortOrder: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }, // keep _id so the editor can address a row for edit/delete
)

// One OPTION row (Name / Display name / Type / Values / …).
const optionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, lowercase: true, maxlength: 120 }, // "always use small case"
    displayName: { type: String, trim: true, maxlength: 200, default: "" },
    type: {
      type: String,
      enum: ["dropdown", "image", "swatch", "radio", "checkbox", "text", "textarea", "number"],
      default: "dropdown",
      required: true,
    },
    values: { type: [optionValueSchema], default: [] },
    minCount: { type: Number, min: 0, default: 0 },
    maxCount: { type: Number, min: 0, default: 0 }, // 0 = unbounded
    required: { type: Boolean, default: false },
    defaultValue: { type: String, trim: true, maxlength: 200, default: null },
    sortOrder: { type: Number, default: 0 },
    showAlways: { type: Boolean, default: false },
  },
  { _id: true },
)

export const optionSetSchema = new mongoose.Schema(
  {
    // ------------------------------------------------------------ identity
    name: { type: String, required: true, trim: true, maxlength: 160 },
    displayName: { type: String, trim: true, maxlength: 200, default: "" }, // present in the StoreHippo export
    alias: { type: String, trim: true, lowercase: true, maxlength: 200 },

    // Always the tenant's single MAIN store — stamped server-side.
    parentStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },

    // ------------------------------------------------------- substore scope
    // Which substores this option set is available in. Mirrors Collections'
    // `substoreIds` exactly: EMPTY = available in ALL substores; otherwise
    // restricted to the listed substore ids (tenant-db `substores` collection).
    substoreIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },

    // ------------------------------------------------------------ payload
    options: { type: [optionSchema], default: [] },

    // Denormalized rollups so the LIST never has to walk options[] in JS:
    //   optionCount   -> the "9 records" badge
    //   optionSummary -> the comma-joined display names shown under the count
    // Both are recomputed in the pre("save") hook below.
    optionCount: { type: Number, default: 0 },
    optionSummary: { type: [String], default: [] },

    // How many products currently reference this set (maintained on attach/detach).
    usageCount: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },

    // ------------------------------------------------------------ audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },

    // -------------------------------------------------------- soft delete
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true },
)

// Covered list: tenant + not-deleted, sorted by name; alias uniqueness; trash.
optionSetSchema.index({ parentStoreId: 1, deletedAt: 1, name: 1 })
optionSetSchema.index({ parentStoreId: 1, alias: 1 }, { unique: true, sparse: true })
// Substore-scoped storefront/list lookups (multikey on the id array).
optionSetSchema.index({ parentStoreId: 1, substoreIds: 1, deletedAt: 1 })

// Slugify alias from name when blank (identical rule to brands/collections).
optionSetSchema.pre("validate", function (next) {
  if (!this.alias && this.name) {
    this.alias = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 200)
  }
  next()
})

// Normalize the payload, then recompute the denormalized rollups on every save.
optionSetSchema.pre("save", function (next) {
  for (const opt of this.options ?? []) {
    const isImage = opt.type === "image"
    for (const val of opt.values ?? []) {
      // Strip the image sub-doc unless this is an image option with a real url.
      // Guarantees we never persist `image: { url: "" }` (the export noise) on
      // dropdown/radio/text/etc. values.
      if (!isImage || !val.image?.url?.trim()) {
        val.image = undefined
      }
    }
  }
  this.optionCount = this.options?.length ?? 0
  this.optionSummary = (this.options ?? []).map((o) => o.displayName || o.name)
  next()
})
