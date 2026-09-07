
// Backend API server (Express).
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:8000"

// Base URL where uploaded images (/uploads/seller/<id>/logo/...) are served.
// Defaults to the backend itself; point it at a CDN in production if needed.
export const IMGDB_URL = import.meta.env.VITE_IMGDB_URL || SERVER_URL


export function imgUrl(path) {
  if (!path) return null
  if (/^(https?:|data:|blob:)/i.test(path)) return path
  return `${IMGDB_URL}${path.startsWith("/") ? "" : "/"}${path}`
}