import mongoose from "mongoose"

// TENANT-DB SCHEMA: the RULE layer of the StoreHippo-style two-layer model.
// A StoreVariant decides WHICH substore/settings a visitor gets:
//   IF conditions match (e.g. location_countries: DK,FR,DE)
//   THEN apply action (theme / currency / language / optional substoreId).
// `action.substoreId` empty = settings-only variant (stay on the MAIN store).
// Precedence: lower `sortOrder` wins when multiple variants match.
export const storeVariantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    sortOrder: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },

    conditions: {
      type: {
        type: String,
        enum: ["location_countries", "domain", "path", "manual"],
        default: "location_countries",
      },
      locationCountries: { type: [String], default: [] }, // ISO-2, uppercase
      domains: { type: [String], default: [] },
      pathPrefix: { type: String, trim: true, maxlength: 60, default: null },
    },

    action: {
      substoreId: { type: mongoose.Schema.Types.ObjectId, ref: "Substore", default: null },
      themeId: { type: String, trim: true, maxlength: 80, default: null },
      // Canvas UI id — which canvas/page-builder layout is shown to visitors
      // matched by this rule (per-substore / per-country storefront UI).
      canvasId: { type: String, trim: true, maxlength: 80, default: null },
      currency: { type: String, trim: true, uppercase: true, maxlength: 3, default: null },
      language: { type: String, trim: true, lowercase: true, maxlength: 10, default: null },
      rtl: { type: Boolean, default: null },
    },

    // Soft delete ("trash"): deleted variants are hidden from normal lists and
    // skipped by the storefront resolver, restorable from the trash view.
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true },
)

storeVariantSchema.index({ sortOrder: 1 })
storeVariantSchema.index({ "conditions.locationCountries": 1 })

storeVariantSchema.pre("validate", function (next) {
  if (Array.isArray(this.conditions?.locationCountries)) {
    this.conditions.locationCountries = this.conditions.locationCountries.map((c) =>
      String(c).toUpperCase().slice(0, 2),
    )
  }
  next()
})
