import { z } from "zod"

// Only `name` is required on create. Everything else is optional so the
// owner can save a bare substore first and enrich it later — matching the
// StoreHippo add-form behavior in the reference screenshots.

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id")
const iso2 = z.string().trim().toUpperCase().length(2)
const shortStr = (max) => z.string().trim().max(max)

const imageDataUrl = z
  .string()
  .regex(/^data:image\/[a-z0-9+.-]+;base64,/i, "Image must be a base64 data URL")
  .max(3 * 1024 * 1024)

const socialLink = z
  .object({ provider: shortStr(60), link: shortStr(500) })
  .strict()

const metaTag = z
  .object({ name: shortStr(120), content: shortStr(500) })
  .strict()

const domainRow = z
  .object({ host: shortStr(253), isPrimary: z.boolean().optional() })
  .strict()

const businessHour = z
  .object({
    day: z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
    open: shortStr(5).optional(),
    close: shortStr(5).optional(),
  })
  .strict()

const visibility = z
  .object({
    mode: z.enum(["all", "include", "exclude"]).optional(),
    includedCategoryIds: z.array(objectId).max(200).optional(),
    excludedCategoryIds: z.array(objectId).max(200).optional(),
    includedBrandIds: z.array(objectId).max(200).optional(),
    excludedBrandIds: z.array(objectId).max(200).optional(),
    includedTags: z.array(shortStr(60)).max(200).optional(),
    excludedTags: z.array(shortStr(60)).max(200).optional(),
    hideOutOfStock: z.boolean().optional(),
    defaultProductStatus: z.enum(["active", "hidden"]).optional(),
  })
  .strict()

const settings = z
  .object({
    storeName: shortStr(120).optional(),
    pageTitle: shortStr(200).optional(),
    customizedTheme: z.boolean().optional(),
    // Logos arrive as base64 data URLs; server writes to uploads/ and stores URLs.
    logoBase64: imageDataUrl.optional(),
    mobileLogoBase64: imageDataUrl.optional(),
    faviconBase64: imageDataUrl.optional(),
    removeLogo: z.boolean().optional(),
    removeMobileLogo: z.boolean().optional(),
    removeFavicon: z.boolean().optional(),
    description: z.string().max(5000).optional(),
    contactEmail: z.union([z.string().email().max(254), z.literal("")]).optional(),
    contactPhone: shortStr(30).optional(),
    defaultStoreLocation: shortStr(200).optional(),
    defaultCountryOfOrigin: shortStr(80).optional(),
    defaultCurrency: shortStr(3).optional(),
    defaultLanguage: shortStr(10).optional(),
    defaultTheme: shortStr(80).optional(),
    copyright: shortStr(300).optional(),
    socialLinks: z.array(socialLink).max(50).optional(),
    metaTags: z.array(metaTag).max(50).optional(),
    languages: z.array(shortStr(10)).max(30).optional(),
  })
  .strict()

const seo = z
  .object({
    title: shortStr(200).optional(),
    description: shortStr(500).optional(),
    keywords: z.array(shortStr(60)).max(50).optional(),
    ogImage: shortStr(500).optional(),
    canonicalDomain: shortStr(253).optional(),
    robots: shortStr(60).optional(),
  })
  .strict()

const analytics = z
  .object({
    gaId: shortStr(40).optional(),
    gtmId: shortStr(40).optional(),
    metaPixelId: shortStr(40).optional(),
  })
  .strict()

const contact = z
  .object({
    email: z.union([z.string().email().max(254), z.literal("")]).optional(),
    phone: shortStr(30).optional(),
    whatsapp: shortStr(30).optional(),
    address: shortStr(500).optional(),
  })
  .strict()

const substoreBody = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    alias: shortStr(140).optional(),
    sortOrder: z.number().int().min(0).max(100000).optional(),
    assignedSellerId: z.union([objectId, z.literal(""), z.null()]).optional(),

    countryCodes: z.array(iso2).max(250).optional(),
    regionCodes: z.array(shortStr(10)).max(50).optional(),
    continent: shortStr(40).optional(),
    isDefault: z.boolean().optional(),
    domains: z.array(domainRow).max(20).optional(),
    pathPrefix: shortStr(60).optional(),
    geoRedirectMode: z.enum(["auto", "suggest", "off"]).optional(),
    timezone: shortStr(60).optional(),

    visibility: visibility.optional(),

    currency: shortStr(3).optional(),
    currencyFormat: shortStr(40).optional(),
    currencySymbolPosition: z.enum(["before", "after"]).optional(),
    currencyDisplay: z.enum(["symbol", "code", "both"]).optional(),
    decimalPrecision: z.number().int().min(0).max(6).optional(),
    pricingMode: z.enum(["shared", "perStore"]).optional(),
    exchangeRate: z.union([z.number().min(0), z.null()]).optional(),
    roundingRule: z
      .enum(["none", "nearest", "up", "down", "nearest5", "nearest10", "nearest50", "nearest100"])
      .optional(),
    taxInclusive: z.boolean().optional(),
    taxRate: z.union([z.number().min(0).max(100), z.null()]).optional(),
    taxRegion: shortStr(80).optional(),
    allowedPaymentMethods: z.array(shortStr(40)).max(30).optional(),
    minOrderValue: z.union([z.number().min(0), z.null()]).optional(),
    freeShippingThreshold: z.union([z.number().min(0), z.null()]).optional(),

    defaultLanguage: shortStr(10).optional(),
    supportedLanguages: z.array(shortStr(10)).max(30).optional(),
    rtl: z.boolean().optional(),
    numberFormat: shortStr(40).optional(),
    dateFormat: shortStr(40).optional(),
    weightUnit: z.enum(["kg", "lb"]).optional(),
    dimensionUnit: z.enum(["cm", "in"]).optional(),

    settings: settings.optional(),
    seo: seo.optional(),
    analytics: analytics.optional(),

    status: z.enum(["draft", "active", "inactive", "coming_soon"]).optional(),
    launchDate: z.union([z.string().datetime(), z.null()]).optional(),
    maintenanceMode: z.boolean().optional(),
    contact: contact.optional(),

    themeId: shortStr(80).optional(),
    customFields: z.array(z.object({ key: shortStr(60), value: shortStr(500) }).strict()).max(50).optional(),
  })
  .strict()

export const createSubstoreSchema = substoreBody

export const updateSubstoreSchema = substoreBody
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" })

export const listSubstoresQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    status: z.enum(["draft", "active", "inactive", "coming_soon"]).optional(),
    // "true" → list only soft-deleted substores (the trash view).
    deleted: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    sort: z.enum(["sortOrder", "-sortOrder", "name", "-name", "createdAt", "-createdAt"]).optional(),
    page: z.coerce.number().int().min(1).max(10000).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict()
