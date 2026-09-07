import { ApiError } from "../../utils/apiError.js"

// Build the Cartesian product of an option name→values matrix into embedded
// variants, matching the export's `variants2`. Called by
// POST /:id/variants/generate.
//
//   matrix = { "Metal Type": ["10K","14K"], "Carat Weight": ["0.50","1.00"] }
//   -> variants for every combination, each with a deterministic variantKey.
//
// Existing variants are preserved by variantKey (diff, don't clobber): a
// regenerate keeps prices/skus the owner already edited and only adds the
// missing combinations.

// Stable key from option VALUES joined in option-name order, e.g.
// "10K|0.50". Option names are sorted so the key is order-independent.
export function buildVariantKey(options) {
  return [...(options ?? [])]
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
    .map((o) => String(o.value))
    .join("|")
}

export function generateVariants({ matrix, basePrice = 0, maxCombos = 1000, existing = [] }) {
  const names = Object.keys(matrix ?? {})
  if (!names.length) throw new ApiError(400, "No options to generate variants from")

  // Guard against runaway matrices before building anything.
  const total = names.reduce((acc, n) => acc * (matrix[n]?.length || 0), 1)
  if (total === 0) throw new ApiError(400, "Every option needs at least one value")
  if (total > maxCombos) {
    throw new ApiError(400, `Too many variant combinations (${total} > ${maxCombos})`)
  }

  // Index existing variants by key so we can preserve edited prices/skus.
  const prior = new Map()
  for (const v of existing ?? []) {
    const key = v.variantKey || buildVariantKey(v.options)
    prior.set(key, v)
  }

  // Iterative Cartesian product.
  let combos = [[]]
  for (const name of names) {
    const next = []
    for (const combo of combos) {
      for (const value of matrix[name]) {
        next.push([...combo, { name, value }])
      }
    }
    combos = next
  }

  return combos.map((options) => {
    const variantKey = buildVariantKey(options)
    const kept = prior.get(variantKey)
    if (kept) {
      // Preserve everything the owner may have edited; refresh the option pairs.
      return { ...kept, options, variantKey }
    }
    return {
      price: basePrice,
      comparePrice: null,
      sku: null,
      options,
      variantKey,
      available: 0,
      inventoryManagement: "none",
      image: null,
      diamondProperties: [],
      metalProperties: [],
      gemstoneProperties: [],
      pearlProperties: [],
    }
  })
}
