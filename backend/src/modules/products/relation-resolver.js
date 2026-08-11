import mongoose from "mongoose"
import { getTenantModels } from "../../config/tenantDb.js"

// Resolve legacy alias arrays (and/or already-resolved ids) to the ObjectId
// form the Product model stores. Used by (a) the editor create/update path and
// (b) the bulk importer. Every lookup is scoped to the tenant + parentStoreId
// and batched in ONE query per relation (no N+1).
//
// HARD RULE (docs/products.md): the DB only ever holds ObjectIds for relations.
// This is the single place aliases are turned into ids.

const oid = (v) => new mongoose.Types.ObjectId(String(v))
const isObjectId = (v) => typeof v === "string" && /^[a-f0-9]{24}$/i.test(v)

// Split a mixed array of alias|id strings into { ids, aliases }.
function partition(list) {
  const ids = []
  const aliases = []
  for (const item of list ?? []) {
    if (item == null) continue
    const s = String(item).trim()
    if (!s) continue
    if (isObjectId(s)) ids.push(s)
    else aliases.push(s)
  }
  return { ids, aliases }
}

// Resolve the relation fields of a raw payload to ObjectIds.
//
// Accepts either the normalized editor fields (brandId, collectionIds[],
// categoryIds[], substoreIds[]) OR the legacy export fields (brand, collections[],
// categories[], substore[], option_set, seller). Whatever is present wins; the
// normalized ids are used as-is, aliases are looked up.
//
// Returns ONLY the keys it could resolve, plus a `warnings[]` array listing
// aliases that matched no document (skipped, never stored as phantom refs) and
// `categoryAncestorIds` (the union of ancestors of every resolved category).
export async function resolveRelations({ tenantDbName, parentStoreId, raw }) {
  const { Brand, Collection, Category, Substore } = getTenantModels(tenantDbName)
  const store = oid(parentStoreId)
  const warnings = []

  // ------------------------------------------------------------------ brand
  let brandId
  if (raw.brandId !== undefined) {
    brandId = raw.brandId ? oid(raw.brandId) : null
  } else if (raw.brand !== undefined) {
    const b = raw.brand ? String(raw.brand).trim() : ""
    if (!b) brandId = null
    else if (isObjectId(b)) brandId = oid(b)
    else {
      const doc = await Brand.findOne({ parentStoreId: store, alias: b }).select("_id").lean()
      if (doc) brandId = doc._id
      else {
        brandId = null
        warnings.push(`brand alias not found: ${b}`)
      }
    }
  }

  // ------------------------------------------------------------ collections
  let collectionIds
  if (raw.collectionIds !== undefined) {
    collectionIds = (raw.collectionIds ?? []).map(oid)
  } else if (raw.collections !== undefined) {
    const { ids, aliases } = partition(raw.collections)
    const found = aliases.length
      ? await Collection.find({ parentStoreId: store, alias: { $in: aliases } }).select("_id alias").lean()
      : []
    const foundAliases = new Set(found.map((c) => c.alias))
    for (const a of aliases) if (!foundAliases.has(a)) warnings.push(`collection alias not found: ${a}`)
    collectionIds = [...ids.map(oid), ...found.map((c) => c._id)]
  }

  // ------------------------------------------------------------- categories
  let categoryIds
  let categoryAncestorIds
  const collectAncestors = async (ids) => {
    if (!ids.length) return []
    const cats = await Category.find({ parentStoreId: store, _id: { $in: ids } })
      .select("_id ancestors")
      .lean()
    const set = new Set()
    for (const c of cats) for (const a of c.ancestors ?? []) set.add(String(a))
    return [...set].map(oid)
  }
  if (raw.categoryIds !== undefined) {
    categoryIds = (raw.categoryIds ?? []).map(oid)
    categoryAncestorIds = await collectAncestors(categoryIds)
  } else if (raw.categories !== undefined) {
    const { ids, aliases } = partition(raw.categories)
    const found = aliases.length
      ? await Category.find({ parentStoreId: store, alias: { $in: aliases } }).select("_id alias ancestors").lean()
      : []
    const foundAliases = new Set(found.map((c) => c.alias))
    for (const a of aliases) if (!foundAliases.has(a)) warnings.push(`category alias not found: ${a}`)
    categoryIds = [...ids.map(oid), ...found.map((c) => c._id)]
    // Ancestors from resolved-by-alias docs + a lookup for the raw id ones.
    const set = new Set(found.flatMap((c) => (c.ancestors ?? []).map(String)))
    for (const a of await collectAncestors(ids.map(oid))) set.add(String(a))
    categoryAncestorIds = [...set].map(oid)
  }

  // -------------------------------------------------------------- substores
  // "all" is a SENTINEL, not a document → collapses to [] (= all substores).
  let substoreIds
  if (raw.substoreIds !== undefined) {
    substoreIds = (raw.substoreIds ?? []).map(oid)
  } else if (raw.substore !== undefined) {
    const cleaned = (raw.substore ?? []).map((s) => String(s).trim()).filter((s) => s && s !== "all")
    const { ids, aliases } = partition(cleaned)
    const found = aliases.length
      ? await Substore.find({ parentStoreId: store, alias: { $in: aliases } }).select("_id alias").lean()
      : []
    const foundAliases = new Set(found.map((s) => s.alias))
    for (const a of aliases) if (!foundAliases.has(a)) warnings.push(`substore alias not found: ${a}`)
    substoreIds = [...ids.map(oid), ...found.map((s) => s._id)]
  }

  // ------------------------------------------------ option set + seller (ids)
  // Both are already ObjectIds in the export — passthrough (validated for
  // existence by the caller / attach flow).
  let optionSetId
  if (raw.optionSetId !== undefined) optionSetId = raw.optionSetId ? oid(raw.optionSetId) : null
  else if (raw.optionSet !== undefined) optionSetId = raw.optionSet ? oid(raw.optionSet) : null
  else if (raw.option_set !== undefined) optionSetId = raw.option_set ? oid(raw.option_set) : null

  let sellerId
  if (raw.sellerId !== undefined) sellerId = raw.sellerId ? oid(raw.sellerId) : null
  else if (raw.seller !== undefined) sellerId = raw.seller ? oid(raw.seller) : null

  const out = { warnings }
  if (brandId !== undefined) out.brandId = brandId
  if (collectionIds !== undefined) out.collectionIds = collectionIds
  if (categoryIds !== undefined) {
    out.categoryIds = categoryIds
    out.categoryAncestorIds = categoryAncestorIds ?? []
  }
  if (substoreIds !== undefined) out.substoreIds = substoreIds
  if (optionSetId !== undefined) out.optionSetId = optionSetId
  if (sellerId !== undefined) out.sellerId = sellerId
  return out
}
