import mongoose from "mongoose"

// TENANT-DB SCHEMA: metafield definitions live inside each seller's dedicated
// database, in a `metafieldDefinitions` collection.
//
// A Metafield Definition is a StoreHippo-style schema BOUND TO A MODULE
// (`ms.categories`, `ms.products`, `ms.optionsets`, ...). It holds an ordered,
// arbitrarily-nestable list of Fields. Each field has TWO independent type
// layers plus a settings block:
//
//   dataType  -> how the value is STORED / validated
//                (string | integer | number | boolean | datetime | file |
//                 geopoint | object | array)
//   editType  -> which INPUT WIDGET renders in the form
//                (text | select | checkbox | color | html | ...)
//   settings  -> validation, visibility, permissions, events, formatter
//
// The whole definition is ONE document (like Option Sets): one editor load, one
// save, one projection — no $lookup, no N+1. See docs/METAFIELDS_SYSTEM_PLAN.md.

// Supported STORAGE data types.
export const DATA_TYPES = [
  "string",
  "integer",
  "number",
  "boolean",
  "datetime",
  "file",
  "geopoint",
  "object",
  "array",
]

// Supported INPUT widgets (from the StoreHippo "Edit Type" dropdown). This is
// the FULL union of every widget across all data types; which subset is offered
// for a given data type is decided in the UI (EDIT_TYPES_BY_DATA_TYPE in
// metafield-utils.js). Keep this list a superset of everything the UI can pick.
export const EDIT_TYPES = [
  "alias",
  "autocomplete",
  "autocomplete2",
  "category",
  "checkbox",
  "code",
  "collection",
  "color",
  "country",
  "createfile",
  "customfile",
  "date",
  "datetime",
  "email",
  "feature",
  "file",
  "formfields",
  "geopoint",
  "gradient",
  "html",
  "length",
  "multiautocomplete",
  "multicheckbox",
  "multiselect",
  "number",
  "optionsvalue",
  "otp",
  "password",
  "paymentmodesettings",
  "phone",
  "price",
  "radio",
  "select",
  "slug",
  "states",
  "taxvariants",
  "text",
  "textarea",
  "video",
  "weight",
  "widget",
]

// One row in the Validation table (Rule / Param / Message).
const validationRuleSchema = new mongoose.Schema(
  {
    rule: { type: String, trim: true, maxlength: 60 },
    param: { type: String, trim: true, maxlength: 500, default: "" },
    message: { type: String, trim: true, maxlength: 300, default: "" },
  },
  { _id: false },
)

// One row in the "Show On" table — this field shows only when another field's
// value satisfies the operator. `showOnOperator` (on settings) joins the rows.
const showOnSchema = new mongoose.Schema(
  {
    field: { type: String, trim: true, maxlength: 120 },
    value: { type: String, trim: true, maxlength: 500, default: "" },
    operator: {
      type: String,
      enum: ["eq", "ne", "gt", "gte", "lt", "lte", "in", "nin", "contains", "exists"],
      default: "eq",
    },
  },
  { _id: false },
)

// One row in the Events table (Event / Handler).
const eventSchema = new mongoose.Schema(
  {
    event: { type: String, trim: true, maxlength: 60 },
    handler: { type: String, trim: true, maxlength: 2000, default: "" },
  },
  { _id: false },
)

// A single choice for select / radio edit types.
const choiceSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 200 },
    value: { type: String, trim: true, maxlength: 200 },
  },
  { _id: false },
)

