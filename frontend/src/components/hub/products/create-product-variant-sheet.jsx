"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  ImageOff,
  Loader2,
  Package,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import useSWRInfinite from "swr/infinite"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ImageGallery } from "@/components/hub/products/image-gallery"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { api, fetcher } from "@/lib/api"
import { imgUrl } from "@/Server"
import { isValueBearing } from "@/components/hub/option-sets/option-set-utils"

const PICKER_PAGE_SIZE = 20

const EMPTY_CONFIG = {
  selections: {}, // { [optionName]: value }
  price: "",
  comparePrice: "",
  sku: "",
  barcode: "",
  tag: "",
  weight: "",
  weightUnit: "gm",
  available: "0",
  inventoryManagement: "none",
  allowOutOfStock: false,
  minLimit: "",
  maxLimit: "",
  isDefault: false,
  images: [],
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  canonicalUrl: "",
  sitemapPriority: "0.5",
  sitemapFrequency: "daily",
  noIndex: false,
}

const WEIGHT_UNITS = ["gm", "kg", "ct", "oz", "lb"]
const SITEMAP_FREQUENCIES = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"]

/**
 * Deterministic variant key mirroring the backend (variant-generator.js):
 * option VALUES joined in option-NAME order. Lets us flag a duplicate
 * combination BEFORE the request so we never even attempt to create one the
 * server would reject with a 409.
 */
function buildVariantKey(selections) {
  return Object.keys(selections ?? {})
    .filter((name) => selections[name] != null && selections[name] !== "")
    .sort((a, b) => a.localeCompare(b))
    .map((name) => String(selections[name]))
    .join("|")
}

/** Value-bearing, non "show-always" options are the ones that define variants. */
function variantOptions(product) {
  return (product?.options ?? []).filter(
    (o) => !o.showAlways && isValueBearing(o.type || "dropdown"),
  )
}

function optionValues(option) {
  return (option.values ?? [])
    .map((v) => (typeof v === "string" ? { label: v, value: v } : { label: v.label ?? v.value, value: v.value }))
    .filter((v) => v.value != null && v.value !== "")
}

/**
 * Create / edit a Product Variant in a right-side Sheet.
 *
 * Two steps:
 *  1. "pick"   — search + lazy-load 10 products at a time (Load More).
 *  2. "config" — the chosen product's option selectors + price/sku/inventory.
 *
 * Duplicate protection is enforced BOTH client-side (the chosen option combo is
 * checked against the product's existing variants and the Add button is
 * disabled) AND server-side (the unique variantKey index → 409), so a duplicate
 * variant can never be created.
 */
