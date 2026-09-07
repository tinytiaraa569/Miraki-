import cookieParser from "cookie-parser"
import cors from "cors"
import express from "express"
import mongoSanitize from "express-mongo-sanitize"
import helmet from "helmet"
import hpp from "hpp"
import { env } from "./config/env.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { apiLimiter } from "./middleware/rateLimiter.js"
import { serveStorefront } from "./middleware/serveStorefront.js"
import { activationRoutes } from "./modules/activation/activation.routes.js"
import { authRoutes } from "./modules/auth/auth.routes.js"
import { brandRoutes } from "./modules/brands/brand.routes.js"
import { categoryRoutes } from "./modules/categories/category.routes.js"
import { collectionRoutes } from "./modules/collections/collection.routes.js"
import { discountRoutes } from "./modules/discounts/discount.routes.js"
import { generalSettingsRoutes } from "./modules/generalsettings/generalSettings.routes.js"
import { metafieldRoutes } from "./modules/metafields/metafield.routes.js"

import { optionSetRoutes } from "./modules/optionsets/optionSet.routes.js"
import { platformRoutes } from "./modules/platform/platform.routes.js"
import { productRoutes } from "./modules/products/product.routes.js"
import { sellerRoutes } from "./modules/seller/seller.routes.js"
import { storefrontRoutes } from "./modules/storefront/storefront.routes.js"
import { storeVariantRoutes } from "./modules/storevariants/storevariant.routes.js"
import { substoreRoutes } from "./modules/substores/substore.routes.js"
import { permissionRoutes } from "./modules/permissions/permission.routes.js"
import { roleRoutes } from "./modules/roles/role.routes.js"
import { storeAdminRoutes } from "./modules/storeadmins/storeadmin.routes.js"
import { storeAdminAuthRoutes } from "./modules/storeadmins/storeadmin.auth.routes.js"
import { couponRoutes } from "./modules/coupons/coupon.routes.js"
import { themeRoutes } from "./modules/theme/theme.routes.js"
import { UPLOADS_ROOT } from "./utils/uploads.js"

export const app = express()

app.set("trust proxy", 1)

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // index.html carries an inline theme bootstrap that MUST run before first
        // paint, so it cannot move to an external file without reintroducing the
        // flash-of-wrong-theme. Allow that one script by hash rather than with
        // 'unsafe-inline' — serveStorefront injects General Settings headHtml into
        // the page, and 'unsafe-inline' would let that content execute scripts.
        // If the bootstrap ever changes, the browser prints the new hash.
        scriptSrc: ["'self'", "'sha256-VEuIjxPzS7pvVUmEDtR7pCgPGq/DhYhnfD+f7hAFjts='"],
        // Only correct once TLS terminates at the proxy. On a plain-HTTP origin it
        // rewrites same-origin requests to https:// where nothing is listening, so
        // gate it on the same flag that governs secure cookies.
        upgradeInsecureRequests: env.COOKIE_SECURE ? [] : null,
        // Helmet's default is ['self', 'data:'], which is too narrow here:
        //   blob:   imgUrl() passes blob: URLs through for local file previews.
        //   https:  product records may store absolute CDN URLs, which imgUrl()
        //           returns verbatim rather than prefixing IMGDB_URL.
        // Narrow `https:` to the specific image hosts in use once they're known —
        // images can't execute script, but a broad scheme source still permits
        // any HTTPS host to be pinged from a page view.
        imgSrc: ["'self'", "data:", "blob:", "https:"],
      },
    },
  }),
)

// Exact-origin whitelist, credentials for httpOnly cookies. No wildcards.
app.use(
  cors({
    origin: env.CLIENT_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
  }),
)

// The seller profile endpoint carries a base64 logo (max 2 MB decoded) in the
// JSON body — it alone gets a bigger parser. Registered BEFORE the global one,
// so the global parser skips it (body already parsed). Every other route stays
// hard-capped at 100kb.
app.use("/api/seller/profile", express.json({ limit: "8mb" }))
// Substore branding (logo / mobile logo / favicon) also arrives as base64
// data URLs in JSON — same scoped limit, everything else stays at 100kb.
app.use("/api/seller/substores", express.json({ limit: "8mb" }))
// Category images (base64 data URLs) also arrive in the JSON body.
app.use("/api/seller/categories", express.json({ limit: "8mb" }))
// Brand images (base64 data URLs) also arrive in the JSON body.
app.use("/api/seller/brands", express.json({ limit: "8mb" }))
// Collection images (base64 data URLs) also arrive in the JSON body.
app.use("/api/seller/collections", express.json({ limit: "8mb" }))
// BOGO gift images (base64 data URLs, max 2 MB decoded) arrive in the JSON body.
app.use("/api/seller/discounts", express.json({ limit: "8mb" }))
// Option-set value swatches (base64 data URLs) also arrive in the JSON body.
app.use("/api/seller/option-sets", express.json({ limit: "8mb" }))
// General Settings branding (logo / mobile logo / favicon / OG / under-construction
// image) arrive as base64 data URLs — same scoped limit, everything else 100kb.
app.use("/api/seller/general-settings", express.json({ limit: "8mb" }))
// Product galleries carry multiple base64 images — allow a larger body.
app.use("/api/seller/products", express.json({ limit: "12mb" }))

