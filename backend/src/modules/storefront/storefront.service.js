import { readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import mongoose from "mongoose"
import { env } from "../../config/env.js"
import { cacheGet, cacheSet } from "../../config/redis.js"
import { getTenantModels, makeTenantDbName } from "../../config/tenantDb.js"

// ---------------------------------------------------------------------------
// Canvas store: plain JSON files on disk, memory-cached at first read.
// A canvas is the full page-builder layout for one storefront variant —
// swapping a StoreVariant's `action.canvasId` in the hub swaps the page.
// ---------------------------------------------------------------------------

const CANVAS_DIR = join(dirname(fileURLToPath(import.meta.url)), "canvases")
const DEFAULT_CANVAS_ID = "miraki-default"
const canvasCache = new Map()

/** canvasId must be a simple slug — no path traversal. */
function isSafeCanvasId(id) {
  return typeof id === "string" && /^[a-z0-9][a-z0-9-]{0,79}$/.test(id)
}

export function loadCanvas(canvasId) {
  const id = isSafeCanvasId(canvasId) ? canvasId : DEFAULT_CANVAS_ID
  const canvasPath = join(CANVAS_DIR, `${id}.json`)

  try {
    const modifiedAt = statSync(canvasPath).mtimeMs
    const cached = canvasCache.get(id)
    if (cached?.modifiedAt === modifiedAt) return cached.canvas

    const canvas = JSON.parse(readFileSync(canvasPath, "utf8"))
    canvasCache.set(id, { modifiedAt, canvas })
    return canvas
  } catch {
    if (id === DEFAULT_CANVAS_ID) throw new Error("Default canvas missing")
    return loadCanvas(DEFAULT_CANVAS_ID)
  }
}

export function listCanvasIds() {
  return readdirSync(CANVAS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
}

// ---------------------------------------------------------------------------
// Storefront tenant: which tenant DB serves the public `/` storefront.
// Priority: STOREFRONT_TENANT_DB env → auto-seeded demo tenant (dev).
// Dev uses an in-memory Mongo, so we seed at boot — idempotent via marker.
// ---------------------------------------------------------------------------

let activeTenantDb = process.env.STOREFRONT_TENANT_DB || null

export function getStorefrontTenantDb() {
  return activeTenantDb
}

export async function ensureStorefrontTenant() {
  if (activeTenantDb) return activeTenantDb

  // DETERMINISTIC database name — always "tenant_miraki_jewels". Seeding is
  // idempotent: if the tenant database already has data, reuse it as-is.
  // A duplicate database can never be created.
  const dbName = makeTenantDbName("miraki_jewels")
  const { Store, Substore, StoreVariant } = getTenantModels(dbName)

  // NEVER seed into a tenant that already has ANY store — that would create a
  // second "main store" next to the seller's real one. Demo seeding only runs
  // against a completely empty database (fresh dev environment).
  const existingStores = await Store.countDocuments({})
  if (existingStores > 0) {
    activeTenantDb = dbName
    console.log(`[storefront] reusing existing tenant "${dbName}"`)
    return dbName
  }

  const sellerId = new mongoose.Types.ObjectId()
  const mainStore = await Store.create({
    sellerId,
    type: "MAIN",
    name: "Miraki Jewels",
    countryCode: "AE",
    currency: "AED",
    language: "en",
    isDeletable: false,
  })

  const [uae, oman, india] = await Substore.create([
    {
      name: "Miraki UAE",
      alias: "miraki-uae",
      sortOrder: 1,
      parentStoreId: mainStore._id,
      countryCodes: ["AE"],
      isDefault: true,
      currency: "AED",
      currencyDisplay: "code",
      currencySymbolPosition: "before",
      decimalPrecision: 0,
      taxInclusive: true,
      taxRate: 5,
      taxRegion: "UAE VAT",
      defaultLanguage: "en",
      supportedLanguages: ["en", "ar"],
      rtl: false,
      timezone: "Asia/Dubai",
      settings: { storeName: "Miraki Jewels UAE", pageTitle: "Miraki Jewels — UAE", defaultCurrency: "AED", defaultLanguage: "en" },
      status: "active",
    },
    {
      name: "Miraki Oman",
      alias: "miraki-oman",
      sortOrder: 2,
      parentStoreId: mainStore._id,
      countryCodes: ["OM"],
      currency: "OMR",
      currencyDisplay: "code",
      currencySymbolPosition: "before",
      decimalPrecision: 0,
      defaultLanguage: "en",
      supportedLanguages: ["en", "ar"],
      rtl: false,
      timezone: "Asia/Muscat",
      settings: { storeName: "Miraki Jewels Oman", pageTitle: "Miraki Jewels — Oman", defaultCurrency: "OMR", defaultLanguage: "en" },
      status: "active",
    },
    {
      name: "Miraki India",
      alias: "miraki-india",
      sortOrder: 3,
      parentStoreId: mainStore._id,
      countryCodes: ["IN"],
      currency: "INR",
      currencyDisplay: "symbol",
      currencySymbolPosition: "before",
      decimalPrecision: 0,
      defaultLanguage: "en",
      supportedLanguages: ["en", "hi"],
      rtl: false,
      timezone: "Asia/Kolkata",
      settings: { storeName: "Miraki Jewels India", pageTitle: "Miraki Jewels — India", defaultCurrency: "INR", defaultLanguage: "en" },
      status: "active",
    },
  ])

  await StoreVariant.create([
    {
      name: "UAE visitors",
      sortOrder: 1,
      conditions: { type: "location_countries", locationCountries: ["AE"] },
      action: { substoreId: uae._id, canvasId: "miraki-uae", currency: "AED", language: "en" },
    },
    {
      name: "Oman visitors",
      sortOrder: 2,
      conditions: { type: "location_countries", locationCountries: ["OM"] },
      action: { substoreId: oman._id, canvasId: "miraki-oman", currency: "OMR", language: "en" },
    },
    {
      name: "India visitors",
      sortOrder: 3,
      conditions: { type: "location_countries", locationCountries: ["IN"] },
      action: { substoreId: india._id, canvasId: "miraki-india", currency: "INR", language: "en" },
    },
  ])

  activeTenantDb = dbName
  console.log(`[storefront] seeded demo tenant "${dbName}" (set STOREFRONT_TENANT_DB to override)`)
  return dbName
}

// ---------------------------------------------------------------------------
// Resolver: country → StoreVariant (rule layer) → Substore + canvas JSON.
// One call = everything the storefront needs to paint.
// ---------------------------------------------------------------------------

function publicSubstore(sub) {
  if (!sub) return null
  return {
    _id: sub._id,
    alias: sub.alias,
    name: sub.name,
    countryCodes: sub.countryCodes,
    isDefault: sub.isDefault,
    currency: sub.currency,
    currencyDisplay: sub.currencyDisplay,
    currencySymbolPosition: sub.currencySymbolPosition,
    decimalPrecision: sub.decimalPrecision,
    taxInclusive: sub.taxInclusive,
    taxRate: sub.taxRate,
    language: sub.defaultLanguage,
    supportedLanguages: sub.supportedLanguages,
    rtl: sub.rtl,
    timezone: sub.timezone,
    settings: {
      storeName: sub.settings?.storeName ?? null,
      pageTitle: sub.settings?.pageTitle ?? null,
      logoUrl: sub.settings?.logoUrl ?? null,
    },
  }
}

export async function resolveStorefront(countryCode) {
  const country = /^[A-Z]{2}$/.test(countryCode || "") ? countryCode : null
  const cacheKey = `storefront:resolve:${country || "default"}`

  const cached = await cacheGet(cacheKey)
  if (cached) return cached

  const dbName = await ensureStorefrontTenant()
  const { Substore, StoreVariant } = getTenantModels(dbName)

  // Rule layer: active, not deleted, lowest sortOrder wins.
  let variant = null
  if (country) {
    variant = await StoreVariant.findOne({
      status: "active",
      isDeleted: { $ne: true },
      "conditions.type": "location_countries",
      "conditions.locationCountries": country,
    })
      .sort({ sortOrder: 1 })
      .lean()
  }

  // Destination layer: variant's substore, else the default substore.
  let substore = null
  if (variant?.action?.substoreId) {
    substore = await Substore.findOne({ _id: variant.action.substoreId, isDeleted: { $ne: true } }).lean()
  }
  if (!substore) {
    substore =
      (await Substore.findOne({ isDefault: true, isDeleted: { $ne: true } }).lean()) ||
      (await Substore.findOne({ isDeleted: { $ne: true } }).sort({ sortOrder: 1 }).lean())
  }

  const canvasId = variant?.action?.canvasId || substore?.themeId || DEFAULT_CANVAS_ID
  const canvas = loadCanvas(canvasId)

  const payload = {
    countryCode: country,
    matchedBy: variant ? "variant" : "default",
    variant: variant ? { _id: variant._id, name: variant.name, canvasId } : null,
    substore: publicSubstore(substore),
    canvas,
  }

  await cacheSet(cacheKey, payload, env.CACHE_TTL_SECONDS * 5)
  return payload
}
