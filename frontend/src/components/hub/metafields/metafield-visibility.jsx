// ---------------------------------------------------------------------------
// Runtime evaluation of a field's "Show On" (conditional display) rules. The
// metafield BUILDER only STORES these rules on settings.showOn; this is the
// half that ACTS on them when a value form renders — a field is shown only when
// its rules pass against the sibling values at the same level.
//
//   settings.showOn         -> [{ field, operator, value }]
//   settings.showOnOperator -> "AND" (all rules) | "OR" (any rule)
//
// Operators mirror SHOW_ON_OPERATORS in metafield-utils.js and the backend enum.
// ---------------------------------------------------------------------------

export function isFieldVisible(field, siblingValues = {}) {
  const rules = field?.settings?.showOn ?? []
  if (!rules.length) return true

  const joiner = field?.settings?.showOnOperator === "OR" ? "OR" : "AND"
  const results = rules.map((r) => evalRule(r, siblingValues?.[r.field]))
  return joiner === "OR" ? results.some(Boolean) : results.every(Boolean)
}

function evalRule(rule, actual) {
  const op = rule?.operator || "eq"
  const expected = rule?.value

  switch (op) {
    case "eq":
      return looseEq(actual, expected)
    case "ne":
      return !looseEq(actual, expected)
    case "gt":
      return toNum(actual) > toNum(expected)
    case "gte":
      return toNum(actual) >= toNum(expected)
    case "lt":
      return toNum(actual) < toNum(expected)
    case "lte":
      return toNum(actual) <= toNum(expected)
    case "in":
      return splitList(expected).some((v) => looseEq(actual, v))
    case "nin":
      return !splitList(expected).some((v) => looseEq(actual, v))
    case "contains":
      return String(actual ?? "").includes(String(expected ?? ""))
    case "exists":
      return actual !== undefined && actual !== null && actual !== ""
    default:
      return true
  }
}

// Loose equality that bridges the gap between typed form values (boolean 1/0,
// number) and the free-text `value` an admin types in the rule.
function looseEq(a, b) {
  if (typeof a === "boolean") return a === truthy(b)
  // Toggle fields persist inconsistently across the stack: one may come back as
  // the number 1, another as the string "true" (or "1"/"false"/"0"). When BOTH
  // sides read as a boolean token, compare their truthiness so a rule value of
  // "1" still matches an actual value of "true" (and vice versa). Without this,
  // a toggle saved as "true" was compared as a raw string ("true" === "1")
  // and its dependent fields never appeared even with the toggle ON.
  if (looksBoolean(a) && looksBoolean(b)) return truthy(a) === truthy(b)
  if (typeof a === "number") return a === toNum(b)
  return String(a ?? "") === String(b ?? "")
}

// A value is "boolean-like" only if it is exactly one of the canonical toggle
// tokens. Kept intentionally strict (no yes/no or arbitrary strings) so genuine
// text/select comparisons are never mistaken for booleans.
function looksBoolean(v) {
  if (typeof v === "boolean") return true
  if (typeof v === "number") return v === 0 || v === 1
  if (typeof v === "string") {
    const s = v.trim().toLowerCase()
    return s === "true" || s === "false" || s === "1" || s === "0"
  }
  return false
}

function truthy(v) {
  return v === true || v === 1 || v === "1" || String(v).toLowerCase() === "true"
}

function toNum(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : Number.NaN
}

function splitList(v) {
  if (Array.isArray(v)) return v
  return String(v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}
