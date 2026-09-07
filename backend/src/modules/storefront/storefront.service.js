import { readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import mongoose from "mongoose"
import { env } from "../../config/env.js"
import { cacheGet, cacheSet } from "../../config/redis.js"
import { getTenantModels, makeTenantDbName } from "../../config/tenantDb.js"
import { listPublicCoupons, previewCouponForCart  } from "../coupons/coupon.service.js"

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

// ---------------------------------------------------------------------------
// Public storefront catalog: read-only product feed for the browsable grid and
// the product detail page. Scoped to the tenant's MAIN store and the resolved
// substore, published + approved only. Facets (shape/gemstone/metal/carat/
// style/occasion) are DERIVED from specifications[] / options[] / tags[] so the
// existing client filter rail works without any schema change.
// ---------------------------------------------------------------------------

const SHAPE_WORDS = ["Round", "Princess", "Cushion", "Emerald", "Oval", "Pear", "Marquise", "Radiant", "Asscher", "Heart"]
const GEM_WORDS = ["Ruby", "Sapphire", "Emerald", "Amethyst", "Topaz", "Aquamarine", "Garnet", "Peridot", "Diamond"]
const METAL_WORDS = ["Yellow Gold", "White Gold", "Rose Gold", "Platinum"]
const STYLE_WORDS = ["Solitaire", "Halo", "Three-Stone", "Pavé", "Vintage", "Modern"]
const OCCASION_WORDS = ["Engagement", "Wedding", "Anniversary", "Everyday", "Gift"]

/** First value from an options[] entry whose name loosely matches `needle`. */
function optionValue(options, needle) {
  const opt = (options || []).find((o) => String(o.name || "").toLowerCase().includes(needle))
  if (!opt) return null
  const def = (opt.values || []).find((v) => v.isDefault) || (opt.values || [])[0]
  return def ? def.label || def.value || null : null
}

/** First spec row value from a group of `type` whose label loosely matches. */
function specValue(specs, groupType, needle) {
  const group = (specs || []).find((g) => g.type === groupType)
  if (!group) return null
  const row = (group.rows || []).find((r) => String(r.label || "").toLowerCase().includes(needle))
  return row ? row.value ?? null : null
}

/** Pick the first dictionary word that appears anywhere in the haystack. */
function matchWord(dictionary, haystack) {
  const hay = String(haystack || "").toLowerCase()
  return dictionary.find((w) => hay.includes(w.toLowerCase())) || null
}

/** Flatten a product into the storefront-safe shape + derived flat facets. */
function toStorefrontCard(p) {
  const images = (p.images || []).map((img) => img?.url).filter(Boolean)
  const tagsHay = [...(p.tags || []), p.tag, p.name].join(" ")
  const caratRaw = specValue(p.specifications, "diamond", "carat") || specValue(p.specifications, "diamond", "weight")
  const carat = caratRaw != null ? Number.parseFloat(String(caratRaw)) : null

  return {
    _id: String(p._id),
    name: p.name,
    alias: p.alias,
    price: p.price,
    comparePrice: p.comparePrice ?? null,
    compareAtPrice: p.comparePrice ?? null,
    tag: p.tag ?? null,
    category: p.tag ?? null,
    image: images[0] ?? null,
    mainImg: images[0] ?? null,
    images,
    // Derived facets — power the existing client filter rail as-is.
    shape:
      optionValue(p.options, "shape") ||
      specValue(p.specifications, "diamond", "shape") ||
      matchWord(SHAPE_WORDS, tagsHay),
    gemstone: optionValue(p.options, "gemstone") || matchWord(GEM_WORDS, tagsHay),
    metal: optionValue(p.options, "metal") || matchWord(METAL_WORDS, tagsHay),
    carat: Number.isFinite(carat) ? carat : null,
    style: matchWord(STYLE_WORDS, tagsHay),
    occasion: matchWord(OCCASION_WORDS, tagsHay),
  }
}

const PRODUCT_LIST_SELECT = {
  name: 1,
  alias: 1,
  price: 1,
  comparePrice: 1,
  tag: 1,
  tags: 1,
  sortOrder: 1,
  "images.url": 1,
  "specifications.type": 1,
  "specifications.rows.label": 1,
  "specifications.rows.value": 1,
  "options.name": 1,
  "options.values.label": 1,
  "options.values.value": 1,
  "options.values.isDefault": 1,
}

async function getStorefrontScope(substoreId) {
  const dbName = await ensureStorefrontTenant()
  const { Store, Product } = getTenantModels(dbName)
  const mainStore = await Store.findOne({ type: "MAIN", isDeleted: { $ne: true } }).select("_id").lean()
  // Storefront gate: the piece must be published and not soft-deleted. `approve`
  // is a moderation status — we surface everything except explicitly rejected
  // items (seller catalogs commonly sit at "pending").
  const match = {
    isDeleted: { $ne: true },
    isPublished: true,
    approve: { $ne: "rejected" },
  }
  if (mainStore?._id) match.parentStoreId = mainStore._id
  // Substore scope: `substoreIds` is an ALLOWLIST (inclusion). Empty/absent =
  // shown in every substore; a listed substore = visible ONLY there. So a
  // product with substoreIds = [IND] appears only on the IND storefront, and a
  // product with no substoreIds appears everywhere.
  if (substoreId) {
    match.$or = [{ substoreIds: { $size: 0 } }, { substoreIds: { $exists: false } }, { substoreIds: substoreId }]
  }
  return { Product, match }
}

export async function listStorefrontProducts(countryCode) {
  const country = /^[A-Z]{2}$/.test(countryCode || "") ? countryCode : null
  const cacheKey = `storefront:products:${country || "default"}`
  const cached = await cacheGet(cacheKey)
  if (cached) return cached

  const { substore } = await resolveStorefront(country)
  const { Product, match } = await getStorefrontScope(substore?._id)

  const rows = await Product.find(match)
    .sort({ sortOrder: 1, name: 1 })
    .select(PRODUCT_LIST_SELECT)
    .limit(200)
    .lean()

  const payload = { products: rows.map(toStorefrontCard) }
  await cacheSet(cacheKey, payload, env.CACHE_TTL_SECONDS * 5)
  return payload
}

/**
 * Cheap alias → _id resolver. On a direct visit/refresh the client only has the
 * pretty alias in the URL, so it calls this ONCE to turn the alias into an _id,
 * then addresses the full detail fetch by _id (get-allproducts/<id>). Projects
 * only `_id`, scoped to the same published/approved/substore gate as the detail
 * route, so it stays a tiny lookup.
 */
export async function resolveStorefrontProductId(alias, countryCode) {
  const country = /^[A-Z]{2}$/.test(countryCode || "") ? countryCode : null
  const { substore } = await resolveStorefront(country)
  const { Product, match } = await getStorefrontScope(substore?._id)

  const doc = await Product.findOne({ ...match, alias: String(alias || "").toLowerCase() })
    .select({ _id: 1 })
    .lean()

  if (!doc) return null
  return { id: String(doc._id) }
}

/**
 * Full product detail for the product page (all images, options, specs).
 * Accepts either a plain alias string or `{ alias, id }`. When a valid `id` is
 * given we resolve by _id (exact, immune to alias renames/collisions) and fall
 * back to the alias otherwise — the URL stays alias-based, only the lookup key
 * changes.
 */
export async function getStorefrontProduct(identifier, countryCode) {
  const alias = typeof identifier === "string" ? identifier : identifier?.alias
  const id = typeof identifier === "object" && identifier ? identifier.id : null
  const country = /^[A-Z]{2}$/.test(countryCode || "") ? countryCode : null
  const { substore } = await resolveStorefront(country)
  const { Product, match } = await getStorefrontScope(substore?._id)

  const selector =
    id && mongoose.isValidObjectId(id) ? { _id: id } : { alias: String(alias || "").toLowerCase() }
  const doc = await Product.findOne({ ...match, ...selector })
    .select({
      name: 1,
      alias: 1,
      description: 1,
      price: 1,
      comparePrice: 1,
      tag: 1,
      tags: 1,
      images: 1,
      specifications: 1,
      options: 1,
      parentStoreId: 1,
    })
    .lean()

  if (!doc) return null

  // Substore scope for options/values. `substoreIds` is an ALLOWLIST (inclusion):
  // empty = shown in every substore; a listed substore = visible ONLY there.
  // This matches how the admin ticks it — "18K is for IND" stores
  // 18K.substoreIds = [IND], so 18K appears only on the IND storefront, while a
  // value with no substoreIds shows everywhere.
  const sid = String(substore?._id || "")
  const inSubstore = (ids) => !ids?.length || ids.map(String).includes(sid)

  // Filter options → values by substore. Drop whole options that are either
  // hidden at the option level or left with zero visible values.
  const visibleOptions = (doc.options || [])
    .filter((o) => inSubstore(o.substoreIds))
    .map((o) => ({ ...o, values: (o.values || []).filter((v) => inSubstore(v.substoreIds)) }))
    .filter((o) => (o.values || []).length > 0)

  // Allowed value set per option name, so we can prune variants that reference a
  // now-hidden value (e.g. any 18K variant on the IND storefront).
  const allowedByOption = new Map(visibleOptions.map((o) => [o.name, new Set((o.values || []).map((v) => v.value))]))

  // Lightweight variant INDEX: one compact row per variant carrying only its
  // key + price + whether it owns an image (never the images themselves or the
  // heavy spec arrays). ~100 bytes/row, so even a 400+ variant product adds only
  // a few KB. The client resolves the selected combo → price INSTANTLY from this
  // index (zero extra requests) and lazy-fetches a variant's images by id ONLY
  // when hasImage is true. Price shown here is display-only; the authoritative
  // charge is recomputed server-side at checkout.
  const dbName = await ensureStorefrontTenant()
  const { ProductVariant } = getTenantModels(dbName)
  const variantRows = await ProductVariant.find({ parentStoreId: doc.parentStoreId, productId: doc._id })
    .select({
      variantKey: 1,
      "options.name": 1,
      "options.value": 1,
      price: 1,
      comparePrice: 1,
      image: 1,
      "images.url": 1,
      isDefault: 1,
    })
    .sort({ sortOrder: 1 })
    .lean()
  const variants = variantRows
    // Drop variants that reference a value hidden in this substore. A variant is
    // only shown when EVERY one of its variant-defining options resolves to a
    // still-visible value; if an option isn't in the allowlist map at all it was
    // fully hidden, so the variant can't be selectable either.
    .filter((v) =>
      (v.options || []).every((o) => {
        const allowed = allowedByOption.get(o.name)
        return allowed ? allowed.has(o.value) : false
      }),
    )
    .map((v) => ({
      id: String(v._id),
      key: v.variantKey || "",
      // Labeled option pairs (name → value) so the client can match a variant by
      // its options regardless of value order — the joined `key` alone is
      // order-dependent and can mismatch. ~40 bytes/row, still a compact index.
      options: (v.options || []).map((o) => ({ name: o.name, value: o.value })),
      price: v.price ?? null,
      comparePrice: v.comparePrice ?? null,
      hasImage: !!(v.image || v.images?.[0]?.url),
      isDefault: !!v.isDefault,
    }))

  // If the original default variant was pruned (its value is hidden here),
  // promote the first surviving variant so the page always opens on a valid,
  // in-scope selection.
  if (variants.length && !variants.some((v) => v.isDefault)) variants[0].isDefault = true

  const card = toStorefrontCard(doc)
  return {
    product: {
      ...card,
      variants,
      description: doc.description ?? null,
      images: (doc.images || []).map((img) => ({ url: img?.url, alt: img?.alt || doc.name })).filter((i) => i.url),
      specifications: (doc.specifications || []).map((g) => ({
        type: g.type,
        displayName: g.displayName || "",
        rows: (g.rows || [])
          .filter((r) => r.show !== false)
          .map((r) => ({ label: r.label, value: r.value, unit: r.unit || "" })),
      })),
      options: visibleOptions.map((o) => ({
        name: o.name,
        displayName: o.displayName || o.name,
        type: o.type || "dropdown",
        required: !!o.required,
        // "Show always" options are storefront-only add-ons — they never define
        // a variant. The client uses this flag to know which selections build
        // the variant-lookup key vs. which are pure add-ons.
        showAlways: !!o.showAlways,
        // Keep the value's own default flag only if it's still visible; if the
        // default value was hidden, fall back to the first visible value.
        values: ensureValueDefault(
          (o.values || []).map((v) => ({
            label: v.label || v.value,
            value: v.value,
            image: v.image?.url || null,
            priceDelta: v.priceDelta || null,
            isDefault: !!v.isDefault,
          })),
        ),
      })),
    },
  }
}

// Guarantee exactly one usable default within a value list: if none of the
// surviving values is flagged default (because the flagged one was hidden for
// this substore), promote the first value so the UI never opens on "nothing".
function ensureValueDefault(values) {
  if (values.length && !values.some((v) => v.isDefault)) values[0].isDefault = true
  return values
}

// ---------------------------------------------------------------------------
// Lazy variant media: given a product alias + a variant _id (from the variant
// index shipped with the product), return ONLY that variant's own image gallery.
// Called on demand when the shopper selects a combination whose index row has
// hasImage=true, so we never preload hundreds of galleries. The response carries
// images ONLY — never a price — so a tampered id can at most reveal a different
// variant's images; the charged price stays server-authoritative at checkout.
// ---------------------------------------------------------------------------
export async function getStorefrontVariantMedia(alias, variantId, countryCode) {
  const country = /^[A-Z]{2}$/.test(countryCode || "") ? countryCode : null

  // Hardening: must be a real ObjectId, and the variant must belong to THIS
  // in-scope product/tenant — never a cross-product id.
  if (!mongoose.Types.ObjectId.isValid(String(variantId || ""))) return null

  const { substore } = await resolveStorefront(country)
  const { Product, match } = await getStorefrontScope(substore?._id)

  const product = await Product.findOne({ ...match, alias: String(alias).toLowerCase() })
    .select({ _id: 1, parentStoreId: 1, name: 1, options: 1 })
    .lean()
  if (!product) return null // product not found / not in storefront scope

  const dbName = await ensureStorefrontTenant()
  const { ProductVariant } = getTenantModels(dbName)
  const v = await ProductVariant.findOne({
    _id: variantId,
    productId: product._id,
    parentStoreId: product.parentStoreId,
  })
    .select({ image: 1, "images.url": 1, "images.alt": 1, "options.name": 1, "options.value": 1 })
    .lean()

  if (!v) return { images: [] }

  // Same substore blocklist as the detail route: a variant hidden in this
  // substore (references a disabled value, e.g. 18K on IND) must not leak its
  // media, even if a valid id is guessed/tampered.
  const sid = String(substore?._id || "")
  const inSubstore = (ids) => !ids?.length || !ids.map(String).includes(sid)
  const allowedByOption = new Map(
    (product.options || [])
      .filter((o) => inSubstore(o.substoreIds))
      .map((o) => [o.name, new Set((o.values || []).filter((val) => inSubstore(val.substoreIds)).map((val) => val.value))]),
  )
  const variantVisible = (v.options || []).every((o) => {
    const allowed = allowedByOption.get(o.name)
    return allowed ? allowed.has(o.value) : false
  })
  if (!variantVisible) return { images: [] }

  let images = (v.images || [])
    .map((img) => ({ url: img?.url, alt: img?.alt || product.name }))
    .filter((i) => i.url)
  // Legacy single-image fallback for older rows that predate the gallery.
  if (!images.length && v.image) images = [{ url: v.image, alt: product.name }]

  return { images }
}

/**
 * Shared matcher: country → StoreVariant (rule layer) → Substore (destination
 * layer). This is the single source of truth used by BOTH the full page resolver
 * (`resolveStorefront`) and the lightweight substore-only resolver
 * (`resolveSubstore`), so their matching can never drift apart.
 */
async function matchSubstore(country) {
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

  return { variant, substore }
}

/**
 * FAST substore-only resolver. Returns just the matched substore for a country —
 * NO canvas JSON, NO product query — so it's the cheapest call to learn "which
 * store/currency applies to this visitor". Use this to scope product/category
 * API calls. Cached separately (its own key) from the full page resolver.
 */
export async function resolveSubstore(countryCode) {
  const country = /^[A-Z]{2}$/.test(countryCode || "") ? countryCode : null
  const cacheKey = `storefront:substore:${country || "default"}`

  const cached = await cacheGet(cacheKey)
  if (cached) return cached

  const { variant, substore } = await matchSubstore(country)

  const payload = {
    countryCode: country,
    matchedBy: variant ? "variant" : "default",
    substore: publicSubstore(substore),
  }

  await cacheSet(cacheKey, payload, env.CACHE_TTL_SECONDS * 5)
  return payload
}

/**
 * FAST list of all sellable substores for the storefront country/region
 * dropdown. Returns a tiny, projected payload (no canvas, no products) sorted
 * by sortOrder, so the navbar can render its options straight from the DB
 * instead of a hardcoded list. Shared, country-independent cache key.
 */
export async function listPublicSubstores() {
  const cacheKey = "storefront:substores:list"

  const cached = await cacheGet(cacheKey)
  if (cached) return cached

  const dbName = await ensureStorefrontTenant()
  const { Substore } = getTenantModels(dbName)

  const docs = await Substore.find({ status: "active", isDeleted: { $ne: true } })
    .sort({ sortOrder: 1, name: 1 })
    .lean()

  const payload = { substores: docs.map(publicSubstore) }

  await cacheSet(cacheKey, payload, env.CACHE_TTL_SECONDS * 5)
  return payload
}

export async function resolveStorefront(countryCode) {
  const country = /^[A-Z]{2}$/.test(countryCode || "") ? countryCode : null
  const cacheKey = `storefront:resolve:${country || "default"}`

  const cached = await cacheGet(cacheKey)
  if (cached) return cached

  const { variant, substore } = await matchSubstore(country)

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

async function getStorefrontSellerId() {
  const dbName = await ensureStorefrontTenant()
  const { Store } = getTenantModels(dbName)
  const mainStore = await Store.findOne({ type: "MAIN", isDeleted: { $ne: true } })
    .select("sellerId")
    .lean()
  if (!mainStore) throw new ApiError(400, "Store not configured")
  return mainStore.sellerId
}

export async function applyStorefrontCoupon({ code, cartTotal, userId, items, countryCode }) {
  const country = /^[A-Z]{2}$/.test(countryCode || "") ? countryCode : null
  const { substore } = await resolveSubstore(country)
  const dbName = await ensureStorefrontTenant()
  const sellerId = await getStorefrontSellerId()

  return previewCouponForCart({
    tenantDbName: dbName,
    code,
    sellerId,
    substoreId: substore?._id,
    userId,
    cartTotal,
    items,
  })
}


export async function listStorefrontAvailableCoupons(countryCode) {
  const country = /^[A-Z]{2}$/.test(countryCode || "") ? countryCode : null
  const { substore } = await resolveSubstore(country)
  const dbName = await ensureStorefrontTenant()
  const sellerId = await getStorefrontSellerId()

  const coupons = await listPublicCoupons({
    tenantDbName: dbName,
    sellerId,
    substoreId: substore?._id,
  })

  return { coupons }
}