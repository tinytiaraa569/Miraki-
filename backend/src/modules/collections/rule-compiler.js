import mongoose from "mongoose"

// ---------------------------------------------------------------------------
// RULE COMPILER — a PURE function that turns a dynamic collection's `rules`
// into a MongoDB product `$match`. Shared by both membership materialization
// (rebuildMembership) and the ad-hoc "how many products match?" preview.
//
// SAFETY: never build a filter from raw client JSON. Every condition's field /
// operator is already whitelisted by the Zod schema (collection.validation.js),
// and here we additionally coerce values to their declared type. Unknown
// fields/operators resolve to a match-nothing clause rather than leaking a raw
// value into the query — this is the query-injection guard.
// ---------------------------------------------------------------------------

const MATCH_NOTHING = { _id: null } // resolves to zero documents, safely

const toObjectId = (v) => {
  try {
    return new mongoose.Types.ObjectId(String(v))
  } catch {
    return null
  }
}

const toObjectIdArray = (v) =>
  (Array.isArray(v) ? v : [v]).map(toObjectId).filter(Boolean)

const toNumber = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// { price: { $lt: 5000 } } / between -> { $gte, $lte }
function priceClause(c) {
  const map = { eq: "$eq", ne: "$ne", gt: "$gt", gte: "$gte", lt: "$lt", lte: "$lte" }
  if (c.operator === "between") {
    const [lo, hi] = Array.isArray(c.value) ? c.value : []
    const a = toNumber(lo)
    const b = toNumber(hi)
    if (a === null || b === null) return MATCH_NOTHING
    return { price: { $gte: Math.min(a, b), $lte: Math.max(a, b) } }
  }
  if (c.operator === "in" || c.operator === "nin") {
    const nums = (Array.isArray(c.value) ? c.value : [c.value]).map(toNumber).filter((n) => n !== null)
    if (!nums.length) return MATCH_NOTHING
    return { price: { [c.operator === "in" ? "$in" : "$nin"]: nums } }
  }
  const op = map[c.operator]
  const n = toNumber(c.value)
  if (!op || n === null) return MATCH_NOTHING
  return { price: { [op]: n } }
}

// { brandId: { $in: [...] } } / eq / ne
function brandClause(c) {
  if (c.operator === "eq" || c.operator === "ne") {
    const id = toObjectId(c.value)
    if (!id) return MATCH_NOTHING
    return { brandId: c.operator === "eq" ? id : { $ne: id } }
  }
  const ids = toObjectIdArray(c.value)
  if (!ids.length) return MATCH_NOTHING
  return { brandId: { [c.operator === "nin" ? "$nin" : "$in"]: ids } }
}

// categoryIds is an ARRAY on the product; membership is "product has this cat".
// contains_all -> $all; in/nin -> $in/$nin; eq -> single-id $in.
function categoryClause(c) {
  const ids = toObjectIdArray(c.value)
  if (!ids.length) return MATCH_NOTHING
  if (c.operator === "contains_all") return { categoryIds: { $all: ids } }
  if (c.operator === "nin") return { categoryIds: { $nin: ids } }
  return { categoryIds: { $in: ids } } // in / eq
}

// options is [{ key, value }]. Requires an optionKey; value comparison via
// $elemMatch so we match the key+value pair on the SAME element.
function optionClause(c) {
  const key = (c.optionKey ?? "").trim()
  if (!key) return MATCH_NOTHING
  if (c.operator === "in" || c.operator === "contains") {
    const values = (Array.isArray(c.value) ? c.value : [c.value]).map((v) => String(v)).filter(Boolean)
    if (!values.length) return MATCH_NOTHING
    return { options: { $elemMatch: { key, value: { $in: values } } } }
  }
  if (c.operator === "ne") {
    return { options: { $not: { $elemMatch: { key, value: String(c.value) } } } }
  }
  return { options: { $elemMatch: { key, value: String(c.value) } } } // eq (default)
}

function compileOne(c) {
  switch (c.field) {
    case "price":
      return priceClause(c)
    case "brand":
      return brandClause(c)
    case "categories":
      return categoryClause(c)
    case "option":
      return optionClause(c)
    default:
      return MATCH_NOTHING
  }
}

/**
 * Compile a rules object into a Mongo product filter.
 *   { match: "all" | "any", conditions: [...] }  ->  { $and | $or: [...] }
 * An empty ruleset matches NOTHING (safe default — a dynamic collection with no
 * filters should be empty, never "everything").
 */
export function compileRules(rules) {
  const clauses = (rules?.conditions ?? []).map(compileOne)
  if (!clauses.length) return { __none: true }
  return rules.match === "any" ? { $or: clauses } : { $and: clauses }
}