export function CreateProductVariantSheet({ open, onOpenChange, onSaved, editTarget }) {
  const isEdit = Boolean(editTarget)
  const [step, setStep] = useState("pick")
  const [selectedProduct, setSelectedProduct] = useState(null) // full product doc
  const [loadingProduct, setLoadingProduct] = useState(false)
  const [existingVariants, setExistingVariants] = useState([])
  const [config, setConfig] = useState(EMPTY_CONFIG)
  const [saving, setSaving] = useState(false)

  // ------------------------------------------------------- product picker feed
  const [search, setSearch] = useState("")
  const q = useDebouncedValue(search, 300)

  const getKey = (pageIndex, prev) => {
    if (!open || isEdit || step !== "pick") return null
    if (prev && prev.rows && prev.rows.length < PICKER_PAGE_SIZE) return null
    const params = new URLSearchParams({
      tab: "all",
      page: String(pageIndex + 1),
      limit: String(PICKER_PAGE_SIZE),
    })
    if (q.trim()) params.set("q", q.trim())
    return `/seller/products?${params.toString()}`
  }

  const { data: pages, size, setSize, isValidating } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
    revalidateFirstPage: false,
  })

  const products = useMemo(() => (pages ?? []).flatMap((p) => p.rows ?? []), [pages])
  const total = pages?.[0]?.total ?? 0
  const hasMore = products.length < total

  // Auto-load the next page when the sentinel scrolls into view. Guarded by
  // `hasMore && !isValidating` so overlapping observations can't stack up
  // duplicate fetches. We keep the latest values in a ref so the observer
  // callback stays current without tearing down/re-creating the observer.
  const sentinelRef = useRef(null)
  const loadMoreState = useRef({ hasMore, isValidating, size })
  loadMoreState.current = { hasMore, isValidating, size }

  useEffect(() => {
    if (!open || isEdit || step !== "pick") return
    const node = sentinelRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        const { hasMore: canLoad, isValidating: loading, size: pageCount } = loadMoreState.current
        if (entries[0]?.isIntersecting && canLoad && !loading) {
          setSize(pageCount + 1)
        }
      },
      { rootMargin: "200px" },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [open, isEdit, step, setSize])

  // Reset everything whenever the sheet opens/closes.
  useEffect(() => {
    if (!open) return
    setSearch("")
    setSaving(false)
    if (isEdit) {
      // Jump straight to config for the row being edited.
      setStep("config")
      const v = editTarget.variant
      setConfig({
        selections: Object.fromEntries((v.options ?? []).map((o) => [o.name, o.value])),
        price: String(v.price ?? ""),
        comparePrice: v.comparePrice != null ? String(v.comparePrice) : "",
        sku: v.sku ?? "",
        barcode: v.barcode ?? "",
        tag: v.tag ?? "",
        weight: v.weight != null ? String(v.weight) : "",
        weightUnit: v.weightUnit ?? "gm",
        available: String(v.available ?? 0),
        inventoryManagement: v.inventoryManagement ?? "none",
        allowOutOfStock: Boolean(v.allowOutOfStock),
        minLimit: v.minLimit != null ? String(v.minLimit) : "",
        maxLimit: v.maxLimit != null ? String(v.maxLimit) : "",
        isDefault: Boolean(v.isDefault),
        images: (v.images ?? []).map((img) => ({
          url: img.url,
          alt: img.alt ?? "",
          caption: img.caption ?? "",
          tags: img.tags ?? [],
        })),
        seoTitle: v.seo?.title ?? "",
        seoDescription: v.seo?.description ?? "",
        seoKeywords: (v.seo?.keywords ?? []).join(", "),
        canonicalUrl: v.seo?.canonicalUrl ?? "",
        sitemapPriority: v.sitemap?.priority != null ? String(v.sitemap.priority) : "0.5",
        sitemapFrequency: v.sitemap?.frequency ?? "daily",
        noIndex: Boolean(v.sitemap?.disableForBots),
      })
      loadProduct(editTarget.productId)
    } else {
      setStep("pick")
      setSelectedProduct(null)
      setExistingVariants([])
      setConfig(EMPTY_CONFIG)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function loadProduct(productId) {
    setLoadingProduct(true)
    try {
      const [{ product }, variantsRes] = await Promise.all([
        api.get(`/seller/products/${productId}`),
        api.get(`/seller/products/${productId}/variants`),
      ])
      setSelectedProduct(product)
      setExistingVariants(variantsRes?.rows ?? [])
      return product
    } catch (err) {
      toast.error(err.message)
      onOpenChange(false)
      return null
    } finally {
      setLoadingProduct(false)
    }
  }

  async function chooseProduct(row) {
    const product = await loadProduct(row._id)
    if (!product) return
    // Prefill price from the product so the owner rarely retypes it.
    setConfig({ ...EMPTY_CONFIG, price: String(product.price ?? "") })
    setStep("config")
  }

  const opts = useMemo(() => variantOptions(selectedProduct), [selectedProduct])

  // Keys already taken for this product (exclude the row we are editing).
  const existingKeys = useMemo(() => {
    const set = new Set()
    for (const v of existingVariants) {
      if (isEdit && String(v._id) === String(editTarget.variant._id)) continue
      set.add(v.variantKey ?? buildVariantKey(Object.fromEntries((v.options ?? []).map((o) => [o.name, o.value]))))
    }
    return set
  }, [existingVariants, isEdit, editTarget])

  const currentKey = buildVariantKey(config.selections)
  const isDuplicate = existingKeys.has(currentKey)
  const missingSelection = opts.some((o) => !config.selections[o.name])

  function setSel(name, value) {
    setConfig((c) => ({ ...c, selections: { ...c.selections, [name]: value } }))
  }
  function set(key, value) {
    setConfig((c) => ({ ...c, [key]: value }))
  }

  async function handleSave() {
    if (config.price === "" || Number(config.price) < 0 || Number.isNaN(Number(config.price))) {
      toast.error("A valid price is required")
      return
    }
    if (missingSelection) {
      toast.error("Select a value for every option")
      return
    }
    if (isDuplicate) {
      toast.error("A variant with this option combination already exists")
      return
    }

    const options = opts
      .map((o) => ({ name: o.name, value: config.selections[o.name] }))
      .filter((o) => o.value)

    const payload = {
      price: Number(config.price),
      comparePrice: config.comparePrice === "" ? null : Number(config.comparePrice),
      sku: config.sku.trim() || null,
      barcode: config.barcode.trim() || null,
      tag: config.tag.trim() || null,
      weight: config.weight === "" ? null : Number(config.weight),
      weightUnit: config.weightUnit,
      available: Number(config.available) || 0,
      inventoryManagement: config.inventoryManagement,
      allowOutOfStock: config.allowOutOfStock,
      minLimit: config.minLimit === "" ? null : Number(config.minLimit),
      maxLimit: config.maxLimit === "" ? null : Number(config.maxLimit),
      isDefault: config.isDefault,
      images: config.images,
      seo: {
        title: config.seoTitle.trim() || null,
        description: config.seoDescription.trim() || null,
        keywords: config.seoKeywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        canonicalUrl: config.canonicalUrl.trim() || null,
      },
      sitemap: {
        priority: config.sitemapPriority === "" ? 0.5 : Number(config.sitemapPriority),
        frequency: config.sitemapFrequency,
        disableForBots: config.noIndex,
      },
      options,
    }

    setSaving(true)
    try {
      if (isEdit) {
        await api.patch(
          `/seller/products/${editTarget.productId}/variants/${editTarget.variant._id}`,
          payload,
        )
        toast.success("Variant updated")
      } else {
        await api.post(`/seller/products/${selectedProduct._id}/variants`, payload)
        toast.success("Variant created")
      }
      onSaved?.()
      onOpenChange(false)
    } catch (err) {
      // Backend still guards the unique combination with a 409.
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle>{isEdit ? "Edit product variant" : "Create product variant"}</SheetTitle>
          <SheetDescription>
            {step === "pick"
              ? "Select a product, then configure its variant options."
              : selectedProduct
                ? `Configuring a variant for ${selectedProduct.name}.`
                : "Loading product…"}
          </SheetDescription>
        </SheetHeader>

        {/* ---------------------------------------------------- step 1: picker */}
        {step === "pick" ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 px-6 py-4">
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="h-9 pl-8"
                aria-label="Search products"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {products.length === 0 && !isValidating ? (
                <div className="flex flex-col items-center gap-2 py-16 text-center">
                  <Package className="size-8 text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">
                    {q.trim() ? "No products match your search." : "No products yet."}
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {products.map((row) => (
                    <li key={row._id}>
                      <button
                        type="button"
                        onClick={() => chooseProduct(row)}
                        className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        {row.thumbnail ? (
                          <img
                            src={imgUrl(row.thumbnail) || "/placeholder.svg"}
                            alt=""
                            className="size-12 shrink-0 rounded-md border border-border bg-muted object-cover"
                          />
                        ) : (
                          <span className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                            <ImageOff className="size-4 text-muted-foreground" aria-hidden="true" />
                          </span>
                        )}
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-medium text-foreground">{row.name}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            SKU: {row.sku || "—"}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-sm font-semibold tabular-nums text-foreground">
                            ${Number(row.price ?? 0).toFixed(0)}
                          </span>
                          {row.variantCount > 0 && (
                            <Badge variant="outline" className="rounded-md text-[10px] font-normal tabular-nums">
                              {row.variantCount} var
                            </Badge>
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {isValidating && (
                <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  Loading…
                </div>
              )}

              {/* Sentinel: auto-loads the next page when scrolled into view. */}
              {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />}
            </div>
          </div>
        ) : null}

        {step === "pick" && (
          <SheetFooter className="flex-row items-center justify-between gap-2 border-t border-border px-6 py-4">
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {isValidating && products.length === 0
                ? "Loading products…"
                : `Showing ${products.length} of ${total} product${total === 1 ? "" : "s"}`}
            </span>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </SheetFooter>
        )}

        {step === "pick" ? null : loadingProduct && !selectedProduct ? (
          /* ------------------------------------------- step 2: loading product */
          <div className="flex flex-1 items-center justify-center py-20">
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading product" />
          </div>
        ) : (
          /* --------------------------------------------- step 2: config form */
          <>
            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
              {selectedProduct && (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                  {selectedProduct.images?.[0]?.url ? (
                    <img
                      src={imgUrl(selectedProduct.images[0].url) || "/placeholder.svg"}
                      alt=""
                      className="size-11 shrink-0 rounded-md border border-border bg-muted object-cover"
                    />
                  ) : (
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                      <ImageOff className="size-4 text-muted-foreground" aria-hidden="true" />
                    </span>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">{selectedProduct.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      SKU: {selectedProduct.sku || "—"} · {existingVariants.length} existing variant
                      {existingVariants.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              )}

              {/* Option selectors */}
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-foreground">Options</h3>
                {opts.length === 0 ? (
                  <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                    This product has no variant-defining options. You can still create a single default
                    variant with its own price and inventory.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {opts.map((option) => {
                      const values = optionValues(option)
                      return (
                        <div key={option.name} className="flex flex-col gap-1.5">
                          <Label className="text-xs font-medium text-muted-foreground">
                            {option.displayName || option.name}
                          </Label>
                          <Select
                            value={config.selections[option.name] ?? ""}
                            onValueChange={(v) => setSel(option.name, v)}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select…" />
                            </SelectTrigger>
                            <SelectContent>
                              {values.map((v) => (
                                <SelectItem key={v.value} value={v.value}>
                                  {v.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )
                    })}
                  </div>
                )}

                {isDuplicate && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      A variant with this exact option combination already exists for this product. Duplicate
                      variants can&apos;t be created — pick a different combination.
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Pricing + inventory */}
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-foreground">Pricing &amp; inventory</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="v-price" className="text-xs font-medium text-muted-foreground">
                      Price *
                    </Label>
                    <Input
                      id="v-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={config.price}
                      onChange={(e) => set("price", e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="v-compare" className="text-xs font-medium text-muted-foreground">
                      Compare-at price
                    </Label>
                    <Input
                      id="v-compare"
                      type="number"
                      min="0"
                      step="0.01"
                      value={config.comparePrice}
                      onChange={(e) => set("comparePrice", e.target.value)}
                      className="h-9"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="v-sku" className="text-xs font-medium text-muted-foreground">
                      SKU
                    </Label>
                    <Input
                      id="v-sku"
                      value={config.sku}
                      onChange={(e) => set("sku", e.target.value)}
                      className="h-9"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="v-available" className="text-xs font-medium text-muted-foreground">
                      Available stock
                    </Label>
                    <Input
                      id="v-available"
                      type="number"
                      min="0"
                      step="1"
                      value={config.available}
                      onChange={(e) => set("available", e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label className="text-xs font-medium text-muted-foreground">Inventory management</Label>
                    <Select
                      value={config.inventoryManagement}
                      onValueChange={(v) => set("inventoryManagement", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Don&apos;t track</SelectItem>
                        <SelectItem value="system">Track with system</SelectItem>
                        <SelectItem value="external">External system</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="v-barcode" className="text-xs font-medium text-muted-foreground">
                      Barcode
                    </Label>
                    <Input
                      id="v-barcode"
                      value={config.barcode}
                      onChange={(e) => set("barcode", e.target.value)}
                      className="h-9"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="v-tag" className="text-xs font-medium text-muted-foreground">
                      Tag
                    </Label>
                    <Input
                      id="v-tag"
                      value={config.tag}
                      onChange={(e) => set("tag", e.target.value)}
                      className="h-9"
                      placeholder="Optional"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="v-weight" className="text-xs font-medium text-muted-foreground">
                      Weight
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="v-weight"
                        type="number"
                        min="0"
                        step="0.01"
                        value={config.weight}
                        onChange={(e) => set("weight", e.target.value)}
                        className="h-9"
                        placeholder="Optional"
                      />
                      <Select value={config.weightUnit} onValueChange={(v) => set("weightUnit", v)}>
                        <SelectTrigger className="h-9 w-24 shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {WEIGHT_UNITS.map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="v-min-limit" className="text-xs font-medium text-muted-foreground">
                      Min limit to buy
                    </Label>
                    <Input
                      id="v-min-limit"
                      type="number"
                      min="0"
                      step="1"
                      value={config.minLimit}
                      onChange={(e) => set("minLimit", e.target.value)}
                      className="h-9"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="v-max-limit" className="text-xs font-medium text-muted-foreground">
                      Max limit to buy
                    </Label>
                    <Input
                      id="v-max-limit"
                      type="number"
                      min="0"
                      step="1"
                      value={config.maxLimit}
                      onChange={(e) => set("maxLimit", e.target.value)}
                      className="h-9"
                      placeholder="Optional"
                    />
                  </div>

                  <label
                    htmlFor="v-allow-oos"
                    className="flex items-center gap-2 sm:col-span-2"
                  >
                    <Checkbox
                      id="v-allow-oos"
                      checked={config.allowOutOfStock}
                      onCheckedChange={(v) => set("allowOutOfStock", Boolean(v))}
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      Allow this variant to be ordered when out of stock
                    </span>
                  </label>
                  <label htmlFor="v-default" className="flex items-center gap-2 sm:col-span-2">
                    <Checkbox
                      id="v-default"
                      checked={config.isDefault}
                      onCheckedChange={(v) => set("isDefault", Boolean(v))}
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      Set as default variant
                    </span>
                  </label>
                </div>
              </div>

              <Separator />

              {/* Variant media gallery — stored per variant under
                  uploads/product/<productId>/variants/<variantId>/ */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold text-foreground">Variant images</h3>
                  <p className="text-xs text-muted-foreground">
                    Images shown when this specific variant is selected on the storefront.
                  </p>
                </div>
                <ImageGallery value={config.images} onChange={(next) => set("images", next)} />
              </div>

              <Separator />

              {/* SEO / sitemap */}
              <div className="flex flex-col gap-4">
                <h3 className="text-sm font-semibold text-foreground">SEO</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="v-seo-title" className="text-xs font-medium text-muted-foreground">
                      Title
                    </Label>
                    <Input
                      id="v-seo-title"
                      value={config.seoTitle}
                      onChange={(e) => set("seoTitle", e.target.value)}
                      className="h-9"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="v-seo-desc" className="text-xs font-medium text-muted-foreground">
                      Description
                    </Label>
                    <Textarea
                      id="v-seo-desc"
                      value={config.seoDescription}
                      onChange={(e) => set("seoDescription", e.target.value)}
                      className="min-h-20"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="v-seo-keywords" className="text-xs font-medium text-muted-foreground">
                      Keywords
                    </Label>
                    <Input
                      id="v-seo-keywords"
                      value={config.seoKeywords}
                      onChange={(e) => set("seoKeywords", e.target.value)}
                      className="h-9"
                      placeholder="Comma separated"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="v-canonical" className="text-xs font-medium text-muted-foreground">
                      Canonical URL
                    </Label>
                    <Input
                      id="v-canonical"
                      value={config.canonicalUrl}
                      onChange={(e) => set("canonicalUrl", e.target.value)}
                      className="h-9"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="v-sitemap-priority" className="text-xs font-medium text-muted-foreground">
                      Sitemap priority
                    </Label>
                    <Input
                      id="v-sitemap-priority"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.sitemapPriority}
                      onChange={(e) => set("sitemapPriority", e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Sitemap frequency</Label>
                    <Select
                      value={config.sitemapFrequency}
                      onValueChange={(v) => set("sitemapFrequency", v)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SITEMAP_FREQUENCIES.map((f) => (
                          <SelectItem key={f} value={f}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <label htmlFor="v-noindex" className="flex items-center gap-2 sm:col-span-2">
                    <Checkbox
                      id="v-noindex"
                      checked={config.noIndex}
                      onCheckedChange={(v) => set("noIndex", Boolean(v))}
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      No index (hide this variant from search engines)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <SheetFooter className="flex-row items-center justify-between gap-2 border-t border-border px-6 py-4">
              {!isEdit ? (
                <Button variant="ghost" onClick={() => setStep("pick")} disabled={saving}>
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back
                </Button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving || isDuplicate || missingSelection}>
                  {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {isEdit ? "Save changes" : "Add variant"}
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default CreateProductVariantSheet
