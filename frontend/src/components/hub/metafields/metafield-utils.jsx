// Shared constants + helpers for the Metafields editor. Kept IN SYNC with the
// backend model (metafield.model.js) and validation (metafield.validation.js):
//   dataType  -> how the value is stored/validated
//   editType  -> which input widget renders in the form
//   settings  -> the per-field gear panel (validation, visibility, events, ...)
//
// A metafield definition is ONE document with a recursive fields[] tree, so the
// whole thing is loaded, edited and saved in a single round trip.

// ---------------------------------------------------------------- data types
// Mirror of DATA_TYPES in the backend model. `hint` powers the dropdown help.
export const DATA_TYPES = [
  { value: "string", label: "string", hint: "Text value" },
  { value: "integer", label: "integer", hint: "Whole number" },
  { value: "number", label: "number", hint: "Decimal number" },
  { value: "boolean", label: "boolean", hint: "True / false" },
  { value: "datetime", label: "datetime", hint: "Date & time" },
  { value: "file", label: "file", hint: "Uploaded file / image" },
  { value: "geopoint", label: "geopoint", hint: "Latitude / longitude" },
  { value: "object", label: "object", hint: "A group of nested fields" },
  { value: "array", label: "array", hint: "A repeating list of items" },
]

// Types that carry a children[] tree.
export const CONTAINER_TYPES = new Set(["object", "array"])

// ---------------------------------------------------------------- edit types
// Full union of every widget the UI can offer. Must stay a subset of the
// backend EDIT_TYPES enum (metafield.model.js) so a save is never rejected.
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

// Which Edit Type widgets are valid for each data type. The Edit Type dropdown
// shows ONLY this subset, so picking `integer` no longer offers file/geopoint
// widgets, etc. The first entry of each list is used as the default when the
// data type changes and the current widget is no longer valid.
export const EDIT_TYPES_BY_DATA_TYPE = {
  string: [
    "text",
    "textarea",
    "checkbox",
    "radio",
    "select",
    "multiselect",
    "multicheckbox",
    "autocomplete",
    "length",
    "price",
    "weight",
    "email",
    "password",
    "phone",
    "slug",
    "html",
    "code",
    "color",
    "country",
    "states",
    "gradient",
    "alias",
    "otp",
    "widget",
  ],
  integer: ["text", "number", "checkbox", "select", "radio", "paymentmodesettings", "taxvariants", "formfields", "widget"],
  number: ["text", "number", "select", "radio", "price", "weight", "length", "multiselect", "multiautocomplete", "widget"],
  boolean: ["checkbox", "radio", "select", "widget"],
  datetime: ["datetime", "date", "widget"],
  file: ["file", "createfile", "customfile", "video", "widget"],
  geopoint: ["geopoint", "widget"],
  object: ["collection", "optionsvalue", "paymentmodesettings", "taxvariants", "formfields", "feature", "widget"],
  array: [
    "text",
    "collection",
    "checkbox",
    "radio",
    "select",
    "multiselect",
    "multicheckbox",
    "multiautocomplete",
    "autocomplete",
    "category",
    "feature",
    "price",
    "widget",
  ],
}

// The widgets valid for a field's data type (falls back to the full list for
// any unknown data type). Always includes the field's current editType so a
// pre-existing/legacy value never disappears from the dropdown.
export function editTypesForField(field) {
  const base = EDIT_TYPES_BY_DATA_TYPE[field?.dataType] ?? EDIT_TYPES
  const current = field?.editType
  return current && !base.includes(current) ? [current, ...base] : base
}

// The default widget to use when a data type (or an array's item type) is
// (re)selected. An `array` of `object` is a repeater of structured records, so
// it defaults to `collection`; every other type uses its list's first entry.
export function defaultEditTypeForDataType(dataType, itemType) {
  if (dataType === "array" && itemType === "object") return "collection"
  return EDIT_TYPES_BY_DATA_TYPE[dataType]?.[0] ?? "text"
}

// Item types a `array` field can hold. `object` turns on the nested repeater.
export const ITEM_TYPES = DATA_TYPES.filter((t) => t.value !== "array")

