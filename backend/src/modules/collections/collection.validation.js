import { z } from "zod"

// Only `name` is required on create. Everything else is optional so the owner
// can save a bare collection first and enrich it later — matching the
// StoreHippo add-collection form. A collection is MANUAL (ordered productIds) or
// DYNAMIC (a rule set). Strict schemas everywhere are the injection guard: the
// rule `field`/`operator`/`value` triples are whitelisted here before the
// rule-compiler ever turns them into a Mongo $match.

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id")
const shortStr = (max) => z.string().trim().max(max)

const imageDataUrl = z
  .string()
  .regex(/^data:image\/[a-z0-9+.-]+;base64,/i, "Image must be a base64 data URL")
  .max(3 * 1024 * 1024)

const imageInput = z
  .object({
    url: shortStr(500).optional(),
    alt: shortStr(200).optional(),
    dataUrl: imageDataUrl.optional(),
  })
  .strict()

const seo = z
  .object({
    title: shortStr(200).optional(),
    description: shortStr(500).optional(),
    keywords: z.array(shortStr(60)).max(50).optional(),
    canonicalUrl: shortStr(500).optional(),
  })
  .strict()

const sitemap = z
  .object({
    priority: z.number().min(0).max(1).optional(),
    frequency: z.enum(["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]).optional(),
    disableForBots: z.boolean().optional(),
  })
  .strict()

const metafield = z
  .object({
    key: shortStr(80),
    value: shortStr(2000),
    type: z.enum(["text", "number", "boolean", "json", "url"]).optional(),
  })
  .strict()

// A single filter row from the rule builder. `value` is a permissive union so a
// rule can carry a number, string, id, or an array of those (for in/between);
// the rule-compiler coerces per-field, and unknown/malformed values compile to
// a match-nothing clause rather than leaking into the query.
const ruleValue = z.union([
  z.string().max(200),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.union([z.string().max(200), z.number()])).max(200),
])

const condition = z
  .object({
    field: z.enum(["price", "brand", "categories", "option"]),
    optionKey: shortStr(80).nullable().optional(),
    operator: z.enum([
      "eq",
      "ne",
      "gt",
      "gte",
      "lt",
      "lte",
      "between",
      "in",
      "nin",
      "contains",
      "contains_all",
    ]),
    value: ruleValue.optional(),
  })
  .strict()

const rules = z
  .object({
    match: z.enum(["all", "any"]).optional(),
    conditions: z.array(condition).max(50).optional(),
  })
  .strict()

const collectionBody = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(160),
    alias: shortStr(200).optional(),
    description: z.string().max(20000).nullable().optional(),
    images: z.array(imageInput).max(12).optional(),

    type: z.enum(["manual", "dynamic"]).optional(),
    productIds: z.array(objectId).max(5000).optional(),
    rules: rules.optional(),

    sortOrder: z.number().int().min(0).max(100000).optional(),
    isPublished: z.boolean().optional(),
    isActive: z.boolean().optional(),
    defaultSortOrder: z
      .enum(["manual", "name_asc", "name_desc", "newest", "oldest", "price_asc", "price_desc"])
      .optional(),
    seo: seo.optional(),
    sitemap: sitemap.optional(),
    metafields: z.array(metafield).max(50).optional(),
    substoreIds: z.array(objectId).max(200).optional(),
    facetGroupId: z.union([objectId, z.null()]).optional(),
    customFields: z.array(z.object({ key: shortStr(60), value: shortStr(500) }).strict()).max(50).optional(),
  })
  .strict()

export const createCollectionSchema = collectionBody

export const updateCollectionSchema = collectionBody
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" })

// Preview endpoint body — just the rules to compile + count.
export const previewCollectionSchema = z.object({ rules: rules }).strict()

export const listCollectionsQuerySchema = z
  .object({
    published: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    q: z.string().trim().max(160).optional(),
    deleted: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    sort: z.enum(["sortOrder", "-sortOrder", "name", "-name", "createdAt", "-createdAt"]).optional(),
    page: z.coerce.number().int().min(1).max(10000).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .strict()

// Lean picker query — search + small page size only (no publish tab / trash).
// `ids` (comma-separated) resolves labels for an already-selected set of
// collections (the chips shown on the product editor).
export const listCollectionOptionsQuerySchema = z
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
