import { z } from "zod"

// TWO validators live here:
//
// 1) saveValuesSchema — a THIN envelope for the request body ({ recordId,
//    data }). The `data` shape is dynamic (it depends on the definition), so
//    the envelope only guarantees the wrapper; the real work is (2).
//
// 2) validateValuesAgainstDefinition — the RUNTIME validator. It walks the
//    definition's fields[] tree and checks the submitted `data` against it:
//    per-dataType coercion, required, the settings.validations rules, arrays,
//    nested objects, geopoint range — and it EXTRACTS geopoints into a flat
//    geo[] for the fixed-path 2dsphere index. Same recursion the editor uses,
//    so server and client agree. See docs/METAFIELDS_SYSTEM_PLAN.md.

// --------------------------------------------------------------- envelope
export const saveValuesSchema = z
  .object({
    // recordId may arrive as a number or ObjectId string — coerce to string to
    // match the value model's stable string key.
    recordId: z
      .union([z.string(), z.number()])
      .transform((v) => String(v).trim())
      .refine((v) => v.length > 0 && v.length <= 120, "recordId is required"),
    data: z.record(z.any()).default({}),
  })
  .strict()

// ------------------------------------------------------------- helpers
const isEmpty = (v) => v === undefined || v === null || v === ""

// Edit-type widgets whose VALUE is always a list, even when the field's
// dataType is a scalar (e.g. a `string` field rendered as a multiselect). The
// editor stores & reads these as arrays (["male","female"]), so the validator
// must coerce each item individually instead of flattening the whole array
// with String([...]) — which used to produce the corrupted "male,female".
const MULTI_VALUE_EDIT_TYPES = new Set(["multiselect", "multicheckbox", "multiautocomplete"])

// Edit types whose VALUE is a REFERENCE to record(s) in another module. The
// editor stores an id+name snapshot — { id, name } for a single relation and
// [{ id, name }] for `multiautocomplete` — so it can render without a refetch.
// These MUST bypass scalar coercion even when the field's dataType is a scalar
// (e.g. `string`): running String({id,name}) is what produced the corrupted
// "[object Object]" stored value. Mirrors the frontend's ENTITY_EDIT_TYPES.
const ENTITY_EDIT_TYPES = new Set(["autocomplete", "autocomplete2", "multiautocomplete", "category"])

// Normalize one relation value into a stored { id, name } snapshot. Accepts a
// { id | _id | value, name } object or a bare id string. Returns null when it
// carries no usable id (treated as empty).
function normalizeEntityRef(raw) {
  if (raw == null || raw === "") return null
  if (typeof raw === "object" && !Array.isArray(raw)) {
    const id = raw.id ?? raw._id ?? raw.value
    if (id == null || id === "") return null
    const out = { id: String(id) }
    if (raw.name != null && raw.name !== "") out.name = String(raw.name)
    return out
  }
  if (typeof raw === "object") return null
  return { id: String(raw) }
}

