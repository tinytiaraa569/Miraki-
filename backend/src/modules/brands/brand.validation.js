import { z } from "zod"

// Only `name` is required on create. Everything else is optional so the owner
// can save a bare brand first and enrich it later — matching the StoreHippo
// add-brand form. Brands are FLAT: there is no parentId and no /move.

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id")
const shortStr = (max) => z.string().trim().max(max)

// A single base64 image data URL — decoded + written to disk server-side.
const imageDataUrl = z
  .string()
  .regex(/^data:image\/[a-z0-9+.-]+;base64,/i, "Image must be a base64 data URL")
  .max(3 * 1024 * 1024)

// Incoming image row: either an already-saved { url } or a fresh base64 upload.
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

const brandBody = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(160),
    alias: shortStr(200).optional(),
    description: z.string().max(8000).nullable().optional(),
    // Ordered list of images; base64 entries get written to uploads/.
    images: z.array(imageInput).max(12).optional(),
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
    brandOwnerIds: z.array(objectId).max(200).optional(),
    facetGroupId: z.union([objectId, z.null()]).optional(),
    customFields: z.array(z.object({ key: shortStr(60), value: shortStr(500) }).strict()).max(50).optional(),
  })
  .strict()

export const createBrandSchema = brandBody

export const updateBrandSchema = brandBody
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" })

// Lean picker query — search + small page size only (no publish tab / trash).
// `ids` (comma-separated) resolves the labels for a known set of brands, e.g.
// the ones already referenced by a dynamic collection's filters.
export const listBrandOptionsQuerySchema = z
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

export const listBrandsQuerySchema = z
  .object({
    // Published / Unpublished tab filter.
    published: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    q: z.string().trim().max(160).optional(),
    // "true" => list only soft-deleted brands (the trash view).
    deleted: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    sort: z.enum(["sortOrder", "-sortOrder", "name", "-name", "createdAt", "-createdAt"]).optional(),
    page: z.coerce.number().int().min(1).max(10000).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .strict()
