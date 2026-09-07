"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { api, fetcher } from "@/lib/api"
import { useMetafieldDefinition } from "@/components/hub/metafields/use-metafields"

// The metafield module products bind their values to. Only the DEFINITION is
// loaded here (to render the value form); the VALUES now live directly on the
// product document (`draft.metafields`) and are saved in the product body —
// there is no separate metafieldValues collection round-trip anymore.
const PRODUCT_MODULE = "products"

/**
 * Load / draft / dirty / save engine for the six-tab product editor.
 *
 * - Loads GET /seller/products/:id and seeds a deep-cloned local `draft`.
 * - Every tab mutates `draft` through `setField(path, value)` (dot paths).
 * - `save()` sends only the CHANGED top-level fields (partial PATCH) so each tab
 *   can persist independently. In create mode the first save is a POST, then the
 *   caller switches the route to /:id/edit.
 * - Relations are always ObjectId strings (brandId / collectionIds /
 *   categoryIds / substoreIds / optionSetId / sellerId). Labels are cached
 *   separately by the pickers so chips render without a refetch.
 */

// Every editable top-level field the editor owns → drives the partial diff.
const TRACKED_FIELDS = [
  "name",
  "alias",
  "description",
  "images",
  "price",
  "comparePrice",
  "sku",
  "tax",
  "productTaxCode",
  "weight",
  "weightUnit",
  "brandId",
  "collectionIds",
  "categoryIds",
  "substoreIds",
  "isPublished",
  "sortOrder",
  "tag",
  "tags",
  "specifications",
  "metafields",
  "media",
  "seo",
  "sitemap",
  "inventory",
  "misc",
  "sellerId",
  "approve",
  // The option-set REFERENCE (`optionSetId`) plus the full option DEFINITIONS
  // (`options`). Attaching a set copies its options[] onto the product; the
  // seller can then add / remove / reorder them per product in the Options &
  // Variants tab. Both are sent to the backend, which persists options[]
  // verbatim. There is no version/snapshot field anymore.
  "optionSetId",
  "options",
]

export function emptyDraft() {
  return {
    name: "",
    alias: "",
    description: "",
    images: [],
    price: "",
    comparePrice: "",
    sku: "",
    tax: "default",
    productTaxCode: "",
    weight: "",
    weightUnit: "gm",
    brandId: null,
    collectionIds: [],
    categoryIds: [],
    substoreIds: [],
    isPublished: true,
    sortOrder: 0,
    tag: "",
    tags: [],
    specifications: [],
    // StoreHippo-style keyed object of definition-driven values, embedded on
    // the product doc (NOT a legacy [{key,value}] array).
    metafields: {},
    media: [],
    seo: { title: "", description: "", keywords: [], canonicalUrl: "" },
    sitemap: { priority: 0.5, frequency: "daily", disableForBots: false },
    inventory: {
      management: "none",
      available: 0,
      minLimit: 1,
      maxLimit: null,
      dimension: { length: null, width: null, height: null },
    },
    misc: {
      barcode: "",
      isbn: "",
      hsn: "",
      sac: "",
      upc: "",
      gtin: "",
      mpn: "",
      uom: "",
      attributes: [],
      features: [],
      enableRfq: false,
      files: [],
      shippingCost: null,
      isCatalog: false,
      catalogOnly: false,
      countryOfOrigin: "",
      googleProductCategory: "",
      relatedProductIds: [],
      boughtTogetherIds: [],
      googleShopping: {},
    },
    sellerId: null,
    approve: "pending",
    optionSetId: null,
    options: [],
    variantCount: 0,
  }
}

// Deep clone that is safe for our plain JSON drafts.
const clone = (v) => (v == null ? v : JSON.parse(JSON.stringify(v)))

// Normalize a loaded product into an editable draft (fill missing nested keys).
function toDraft(product) {
  const base = emptyDraft()
  return {
    ...base,
    ...product,
    seo: { ...base.seo, ...(product.seo ?? {}) },
    sitemap: { ...base.sitemap, ...(product.sitemap ?? {}) },
    inventory: {
      ...base.inventory,
      ...(product.inventory ?? {}),
      dimension: { ...base.inventory.dimension, ...(product.inventory?.dimension ?? {}) },
    },
    misc: {
      ...base.misc,
      ...(product.misc ?? {}),
      googleShopping: { ...base.misc.googleShopping, ...(product.misc?.googleShopping ?? {}) },
    },
  }
}

