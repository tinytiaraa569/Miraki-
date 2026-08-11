import { z } from "zod"

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id")

const strongPassword = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(200)
  .regex(/[a-z]/, "Must include a lowercase letter")
  .regex(/[A-Z]/, "Must include an uppercase letter")
  .regex(/[0-9]/, "Must include a number")

const storeAdminBaseSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  twoFactorRequired: z.boolean().optional(),
  roleId: objectId,
  overridePermissions: z
    .object({
      grant: z.array(objectId).max(200).optional(),
      revoke: z.array(objectId).max(200).optional(),
    })
    .strict()
    .optional(),
  substoreIds: z.array(objectId).max(500).optional(),
  status: z.enum(["invited", "active", "suspended"]).optional(),
})

export const createStoreAdminSchema = storeAdminBaseSchema
  .extend({
    password: strongPassword,
  })
  .strict()

// password is excluded from update


export const updateStoreAdminSchema = storeAdminBaseSchema.partial().strict()

export const listStoreAdminsQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    status: z.enum(["invited", "active", "suspended"]).optional(),
    roleId: objectId.optional(),
    substoreId: objectId.optional(),
    includeDeleted: z.coerce.boolean().optional().default(false),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    sort: z.enum(["-createdAt","createdAt", "name", "email", "status"]).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  })
  .strict()