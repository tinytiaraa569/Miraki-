import mongoose from "mongoose"

// TENANT-DB SCHEMA: substores live inside each seller's dedicated database.
// A Substore is the DESTINATION layer (StoreHippo-style two-layer model):
// catalog visibility + branding + localization for a country/region store.
// Geo *matching* lives on StoreVariant (the rule/router layer) — this schema
// only keeps optional geo metadata (countryCodes, isDefault, domains).
// Only `name` is required; everything else is optional by design.

const socialLinkSchema = new mongoose.Schema(
  {
    provider: { type: String, trim: true, maxlength: 60 },
    link: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
)

const metaTagSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 120 },
    content: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
)

const domainSchema = new mongoose.Schema(
  {
    host: { type: String, trim: true, lowercase: true, maxlength: 253 },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false },
)

const businessHourSchema = new mongoose.Schema(
  {
    day: { type: String, enum: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] },
    open: { type: String, maxlength: 5 }, // "09:00"
    close: { type: String, maxlength: 5 },
  },
  { _id: false },
)

export const substoreSchema = new mongoose.Schema(
  {
    // ------------------------------------------------------------------ identity
    name: { type: String, required: true, trim: true, maxlength: 120 },
    alias: { type: String, trim: true, lowercase: true, maxlength: 140 },
    sortOrder: { type: Number, default: 0 },
    // Always the tenant's single MAIN store — stamped server-side.
    parentStoreId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    assignedSellerId: { type: mongoose.Schema.Types.ObjectId, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },

    // ------------------------------------------------------------- geo & routing
    countryCodes: { type: [String], default: [] }, // ISO-2, uppercase
    regionCodes: { type: [String], default: [] },
    continent: { type: String, trim: true, maxlength: 40, default: null },
    isDefault: { type: Boolean, default: false },
    domains: { type: [domainSchema], default: [] },
    pathPrefix: { type: String, trim: true, maxlength: 60, default: null },
    geoRedirectMode: { type: String, enum: ["auto", "suggest", "off"], default: "off" },
    timezone: { type: String, trim: true, maxlength: 60, default: null },

    // -------------------------------------------------------- product visibility
    visibility: {
      mode: { type: String, enum: ["all", "include", "exclude"], default: "all" },
      includedCategoryIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
      excludedCategoryIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
      includedBrandIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
      excludedBrandIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
      includedTags: { type: [String], default: [] },
      excludedTags: { type: [String], default: [] },
      hideOutOfStock: { type: Boolean, default: false },
      defaultProductStatus: { type: String, enum: ["active", "hidden"], default: "active" },
    },

    // --------------------------------------------------------- commerce & pricing
    currency: { type: String, trim: true, uppercase: true, maxlength: 3, default: null },
    currencyFormat: { type: String, trim: true, maxlength: 40, default: null },
    currencySymbolPosition: { type: String, enum: ["before", "after"], default: "before" },
    // What identifies the currency next to prices: symbol (₹ 99), code (INR 99), or both (₹ 99 INR).
    currencyDisplay: { type: String, enum: ["symbol", "code", "both"], default: "symbol" },
    decimalPrecision: { type: Number, min: 0, max: 6, default: 2 },
    pricingMode: { type: String, enum: ["shared", "perStore"], default: "shared" },
    exchangeRate: { type: Number, min: 0, default: null },
    roundingRule: {
      type: String,
      enum: [
        "none",
        "nearest",
        "up",
        "down",
        "nearest5",
        "nearest10",
        "nearest50",
        "nearest100",
      ],
      default: "none",
    },
    taxInclusive: { type: Boolean, default: false },
    taxRate: { type: Number, min: 0, max: 100, default: null }, // VAT % e.g. 5 for UAE
    taxRegion: { type: String, trim: true, maxlength: 80, default: null },
    allowedPaymentMethods: { type: [String], default: [] },
    allowedShippingZoneIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    minOrderValue: { type: Number, min: 0, default: null },
    freeShippingThreshold: { type: Number, min: 0, default: null },

    // ---------------------------------------------------------------- localization
    defaultLanguage: { type: String, trim: true, lowercase: true, maxlength: 10, default: null },
    supportedLanguages: { type: [String], default: [] },
    rtl: { type: Boolean, default: false },
    numberFormat: { type: String, trim: true, maxlength: 40, default: null },
    dateFormat: { type: String, trim: true, maxlength: 40, default: null },
    weightUnit: { type: String, enum: ["kg", "lb"], default: "kg" },
    dimensionUnit: { type: String, enum: ["cm", "in"], default: "cm" },

    // ------------------------------------------------- branding & storefront settings
    settings: {
      storeName: { type: String, trim: true, maxlength: 120, default: null },
      pageTitle: { type: String, trim: true, maxlength: 200, default: null },
      customizedTheme: { type: Boolean, default: false },
      logoUrl: { type: String, default: null },
      mobileLogoUrl: { type: String, default: null },
      faviconUrl: { type: String, default: null },
      description: { type: String, maxlength: 5000, default: null },
      contactEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: null },
      contactPhone: { type: String, trim: true, maxlength: 30, default: null },
      defaultStoreLocation: { type: String, trim: true, maxlength: 200, default: null },
      defaultCountryOfOrigin: { type: String, trim: true, maxlength: 80, default: null },
      defaultCurrency: { type: String, trim: true, uppercase: true, maxlength: 3, default: null },
      defaultLanguage: { type: String, trim: true, lowercase: true, maxlength: 10, default: null },
      defaultTheme: { type: String, trim: true, maxlength: 80, default: null },
      copyright: { type: String, trim: true, maxlength: 300, default: null },
      socialLinks: { type: [socialLinkSchema], default: [] },
      metaTags: { type: [metaTagSchema], default: [] },
      languages: { type: [String], default: [] },
    },

    // -------------------------------------------------------------- SEO & analytics
    seo: {
      title: { type: String, trim: true, maxlength: 200, default: null },
      description: { type: String, trim: true, maxlength: 500, default: null },
      keywords: { type: [String], default: [] },
      ogImage: { type: String, default: null },
      canonicalDomain: { type: String, trim: true, maxlength: 253, default: null },
      robots: { type: String, trim: true, maxlength: 60, default: null },
    },
    analytics: {
      gaId: { type: String, trim: true, maxlength: 40, default: null },
      gtmId: { type: String, trim: true, maxlength: 40, default: null },
      metaPixelId: { type: String, trim: true, maxlength: 40, default: null },
    },

    // -------------------------------------------------------- lifecycle & operations
    status: { type: String, enum: ["draft", "active", "inactive", "coming_soon"], default: "active" },
    launchDate: { type: Date, default: null },
    maintenanceMode: { type: Boolean, default: false },
    contact: {
      email: { type: String, trim: true, lowercase: true, maxlength: 254, default: null },
      phone: { type: String, trim: true, maxlength: 30, default: null },
      whatsapp: { type: String, trim: true, maxlength: 30, default: null },
      address: { type: String, trim: true, maxlength: 500, default: null },
    },
    businessHours: { type: [businessHourSchema], default: [] },
    holidays: { type: [Date], default: [] },

    // ------------------------------------------------------------------ soft delete
    // Non-null means the substore is in the "trash": hidden from normal lists
    // and storefront routing, restorable until permanently destroyed.
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, default: null },

    // ----------------------------------------------------------------- extensibility
    themeId: { type: String, trim: true, maxlength: 80, default: null },
    themeOverrides: { type: mongoose.Schema.Types.Mixed, default: null },
    customFields: { type: [{ key: String, value: String }], default: [] },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
)

// Alias is unique per parent store; sorted lists stay covered.
substoreSchema.index({ parentStoreId: 1, alias: 1 }, { unique: true, sparse: true })
substoreSchema.index({ parentStoreId: 1, sortOrder: 1 })
substoreSchema.index({ countryCodes: 1 })

// Slugify alias from name when blank, normalize country codes to uppercase.
substoreSchema.pre("validate", function (next) {
  if (!this.alias && this.name) {
    this.alias = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 140)
  }
  if (Array.isArray(this.countryCodes)) {
    this.countryCodes = this.countryCodes.map((c) => String(c).toUpperCase().slice(0, 2))
  }
  next()
})
