import { Router } from "express"
import { resolveStorefront, listCanvasIds } from "./storefront.service.js"

// PUBLIC, read-only storefront resolver — no auth, safe by construction:
// it only ever returns whitelisted substore fields + a static canvas JSON.
export const storefrontRoutes = Router()

/** Country detection: explicit ?country override → CDN geo headers. */
function detectCountry(req) {
  const q = String(req.query.country || "").toUpperCase()
  if (/^[A-Z]{2}$/.test(q)) return q
  const header =
    req.headers["x-vercel-ip-country"] ||
    req.headers["cf-ipcountry"] ||
    req.headers["x-country-code"] ||
    ""
  const h = String(header).toUpperCase()
  return /^[A-Z]{2}$/.test(h) ? h : null
}

storefrontRoutes.get("/resolve", async (req, res, next) => {
  try {
    const payload = await resolveStorefront(detectCountry(req))
    // Browser/CDN caching: fresh for 60s, serve-stale while revalidating 5min.
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
    res.set("Vary", "x-vercel-ip-country, cf-ipcountry")
    res.json(payload)
  } catch (err) {
    next(err)
  }
})

// Handy for hub testing: which canvas IDs exist on disk.
storefrontRoutes.get("/canvases", (_req, res) => {
  res.set("Cache-Control", "public, max-age=300")
  res.json({ canvasIds: listCanvasIds() })
})
