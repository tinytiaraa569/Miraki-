import { z } from "zod"
import { DATA_TYPES, EDIT_TYPES } from "./metafield.model.js"

// Only `module` is required on create — everything else is optional so an owner
// can save a bare definition and enrich it later, matching the other add-forms.
// Fields nest recursively (object / array-of-object), so the field schema is
// declared with z.lazy(). Parent-schema style matches categories / option sets.

const shortStr = (max) => z.string().trim().max(max)

// Module binding: StoreHippo names them ms.<snake_case> (e.g. ms.categories).
const moduleName = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Module is required")
  .max(120)
  .regex(/^ms\.[a-z0-9_]+$/, "Module must look like ms.<name> (lowercase, letters/numbers/_)")

// Field key: lowercase snake/alnum, the storage key.
const fieldKey = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Field name is required")
  .max(80)
  .regex(/^[a-z0-9_]+$/, "Field name must be lowercase letters, numbers or underscore")

const dataType = z.enum(DATA_TYPES)
const editType = z.enum(EDIT_TYPES)

const validationRule = z
  .object({
    rule: shortStr(60),
    param: shortStr(500).optional(),
    message: shortStr(300).optional(),
  })
  .strict()

const showOnRule = z
  .object({
    field: shortStr(120),
    value: shortStr(500).optional(),
    operator: z
      .enum(["eq", "ne", "gt", "gte", "lt", "lte", "in", "nin", "contains", "exists"])
      .optional(),
  })
  .strict()

const eventRule = z
  .object({
    event: shortStr(60),
    handler: shortStr(2000).optional(),
  })
  .strict()

const choice = z
  .object({
    label: shortStr(200),
    value: shortStr(200),
  })
  .strict()

const fieldSettings = z
  .object({
    // Behavior & validation
    validations: z.array(validationRule).max(50).optional(),
    description: shortStr(2000).optional(),
    example: shortStr(2000).optional(),
    required: z.boolean().optional(),
    defaultValue: shortStr(2000).optional(),
    defaultMobile: shortStr(2000).optional(),
    formatter: z.string().max(20000).optional(),

    // Visibility & permissions
    hidden: z.boolean().optional(),
    addHidden: z.boolean().optional(),
    editHidden: z.boolean().optional(),
    hideForSeller: z.boolean().optional(),
    hideForSellerManager: z.boolean().optional(),
    readOnly: z.boolean().optional(),
    disabled: z.boolean().optional(),
    deprecated: z.boolean().optional(),
    encrypt: z.boolean().optional(),

    // Conditional display
    showOn: z.array(showOnRule).max(50).optional(),
    showOnOperator: z.enum(["AND", "OR"]).optional(),

    // Events
    events: z.array(eventRule).max(50).optional(),

    // Presentation
    label: shortStr(200).optional(),
    tooltip: shortStr(500).optional(),
    level: shortStr(60).optional(),
    settingType: shortStr(60).optional(),
    configurable: z.boolean().optional(),
    hideDeviceToggle: z.boolean().optional(),

    // Relation source: the entity an autocomplete/relation field links to,
    // stored PLAIN without an ms. prefix (e.g. "collections"). Empty string
    // when the field isn't a relation.
    entity: z
      .string()
      .trim()
      .toLowerCase()
      .max(120)
      .refine((v) => v === "" || /^[a-z0-9_]+$/.test(v), {
        message: "Entity must be a plain name (lowercase letters, numbers or underscore)",
      })
      .optional(),
    // Linked-model columns used as the picker's value / label.
    valueField: shortStr(120).optional(),
    labelField: shortStr(120).optional(),
    // "entity" = feed from the entity's /options route; "function" = run a
    // custom source function body instead.
    source: z.enum(["entity", "function"]).optional(),
    sourceFunction: z.string().max(20000).optional(),

    // Choices for select / radio
    options: z.array(choice).max(500).optional(),
  })
  .strict()

// Recursive field: object / array-of-object carry `children[]` of the same
// shape. z.lazy defers evaluation so the schema can reference itself. A soft
// depth cap keeps a hostile payload from nesting forever.
const MAX_DEPTH = 6

const makeField = (depth) =>
  z
    .object({
      key: fieldKey,
      label: shortStr(200).optional(),
      dataType: dataType.optional(),
      itemType: dataType.nullable().optional(),
      editType: editType.optional(),
      order: z.number().int().min(0).max(100000).optional(),
      settings: fieldSettings.optional(),
      children:
        depth >= MAX_DEPTH
          ? z.array(z.never()).max(0).optional()
          : z.array(z.lazy(() => makeField(depth + 1))).max(200).optional(),
    })
    .strict()

const field = makeField(0)

const definitionBody = z
  .object({
    module: moduleName,
    label: shortStr(200).optional(),
    description: shortStr(2000).optional(),
    fields: z.array(field).max(500).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()

export const createMetafieldSchema = definitionBody

// Update never changes the module binding (that identity is fixed) — strip it.
export const updateMetafieldSchema = definitionBody
  .omit({ module: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" })

export const listMetafieldsQuerySchema = z
  .object({
    q: z.string().trim().max(160).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    deleted: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    sort: z.enum(["module", "-module", "createdAt", "-createdAt", "fieldCount", "-fieldCount"]).optional(),
    page: z.coerce.number().int().min(1).max(10000).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .strict()
