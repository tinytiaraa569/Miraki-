import { z } from "zod"

export const createSellerSchema = z
  .object({
    businessName: z.string().min(2).max(120),
    ownerEmail: z.string().email().max(254),
    multistoreEnabled: z.boolean().default(false),
  })
  .strict()

export const sellerStatusSchema = z
  .object({
    status: z.enum(["active", "suspended"]),
  })
  .strict()

// Edit seller: all fields optional, but at least one must be present.
// .strict() blocks injected fields (status, mainStoreId, deletedAt, ...).
export const updateSellerSchema = z
  .object({
    businessName: z.string().min(2).max(120).optional(),
    ownerEmail: z.string().email().max(254).optional(),
    multistoreEnabled: z.boolean().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" })

// Strong password: min 10 chars with lower, upper, digit.
const strongPassword = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128)
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a digit")

export const createSuperadminSchema = z
  .object({
    name: z.string().trim().max(120).optional().default(""),
    email: z.string().email().max(254),
    password: strongPassword,
  })
  .strict()

export const superadminStatusSchema = z
  .object({
    status: z.enum(["active", "suspended"]),
  })
  .strict()

export const superadminTwoFactorSchema = z
  .object({
    required: z.boolean(),
  })
  .strict()
