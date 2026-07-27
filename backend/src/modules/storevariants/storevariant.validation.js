import { z } from "zod"

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id")
const iso2 = z.string().trim().toUpperCase().length(2)
const shortStr = (max) => z.string().trim().max(max)

const conditions = z
  .object({
    type: z.enum(["location_countries", "domain", "path", "manual"]).optional(),
    locationCountries: z.array(iso2).max(250).optional(),
    domains: z.array(shortStr(253)).max(20).optional(),
    pathPrefix: shortStr(60).optional(),
  })
  .strict()

const action = z
  .object({
    // Empty string / null = settings-only variant (stays on the MAIN store).
    substoreId: z.union([objectId, z.literal(""), z.null()]).optional(),
    themeId: shortStr(80).optional(),
    // Canvas UI id shown to visitors matched by this rule (per-substore / country UI).
    canvasId: shortStr(80).optional(),
    currency: shortStr(3).optional(),
    language: shortStr(10).optional(),
    rtl: z.union([z.boolean(), z.null()]).optional(),
  })
  .strict()

const variantBody = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    sortOrder: z.number().int().min(0).max(100000).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    conditions: conditions.optional(),
    action: action.optional(),
  })
  .strict()

export const createStoreVariantSchema = variantBody

export const updateStoreVariantSchema = variantBody
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" })

export const listStoreVariantsQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    // "true" → list only soft-deleted variants (the trash view).
    deleted: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    sort: z.enum(["sortOrder", "-sortOrder", "name", "-name", "createdAt", "-createdAt"]).optional(),
    page: z.coerce.number().int().min(1).max(10000).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict()
