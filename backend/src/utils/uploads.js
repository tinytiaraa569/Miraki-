import { randomBytes } from "node:crypto"
import { mkdir, rm, unlink, writeFile } from "node:fs/promises"
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
  "image/avif": "avif",
  "image/svg+xml": "svg",
}

// Video formats accepted alongside images in the product gallery. Same base64
// data-URL pipeline — the client sends data:video/mp4;base64,... and we decode
// and write it to disk exactly like an image.
const ALLOWED_VIDEO_MIME = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "video/ogg": "ogv",
}

const MAX_IMAGE_BYTES = 2 * 1024 * 1024 // 2 MB decoded
const MAX_VIDEO_BYTES = 8 * 1024 * 1024 // 8 MB decoded (kept under the 12 MB body cap)

// Only ever accept a MongoDB ObjectId string — prevents path traversal
// ("../../etc") since the id is the directory name on disk.
function assertSafeId(sellerId) {
  if (!/^[a-f0-9]{24}$/i.test(String(sellerId))) {
    throw new ApiError(400, "Invalid seller id")
  }
}

// data:image/png;base64,AAAA... -> { mime, buffer }
// `allowed` maps accepted MIME types to file extensions; `maxImageBytes` and
// `maxVideoBytes` bound the decoded size (videos get a larger cap). Defaults
// keep every existing caller (brand/category/collection/etc.) image-only.
function parseDataUrl(dataUrl, { allowed = ALLOWED_MIME, maxImageBytes = MAX_IMAGE_BYTES, maxVideoBytes = MAX_VIDEO_BYTES } = {}) {
  if (typeof dataUrl !== "string") throw new ApiError(400, "File must be a base64 data URL")
  const match = dataUrl.match(/^data:([a-z0-9+/.-]+);base64,(.+)$/i)
  if (!match) throw new ApiError(400, "File must be a base64 data URL (data:...;base64,...)")
  const [, rawMime, b64] = match
  const mime = rawMime.toLowerCase()
  const ext = allowed[mime]
  if (!ext) throw new ApiError(400, "Unsupported file type")
  const buffer = Buffer.from(b64, "base64")
  if (buffer.length === 0) throw new ApiError(400, "Empty file")
  const isVideo = mime.startsWith("video/")
  const cap = isVideo ? maxVideoBytes : maxImageBytes
  if (buffer.length > cap) {
    throw new ApiError(413, isVideo ? "Video too large (max 8 MB)" : "Image too large (max 2 MB)")
  }
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

// ---------------------------------------------------------------------------
// CATEGORY IMAGES — stored per-category so a category's assets live together
// and are cleaned up wholesale when it is permanently deleted:
//   uploads/category/<categoryId>/<file>   ->  /uploads/category/<categoryId>/<file>
// The categoryId is a 24-hex ObjectId (validated) used as the directory name,
// which prevents path traversal.
// ---------------------------------------------------------------------------
export async function saveCategoryImage({ categoryId, dataUrl }) {
  if (!/^[a-f0-9]{24}$/i.test(String(categoryId))) throw new ApiError(400, "Invalid category id")
  const { ext, buffer } = parseDataUrl(dataUrl)

  const dir = path.join(UPLOADS_ROOT, "category", String(categoryId))
  await mkdir(dir, { recursive: true })

  const filename = `${Date.now()}_${randomBytes(6).toString("hex")}.${ext}`
  await writeFile(path.join(dir, filename), buffer)

  return `/uploads/category/${categoryId}/${filename}`
}

// Best-effort removal of a category image. Only files under this category's
// own folder are eligible, and the path is shape-checked against traversal.
export async function deleteCategoryImage({ categoryId, publicUrl }) {
  if (!/^[a-f0-9]{24}$/i.test(String(categoryId))) return
  if (typeof publicUrl !== "string") return
  if (!publicUrl.startsWith(`/uploads/category/${categoryId}/`)) return
  const rel = publicUrl.slice("/uploads/".length)
  if (!/^[a-z0-9/_.-]+$/i.test(rel) || rel.includes("..")) return
  try {
    await unlink(path.join(UPLOADS_ROOT, rel))
  } catch {
    // already gone — fine
  }
}

// ---------------------------------------------------------------------------
// BRAND IMAGES — stored per-brand so a brand's assets live together and are
// cleaned up wholesale when it is permanently deleted:
//   uploads/brand/<brandId>/<file>   ->  /uploads/brand/<brandId>/<file>
// The brandId is a 24-hex ObjectId (validated) used as the directory name,
// which prevents path traversal.
// ---------------------------------------------------------------------------
export async function saveBrandImage({ brandId, dataUrl }) {
  if (!/^[a-f0-9]{24}$/i.test(String(brandId))) throw new ApiError(400, "Invalid brand id")
  const { ext, buffer } = parseDataUrl(dataUrl)

  const dir = path.join(UPLOADS_ROOT, "brand", String(brandId))
  await mkdir(dir, { recursive: true })

  const filename = `${Date.now()}_${randomBytes(6).toString("hex")}.${ext}`
  await writeFile(path.join(dir, filename), buffer)

  return `/uploads/brand/${brandId}/${filename}`
}

// Best-effort removal of a brand image. Only files under this brand's own
// folder are eligible, and the path is shape-checked against traversal.
export async function deleteBrandImage({ brandId, publicUrl }) {
  if (!/^[a-f0-9]{24}$/i.test(String(brandId))) return
  if (typeof publicUrl !== "string") return
  if (!publicUrl.startsWith(`/uploads/brand/${brandId}/`)) return
  const rel = publicUrl.slice("/uploads/".length)
  if (!/^[a-z0-9/_.-]+$/i.test(rel) || rel.includes("..")) return
  try {
    await unlink(path.join(UPLOADS_ROOT, rel))
  } catch {
    // already gone — fine
  }
}

// ---------------------------------------------------------------------------
// COLLECTION IMAGES — stored per-collection so its assets live together and are
// cleaned up wholesale when it is permanently deleted:
//   uploads/collection/<collectionId>/<file>  ->  /uploads/collection/<collectionId>/<file>
// The collectionId is a 24-hex ObjectId (validated) used as the directory name,
// which prevents path traversal.
// ---------------------------------------------------------------------------
export async function saveCollectionImage({ collectionId, dataUrl }) {
  if (!/^[a-f0-9]{24}$/i.test(String(collectionId))) throw new ApiError(400, "Invalid collection id")
  const { ext, buffer } = parseDataUrl(dataUrl)

  const dir = path.join(UPLOADS_ROOT, "collection", String(collectionId))
  await mkdir(dir, { recursive: true })

  const filename = `${Date.now()}_${randomBytes(6).toString("hex")}.${ext}`
  await writeFile(path.join(dir, filename), buffer)

  return `/uploads/collection/${collectionId}/${filename}`
}

// Best-effort removal of a collection image. Only files under this collection's
// own folder are eligible, and the path is shape-checked against traversal.
export async function deleteCollectionImage({ collectionId, publicUrl }) {
  if (!/^[a-f0-9]{24}$/i.test(String(collectionId))) return
  if (typeof publicUrl !== "string") return
  if (!publicUrl.startsWith(`/uploads/collection/${collectionId}/`)) return
  const rel = publicUrl.slice("/uploads/".length)
  if (!/^[a-z0-9/_.-]+$/i.test(rel) || rel.includes("..")) return
  try {
    await unlink(path.join(UPLOADS_ROOT, rel))
  } catch {
    // already gone — fine
  }
}

// ---------------------------------------------------------------------------
// OPTION-SET VALUE SWATCH IMAGES — image-type option values carry a swatch.
// Stored per-option-set so all of a set's swatches live together and are
// cleaned up wholesale when it is permanently deleted:
//   uploads/optionset/<optionSetId>/<file>  ->  /uploads/optionset/<optionSetId>/<file>
// The optionSetId is a 24-hex ObjectId (validated) used as the directory name,
// which prevents path traversal.
// ---------------------------------------------------------------------------
export async function saveOptionSetImage({ optionSetId, dataUrl }) {
  if (!/^[a-f0-9]{24}$/i.test(String(optionSetId))) throw new ApiError(400, "Invalid option set id")
  const { ext, buffer } = parseDataUrl(dataUrl)

  const dir = path.join(UPLOADS_ROOT, "optionset", String(optionSetId))
  await mkdir(dir, { recursive: true })

  const filename = `${Date.now()}_${randomBytes(6).toString("hex")}.${ext}`
  await writeFile(path.join(dir, filename), buffer)

  return `/uploads/optionset/${optionSetId}/${filename}`
}

// Best-effort removal of an option-set swatch. Only files under this set's own
// folder are eligible, and the path is shape-checked against traversal.
export async function deleteOptionSetImage({ optionSetId, publicUrl }) {
  if (!/^[a-f0-9]{24}$/i.test(String(optionSetId))) return
  if (typeof publicUrl !== "string") return
  if (!publicUrl.startsWith(`/uploads/optionset/${optionSetId}/`)) return
  const rel = publicUrl.slice("/uploads/".length)
  if (!/^[a-z0-9/_.-]+$/i.test(rel) || rel.includes("..")) return
  try {
    await unlink(path.join(UPLOADS_ROOT, rel))
  } catch {
    // already gone — fine
  }
}

// ---------------------------------------------------------------------------
// PRODUCT IMAGES — stored per-product so a product's gallery lives together and
// is cleaned up wholesale on permanent delete:
//   uploads/product/<productId>/<file>  ->  /uploads/product/<productId>/<file>
// The productId is a 24-hex ObjectId (validated) used as the directory name,
// which prevents path traversal.
// ---------------------------------------------------------------------------
export async function saveProductImage({ productId, dataUrl }) {
  if (!/^[a-f0-9]{24}$/i.test(String(productId))) throw new ApiError(400, "Invalid product id")
  // The product gallery accepts images AND videos (same base64 pipeline).
  const { ext, buffer } = parseDataUrl(dataUrl, { allowed: { ...ALLOWED_MIME, ...ALLOWED_VIDEO_MIME } })

  const dir = path.join(UPLOADS_ROOT, "product", String(productId))
  await mkdir(dir, { recursive: true })

  const filename = `${Date.now()}_${randomBytes(6).toString("hex")}.${ext}`
  await writeFile(path.join(dir, filename), buffer)

  return `/uploads/product/${productId}/${filename}`
}

// Best-effort removal of a product image. Only files under this product's own
// folder are eligible, and the path is shape-checked against traversal.
export async function deleteProductImage({ productId, publicUrl }) {
  if (!/^[a-f0-9]{24}$/i.test(String(productId))) return
  if (typeof publicUrl !== "string") return
  if (!publicUrl.startsWith(`/uploads/product/${productId}/`)) return
  const rel = publicUrl.slice("/uploads/".length)
  if (!/^[a-z0-9/_.-]+$/i.test(rel) || rel.includes("..")) return
  try {
    await unlink(path.join(UPLOADS_ROOT, rel))
  } catch {
    // already gone — fine
  }
}

// ---------------------------------------------------------------------------
// PRODUCT VARIANT IMAGES — each variant carries its OWN gallery, nested under
// its parent product so a product's variant assets live together and are
// cleaned up wholesale when the product is deleted:
//   uploads/product/<productId>/variants/<variantId>/<file>
//     ->  /uploads/product/<productId>/variants/<variantId>/<file>
// Both ids are 24-hex ObjectIds (validated) used as directory names, which
// prevents path traversal.
// ---------------------------------------------------------------------------
export async function saveVariantImage({ productId, variantId, dataUrl }) {
  if (!/^[a-f0-9]{24}$/i.test(String(productId))) throw new ApiError(400, "Invalid product id")
  if (!/^[a-f0-9]{24}$/i.test(String(variantId))) throw new ApiError(400, "Invalid variant id")
  // Variants accept images AND videos (same base64 pipeline as products).
  const { ext, buffer } = parseDataUrl(dataUrl, { allowed: { ...ALLOWED_MIME, ...ALLOWED_VIDEO_MIME } })

  const dir = path.join(UPLOADS_ROOT, "product", String(productId), "variants", String(variantId))
  await mkdir(dir, { recursive: true })

  const filename = `${Date.now()}_${randomBytes(6).toString("hex")}.${ext}`
  await writeFile(path.join(dir, filename), buffer)

  return `/uploads/product/${productId}/variants/${variantId}/${filename}`
}

// Best-effort removal of a variant image. Only files under this variant's own
// folder are eligible, and the path is shape-checked against traversal.
export async function deleteVariantImage({ productId, variantId, publicUrl }) {
  if (!/^[a-f0-9]{24}$/i.test(String(productId))) return
  if (!/^[a-f0-9]{24}$/i.test(String(variantId))) return
  if (typeof publicUrl !== "string") return
  if (!publicUrl.startsWith(`/uploads/product/${productId}/variants/${variantId}/`)) return
  const rel = publicUrl.slice("/uploads/".length)
  if (!/^[a-z0-9/_.-]+$/i.test(rel) || rel.includes("..")) return
  try {
    await unlink(path.join(UPLOADS_ROOT, rel))
  } catch {
    // already gone — fine
  }
}

// ---------------------------------------------------------------------------
// METAFIELD IMAGES — definition-driven metafield values can carry file/image
// fields nested at ANY depth (e.g. a repeater's `engagement_rings[0].image`).
// The editor sends each as a base64 data URL; without this the raw base64 gets
// embedded straight into the owner doc's `metafields`. We decode + write it to
// disk exactly like every other image and store ONLY the public URL.
//
// Owner-scoped layout — nested under the SAME <ownerType>/<ownerId> root the
// owner's own images use, so deleting the record cleans up its metafield files
// in one folder removal:
//   uploads/<ownerType>/<ownerId>/metafields/<fieldPath>/<file>
//     ->  /uploads/<ownerType>/<ownerId>/metafields/<fieldPath>/<file>
// `ownerType` is the entity folder name ("category" / "product") for embedded
// metafields, or the sanitized module for standalone MetafieldValue records.
// `fieldPath` is the dotted definition path with array indices, joined with
// "/" (e.g. "engagement_rings/0/image"). Every segment is sanitized to a safe
// charset so it can never traverse outside the owner folder.
// ---------------------------------------------------------------------------
const METAFIELD_UPLOAD_MIME = { ...ALLOWED_MIME, ...ALLOWED_VIDEO_MIME }

// Collapse any string into a safe single path segment. Empty -> "_".
function safeSegment(raw) {
  const s = String(raw ?? "").toLowerCase().replace(/[^a-z0-9_-]/g, "_")
  return s.length ? s.slice(0, 64) : "_"
}

// Normalize a field path (string "a/b/0/c" or array ["a","b",0,"c"]) into a
// sanitized "/"-joined string, dropping empties.
function safeFieldPath(fieldPath) {
  const parts = Array.isArray(fieldPath) ? fieldPath : String(fieldPath ?? "").split("/")
  return parts.map(safeSegment).filter((p) => p !== "_" || parts.length === 1).join("/")
}

export async function saveMetafieldImage({ ownerType, ownerId, fieldPath, dataUrl }) {
  const type = safeSegment(ownerType)
  const id = safeSegment(ownerId)
  const rel = safeFieldPath(fieldPath) || "field"
  // Metafield file fields accept images AND videos (same base64 pipeline).
  const { ext, buffer } = parseDataUrl(dataUrl, { allowed: METAFIELD_UPLOAD_MIME })

  const dir = path.join(UPLOADS_ROOT, type, id, "metafields", rel)
  await mkdir(dir, { recursive: true })

  const filename = `${Date.now()}_${randomBytes(6).toString("hex")}.${ext}`
  await writeFile(path.join(dir, filename), buffer)

  return `/uploads/${type}/${id}/metafields/${rel}/${filename}`
}

// Best-effort removal of a single metafield file. Only files under this owner's
// own metafields folder are eligible, and the path is shape-checked against
// traversal.
export async function deleteMetafieldImage({ ownerType, ownerId, publicUrl }) {
  if (typeof publicUrl !== "string") return
  const prefix = `/uploads/${safeSegment(ownerType)}/${safeSegment(ownerId)}/metafields/`
  if (!publicUrl.startsWith(prefix)) return
  const rel = publicUrl.slice("/uploads/".length)
  if (!/^[a-z0-9/_.-]+$/i.test(rel) || rel.includes("..")) return
  try {
    await unlink(path.join(UPLOADS_ROOT, rel))
  } catch {
    // already gone — fine
  }
}

// Wholesale removal of an owner's entire metafields folder — used on permanent
// delete so every nested metafield asset is cleaned up in one shot.
export async function deleteMetafieldDir({ ownerType, ownerId }) {
  const type = safeSegment(ownerType)
  const id = safeSegment(ownerId)
  const dir = path.join(UPLOADS_ROOT, type, id, "metafields")
  // Guard: the resolved dir must stay inside UPLOADS_ROOT.
  if (!dir.startsWith(path.join(UPLOADS_ROOT, type, id))) return
  try {
    await rm(dir, { recursive: true, force: true })
  } catch {
    // already gone — fine
  }
}
