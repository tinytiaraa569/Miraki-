import { z } from "zod"



const shortStr = (max) => z.string().trim().max(max)

const imageDataUrl = z
  .string()
  .regex(/^data:image\/[a-z0-9+.-]+;base64,/i, "Image must be a base64 data URL")
  .max(3 * 1024 * 1024)

const underConstruction = z
  .object({
    enabled: z.boolean().optional(),
    imageBase64: imageDataUrl.optional(),
    removeImage: z.boolean().optional(),
  })
  .strict()

const passwordPage = z
  .object({
    enabled: z.boolean().optional(),
    // A non-empty value sets a new gate password (hashed server-side); "" clears
    // it. The current password is NEVER returned by any endpoint.
    password: z.union([z.string().min(4).max(200), z.literal("")]).optional(),
  })
  .strict()

const generalSettingsBody = z
  .object({
    storeName: shortStr(160).optional(),
    pageTitle: shortStr(200).optional(),
   
    description: shortStr(20000).optional(),

    // Branding uploads (base64 in, /uploads URL stored) + remove flags.
    logoBase64: imageDataUrl.optional(),
    mobileLogoBase64: imageDataUrl.optional(),
    faviconBase64: imageDataUrl.optional(),
    ogImageBase64: imageDataUrl.optional(),
    removeLogo: z.boolean().optional(),
    removeMobileLogo: z.boolean().optional(),
    removeFavicon: z.boolean().optional(),
    removeOgImage: z.boolean().optional(),

    contactEmail: z.union([z.string().email().max(254), z.literal("")]).optional(),
    contactPhone: shortStr(30).optional(),
    defaultStoreLocation: shortStr(200).optional(),
    copyright: shortStr(300).optional(),
    defaultLanguage: shortStr(10).optional(),
    defaultTimezone: shortStr(60).optional(),

    underConstruction: underConstruction.optional(),
    passwordPage: passwordPage.optional(),
  })
  .strict()

export const updateGeneralSettingsSchema = generalSettingsBody.refine(
  (data) => Object.keys(data).length > 0,
  { message: "No fields to update" },
)