// The full per-field settings block (the gear panel).
const fieldSettingsSchema = new mongoose.Schema(
  {
    // Behavior & validation
    validations: { type: [validationRuleSchema], default: [] },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    example: { type: String, trim: true, maxlength: 2000, default: "" },
    required: { type: Boolean, default: false },
    defaultValue: { type: String, trim: true, maxlength: 2000, default: "" },
    defaultMobile: { type: String, trim: true, maxlength: 2000, default: "" },
    formatter: { type: String, maxlength: 20000, default: "" },

    // Visibility & permissions
    hidden: { type: Boolean, default: false },
    addHidden: { type: Boolean, default: false },
    editHidden: { type: Boolean, default: false },
    hideForSeller: { type: Boolean, default: false },
    hideForSellerManager: { type: Boolean, default: false },
    readOnly: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    deprecated: { type: Boolean, default: false },
    encrypt: { type: Boolean, default: false },

    // Conditional display
    showOn: { type: [showOnSchema], default: [] },
    showOnOperator: { type: String, enum: ["AND", "OR"], default: "AND" },

    // Events
    events: { type: [eventSchema], default: [] },

    // Presentation
    label: { type: String, trim: true, maxlength: 200, default: "" },
    tooltip: { type: String, trim: true, maxlength: 500, default: "" },
    level: { type: String, trim: true, maxlength: 60, default: "" },
    settingType: { type: String, trim: true, maxlength: 60, default: "" },
    configurable: { type: Boolean, default: false },
    hideDeviceToggle: { type: Boolean, default: false },

    // Relation source (autocomplete / autocomplete2 / multiautocomplete /
    // category / collection edit types). `entity` is the linked module stored
    // PLAIN, without an ms. prefix (e.g. "collections"). valueField/labelField
    // are the linked model's columns to store/show. `source` toggles between
    // the entity's /options feed and a custom `sourceFunction` body.
    entity: { type: String, trim: true, maxlength: 120, default: "" },
    valueField: { type: String, trim: true, maxlength: 120, default: "" },
    labelField: { type: String, trim: true, maxlength: 120, default: "" },
    source: { type: String, enum: ["entity", "function"], default: "entity" },
    sourceFunction: { type: String, maxlength: 20000, default: "" },

    // Choices for select / radio.
    options: { type: [choiceSchema], default: [] },
  },
  { _id: false },
)

// One FIELD. RECURSIVE: `children[]` holds sub-fields for `object` and
// `array`-of-`object`. Mongoose supports self-reference via `.add()` below.
const fieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true, lowercase: true, maxlength: 80 },
    label: { type: String, trim: true, maxlength: 200, default: "" },
    dataType: { type: String, enum: DATA_TYPES, required: true, default: "string" },
    // For arrays: the type of each item. `object` means the item shape is the
    // field's own `children[]` (the "Add more records" repeater).
    itemType: { type: String, enum: DATA_TYPES, default: null },
    editType: { type: String, enum: EDIT_TYPES, default: "text" },
    order: { type: Number, default: 0 },
    settings: { type: fieldSettingsSchema, default: () => ({}) },
  },
  { _id: true }, // keep _id so the editor can address a row for edit / delete
)
// Self-reference: a field can contain child fields to any depth.
fieldSchema.add({ children: { type: [fieldSchema], default: [] } })

export const metafieldDefinitionSchema = new mongoose.Schema(
  {
    // ------------------------------------------------------------ identity
    // The bound module, e.g. "ms.categories". Unique per tenant.
    module: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    label: { type: String, trim: true, maxlength: 200, default: "" },
    description: { type: String, trim: true, maxlength: 2000, default: "" },

    // Bumped whenever fields[] changes, so saved values can record which schema
    // version they were entered against (phase 2).
    version: { type: Number, default: 1 },

    // Always the tenant's single MAIN store — stamped server-side.
    parentStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },

    // ------------------------------------------------------------ payload
    fields: { type: [fieldSchema], default: [] },

    // Denormalized so the LIST never walks fields[] in JS (the count badge).
    fieldCount: { type: Number, default: 0 },

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

// One definition per module per tenant; also the covered list match + sort.
metafieldDefinitionSchema.index({ parentStoreId: 1, module: 1 }, { unique: true })
metafieldDefinitionSchema.index({ parentStoreId: 1, deletedAt: 1, module: 1 })

// Recompute the denormalized top-level field count on every save.
metafieldDefinitionSchema.pre("save", function (next) {
  this.fieldCount = this.fields?.length ?? 0
  next()
})
