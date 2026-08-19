// Shared constants + helpers for the Option Sets editor. Kept in sync with the
// backend enum (§3) and validation (§8): value-bearing types must carry values;
// free-text types must not.

export const OPTION_TYPES = [
  { value: "dropdown", label: "Dropdown", hint: "A simple list of selectable choices" },
  { value: "image", label: "Image", hint: "Each value shows an uploaded picture" },
  { value: "swatch", label: "Swatch", hint: "Values shown as selectable chips" },
  { value: "radio", label: "Radio", hint: "Pick one from visible options" },
  { value: "checkbox", label: "Checkbox", hint: "Pick one or more options" },
  { value: "text", label: "Text", hint: "Shopper types a short line" },
  { value: "textarea", label: "Text area", hint: "Shopper types a longer note" },
  { value: "number", label: "Number", hint: "Shopper enters a number" },
]

export function typeHint(type) {
  return OPTION_TYPES.find((t) => t.value === type)?.hint ?? ""
}

export const VALUE_BEARING = new Set(["dropdown", "image", "swatch", "radio", "checkbox"])

export function typeLabel(type) {
  return OPTION_TYPES.find((t) => t.value === type)?.label ?? type
}

export function isValueBearing(type) {
  return VALUE_BEARING.has(type)
}

// --------------------------------------------------------------------------
// Substore visibility (option AND value level).
// Convention matches everywhere else in the app: an EMPTY (or missing)
// `substoreIds` means "visible in ALL substores"; a non-empty list restricts
// visibility to exactly those substore ids. The same rule applies to an option
// object and to a single value object (e.g. "18K Gold" only in the UAE store).
// Kept here so the hub editor, the storefront render path, and the variant
// generator all resolve visibility identically.
// --------------------------------------------------------------------------
export function visibleInSubstore(item, substoreId) {
  // Plain string values (legacy shape) are never scoped → always visible.
  if (typeof item === "string") return true
  const ids = item?.substoreIds
  if (!Array.isArray(ids) || ids.length === 0) return true
  if (!substoreId) return true
  return ids.map(String).includes(String(substoreId))
}

// Filter a product's options[] down to what is visible in the given substore:
// drops hidden options AND prunes each surviving option's hidden values.
// Pass a falsy substoreId (e.g. the hub, or "all") to get everything back.
export function optionsForSubstore(options = [], substoreId) {
  if (!substoreId) return options
  return options
    .filter((opt) => visibleInSubstore(opt, substoreId))
    .map((opt) =>
      Array.isArray(opt.values)
        ? { ...opt, values: opt.values.filter((v) => visibleInSubstore(v, substoreId)) }
        : opt,
    )
}

export function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// A blank option row for the inline builder.
export function emptyOption() {
  return {
    _key: crypto.randomUUID(),
    name: "",
    displayName: "",
    type: "dropdown",
    values: [],
    minCount: 0,
    maxCount: 0,
    required: false,
    defaultValue: null,
    sortOrder: 0,
    showAlways: false,
  }
}

// A blank value row.
export function emptyValue() {
  return {
    _key: crypto.randomUUID(),
    label: "",
    value: "",
    image: null, // { url } | { dataUrl } | null
    color: "", // hex string for swatch-type options, e.g. "#c0a062"
    priceDelta: { mode: "amount", amount: 0 },
    sortOrder: 0,
    isDefault: false,
  }
}

// Map a persisted option-set doc into editor form state (adds stable _key ids
// so React lists + inline edits stay addressable).
export function docToForm(doc) {
  return {
    name: doc?.name ?? "",
    displayName: doc?.displayName ?? "",
    alias: doc?.alias ?? "",
    // Empty = available in ALL substores; otherwise restricted to these ids.
    substoreIds: (doc?.substoreIds ?? []).map((id) => String(id)),
    options: (doc?.options ?? []).map((opt) => ({
      _key: crypto.randomUUID(),
      name: opt.name ?? "",
      displayName: opt.displayName ?? "",
      type: opt.type ?? "dropdown",
      minCount: opt.minCount ?? 0,
      maxCount: opt.maxCount ?? 0,
      required: Boolean(opt.required),
      defaultValue: opt.defaultValue ?? null,
      sortOrder: opt.sortOrder ?? 0,
      showAlways: Boolean(opt.showAlways),
      values: (opt.values ?? []).map((val) => ({
        _key: crypto.randomUUID(),
        label: val.label ?? "",
        value: val.value ?? "",
        image: val.image?.url ? { url: val.image.url } : null,
        color: val.color ?? "",
        priceDelta: { mode: val.priceDelta?.mode ?? "amount", amount: val.priceDelta?.amount ?? 0 },
        sortOrder: val.sortOrder ?? 0,
        isDefault: Boolean(val.isDefault),
      })),
    })),
  }
}

// Strip the transient _key fields and shape the payload for POST/PATCH (§8).
// Only image options send an `image`, and only when a url/dataUrl is present.
export function formToPayload(form) {
  return {
    name: form.name.trim(),
    displayName: form.displayName?.trim() || undefined,
    alias: form.alias?.trim() || undefined,
    // Always send the array (even empty) so clearing the scope persists.
    substoreIds: Array.isArray(form.substoreIds) ? form.substoreIds : [],
    options: form.options.map((opt) => {
      const bearing = isValueBearing(opt.type)
      const values = bearing
        ? opt.values.map((val) => {
            const out = {
              label: val.label.trim(),
              value: val.value.trim(),
              sortOrder: Number(val.sortOrder) || 0,
              isDefault: Boolean(val.isDefault),
            }
            if (opt.type === "image" && val.image) {
              if (val.image.dataUrl) out.image = { dataUrl: val.image.dataUrl }
              else if (val.image.url) out.image = { url: val.image.url }
            }
            return out
          })
        : []
      // The server rejects the WHOLE save if `defaultValue` doesn't match one of
      // the option's value keys (e.g. a legacy/imported default like "10K" vs the
      // slugified "10k", or a stale default left after the values changed). Prefer
      // the value flagged default, then keep an existing default only if it still
      // matches a value, otherwise drop it — so a mismatch can never block the save.
      const flagged = values.find((v) => v.isDefault)?.value
      const kept = values.some((v) => v.value === opt.defaultValue) ? opt.defaultValue : null
      const defaultValue = flagged ?? kept ?? null
      return {
        name: opt.name.trim().toLowerCase(),
        displayName: opt.displayName?.trim() || undefined,
        type: opt.type,
        minCount: Number(opt.minCount) || 0,
        maxCount: Number(opt.maxCount) || 0,
        required: Boolean(opt.required),
        defaultValue,
        sortOrder: Number(opt.sortOrder) || 0,
        showAlways: Boolean(opt.showAlways),
        values,
      }
    }),
  }
}