// Coerce + range-check ONE scalar. Returns { ok, value } | { ok:false, error }.
function coerceScalar(dataType, raw) {
  switch (dataType) {
    case "string":
      // Never String()-ify an object/array — that is what produced the
      // corrupted "[object Object]" for relation fields. Reject instead so the
      // save fails loudly rather than storing garbage.
      if (raw !== null && typeof raw === "object") return { ok: false, error: "must be text" }
      return { ok: true, value: String(raw) }
    case "integer": {
      const n = Number(raw)
      if (!Number.isFinite(n) || !Number.isInteger(n)) return { ok: false, error: "must be an integer" }
      return { ok: true, value: n }
    }
    case "number": {
      const n = Number(raw)
      if (!Number.isFinite(n)) return { ok: false, error: "must be a number" }
      return { ok: true, value: n }
    }
    case "boolean": {
      if (typeof raw === "boolean") return { ok: true, value: raw }
      if (raw === "true" || raw === 1 || raw === "1") return { ok: true, value: true }
      if (raw === "false" || raw === 0 || raw === "0") return { ok: true, value: false }
      return { ok: false, error: "must be true or false" }
    }
    case "datetime": {
      const d = new Date(raw)
      if (Number.isNaN(d.getTime())) return { ok: false, error: "must be a valid date" }
      return { ok: true, value: d }
    }
    case "file": {
      // Accept a bare URL string or an object { url, name, mime, size }.
      if (typeof raw === "string") return { ok: true, value: { url: raw } }
      if (raw && typeof raw === "object" && typeof raw.url === "string") {
        const { url, name, mime, size } = raw
        return { ok: true, value: { url, name, mime, size } }
      }
      return { ok: false, error: "must be a file url or { url } object" }
    }
    case "geopoint": {
      // Accept { lat, lng } | { latitude, longitude } | [lng, lat] |
      // { coordinates:[lng,lat] } — normalize to GeoJSON [lng, lat].
      let lng
      let lat
      if (Array.isArray(raw)) {
        ;[lng, lat] = raw
      } else if (raw && typeof raw === "object") {
        if (Array.isArray(raw.coordinates)) [lng, lat] = raw.coordinates
        else {
          lng = raw.lng ?? raw.longitude
          lat = raw.lat ?? raw.latitude
        }
      }
      lng = Number(lng)
      lat = Number(lat)
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return { ok: false, error: "needs lng & lat" }
      if (lng < -180 || lng > 180) return { ok: false, error: "longitude out of range (-180..180)" }
      if (lat < -90 || lat > 90) return { ok: false, error: "latitude out of range (-90..90)" }
      return { ok: true, value: { type: "Point", coordinates: [lng, lat] } }
    }
    default:
      return { ok: true, value: raw }
  }
}

// Apply the settings.validations rows to an already-coerced scalar.
function applyRules(dataType, value, rules = [], label, errors, path) {
  for (const r of rules) {
    const rule = String(r.rule ?? "").trim()
    const param = r.param
    const msg = r.message || null
    const fail = (def) => errors.push({ path, message: msg || `${label} ${def}` })

    switch (rule) {
      case "min":
        if (Number(value) < Number(param)) fail(`must be >= ${param}`)
        break
      case "max":
        if (Number(value) > Number(param)) fail(`must be <= ${param}`)
        break
      case "minLength":
        if (String(value).length < Number(param)) fail(`must be at least ${param} characters`)
        break
      case "maxLength":
        if (String(value).length > Number(param)) fail(`must be at most ${param} characters`)
        break
      case "regex":
      case "pattern":
        try {
          if (!new RegExp(param).test(String(value))) fail("has an invalid format")
        } catch {
          /* an invalid regex in the definition is ignored, never throws here */
        }
        break
      case "enum":
      case "in": {
        const allowed = String(param)
          .split(",")
          .map((s) => s.trim())
        if (!allowed.includes(String(value))) fail(`must be one of: ${allowed.join(", ")}`)
        break
      }
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) fail("must be a valid email")
        break
      default:
        // Unknown rule name — skip (definitions are user-authored & flexible).
        break
    }
  }
}

