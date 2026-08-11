import { z } from "zod"

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id")
const hexColor = z.string().trim().regex(/^#([A-Fa-f0-9]{6})$/, "Must be a hex color like #EC4899")

const roleBody = z
  .object({
    displayName: z.string().trim().min(1, "Name is required").max(120),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .max(80)
      .regex(/^[a-z0-9_]+$/, "Slug can only contain lowercase letters, numbers, and underscores")
      .optional(),
    description: z.string().trim().max(500).optional(),
    color: hexColor.optional(),
    permissions: z.array(objectId).max(500).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    dataAccess: z.enum(["own_substore", "multiple_substores", "all_substores"]).optional(),
    otherSubstoreAccess: z.enum(["view_only", "permission_based"]).optional(),
    substoreIds: z.array(objectId).max(500).optional(),
  })
  .strict()
  // .refine((data) => data.dataAccess !== "multiple_substores" || (data.substoreIds?.length ?? 0) > 0, {
  //   message: "Select at least one substore when data access is 'multiple_substores'",
  //   path: ["substoreIds"],
  // })

export const createRoleSchema = roleBody

export const updateRoleSchema = z
  .object({
    displayName: z.string().trim().min(1, "Name is required").max(120).optional(),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .max(80)
      .regex(/^[a-z0-9_]+$/, "Slug can only contain lowercase letters, numbers, and underscores")
      .optional(),
    description: z.string().trim().max(500).optional(),
    color: hexColor.optional(),
    permissions: z.array(objectId).max(500).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    dataAccess: z.enum(["own_substore", "multiple_substores", "all_substores"]).optional(),
    otherSubstoreAccess: z.enum(["view_only", "permission_based"]).optional(),
    substoreIds: z.array(objectId).max(500).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" })
  // .refine((data) => data.dataAccess !== "multiple_substores" || (data.substoreIds?.length ?? 0) > 0, {
  //   message: "Select at least one substore when data access is 'multiple_substores'",
  //   path: ["substoreIds"],
  // })

export const listRolesQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    dataAccess: z.enum(["own_substore", "multiple_substores", "all_substores"]).optional(),
    // "true" - list only soft-deleted roles (the trash view).
    deleted: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    sort: z.enum(["displayName", "-displayName", "createdAt", "-createdAt"]).optional(),
    page: z.coerce.number().int().min(1).max(10000).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict()