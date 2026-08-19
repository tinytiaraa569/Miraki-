import { z } from "zod"



const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id")
const idOrNull = z.union([objectId, z.literal(""), z.null()])
const shortStr = (max) => z.string().trim().max(max)
const numOrNull = z.union([z.number(), z.null()]) // frontend sends null for "empty"


const dateInput = z.union([
  z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?)?$/,
      "Date must be yyyy-mm-dd or an ISO datetime",
    ),
  z.literal(""),
  z.null(),
])


const giftImageInput = z.union([
  z
    .string()
    .regex(/^data:image\/[a-z0-9+.-]+;base64,/i, "Gift image must be an image data URL")
    .max(3 * 1024 * 1024),
  shortStr(500),
  z.null(),
])


const conditionValue = z.union([
  z.string().max(200),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.union([z.string().max(200), z.number()])).max(200),
])

const conditionItem = z
  .object({
    field: z.string().trim().min(1).max(80),
    operator: z.string().trim().max(40),
    value: conditionValue.optional(),
  })
  .strict()

const conditions = z
  .object({
    match: z.enum(["all", "any"]).optional(),
    items: z.array(conditionItem).max(50).optional(),
  })
  .strict()

const discountBody = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(160),
    description: shortStr(500).optional(),
    ruleType: z.enum(["product", "order", "bogo_auto_add"]).optional(),

    // ---- product / order ----
    amountType: z.enum(["flat", "percentage"]).optional(),
    amountValue: z.number().min(0).max(100_000_000).optional(),
    applyOn: z.enum(["all", "conditional"]).optional(),
    conditions: conditions.optional(),
    maxDiscount: numOrNull.optional(),

    // ---- bogo_auto_add ----
    productGroup: z.enum(["product", "collection", "category", "brand"]).optional(),
    sourceItemId: idOrNull.optional(),
    sourceMinQuantity: numOrNull.optional(),
    sourceMinTotal: numOrNull.optional(),
    discountLabel: shortStr(160).optional(),
    discountMessage: shortStr(300).optional(),
    freeProductConfig: z.enum(["single", "multiple"]).optional(),
    freeProductIds: z.array(objectId).max(50).optional(),
    giftImage: giftImageInput.optional(),
    giftHeading: shortStr(160).optional(),
    giftMessage: shortStr(300).optional(),

    // ---- shared ----
    substoreIds: z.array(objectId).max(500).optional(),
    maxUsage: numOrNull.optional(),
    startDate: dateInput.optional(),
    endDate: dateInput.optional(),
    sellerId: idOrNull.optional(),
    enabled: z.boolean().optional(),
  })
  .strict()

export const createDiscountSchema = discountBody

export const updateDiscountSchema = discountBody
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" })

// List query — Enabled/Disabled tab (or a flat search across both), the trash
// view, sort, and pagination.
export const listDiscountsQuerySchema = z
  .object({
    q: z.string().trim().max(160).optional(),
    enabled: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    deleted: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    sort: z.enum(["createdAt", "-createdAt", "name", "-name"]).optional(),
    page: z.coerce.number().int().min(1).max(10000).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .strict()

// The entity kinds the discount picker feeds serve (path param on /options).
export const optionEntity = z.enum([
  "products",
  "categories",
  "collections",
  "brands",
  "substores",
  "sellers",
])


export const listOptionsQuerySchema = z
  .object({
    q: z.string().trim().max(160).optional(),
    page: z.coerce.number().int().min(1).max(10000).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    ids: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined))
      .refine((arr) => !arr || arr.every((id) => /^[a-f0-9]{24}$/i.test(id)), { message: "Invalid id" }),
  })
  .strict()