// Show-On operators — mirror of the backend enum.
export const SHOW_ON_OPERATORS = [
  { value: "eq", label: "equals" },
  { value: "ne", label: "not equals" },
  { value: "gt", label: "greater than" },
  { value: "gte", label: "greater or equal" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "less or equal" },
  { value: "in", label: "in list" },
  { value: "nin", label: "not in list" },
  { value: "contains", label: "contains" },
  { value: "exists", label: "exists" },
]

export const SHOW_ON_JOINERS = [
  { value: "AND", label: "Match ALL rules (AND)" },
  { value: "OR", label: "Match ANY rule (OR)" },
]

export function dataTypeHint(value) {
  return DATA_TYPES.find((t) => t.value === value)?.hint ?? ""
}

// True when a field owns a nested children[] tree in the UI:
//   object            -> always
//   array of objects  -> the "Add more records" repeater
export function hasChildren(field) {
  if (!field) return false
  if (field.dataType === "object") return true
  return field.dataType === "array" && field.itemType === "object"
}

// ------------------------------------------------------------------ modules
// The bindable modules a metafield can attach to. `value` is the ms.<snake>
// binding stored on the document; `label` is the human name shown in the Name
// dropdown. A module is UNIQUE per tenant (see the backend unique index), so
// once a definition exists for it the option is disabled in create mode.
export const MODULES = [
  { value: "ms.products", label: "Products" },
  { value: "ms.categories", label: "Categories" },
  { value: "ms.collections", label: "Collections" },
  { value: "ms.brands", label: "Brands" },
  { value: "ms.option_sets", label: "Option sets" },
  { value: "ms.orders", label: "Orders" },
  { value: "ms.customers", label: "Customers" },
  { value: "ms.pages", label: "Pages" },
  { value: "ms.coupons", label: "Coupons" },
  { value: "ms.reviews", label: "Reviews" },
]

// Friendly label for a module value; falls back to the raw binding so unknown
// (e.g. legacy) modules still render sensibly in edit mode.
export function moduleLabel(value) {
  return MODULES.find((m) => m.value === value)?.label ?? value ?? ""
}

// The module name must look like ms.<snake_case> (matches the backend regex).
export function normalizeModule(value) {
  const raw = String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._]+/g, "_")
  if (!raw) return ""
  return raw.startsWith("ms.") ? raw : `ms.${raw.replace(/^ms\.?/, "")}`
}

export function isValidModule(value) {
  return /^ms\.[a-z0-9_]+$/.test(String(value ?? ""))
}

// ---------------------------------------------------------------- entities
// Edit types whose VALUE is a reference to record(s) in another module. For
// these the gear panel shows an "Entity source" selector (WHICH module to link
// to, stored on settings.entity) and the value form renders a searchable
// EntityPicker instead of a plain input. `multiautocomplete` is the multi
// variant (stores an array); the rest store a single reference.
//
// NOTE: `collection` is intentionally NOT here. In this admin a `collection`
// edit type is a REPEATER of structured child records (an "Add more records"
// list of objects like image / title / subtitle / url / sort_order), not a
// link to the store's Collections module — so it renders the array/object
// repeater and shows no relation settings.
export const ENTITY_EDIT_TYPES = new Set([
  "autocomplete",
  "autocomplete2",
  "multiautocomplete",
  "category",
])

export function isEntityEditType(editType) {
  return ENTITY_EDIT_TYPES.has(editType)
}

// The linkable entities that expose a lean `/options` picker feed
// ({ rows:[{ _id, name, alias }], total }) supporting `q` / `page` / `limit` /
// `ids`. `value` is stored PLAIN (no ms. prefix) on settings.entity. `fields`
// are the model columns offered in the Value Field / Label Field dropdowns —
// they come from each entity's Mongoose model (product/category/… .model.js),
// NOT from the metafield definition.
export const ENTITY_SOURCES = [
  { value: "products", label: "Products", endpoint: "/seller/products/options", fields: ["_id", "name", "alias", "sku"] },
  { value: "categories", label: "Categories", endpoint: "/seller/categories/options", fields: ["_id", "name", "alias"] },
  { value: "collections", label: "Collections", endpoint: "/seller/collections/options", fields: ["_id", "name", "alias"] },
  { value: "brands", label: "Brands", endpoint: "/seller/brands/options", fields: ["_id", "name", "alias"] },
  { value: "option_sets", label: "Option sets", endpoint: "/seller/option-sets/options", fields: ["_id", "name", "displayName", "alias"] },
]

