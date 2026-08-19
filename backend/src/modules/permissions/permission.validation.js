import { z } from "zod"

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id")

const lowerStr = (max) => z.string().trim().toLowerCase().max(max)
const displayStr = (max) => z.string().trim().max(max)

const permissionBodyShape = {
  key: lowerStr(100),
  action: lowerStr(20).optional(),
  category: lowerStr(80).optional(),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
  label: displayStr(80).optional(),
  module: lowerStr(80).optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
}

export const createPermissionSchema = z.object(permissionBodyShape).strict()

export const updatePermissionSchema = z
  .object(permissionBodyShape)
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" })

export const listPermissionsQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    module: lowerStr(80).optional(),
    category: lowerStr(80).optional(),
    action: lowerStr(20).optional(),
    isActive: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    isSystem: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    sort: z.enum(["sortOrder", "-sortOrder", "label", "-label", "createdAt", "-createdAt"]).optional(),
    page: z.coerce.number().int().min(1).max(10000).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict()

export const bulkDeletePermissionSchema = z
  .object({
    ids: z.array(objectId).min(1, "At least one id is required").max(200, "Too many ids in one request"),
  })
  .strict()