// ---------------------------------------------------------------------------
// SERVER CONFIG — the single place where the frontend knows about the
// backend. Change these (or set VITE_SERVER_URL / VITE_IMGDB_URL in .env)
// when deploying; nothing else in the app hardcodes a host.
// ---------------------------------------------------------------------------

// Backend API server (Express).
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8000"

// Base URL where uploaded images (/uploads/seller/<id>/logo/...) are served.
// Defaults to the backend itself; point it at a CDN in production if needed.
export const IMGDB_URL = import.meta.env.VITE_IMGDB_URL || SERVER_URL

/**
 * Resolve a stored image URL from the database into an absolute src.
 * DB rows only store paths like "/uploads/seller/<id>/logo/x.png" —
 * this prefixes IMGDB_URL. Absolute/data/blob URLs pass through untouched.
 */
export function imgUrl(path) {
  if (!path) return null
  if (/^(https?:|data:|blob:)/i.test(path)) return path
  return `${IMGDB_URL}${path.startsWith("/") ? "" : "/"}${path}`
}