// Accept both the new plain form ("collections") and any legacy ms.-prefixed
// value ("ms.collections") so existing saved definitions keep resolving.
export function normalizeEntity(value) {
  return String(value ?? "").trim().replace(/^ms\./, "")
}

export function entitySource(value) {
  const v = normalizeEntity(value)
  return ENTITY_SOURCES.find((e) => e.value === v) ?? null
}

// The picker endpoint for a stored entity binding, or null when unset/unknown.
export function endpointForEntity(value) {
  return entitySource(value)?.endpoint ?? null
}

// The model fields available for the Value / Label Field dropdowns.
export function fieldsForEntity(value) {
  return entitySource(value)?.fields ?? ["_id", "name", "alias"]
}

// Field key: lowercase letters / numbers / underscore.
export function slugKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

// ---------------------------------------------------------- default settings
// Every key here matches the strict backend settings schema — nothing extra is
// ever sent, so a save can't be rejected for an unknown property.
export function emptySettings() {
  return {
    // Behavior & validation
    validations: [],
    description: "",
    example: "",
    required: false,
    defaultValue: "",
    defaultMobile: "",
    formatter: "",
    // Visibility & permissions
    hidden: false,
    addHidden: false,
    editHidden: false,
    hideForSeller: false,
    hideForSellerManager: false,
    readOnly: false,
    disabled: false,
    deprecated: false,
    encrypt: false,
    // Conditional display
    showOn: [],
    showOnOperator: "AND",
    // Events
    events: [],
    // Presentation
    label: "",
    tooltip: "",
    level: "",
    settingType: "",
    configurable: false,
    hideDeviceToggle: false,
    // Relation (autocomplete / category / collection) settings
    entity: "", // which entity to link to, e.g. "collections"
    valueField: "_id", // model field stored as the value
    labelField: "name", // model field shown as the label
    source: "entity", // "entity" = picker feed | "function" = custom JS source
    sourceFunction: "", // custom source function body (when source === "function")
    // Choices for select / radio
    options: [],
  }
}

// A blank field row for the inline builder. `_key` is a stable client id so
// React lists + inline edits stay addressable (stripped before save).
export function emptyField(overrides = {}) {
  return {
    _key: crypto.randomUUID(),
    key: "",
    label: "",
    dataType: "string",
    itemType: null,
    editType: "text",
    order: 0,
    settings: emptySettings(),
    children: [],
    ...overrides,
  }
}

// ------------------------------------------------------------- doc -> form
// Map a persisted definition into editor form state (recursively, adding _key).
export function docToForm(doc) {
  return {
    module: doc?.module ?? "",
    label: doc?.label ?? "",
    description: doc?.description ?? "",
    isActive: doc?.isActive !== false,
    fields: fieldsToForm(doc?.fields ?? []),
  }
}

function fieldsToForm(fields = []) {
  return [...fields]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((f) => ({
      _key: crypto.randomUUID(),
      key: f.key ?? "",
      label: f.label ?? "",
      dataType: f.dataType ?? "string",
      itemType: f.dataType === "array" ? (f.itemType ?? null) : null,
      editType: f.editType ?? "text",
      order: f.order ?? 0,
      settings: { ...emptySettings(), ...(f.settings ?? {}) },
      children: fieldsToForm(f.children ?? []),
    }))
}

// A fresh, empty form for create mode.
export function emptyForm() {
  return { module: "", label: "", description: "", isActive: true, fields: [] }
}