// Set a value at a dot path on an immutable clone (e.g. "inventory.dimension.length").
function setPath(obj, path, value) {
  const keys = path.split(".")
  const next = clone(obj)
  let cursor = next
  for (let i = 0; i < keys.length - 1; i++) {
    cursor[keys[i]] = cursor[keys[i]] == null ? {} : cursor[keys[i]]
    cursor = cursor[keys[i]]
  }
  cursor[keys[keys.length - 1]] = value
  return next
}

export function useProductEditor(id) {
  const { mutate: globalMutate } = useSWRConfig()
  const isCreate = !id

  const { data, isLoading } = useSWR(id ? `/seller/products/${id}` : null, fetcher, {
    revalidateOnFocus: false,
  })

  const [draft, setDraft] = useState(() => (isCreate ? emptyDraft() : null))
  const serverRef = useRef(isCreate ? emptyDraft() : null)
  const [saving, setSaving] = useState(false)
  const [labelCache, setLabelCache] = useState({})

  // Metafields: load ONLY the ms.products DEFINITION (the schema the General
  // tab renders). The actual VALUES live on `draft.metafields` and are seeded /
  // diffed / saved as a normal product field — no separate values endpoint.
  const { definition: mfDefinition } = useMetafieldDefinition(PRODUCT_MODULE)

  // Seed the draft once when the product arrives.
  useEffect(() => {
    if (data?.product && draft === null) {
      const d = toDraft(data.product)
      setDraft(d)
      serverRef.current = clone(d)
    }
  }, [data, draft])

  const setField = useCallback((path, value) => {
    setDraft((prev) => setPath(prev ?? emptyDraft(), path, value))
  }, [])

  const mergeLabels = useCallback((map) => {
    setLabelCache((prev) => ({ ...prev, ...map }))
  }, [])

  // Top-level keys whose value differs from the server copy.
  const changedFields = useMemo(() => {
    if (!draft) return []
    const server = serverRef.current ?? {}
    return TRACKED_FIELDS.filter(
      (k) => JSON.stringify(draft[k]) !== JSON.stringify(server[k]),
    )
  }, [draft])

  const isDirty = changedFields.length > 0

  // Coerce a numeric field back to Number (or null) for the wire payload.
  const num = (v, dflt = null) => {
    if (v === "" || v === null || v === undefined) return dflt
    const n = Number(v)
    return Number.isNaN(n) ? dflt : n
  }

  function buildPayload(fields) {
    const p = {}
    for (const k of fields) {
      if (k === "price") p.price = num(draft.price, 0)
      else if (k === "comparePrice") p.comparePrice = num(draft.comparePrice)
      else if (k === "weight") p.weight = num(draft.weight)
      else if (k === "sortOrder") p.sortOrder = num(draft.sortOrder, 0)
      else p[k] = draft[k]
    }
    return p
  }

  const save = useCallback(
    async ({ silentIfClean = false } = {}) => {
      if (!draft) return null
      if (isCreate) {
        setSaving(true)
        try {
          // metafields ride along in the body (it is a TRACKED_FIELD) and are
          // validated + embedded on the product server-side.
          const payload = buildPayload(TRACKED_FIELDS)
          const { product, warnings } = await api.post("/seller/products", payload)
          serverRef.current = clone(toDraft(product))
          setDraft(toDraft(product))
          globalMutate((key) => typeof key === "string" && key.startsWith("/seller/products"))
          return { product, warnings: warnings ?? [] }
        } finally {
          setSaving(false)
        }
      }
      const fields = changedFields
      // Nothing changed at all — metafields now live on the product doc, so a
      // clean draft has genuinely nothing to persist.
      if (fields.length === 0) {
        if (silentIfClean) return { product: draft, warnings: [] }
        return { product: draft, warnings: [], clean: true }
      }
      setSaving(true)
      try {
        const payload = buildPayload(fields)
        const { product, warnings } = await api.patch(`/seller/products/${id}`, payload)
        const merged = toDraft({ ...serverRef.current, ...product })
        serverRef.current = clone(merged)
        setDraft(merged)
        globalMutate((key) => typeof key === "string" && key.startsWith("/seller/products"))
        return { product, warnings: warnings ?? [] }
      } finally {
        setSaving(false)
      }
    },
    [draft, changedFields, id, isCreate, globalMutate],
  )

  return {
    isCreate,
    loading: !isCreate && (isLoading || draft === null),
    product: data?.product ?? null,
    draft: draft ?? emptyDraft(),
    setDraft,
    setField,
    labelCache,
    mergeLabels,
    isDirty,
    changedFields,
    saving,
    save,
    // Definition-driven metafields (ms.products). VALUES live on the product
    // doc — the General tab reads `draft.metafields` and writes it back through
    // `setField("metafields", ...)`; only the DEFINITION is exposed here.
    mfDefinition,
  }
}
