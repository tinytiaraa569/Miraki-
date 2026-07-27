import { ApiError } from "../../utils/apiError.js"
import { audit } from "../audit/audit.service.js"
import { SellerTheme } from "./theme.model.js"

// Serialize a theme doc into the tiny JSON payload the Hub shell consumes.
function toPayload(doc) {
  if (!doc) return { light: {}, dark: {}, radius: null, fonts: { sans: null, mono: null } }
  return {
    light: doc.light ? Object.fromEntries(doc.light) : {},
    dark: doc.dark ? Object.fromEntries(doc.dark) : {},
    radius: doc.radius ?? null,
    fonts: { sans: doc.fonts?.sans ?? null, mono: doc.fonts?.mono ?? null },
  }
}

// Read is available to every Hub user — the theme must apply for everyone.
export async function getSellerTheme({ seller }) {
  const doc = await SellerTheme.findOne({ sellerId: seller._id })
  return toPayload(doc)
}

// Owner-only write. `light`/`dark` REPLACE the stored map wholesale (the
// editor always sends the complete set of changed tokens), so removing a
// token override client-side genuinely clears it here too.
export async function saveSellerTheme({ seller, user, updates, req }) {
  if (user.role !== "SELLER_SUPERADMIN") throw new ApiError(403, "Only the owner can edit the dashboard theme")

  let doc = await SellerTheme.findOne({ sellerId: seller._id })
  const before = toPayload(doc)

  if (!doc) doc = new SellerTheme({ sellerId: seller._id })
  if (updates.light !== undefined) doc.light = updates.light
  if (updates.dark !== undefined) doc.dark = updates.dark
  if (updates.radius !== undefined) doc.radius = updates.radius || null
  if (updates.fonts !== undefined) {
    if (updates.fonts.sans !== undefined) doc.set("fonts.sans", updates.fonts.sans || null)
    if (updates.fonts.mono !== undefined) doc.set("fonts.mono", updates.fonts.mono || null)
  }
  doc.updatedBy = user._id
  await doc.save()

  const after = toPayload(doc)
  await audit({
    req,
    actorId: user._id,
    actorRole: user.role,
    sellerId: seller._id,
    action: "seller.theme.updated",
    targetType: "SellerTheme",
    targetId: doc._id,
    before,
    after,
  })

  return after
}

// Owner-only reset — deletes the override document entirely, so the Hub
// falls back to the default globals.css theme.
export async function resetSellerTheme({ seller, user, req }) {
  if (user.role !== "SELLER_SUPERADMIN") throw new ApiError(403, "Only the owner can reset the dashboard theme")

  const doc = await SellerTheme.findOneAndDelete({ sellerId: seller._id })
  if (doc) {
    await audit({
      req,
      actorId: user._id,
      actorRole: user.role,
      sellerId: seller._id,
      action: "seller.theme.reset",
      targetType: "SellerTheme",
      targetId: doc._id,
      before: toPayload(doc),
    })
  }
  return { light: {}, dark: {}, radius: null, fonts: { sans: null, mono: null } }
}
