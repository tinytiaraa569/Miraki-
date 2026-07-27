import { z } from "zod"

// strict() rejects unknown keys entirely — nothing extra ever reaches the service layer.
export const loginSchema = z
  .object({
    email: z.string().email().max(254),
    password: z.string().min(1).max(256),
  })
  .strict()

export const totpSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
  })
  .strict()

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(256),
    newPassword: z
      .string()
      .min(10, "Password must be at least 10 characters")
      .max(256)
      .regex(/[a-z]/, "Must include a lowercase letter")
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/\d/, "Must include a number"),
  })
  .strict()