// Recursively validate `value` against ONE field. Pushes into errors[] and
// geo[] (side channels); returns the cleaned value (or undefined to omit).
function validateField(field, value, path, errors, geo) {
  const label = field.label || field.key
  const settings = field.settings ?? {}
  const dataType = field.dataType ?? "string"

  // MULTI-VALUE widget on a SCALAR dataType (multiselect / multicheckbox /
  // multiautocomplete). The editor keeps these as an ARRAY of scalars, so
  // validate/coerce each item as the field's dataType and STORE AN ARRAY —
  // never String([...]). Handled before the empty check so [] is treated as
  // an empty list (respecting `required`) rather than a scalar value.
  if (MULTI_VALUE_EDIT_TYPES.has(field.editType) && dataType !== "array" && dataType !== "object") {
    const list = Array.isArray(value) ? value : isEmpty(value) ? [] : [value]
    if (list.length === 0) {
      if (settings.required) errors.push({ path, message: `${label} is required` })
      return undefined
    }
    const cleaned = []
    list.forEach((item, i) => {
      const itemPath = `${path}.${i}`
      const c = coerceScalar(dataType, item)
      if (!c.ok) {
        errors.push({ path: itemPath, message: `${label} item ${c.error}` })
        return
      }
      applyRules(dataType, c.value, settings.validations, label, errors, itemPath)
      cleaned.push(c.value)
    })
    return cleaned.length ? cleaned : undefined
  }

  // ENTITY RELATION widget (autocomplete / category / multiautocomplete) on a
  // SCALAR dataType. The value is an id+name snapshot ({ id, name } single, or
  // [{ id, name }] for multi) — store it AS-IS instead of scalar-coercing it,
  // which would corrupt it into "[object Object]". Handled before the empty
  // check so an empty selection respects `required`.
  if (ENTITY_EDIT_TYPES.has(field.editType) && dataType !== "array" && dataType !== "object") {
    const multiple = field.editType === "multiautocomplete"
    if (multiple) {
      const list = Array.isArray(value) ? value : isEmpty(value) ? [] : [value]
      const cleaned = list.map(normalizeEntityRef).filter(Boolean)
      if (cleaned.length === 0) {
        if (settings.required) errors.push({ path, message: `${label} is required` })
        return undefined
      }
      return cleaned
    }
    const ref = normalizeEntityRef(value)
    if (!ref) {
      if (settings.required) errors.push({ path, message: `${label} is required` })
      return undefined
    }
    return ref
  }

  // Required / empty handling.
  if (isEmpty(value)) {
    if (settings.required) errors.push({ path, message: `${label} is required` })
    if (!isEmpty(settings.defaultValue)) value = settings.defaultValue
    else return undefined
  }

  // OBJECT — recurse each child into value[child.key].
  if (dataType === "object") {
    if (typeof value !== "object" || Array.isArray(value)) {
      errors.push({ path, message: `${label} must be an object` })
      return undefined
    }
    const out = {}
    for (const child of field.children ?? []) {
      const cv = validateField(child, value[child.key], `${path}.${child.key}`, errors, geo)
      if (cv !== undefined) out[child.key] = cv
    }
    return out
  }

  // ARRAY — validate each item as itemType (object -> children, else scalar).
  if (dataType === "array") {
    if (!Array.isArray(value)) {
      errors.push({ path, message: `${label} must be a list` })
      return undefined
    }
    const itemType = field.itemType ?? "string"
    return value.map((item, i) => {
      const itemPath = `${path}.${i}`
      if (itemType === "object") {
        const out = {}
        for (const child of field.children ?? []) {
          const cv = validateField(child, item?.[child.key], `${itemPath}.${child.key}`, errors, geo)
          if (cv !== undefined) out[child.key] = cv
        }
        return out
      }
      const c = coerceScalar(itemType, item)
      if (!c.ok) {
        errors.push({ path: itemPath, message: `${label} item ${c.error}` })
        return undefined
      }
      if (itemType === "geopoint") geo.push({ path: itemPath, point: c.value })
      applyRules(itemType, c.value, settings.validations, label, errors, itemPath)
      return c.value
    })
  }

  // SCALAR.
  const c = coerceScalar(dataType, value)
  if (!c.ok) {
    errors.push({ path, message: `${label} ${c.error}` })
    return undefined
  }
  if (dataType === "geopoint") geo.push({ path, point: c.value })
  applyRules(dataType, c.value, settings.validations, label, errors, path)
  return c.value
}

// PUBLIC: validate a whole `data` object against a definition's fields[].
// Returns { ok, data, geo, errors }. Never throws on bad DATA (errors are
// collected); the caller turns a non-empty errors[] into a 422.
export function validateValuesAgainstDefinition(fields = [], data = {}) {
  const errors = []
  const geo = []
  const out = {}
  for (const field of fields) {
    const v = validateField(field, data?.[field.key], field.key, errors, geo)
    if (v !== undefined) out[field.key] = v
  }
  return { ok: errors.length === 0, data: out, geo, errors }
}
