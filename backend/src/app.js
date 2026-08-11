import cookieParser from "cookie-parser"
import cors from "cors"
import express from "express"
import mongoSanitize from "express-mongo-sanitize"
import helmet from "helmet"
import hpp from "hpp"
import { env } from "./config/env.js"
import { errorHandler } from "./middleware/errorHandler.js"
import { apiLimiter } from "./middleware/rateLimiter.js"
import { activationRoutes } from "./modules/activation/activation.routes.js"
import { authRoutes } from "./modules/auth/auth.routes.js"
import { platformRoutes } from "./modules/platform/platform.routes.js"
import { sellerRoutes } from "./modules/seller/seller.routes.js"
import { storefrontRoutes } from "./modules/storefront/storefront.routes.js"
import { storeVariantRoutes } from "./modules/storevariants/storevariant.routes.js"
import { substoreRoutes } from "./modules/substores/substore.routes.js"
import { permissionRoutes } from "./modules/permissions/permission.routes.js"
import { roleRoutes } from "./modules/roles/role.routes.js"
import { storeAdminRoutes } from "./modules/storeadmins/storeadmin.routes.js"
import { storeAdminAuthRoutes } from "./modules/storeadmins/storeadmin.auth.routes.js"
import { themeRoutes } from "./modules/theme/theme.routes.js"
import { UPLOADS_ROOT } from "./utils/uploads.js"

export const app = express()

app.set("trust proxy", 1)

// Security headers
app.use(helmet())

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
app.use(express.json({ limit: "100kb" }))
app.use(cookieParser())

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
app.use("/api/seller/permissions", permissionRoutes)
app.use("/api/seller/roles", roleRoutes)
app.use("/api/seller/store-admins", storeAdminRoutes)
app.use("/api/seller/store-admins/auth", storeAdminAuthRoutes)
app.use("/api/seller", sellerRoutes)

// Deny by default — unknown API routes 404 with no info leak.
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }))

app.use(errorHandler)
