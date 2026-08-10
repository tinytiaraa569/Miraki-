import { z } from "zod"

// Only `name` is required on create. Everything else is optional so the owner
// can save a bare category first and enrich it later — matching the StoreHippo
// add-category form. Parent changes go through the dedicated /move endpoint so
// the server can safely recompute the whole subtree.

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

const categoryBody = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(160),
    alias: shortStr(200).optional(),
    description: z.string().max(8000).nullable().optional(),
    // Ordered list of images; base64 entries get written to uploads/.
    images: z.array(imageInput).max(12).optional(),
    sortOrder: z.number().int().min(0).max(100000).optional(),
    isActive: z.boolean().optional(),
    status: z.enum(["active", "inactive"]).optional(),

    // Parent chosen at CREATE time only. Afterwards use PATCH /:id/move.
    parentId: z.union([objectId, z.null()]).optional(),

    seo: seo.optional(),
    sitemap: sitemap.optional(),
    // Definition-driven metafields: a dynamic keyed object (StoreHippo-style),
    // embedded on the category. The envelope only guarantees it is an object;
    // the real per-field coercion + rule/required checks run server-side
    // against the live ms.categories definition (see buildCategoryMetafields).
    metafields: z.record(z.any()).optional(),
    substoreIds: z.array(objectId).max(200).optional(),
    defaultSortOrder: z
      .enum(["manual", "name_asc", "name_desc", "newest", "oldest", "price_asc", "price_desc"])
      .optional(),
    widget: shortStr(120).nullable().optional(),
    customFields: z.array(z.object({ key: shortStr(60), value: shortStr(500) }).strict()).max(50).optional(),
  })
  .strict()

export const createCategorySchema = categoryBody

// Update never changes the parent (that is a move) — strip it if present.
export const updateCategorySchema = categoryBody
  .omit({ parentId: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" })

// Move / reparent: parentId = null makes it a root.
export const moveCategorySchema = z
  .object({ parentId: z.union([objectId, z.null()]) })
  .strict()

// Lean picker query — search + small page size only. `ids` (comma-separated)
// resolves the labels for a known set of categories, e.g. the ones already
// referenced by a dynamic collection's filters.
export const listCategoryOptionsQuerySchema = z
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

export const listCategoriesQuerySchema = z
  .object({
    // Direct children of this parent. "null"/"root"/omitted => level-0 roots.
    parentId: z.union([objectId, z.literal("null"), z.literal("root")]).optional(),
    // "true" => flat list of EVERY category across all levels (for the parent /
    // move picker); ignores parentId. Returns lightweight tree fields only.
    flat: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    q: z.string().trim().max(160).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    // "true" => list only soft-deleted categories (the trash view).
    deleted: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    sort: z.enum(["sortOrder", "-sortOrder", "name", "-name", "createdAt", "-createdAt"]).optional(),
    page: z.coerce.number().int().min(1).max(10000).optional(),
    limit: z.coerce.number().int().min(1).max(500).optional(),
  })
  .strict()
