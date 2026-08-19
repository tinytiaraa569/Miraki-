import { z } from "zod"

export const sellerLoginSchema = z
  .object({
    email: z.string().email().max(254),
    password: z.string().min(1).max(256),
  })
  .strict()

export const createSubstoreSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
  })
  .strict()

// `role` here is the INVITED user's store-level role — restricted to the two
// substore roles. SELLER_SUPERADMIN can never be granted via invite.
export const inviteUserSchema = z
  .object({
    email: z.string().email().max(254),
    role: z.enum(["STORE_SUPERADMIN", "STORE_ADMIN"]),
  })
  .strict()

// Business profile update. Logos arrive as base64 data URLs in the JSON
// body (no multer / multipart anywhere) — utils/uploads.js re-validates the
// MIME whitelist and the 2 MB decoded size on the server before writing to
// uploads/seller/<sellerId>/logo/. Only the URL is stored in the database.
const logoDataUrl = z
  .string()
  .regex(/^data:image\/[a-z0-9+.-]+;base64,/i, "Logo must be a base64 image data URL")
  .max(3 * 1024 * 1024) // ~2 MB decoded + base64 overhead

// Hex brand color; empty string / null clears it back to the default theme.
const hexColor = z
  .union([z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, "Must be a hex color like #7c3aed"), z.literal(""), z.null()])

export const updateProfileSchema = z
  .object({
    phone: z.string().trim().max(30).optional(),
    website: z.string().trim().max(200).optional(),
    description: z.string().trim().max(1000).optional(),
    addressLine1: z.string().trim().max(200).optional(),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    country: z.string().trim().max(100).optional(),
    postalCode: z.string().trim().max(20).optional(),
    // Branding — light-mode logo, dark-mode logo, collapsed-sidebar icon,
    // brand + accent colors.
    logoLightBase64: logoDataUrl.optional(),
    logoDarkBase64: logoDataUrl.optional(),
    logoIconBase64: logoDataUrl.optional(),
    logoIconDarkBase64: logoDataUrl.optional(),
    removeLogoLight: z.boolean().optional(),
    removeLogoDark: z.boolean().optional(),
    removeLogoIcon: z.boolean().optional(),
    removeLogoIconDark: z.boolean().optional(),
    brandColor: hexColor.optional(),
    accentColor: hexColor.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" })