app.use("/api/seller/metafields", express.json({ limit: "2mb" }))

app.use(express.json({ limit: "100kb" }))
app.use(cookieParser(env.COOKIE_SECRET))

// NoSQL injection & HTTP parameter pollution defense
app.use(mongoSanitize())
app.use(hpp())

app.use("/api", apiLimiter)

// Uploaded files (seller logos etc.) — written by utils/uploads.js as
// uploads/<sellerId>/images/<file>, served read-only. dotfiles denied,
// no directory listings, immutable cache (filenames are content-unique).
app.use(
  "/uploads",
  // Images may be rendered from a different origin (frontend dev server /
  // CDN) — relax helmet's same-origin resource policy for this path only.
  (_req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin")
    next()
  },
  express.static(UPLOADS_ROOT, {
    immutable: true,
    maxAge: "7d",
    dotfiles: "deny",
    index: false,
  }),
  // Missing file → clean 404 (never falls through to the SPA or API).
  (_req, res) => res.status(404).json({ error: "Not found" }),
)

app.get("/api/health", (_req, res) => res.json({ ok: true }))
// Public storefront resolver (geo → substore + canvas). Read-only, cacheable.
app.use("/api/storefront", storefrontRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/activate", activationRoutes)
app.use("/api/platform", platformRoutes)
// Dashboard theme (separate SellerTheme collection) — registered BEFORE the
// general seller router so /api/seller/theme resolves here first.
app.use("/api/seller/theme", themeRoutes)
// Substores (destination layer) + Store Variants (routing-rule layer) —
// registered BEFORE the general seller router so they resolve first.
app.use("/api/seller/substores", substoreRoutes)
app.use("/api/seller/store-variants", storeVariantRoutes)
// Product categories (N-level tree) — before the general seller router.
app.use("/api/seller/categories", categoryRoutes)
// Product brands (flat list, publish tabs) — before the general seller router.
app.use("/api/seller/brands", brandRoutes)
// Product collections (manual + dynamic rule-based) — before the general router.
app.use("/api/seller/collections", collectionRoutes)
// Discounts (product / order / BOGO) + their scoped picker feeds — before the
// general seller router so /api/seller/discounts/options/:entity resolves here.
app.use("/api/seller/discounts", discountRoutes)
// Product option sets (embedded options + values) — before the general router.
app.use("/api/seller/option-sets", optionSetRoutes)

app.use("/api/seller/metafields", metafieldRoutes)
// Products (central catalog entity) + their standalone variants collection —
// before the general seller router so they resolve first.
app.use("/api/seller/products", productRoutes)
app.use("/api/seller/permissions", permissionRoutes)
app.use("/api/seller/roles", roleRoutes)
app.use("/api/seller/store-admins", storeAdminRoutes)
app.use("/api/seller/store-admins/auth", storeAdminAuthRoutes)
// General Settings (store-wide singleton) — before the general seller router so
// /api/seller/general-settings resolves here first.
app.use("/api/seller/general-settings", generalSettingsRoutes)
app.use("/api/seller/coupons", couponRoutes)
app.use("/api/seller", sellerRoutes)

// Deny by default — unknown API routes 404 with no info leak.
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }))

// Storefront HTML (prod only, opt-in). When SERVE_FRONTEND=true the backend
// serves the built SPA from FRONTEND_DIST and templates the storefront <head>
// from the GeneralSettings singleton. Mounted LAST so it can never shadow /api
// or /uploads (both handled above; the middleware also guards those prefixes).
// In dev this stays OFF — Vite serves index.html and the API is purely
// /api + /uploads, exactly as before.
if (env.SERVE_FRONTEND && env.FRONTEND_DIST) {
  app.use(serveStorefront(env.FRONTEND_DIST))
}

app.use(errorHandler)
