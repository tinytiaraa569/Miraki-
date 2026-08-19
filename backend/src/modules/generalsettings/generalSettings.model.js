import mongoose from "mongoose"



const underConstructionSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    // Stored as a /uploads/... URL string only — never raw bytes.
    imageUrl: { type: String, default: null },
  },
  { _id: false },
)

const passwordPageSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    
    passwordHash: { type: String, default: null, select: false },
  },
  { _id: false },
)

export const generalSettingsSchema = new mongoose.Schema(
  {
    // Fixed discriminator — enforces exactly one settings doc per tenant.
    key: { type: String, default: "general", unique: true, immutable: true },

    // Store identity + storefront <head>.
    storeName: { type: String, default: "" },
    pageTitle: { type: String, default: "" },
    description: { type: String, default: "" },

    // Branding assets (only the /uploads/... URL is stored).
    logoUrl: { type: String, default: null },
    mobileLogoUrl: { type: String, default: null },
    faviconUrl: { type: String, default: null },
    ogImageUrl: { type: String, default: null },

    // Contact + locale.
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    defaultStoreLocation: { type: String, default: "" },
    copyright: { type: String, default: "" },
    defaultLanguage: { type: String, default: "en" },
    defaultTimezone: { type: String, default: "" },

    
    underConstruction: { type: underConstructionSchema, default: () => ({}) },
    passwordPage: { type: passwordPageSchema, default: () => ({}) },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true },
)
