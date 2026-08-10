import { z } from "zod"

// Never trust client JSON for embedded arrays. Validate the full nested shape.
// Strict schemas everywhere are the injection guard. An Option Set embeds
// options[], each of which embeds values[]. See docs/OPTION_SETS_SYSTEM_PLAN.md §8.

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id")
const shortStr = (max) => z.string().trim().max(max)

const imageDataUrl = z
  .string()
  .regex(/^data:image\/[a-z0-9+.-]+;base64,/i, "Image must be a base64 data URL")
  .max(3 * 1024 * 1024)

const VALUE_BEARING = ["dropdown", "image", "swatch", "radio", "checkbox"]
const FREE_TEXT = ["text", "textarea", "number"]

const value = z
  .object({
    label: z.string().trim().min(1, "Label is required").max(200),
    value: z.string().trim().min(1, "Value is required").max(200),
    // Image accepts ONLY a url (persisted) plus a transient dataUrl for upload —
    // no `alt` or other fields. Empty/omitted images are dropped server-side so
    // non-image values never store an `image` key.
    image: z
      .object({ url: shortStr(500).optional(), dataUrl: imageDataUrl.optional() })
      .strict()
      .nullable()
      .optional(),
    priceDelta: z
      .object({ mode: z.enum(["amount", "percent"]).optional(), amount: z.number().optional() })
      .strict()
      .optional(),
    sortOrder: z.number().int().min(0).max(100000).optional(),
    isDefault: z.boolean().optional(),
  })
  .strict()

const option = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    displayName: shortStr(200).optional(),
    type: z.enum(["dropdown", "image", "swatch", "radio", "checkbox", "text", "textarea", "number"]),
    values: z.array(value).max(200).optional(),
    minCount: z.number().int().min(0).max(100).optional(),
    maxCount: z.number().int().min(0).max(100).optional(),
    required: z.boolean().optional(),
    defaultValue: shortStr(200).nullable().optional(),
    sortOrder: z.number().int().min(0).max(100000).optional(),
    showAlways: z.boolean().optional(),
  })
  .strict()
  // value-bearing types must have values; free-text types must not.
  .refine(
    (o) => (FREE_TEXT.includes(o.type) ? !(o.values?.length) : (o.values?.length ?? 0) > 0),
    { message: "This option type requires (or forbids) values", path: ["values"] },
  )
  // defaultValue must reference a real value.
  .refine((o) => !o.defaultValue || (o.values ?? []).some((v) => v.value === o.defaultValue), {
    message: "Default value must match one of the option values",
    path: ["defaultValue"],
  })
  // maxCount (when set) >= minCount.
  .refine((o) => !o.maxCount || o.maxCount >= (o.minCount ?? 0), {
    message: "Max count must be >= min count",
    path: ["maxCount"],
  })

const body = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(160),
    displayName: shortStr(200).optional(),
    alias: shortStr(200).optional(),
    // Restrict to substores; empty/omitted = available in all substores.
    substoreIds: z.array(objectId).max(200).optional(),
    options: z.array(option).max(100).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()

export const createOptionSetSchema = body

export const updateOptionSetSchema = body
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "No fields to update" })

export const listOptionSetsQuerySchema = z
  .object({
    q: z.string().trim().max(160).optional(),
    deleted: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    substore: objectId.optional(),
    sort: z
      .enum(["name", "-name", "createdAt", "-createdAt", "optionCount", "-optionCount"])
      .optional(),
    page: z.coerce.number().int().min(1).max(10000).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .strict()
  // Deep-page guard (§6.3): reject pathological $skip depth.
  .refine((q) => (q.page ?? 1) * (q.limit ?? 50) <= 50000, {
    message: "Page too deep — narrow your search or use a cursor",
    path: ["page"],
  })
