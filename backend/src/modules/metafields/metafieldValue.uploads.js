import { deleteMetafieldImage, saveMetafieldImage } from "../../utils/uploads.js"

// ---------------------------------------------------------------------------
// METAFIELD IMAGE PERSISTENCE
//
// Definition-driven metafield values can carry file/image fields nested at any
// depth (a plain `file` field, or a repeater like `engagement_rings[].image`).
// The editor sends each file as a base64 data URL, and the validator
// (metafieldValue.validation.js) coerces a `file` field to { url, name, mime,
// size } WITHOUT touching the bytes — so the raw base64 would otherwise be
// embedded straight into the owner doc's `metafields`.
//
// This walker runs AFTER validation, mutating the ALREADY-CLEANED value object
// in place: it mirrors the validator's fields[] recursion, and whenever it
// reaches a `file` field whose url is a `data:` URL it writes the file to disk
// (owner-scoped, see utils/uploads.js) and swaps in the `/uploads/...` URL.
// Values that are already saved URLs are left untouched.
//
// On update it also diffs against the previous stored values and removes any
// metafield file that is no longer referenced.
// ---------------------------------------------------------------------------

const isDataUrl = (v) => typeof v === "string" && v.startsWith("data:")

// Convert ONE file value (either a bare url string or a { url, ... } object).
// Returns the value to store (with any base64 replaced by a saved URL).
async function convertFileValue({ ownerType, ownerId, fieldPath, value }) {
  if (value == null) return value

  if (typeof value === "string") {
    if (!isDataUrl(value)) return value
    const url = await saveMetafieldImage({ ownerType, ownerId, fieldPath, dataUrl: value })
    return { url }
  }

  if (typeof value === "object" && isDataUrl(value.url)) {
    const url = await saveMetafieldImage({ ownerType, ownerId, fieldPath, dataUrl: value.url })
    return { ...value, url }
  }

  return value
}

// Recurse ONE field alongside its cleaned value, mutating `container[key]` in
// place. `pathSegs` is the sanitized-later folder path for saved files.
async function walkField({ ownerType, ownerId, field, container, key, pathSegs }) {
  const value = container?.[key]
  if (value == null) return

  const dataType = field.dataType ?? "string"

  // FILE — the leaf we care about.
  if (dataType === "file") {
    container[key] = await convertFileValue({
      ownerType,
      ownerId,
      fieldPath: pathSegs.join("/"),
      value,
    })
    return
  }

  // OBJECT — recurse each child into value[child.key].
  if (dataType === "object") {
    if (typeof value !== "object" || Array.isArray(value)) return
    for (const child of field.children ?? []) {
      await walkField({
        ownerType,
        ownerId,
        field: child,
        container: value,
        key: child.key,
        pathSegs: [...pathSegs, child.key],
      })
    }
    return
  }

  // ARRAY — object items recurse per index; file items convert per index.
  if (dataType === "array") {
    if (!Array.isArray(value)) return
    const itemType = field.itemType ?? "string"

    if (itemType === "object") {
      for (let i = 0; i < value.length; i += 1) {
        const item = value[i]
        if (item == null || typeof item !== "object") continue
        for (const child of field.children ?? []) {
          await walkField({
            ownerType,
            ownerId,
            field: child,
            container: item,
            key: child.key,
            pathSegs: [...pathSegs, String(i), child.key],
          })
        }
      }
      return
    }

    if (itemType === "file") {
      for (let i = 0; i < value.length; i += 1) {
        value[i] = await convertFileValue({
          ownerType,
          ownerId,
          fieldPath: [...pathSegs, String(i)].join("/"),
          value: value[i],
        })
      }
    }
  }
}

// Collect every stored metafield file URL referenced anywhere in a value tree.
// Used to diff old vs new so orphaned files can be removed on update.
function collectUploadUrls(node, out = new Set()) {
  if (node == null) return out
  if (typeof node === "string") {
    if (node.startsWith("/uploads/") && node.includes("/metafields/")) out.add(node)
    return out
  }
  if (Array.isArray(node)) {
    for (const item of node) collectUploadUrls(item, out)
    return out
  }
  if (typeof node === "object") {
    for (const v of Object.values(node)) collectUploadUrls(v, out)
  }
  return out
}

// PUBLIC — persist all base64 metafield images in `values` to disk (in place)
// and clean up any files that `previousValues` referenced but `values` no
// longer does. `fields` is the live definition's fields[]. Safe to call with an
// empty/absent definition (no-op).
export async function persistMetafieldImages({ ownerType, ownerId, fields, values, previousValues }) {
  if (!Array.isArray(fields) || !fields.length || !values || typeof values !== "object") {
    return values
  }

  for (const field of fields) {
    await walkField({ ownerType, ownerId, field, container: values, key: field.key, pathSegs: [field.key] })
  }

  // Remove files that were referenced before but are gone now.
  if (previousValues && typeof previousValues === "object") {
    const kept = collectUploadUrls(values)
    const prior = collectUploadUrls(previousValues)
    for (const url of prior) {
      if (!kept.has(url)) {
        await deleteMetafieldImage({ ownerType, ownerId, publicUrl: url })
      }
    }
  }

  return values
}