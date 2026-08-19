import { getTenantModels } from "../../config/tenantDb.js"
import { hashPassword } from "../../utils/crypto.js"
import { deleteSettingsImage, saveSettingsImage } from "../../utils/uploads.js"
import { audit } from "../audit/audit.service.js"


const SINGLETON_KEY = "general"

const DEFAULT_TITLE = "Miraki Jewels"
const DEFAULT_DESCRIPTION = ""
const DEFAULT_FAVICON = "/favicon.svg"

const IMAGE_SLOTS = [
  { data: "logoBase64", remove: "removeLogo", field: "logoUrl" },
  { data: "mobileLogoBase64", remove: "removeMobileLogo", field: "mobileLogoUrl" },
  { data: "faviconBase64", remove: "removeFavicon", field: "faviconUrl" },
  { data: "ogImageBase64", remove: "removeOgImage", field: "ogImageUrl" },
]

const SCALAR_FIELDS = [
  "storeName",
  "pageTitle",
  "description",
  "contactEmail",
  "contactPhone",
  "defaultStoreLocation",
  "copyright",
  "defaultLanguage",
  "defaultTimezone",
]

function publicSettings(doc) {
  if (!doc) return null
  const o = typeof doc.toObject === "function" ? doc.toObject() : doc
  const { passwordPage, __v, ...rest } = o
  return {
    ...rest,
    passwordPage: { enabled: !!passwordPage?.enabled },
  }
}


const headCache = new Map() // tenantDbName -> { payload, expiresAt }
const HEAD_TTL_MS = 60_000

export function bustHeadCache(tenantDbName) {
  if (tenantDbName) headCache.delete(tenantDbName)
}

// Escape a value for safe interpolation into an HTML text/attribute context.
function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}


function htmlToText(html) {
  return String(html ?? "")
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
}


function safeAssetUrl(url) {
  if (typeof url !== "string") return null
  if (!/^\/uploads\/[a-z0-9/_.-]+$/i.test(url) || url.includes("..")) return null
  return url
}


export function renderHeadHtml(settings) {
  const title = escapeHtml((settings?.pageTitle || settings?.storeName || DEFAULT_TITLE).slice(0, 200))
  const description = escapeHtml(htmlToText(settings?.description || DEFAULT_DESCRIPTION).slice(0, 500))
  const favicon = escapeHtml(safeAssetUrl(settings?.faviconUrl) || DEFAULT_FAVICON)
  const ogImage = safeAssetUrl(settings?.ogImageUrl)

  const lines = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="icon" href="${favicon}" />`,
    `<meta property="og:title" content="${title}" />`,
  ]
  if (description) lines.push(`<meta property="og:description" content="${description}" />`)
  if (ogImage) lines.push(`<meta property="og:image" content="${escapeHtml(ogImage)}" />`)
  return lines.join("\n    ")
}


export async function getPublicHead(tenantDbName) {
  const cached = headCache.get(tenantDbName)
  if (cached && cached.expiresAt > Date.now()) return cached.payload

  const { GeneralSettings } = getTenantModels(tenantDbName)
  const doc = await GeneralSettings.findOne({ key: SINGLETON_KEY }).lean()

  const payload = {
    title: (doc?.pageTitle || doc?.storeName || DEFAULT_TITLE).slice(0, 200),
    description: htmlToText(doc?.description || DEFAULT_DESCRIPTION).slice(0, 500),
    faviconUrl: safeAssetUrl(doc?.faviconUrl) || DEFAULT_FAVICON,
    ogImageUrl: safeAssetUrl(doc?.ogImageUrl),
    
    underConstruction: {
      enabled: !!doc?.underConstruction?.enabled,
      imageUrl: safeAssetUrl(doc?.underConstruction?.imageUrl) || null,
    },
    headHtml: renderHeadHtml(doc),
  }

  headCache.set(tenantDbName, { payload, expiresAt: Date.now() + HEAD_TTL_MS })
  return payload
}


export async function getGeneralSettings({ tenantDbName }) {
  const { GeneralSettings } = getTenantModels(tenantDbName)
  let doc = await GeneralSettings.findOne({ key: SINGLETON_KEY }).lean()
  if (!doc) {
    doc = (await GeneralSettings.create({ key: SINGLETON_KEY })).toObject()
  }
  return publicSettings(doc)
}

export async function updateGeneralSettings({ seller, tenantDbName, user, req }, updates) {
  const { GeneralSettings } = getTenantModels(tenantDbName)

  // Load WITH the hash so a partial save can preserve it; create the singleton
  // on first save.
  let doc = await GeneralSettings.findOne({ key: SINGLETON_KEY }).select("+passwordPage.passwordHash")
  if (!doc) doc = new GeneralSettings({ key: SINGLETON_KEY })

  const sellerId = seller._id

  // Top-level image slots.
  for (const slot of IMAGE_SLOTS) {
    if (updates[slot.data]) {
      const oldUrl = doc[slot.field]
      doc[slot.field] = await saveSettingsImage({ sellerId, dataUrl: updates[slot.data] })
      if (oldUrl) await deleteSettingsImage({ sellerId, publicUrl: oldUrl })
    } else if (updates[slot.remove] === true && doc[slot.field]) {
      await deleteSettingsImage({ sellerId, publicUrl: doc[slot.field] })
      doc[slot.field] = null
    }
  }

  // Under-construction (nested toggle + own image slot).
  if (updates.underConstruction) {
    const uc = updates.underConstruction
    if (typeof uc.enabled === "boolean") doc.underConstruction.enabled = uc.enabled
    if (uc.imageBase64) {
      const oldUrl = doc.underConstruction.imageUrl
      doc.underConstruction.imageUrl = await saveSettingsImage({ sellerId, dataUrl: uc.imageBase64 })
      if (oldUrl) await deleteSettingsImage({ sellerId, publicUrl: oldUrl })
    } else if (uc.removeImage === true && doc.underConstruction.imageUrl) {
      await deleteSettingsImage({ sellerId, publicUrl: doc.underConstruction.imageUrl })
      doc.underConstruction.imageUrl = null
    }
  }

  // Password page (nested toggle + hashed secret). "" clears it; a value sets it.
  if (updates.passwordPage) {
    const pp = updates.passwordPage
    if (typeof pp.enabled === "boolean") doc.passwordPage.enabled = pp.enabled
    if (pp.password === "") {
      doc.passwordPage.passwordHash = null
    } else if (typeof pp.password === "string" && pp.password) {
      doc.passwordPage.passwordHash = await hashPassword(pp.password)
    }
  }

  // Scalar text fields.
  for (const key of SCALAR_FIELDS) {
    if (updates[key] !== undefined) doc[key] = updates[key]
  }

  
  if (seller?.businessName) doc.storeName = seller.businessName

  doc.updatedBy = user._id
  await doc.save()

  // Storefront head reflects the edit on next request (within the TTL window).
  bustHeadCache(tenantDbName)

  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.general_settings.updated",
    targetType: "GeneralSettings",
    targetId: doc._id,
    after: { storeName: doc.storeName, pageTitle: doc.pageTitle },
  })

  return publicSettings(doc)
}
