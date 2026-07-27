import { randomBytes } from "node:crypto"
import { mkdir, unlink, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { ApiError } from "./apiError.js"

// ---------------------------------------------------------------------------
// BASE64 UPLOADS — no multer, no multipart. The client sends a data URL
// (data:image/png;base64,....) in the JSON body; we decode and write it to
// disk ourselves at:  uploads/<sellerId>/images/<random>.<ext>
// Served statically at /uploads (app.js).
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// server/src/utils -> server/uploads
export const UPLOADS_ROOT = path.resolve(__dirname, "../../uploads")

const ALLOWED_MIME = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
}

const MAX_IMAGE_BYTES = 2 * 1024 * 1024 // 2 MB decoded

// Only ever accept a MongoDB ObjectId string — prevents path traversal
// ("../../etc") since the id is the directory name on disk.
function assertSafeId(sellerId) {
  if (!/^[a-f0-9]{24}$/i.test(String(sellerId))) {
    throw new ApiError(400, "Invalid seller id")
  }
}

// data:image/png;base64,AAAA... -> { mime, buffer }
function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== "string") throw new ApiError(400, "Image must be a base64 data URL")
  const match = dataUrl.match(/^data:([a-z0-9+/.-]+);base64,(.+)$/i)
  if (!match) throw new ApiError(400, "Image must be a base64 data URL (data:image/...;base64,...)")
  const [, mime, b64] = match
  const ext = ALLOWED_MIME[mime.toLowerCase()]
  if (!ext) throw new ApiError(400, "Only PNG, JPEG, WEBP, or SVG images are allowed")
  const buffer = Buffer.from(b64, "base64")
  if (buffer.length === 0) throw new ApiError(400, "Empty image")
  if (buffer.length > MAX_IMAGE_BYTES) throw new ApiError(413, "Image too large (max 2 MB)")
  return { ext, buffer }
}

// Writes the image and returns its public URL path:
//   /uploads/seller/<sellerId>/<folder>/<file>   (folder defaults to "logo")
// ONLY this URL string is persisted in the database — never the bytes.
export async function saveSellerImage({ sellerId, dataUrl, folder = "logo" }) {
  assertSafeId(sellerId)
  if (!/^[a-z0-9_-]{1,32}$/i.test(folder)) throw new ApiError(400, "Invalid upload folder")
  const { ext, buffer } = parseDataUrl(dataUrl)

  const dir = path.join(UPLOADS_ROOT, "seller", String(sellerId), folder)
  await mkdir(dir, { recursive: true })

  const filename = `${Date.now()}_${randomBytes(6).toString("hex")}.${ext}`
  await writeFile(path.join(dir, filename), buffer)

  return `/uploads/seller/${sellerId}/${folder}/${filename}`
}

// Best-effort removal of a previously saved image (e.g. replaced logo).
// Validates the URL shape so only files under this seller's folders can go.
// Accepts both the current layout (/uploads/seller/<id>/...) and the legacy
// one (/uploads/<id>/images/...) so replacing an old logo cleans it up too.
export async function deleteSellerImage({ sellerId, publicUrl }) {
  assertSafeId(sellerId)
  if (typeof publicUrl !== "string") return
  const allowedPrefixes = [`/uploads/seller/${sellerId}/`, `/uploads/${sellerId}/images/`]
  if (!allowedPrefixes.some((p) => publicUrl.startsWith(p))) return
  const rel = publicUrl.slice("/uploads/".length)
  if (!/^[a-z0-9/_.-]+$/i.test(rel) || rel.includes("..")) return
  try {
    await unlink(path.join(UPLOADS_ROOT, rel))
  } catch {
    // already gone — fine
  }
}
