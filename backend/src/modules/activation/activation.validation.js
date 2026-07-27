import { z } from "zod"

// The raw invite token is 32 random bytes hex-encoded → exactly 64 hex chars.
const tokenField = z.string().regex(/^[a-f0-9]{64}$/i, "Invalid token")

export const verifyTokenSchema = z
  .object({
    token: tokenField,
  })
  .strict()

export const activateSchema = z
  .object({
    token: tokenField,
    password: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .max(256)
      .regex(/[a-z]/, "Must include a lowercase letter")
      .regex(/[A-Z]/, "Must include an uppercase letter")
      .regex(/\d/, "Must include a number")
      .regex(/[^a-zA-Z0-9]/, "Must include a symbol"),
  })
  .strict()