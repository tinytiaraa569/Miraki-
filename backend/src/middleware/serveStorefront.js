import { readFileSync } from "node:fs"
import path from "node:path"
import express from "express"
import { getPublicHead, renderHeadHtml } from "../modules/generalsettings/generalSettings.service.js"
import { ensureStorefrontTenant } from "../modules/storefront/storefront.service.js"

// ---------------------------------------------------------------------------
// SERVE STOREFRONT (prod) — serves the built SPA and templates the storefront
// <head> from the store-wide General Settings singleton, replacing the
// <!--SF_HEAD--> marker in index.html at serve time.
//
// ADDITIVE + PROD-GATED: app.js mounts this LAST and only when
// env.SERVE_FRONTEND is true. In dev (Vite) and the API-only deployment it is
// never mounted, so /api and /uploads behaviour is completely unchanged.
//
//   /  and /index.html   → templated HTML (no-cache, so head edits show up)
//   /assets/* etc.       → express.static, hashed + immutable (1y cache)
//   deep SPA links       → templated HTML shell (client router takes over)
// ---------------------------------------------------------------------------
export function serveStorefront(distDir) {
  const indexPath = path.join(distDir, "index.html")
  // Read the built shell ONCE at boot — it is immutable for a given build.
  const template = readFileSync(indexPath, "utf8")

  async function serveTemplated(_req, res) {
    let headHtml
    try {
      const dbName = await ensureStorefrontTenant()
      headHtml = (await getPublicHead(dbName)).headHtml
    } catch {
      // Never fail the page on a settings/DB hiccup — fall back to the default
      // head so the marker never leaks and the shell always boots.
      headHtml = renderHeadHtml(null)
    }
    res.set("Cache-Control", "no-cache")
    res.type("html").send(template.replace("<!--SF_HEAD-->", headHtml))
  }

  const router = express.Router()

  // index.html is ALWAYS templated + no-cache (never served stale by static).
  router.get(["/", "/index.html"], serveTemplated)

  // Hashed, immutable build assets — the fast static path.
  router.use(express.static(distDir, { index: false, maxAge: "1y", immutable: true }))

  // SPA deep links resolve to the templated shell. /api and /uploads are handled
  // earlier in app.js; guard anyway so a stray match can never shadow them.
  router.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next()
    return serveTemplated(req, res)
  })

  return router
}