// ------------------------------------------------------------- form -> payload
// Strip transient _key fields and shape the tree for POST/PATCH. Only allowed
// keys are sent; itemType/children are pruned for types that can't hold them.
export function formToPayload(form, { includeModule = true } = {}) {
  const body = {
    label: form.label?.trim() || "",
    description: form.description?.trim() || "",
    isActive: form.isActive !== false,
    fields: fieldsToPayload(form.fields),
  }
  if (includeModule) body.module = normalizeModule(form.module)
  return body
}

function cleanSettings(s = {}) {
  const out = {
    validations: (s.validations ?? [])
      .filter((v) => v.rule?.trim())
      .map((v) => ({
        rule: v.rule.trim(),
        param: v.param?.trim() || "",
        message: v.message?.trim() || "",
      })),
    description: s.description?.trim() || "",
    example: s.example?.trim() || "",
    required: Boolean(s.required),
    defaultValue: s.defaultValue?.trim?.() || "",
    defaultMobile: s.defaultMobile?.trim?.() || "",
    formatter: s.formatter ?? "",
    hidden: Boolean(s.hidden),
    addHidden: Boolean(s.addHidden),
    editHidden: Boolean(s.editHidden),
    hideForSeller: Boolean(s.hideForSeller),
    hideForSellerManager: Boolean(s.hideForSellerManager),
    readOnly: Boolean(s.readOnly),
    disabled: Boolean(s.disabled),
    deprecated: Boolean(s.deprecated),
    encrypt: Boolean(s.encrypt),
    showOn: (s.showOn ?? [])
      .filter((r) => r.field?.trim())
      .map((r) => ({
        field: r.field.trim(),
        value: r.value?.trim() || "",
        operator: r.operator || "eq",
      })),
    showOnOperator: s.showOnOperator === "OR" ? "OR" : "AND",
    events: (s.events ?? [])
      .filter((e) => e.event?.trim())
      .map((e) => ({ event: e.event.trim(), handler: e.handler?.trim() || "" })),
    label: s.label?.trim() || "",
    tooltip: s.tooltip?.trim() || "",
    level: s.level?.trim() || "",
    settingType: s.settingType?.trim() || "",
    configurable: Boolean(s.configurable),
    hideDeviceToggle: Boolean(s.hideDeviceToggle),
    entity: normalizeEntity(s.entity),
    valueField: s.valueField?.trim?.() || "",
    labelField: s.labelField?.trim?.() || "",
    source: s.source === "function" ? "function" : "entity",
    sourceFunction: s.sourceFunction ?? "",
    options: (s.options ?? [])
      .filter((o) => o.label?.trim() || o.value?.trim())
      .map((o) => ({ label: o.label?.trim() || "", value: o.value?.trim() || "" })),
  }
  return out
}

function fieldsToPayload(fields = []) {
  return fields.map((f, i) => {
    const dataType = f.dataType ?? "string"
    const isArray = dataType === "array"
    const itemIsObject = isArray && f.itemType === "object"

    const out = {
      key: slugKey(f.key),
      label: f.label?.trim() || "",
      dataType,
      itemType: isArray ? (f.itemType ?? null) : null,
      editType: f.editType ?? "text",
      order: i, // sequential, stable order from the current list position
      settings: cleanSettings(f.settings),
    }

    if (dataType === "object" || itemIsObject) {
      out.children = fieldsToPayload(f.children ?? [])
    } else {
      out.children = []
    }
    return out
  })
}

// Client-side pre-save check so the user gets an inline message before the
// server round trip. Returns a human string, or null when the tree is valid.
export function validateForm(form) {
  if (!isValidModule(normalizeModule(form.module))) {
    return "Module must look like ms.<name> (lowercase letters, numbers, underscore)."
  }
  return firstBadField(form.fields)
}

function firstBadField(fields = []) {
  const seen = new Set()
  for (const f of fields) {
    const key = slugKey(f.key)
    if (!key) return "Every field needs a name."
    if (seen.has(key)) return `Duplicate field name "${key}" at the same level.`
    seen.add(key)
    if (hasChildren(f)) {
      const bad = firstBadField(f.children ?? [])
      if (bad) return bad
    }
  }
  return null
}
