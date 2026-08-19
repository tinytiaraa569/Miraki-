"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Loader2, Save, Trash2, Upload, X } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"
import useSWRInfinite from "swr/infinite"
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
import { MultiSelect } from "@/components/hub/multi-select"
import { EntityPicker } from "@/components/hub/collections/entity-picker"
import { DiscountConditionsBuilder } from "@/components/hub/discounts/discount-conditions-builder"
import { useDiscount, useDiscountMutations } from "@/components/hub/discounts/use-discounts"
import { fetcher } from "@/lib/api"
import { imgUrl } from "@/Server"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Create / edit panel for a Discount — matches the StoreHippo discount form.
//
// Three Rule Types:
//   • product / order  → Amount (flat|%), Apply On, and a conditions table.
//   • bogo_auto_add    → a "buy X, auto-add a free gift" config (Product Group,
//                        source item + thresholds, free product, gift media).
// Every rule type also carries a Substores multi-select (restrict the discount
// to specific stores) and the shared Enabled / advance-settings block.
//
// API payload (matches use-discounts + the backend contract to come):
//   product/order:
//     { name, description, ruleType, amountType, amountValue, applyOn,
//       conditions:{ match, items:[{ field, operator, value }] },
//       substoreIds, maxUsage, maxDiscount, startDate, endDate, sellerId, enabled }
//   bogo_auto_add:
//     { name, description, ruleType:"bogo_auto_add", productGroup, sourceItemId,
//       sourceMinQuantity, sourceMinTotal, discountLabel, discountMessage,
//       freeProductConfig, freeProductIds, giftImage, giftHeading, giftMessage,
//       substoreIds, maxUsage, startDate, endDate, sellerId, enabled }
// ---------------------------------------------------------------------------

const RULE_TYPES = [
  { value: "product", label: "Product based" },
  { value: "order", label: "Order based" },
  { value: "bogo_auto_add", label: "Bogo auto add" },
]

// Product Group → what the "source items" are grouped by, plus the discount-
// scoped /options feed its picker reads from. All feeds are served by the
// discount module (paginated + searchable → the pickers infinite-scroll).
const SOURCE_GROUPS = {
  product: { label: "Product", endpoint: "/seller/discounts/options/products" },
  collection: { label: "Collection", endpoint: "/seller/discounts/options/collections" },
  category: { label: "Category", endpoint: "/seller/discounts/options/categories" },
  brand: { label: "Brand", endpoint: "/seller/discounts/options/brands" },
}

const FREE_PRODUCT_CONFIGS = [
  { value: "single", label: "Single" },
  { value: "multiple", label: "Multiple" },
]

const EMPTY_FORM = {
  name: "",
  description: "",
  ruleType: "product", // "product" | "order" | "bogo_auto_add"
  // --- product / order ---
  amountType: "flat", // "flat" | "percentage"
  amountValue: "",
  applyOn: "all", // "all" | "conditional"
  conditions: { match: "all", items: [] },
  // --- bogo_auto_add ---
  productGroup: "collection", // "product" | "collection" | "category" | "brand"
  sourceItemId: "",
  sourceMinQuantity: "",
  sourceMinTotal: "",
  discountLabel: "",
  discountMessage: "",
  freeProductConfig: "single", // "single" | "multiple"
  freeProductIds: [],
  giftImage: null, // dataUrl (new upload) | url string (saved) | null
  giftHeading: "",
  giftMessage: "",
  // --- shared ---
  substoreIds: [],
  maxUsage: "",
  maxDiscount: "",
  startDate: "",
  endDate: "",
  sellerId: "",
  enabled: true,
  timesUsed: 0,
}

function num(value, fallback) {
  if (value === "" || value === null || value === undefined) return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

// Stored instant → "yyyy-mm-ddThh:mm" in the browser's LOCAL time for the native
// datetime-local input (no Calendar primitive). Local getters — NOT toISOString —
// so the merchant sees the same wall-clock they saved, whatever the server TZ.
function toDateTimeInput(value) {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Native datetime-local string (local wall-clock, no zone) → full UTC ISO instant
// for the payload. new Date() reads the bare string as LOCAL, toISOString() pins
// the real instant, so start/end round-trip correctly regardless of server TZ.
function toIsoOrNull(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function docToForm(doc) {
  if (!doc) return EMPTY_FORM
  return {
    name: doc.name ?? "",
    description: doc.description ?? "",
    ruleType: doc.ruleType ?? "product",
    amountType: doc.amountType ?? "flat",
    amountValue: doc.amountValue ?? "",
    applyOn: doc.applyOn ?? "all",
    conditions: {
      match: doc.conditions?.match ?? "all",
      items: (doc.conditions?.items ?? []).map((it) => ({
        field: it.field,
        operator: it.operator,
        value: it.value,
      })),
    },
    productGroup: doc.productGroup ?? "collection",
    sourceItemId: doc.sourceItemId ? String(doc.sourceItemId) : "",
    sourceMinQuantity: doc.sourceMinQuantity ?? "",
    sourceMinTotal: doc.sourceMinTotal ?? "",
    discountLabel: doc.discountLabel ?? "",
    discountMessage: doc.discountMessage ?? "",
    freeProductConfig: doc.freeProductConfig ?? "single",
    freeProductIds: (doc.freeProductIds ?? []).map(String),
    giftImage: doc.giftImage ?? null,
    giftHeading: doc.giftHeading ?? "",
    giftMessage: doc.giftMessage ?? "",
    substoreIds: (doc.substoreIds ?? []).map(String),
    maxUsage: doc.maxUsage ?? "",
    maxDiscount: doc.maxDiscount ?? "",
    startDate: toDateTimeInput(doc.startDate),
    endDate: toDateTimeInput(doc.endDate),
    sellerId: doc.sellerId ? String(doc.sellerId) : "",
    enabled: doc.enabled !== false,
    timesUsed: doc.timesUsed ?? 0,
  }
}

function formToPayload(form) {
  // Fields common to every rule type.
  const base = {
    name: form.name.trim(),
    description: form.description.trim(),
    ruleType: form.ruleType,
    substoreIds: form.substoreIds,
    maxUsage: form.maxUsage === "" ? null : num(form.maxUsage, null),
    startDate: toIsoOrNull(form.startDate),
    endDate: toIsoOrNull(form.endDate),
    sellerId: form.sellerId || null,
    enabled: form.enabled,
  }

  if (form.ruleType === "bogo_auto_add") {
    return {
      ...base,
      productGroup: form.productGroup,
      sourceItemId: form.sourceItemId || null,
      sourceMinQuantity: form.sourceMinQuantity === "" ? null : num(form.sourceMinQuantity, null),
      sourceMinTotal: form.sourceMinTotal === "" ? null : num(form.sourceMinTotal, null),
      discountLabel: form.discountLabel.trim(),
      discountMessage: form.discountMessage.trim(),
      freeProductConfig: form.freeProductConfig,
      // "single" auto-add is still stored as a one-element list for a uniform shape.
      freeProductIds: form.freeProductConfig === "single" ? form.freeProductIds.slice(0, 1) : form.freeProductIds,
      giftImage: form.giftImage || null,
      giftHeading: form.giftHeading.trim(),
      giftMessage: form.giftMessage.trim(),
    }
  }

  // product / order
  return {
    ...base,
    amountType: form.amountType,
    amountValue: num(form.amountValue, 0),
    applyOn: form.applyOn,
    conditions:
      form.applyOn === "conditional"
        ? { match: form.conditions.match, items: form.conditions.items }
        : { match: "all", items: [] },
    // Max discount only caps a percentage discount; drop it otherwise.
    maxDiscount: form.amountType === "percentage" && form.maxDiscount !== "" ? num(form.maxDiscount, null) : null,
  }
}

function Field({ label, hint, children, htmlFor, required, className }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </Label>
      )}
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

// Plain horizontal radio group (circle + label), matching the "Apply On" row in
// the reference screenshots — no radio-group primitive in this project.
function RadioRow({ ariaLabel, options, value, onChange }) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap items-center gap-6">
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className="flex items-center gap-2 text-sm text-foreground focus-visible:outline-none"
          >
            <span
              className={cn(
                "flex size-4 items-center justify-center rounded-full border",
                active ? "border-primary" : "border-input",
              )}
              aria-hidden="true"
            >
              {active && <span className="size-2 rounded-full bg-primary" />}
            </span>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// Compact "Choose File" gift-image field — reads to a dataUrl (2 MB cap), shows a
// thumbnail + Remove. Saved records pass a url string; previewed via imgUrl().
function GiftImageField({ value, onChange }) {
  const inputRef = useRef(null)
  const preview = value ? (value.startsWith("data:") ? value : imgUrl(value)) : null

  function readFile(file) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large (max 2 MB)")
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex items-center gap-3">
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        <Upload className="size-3.5" aria-hidden="true" />
        Choose File
      </Button>
      {preview && (
        <img src={preview} alt="Gift preview" className="size-12 rounded-md border border-border object-cover" />
      )}
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => onChange(null)}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
          Remove
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
        className="sr-only"
        onChange={(e) => {
          readFile(e.target.files?.[0])
          e.target.value = ""
        }}
        aria-label="Upload gift image"
      />
    </div>
  )
}

export function DiscountEditor({ discountId, onSaved, onCancel }) {
  const isEdit = Boolean(discountId)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [saving, setSaving] = useState(false)

  const { discount, error: detailError, isLoading: detailLoading } = useDiscount(discountId)
  const { save } = useDiscountMutations()
  const loading = isEdit && detailLoading

  const isBogo = form.ruleType === "bogo_auto_add"
  const sourceGroup = SOURCE_GROUPS[form.productGroup] ?? SOURCE_GROUPS.collection

  // ---- Substore picker (lazy, paged) — same pattern as the collection editor. --
  const SUBSTORE_PAGE_SIZE = 5
  const [substoreQuery, setSubstoreQuery] = useState("")
  const [substorePickerOpen, setSubstorePickerOpen] = useState(false)
  const getSubstoreKey = (index, prev) => {
    if (!substorePickerOpen) return null
    if (prev && prev.rows.length < SUBSTORE_PAGE_SIZE) return null
    const params = new URLSearchParams({ page: String(index + 1), limit: String(SUBSTORE_PAGE_SIZE) })
    if (substoreQuery) params.set("q", substoreQuery)
    return `/seller/discounts/options/substores?${params.toString()}`
  }
  const {
    data: substorePages,
    size: substoreSize,
    setSize: setSubstoreSize,
    isLoading: substoreLoading,
    isValidating: substoreValidating,
  } = useSWRInfinite(getSubstoreKey, fetcher, {
    revalidateOnFocus: false,
    revalidateFirstPage: false,
    shouldRetryOnError: false,
  })

  const substoreRows = (substorePages ?? []).flatMap((p) => p?.rows ?? [])
  const substoreTotal = substorePages?.[0]?.total ?? 0
  const pickerSubstoreOptions = substoreRows.map((s) => ({ value: String(s._id), label: s.name, sublabel: s.alias }))
  const substoreHasMore = substoreRows.length < substoreTotal
  const substoreLoadingMore = substoreValidating && substorePages && substoreSize > substorePages.length

  // Resolve the names of already-selected substores so chips read as names.
  const initialSubstoreIds = useMemo(() => (discount?.substoreIds ?? []).map(String), [discount])
  const { data: selectedSubstoreData } = useSWR(
    initialSubstoreIds.length ? `/seller/discounts/options/substores?ids=${initialSubstoreIds.join(",")}` : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const substoreOptions = useMemo(() => {
    const byValue = new Map()
    for (const s of selectedSubstoreData?.rows ?? []) {
      byValue.set(String(s._id), { value: String(s._id), label: s.name, sublabel: s.alias })
    }
    for (const o of pickerSubstoreOptions) byValue.set(o.value, o)
    return [...byValue.values()]
  }, [selectedSubstoreData, pickerSubstoreOptions])

  useEffect(() => {
    if (detailError) toast.error(detailError.message || "Failed to load discount")
  }, [detailError])

  useEffect(() => {
    if (!discount) return
    const next = docToForm(discount)
    setForm(next)
    // Auto-expand advanced settings when the saved record uses any of them.
    setShowAdvanced(
      Boolean(next.maxUsage || next.maxDiscount || next.startDate || next.endDate || next.sellerId),
    )
  }, [discount])

  const setInput = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  // Switching rule type invalidates any product-specific conditions, so clear
  // them (the builder also remounts via `key` for a fresh draft).
  function onRuleTypeChange(next) {
    setForm((f) => ({ ...f, ruleType: next, conditions: { match: f.conditions.match, items: [] } }))
  }

  // Product Group switches the source-item entity space, so drop the old pick.
  function onProductGroupChange(next) {
    setForm((f) => ({ ...f, productGroup: next, sourceItemId: "" }))
  }

  const applyOnOptions =
    form.ruleType === "order"
      ? [
          { value: "all", label: "All orders" },
          { value: "conditional", label: "Orders that meets conditions" },
        ]
      : [
          { value: "all", label: "All products" },
          { value: "conditional", label: "Products that meets conditions" },
        ]

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    // Amount only applies to product / order discounts.
    if (!isBogo) {
      const amt = Number(form.amountValue)
      if (!Number.isFinite(amt) || amt <= 0) {
        toast.error("Enter a discount value greater than 0")
        return
      }
      if (form.amountType === "percentage" && amt > 100) {
        toast.error("Percentage cannot exceed 100")
        return
      }
    }
    setSaving(true)
    try {
      await save({ id: isEdit ? discountId : undefined, body: formToPayload(form) })
      toast.success(isEdit ? "Discount updated" : "Discount created")
      onSaved?.()
    } catch (err) {
      toast.error(err.message || "Failed to save discount")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading discount" />
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground md:text-xl">
          Discounts <span className="text-muted-foreground">/ {isEdit ? "Edit" : "Add"}</span>
        </h2>
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={saving || !form.name.trim()}>
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            Save
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
            <X className="size-4" aria-hidden="true" />
            Cancel
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
        {/* Name */}
        <Field label="Name" htmlFor="disc-name" required>
          <Input
            id="disc-name"
            value={form.name}
            onChange={setInput("name")}
            placeholder="e.g. Diwali Sale"
            required
            maxLength={160}
            aria-required="true"
          />
        </Field>

        {/* Description */}
        <Field label="Description" htmlFor="disc-desc">
          <Input
            id="disc-desc"
            value={form.description}
            onChange={setInput("description")}
            placeholder="Short description (optional)"
            maxLength={500}
          />
        </Field>

        {/* Rule Type — selection options */}
        <Field label="Rule Type" required>
          <Select value={form.ruleType} onValueChange={onRuleTypeChange}>
            <SelectTrigger aria-label="Rule type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RULE_TYPES.map((rt) => (
                <SelectItem key={rt.value} value={rt.value}>
                  {rt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* ------------------------------------------- PRODUCT / ORDER fields */}
        {!isBogo && (
          <>
            {/* Amount — type select + value */}
            <Field label="Amount" required>
              <div className="flex flex-wrap items-center gap-3">
                <Select value={form.amountType} onValueChange={set("amountType")}>
                  <SelectTrigger className="w-40" aria-label="Amount type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  {form.amountType === "flat" && <span className="text-sm text-muted-foreground">$</span>}
                  <Input
                    type="number"
                    min={0}
                    max={form.amountType === "percentage" ? 100 : undefined}
                    step="0.01"
                    value={form.amountValue}
                    onChange={setInput("amountValue")}
                    placeholder={form.amountType === "percentage" ? "e.g. 10" : "e.g. 500"}
                    className="w-40"
                    aria-label="Amount value"
                  />
                  {form.amountType === "percentage" && <span className="text-sm text-muted-foreground">%</span>}
                </div>
              </div>
            </Field>

            {/* Apply On — radios */}
            <Field label="Apply On">
              <RadioRow ariaLabel="Apply on" options={applyOnOptions} value={form.applyOn} onChange={set("applyOn")} />
            </Field>

            {/* Conditions — only when "meets conditions" */}
            {form.applyOn === "conditional" && (
              <Field label="Conditions">
                <DiscountConditionsBuilder
                  key={form.ruleType}
                  ruleType={form.ruleType}
                  value={form.conditions}
                  onChange={set("conditions")}
                />
              </Field>
            )}
          </>
        )}

        {/* ------------------------------------------------ BOGO / FREE GIFT */}
        {isBogo && (
          <div className="flex flex-col gap-6 rounded-lg border border-border p-4">
            {/* Product Group */}
            <Field label="Product Group" required hint="What the source items are grouped by.">
              <Select value={form.productGroup} onValueChange={onProductGroupChange}>
                <SelectTrigger className="w-full sm:w-72" aria-label="Product group">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SOURCE_GROUPS).map(([value, g]) => (
                    <SelectItem key={value} value={value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Source Item <group> */}
            <Field label={`Source Item ${sourceGroup.label}`} hint="Items the customer must buy to unlock the gift.">
              <EntityPicker
                key={form.productGroup}
                endpoint={sourceGroup.endpoint}
                value={form.sourceItemId}
                onChange={set("sourceItemId")}
                placeholder={`Enter to Search ${sourceGroup.label}`}
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Source Item Minimum Quantity" htmlFor="disc-src-minqty">
                <Input
                  id="disc-src-minqty"
                  type="number"
                  min={0}
                  value={form.sourceMinQuantity}
                  onChange={setInput("sourceMinQuantity")}
                  placeholder="e.g. 1"
                />
              </Field>
              <Field label="Source Item Minimum Total" htmlFor="disc-src-mintotal">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    id="disc-src-mintotal"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.sourceMinTotal}
                    onChange={setInput("sourceMinTotal")}
                    placeholder="e.g. 999"
                  />
                </div>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Discount Label" htmlFor="disc-label">
                <Input
                  id="disc-label"
                  value={form.discountLabel}
                  onChange={setInput("discountLabel")}
                  placeholder="e.g. Free Gift"
                  maxLength={160}
                />
              </Field>
              <Field label="Discount Message" htmlFor="disc-message">
                <Input
                  id="disc-message"
                  value={form.discountMessage}
                  onChange={setInput("discountMessage")}
                  placeholder="Shown to the customer"
                  maxLength={300}
                />
              </Field>
            </div>

            {/* Free Product Config */}
            <Field label="Free Product Config" required>
              <Select value={form.freeProductConfig} onValueChange={set("freeProductConfig")}>
                <SelectTrigger className="w-full sm:w-72" aria-label="Free product config">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREE_PRODUCT_CONFIGS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Free Product (Auto Add) */}
            <Field label="Free Product (Auto Add)" hint="Automatically added to the cart as the gift.">
              {form.freeProductConfig === "multiple" ? (
                <EntityPicker
                  key="free-multi"
                  endpoint="/seller/discounts/options/products"
                  multiple
                  value={form.freeProductIds}
                  onChange={set("freeProductIds")}
                  placeholder="Enter to Search Product"
                />
              ) : (
                <EntityPicker
                  key="free-single"
                  endpoint="/seller/discounts/options/products"
                  value={form.freeProductIds[0] ?? ""}
                  onChange={(id) => set("freeProductIds")(id ? [id] : [])}
                  placeholder="Enter to Search Product"
                />
              )}
            </Field>

            {/* Gift Image */}
            <Field label="Gift Image" hint="Shown with the gift on the storefront.">
              <GiftImageField value={form.giftImage} onChange={set("giftImage")} />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Gift Heading" htmlFor="disc-gift-heading">
                <Input
                  id="disc-gift-heading"
                  value={form.giftHeading}
                  onChange={setInput("giftHeading")}
                  placeholder="e.g. Your free gift!"
                  maxLength={160}
                />
              </Field>
              <Field label="Gift Message" htmlFor="disc-gift-message">
                <Input
                  id="disc-gift-message"
                  value={form.giftMessage}
                  onChange={setInput("giftMessage")}
                  placeholder="e.g. Added to your cart"
                  maxLength={300}
                />
              </Field>
            </div>
          </div>
        )}

        {/* Substores — restrict this discount to specific stores (all rule types) */}
        <Field
          label="Substores"
          hint="Leave empty to apply in all substores. Select to restrict this discount to specific stores."
        >
          <MultiSelect
            options={substoreOptions}
            selected={form.substoreIds}
            onChange={set("substoreIds")}
            placeholder="All substores"
            emptyText="No substores"
            onOpenChange={(open) => open && setSubstorePickerOpen(true)}
            loading={substoreLoading}
            hasMore={substoreHasMore}
            isLoadingMore={substoreLoadingMore}
            onLoadMore={() => setSubstoreSize(substoreSize + 1)}
            onSearch={(q) => {
              setSubstoreQuery(q)
              setSubstoreSize(1)
            }}
          />
        </Field>

        {/* Enabled */}
        <div className="flex items-center gap-3">
          <Checkbox
            id="disc-enabled"
            checked={form.enabled}
            onCheckedChange={(v) => set("enabled")(Boolean(v))}
          />
          <Label htmlFor="disc-enabled" className="text-sm font-medium text-foreground">
            Enabled
          </Label>
        </div>

        {/* Show advance settings */}
        <div className="flex items-center gap-3">
          <Checkbox
            id="disc-advanced"
            checked={showAdvanced}
            onCheckedChange={(v) => setShowAdvanced(Boolean(v))}
          />
          <Label htmlFor="disc-advanced" className="text-sm font-medium text-foreground">
            Show advance settings
          </Label>
        </div>

        {showAdvanced && (
          <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
            <Field label="Maximum usage" htmlFor="disc-maxusage" hint="Total times this discount can be used. Empty = unlimited.">
              <Input
                id="disc-maxusage"
                type="number"
                min={0}
                value={form.maxUsage}
                onChange={setInput("maxUsage")}
                placeholder="Unlimited"
              />
            </Field>
            {!isBogo && form.amountType === "percentage" && (
              <Field label="Maximum Discount" htmlFor="disc-maxdiscount" hint="Cap the discount amount for a percentage discount.">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    id="disc-maxdiscount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.maxDiscount}
                    onChange={setInput("maxDiscount")}
                    placeholder="No cap"
                  />
                </div>
              </Field>
            )}

            <Field label="Start Date & Time" htmlFor="disc-start">
              <Input id="disc-start" type="datetime-local" value={form.startDate} onChange={setInput("startDate")} />
            </Field>
            <Field label="End Date & Time" htmlFor="disc-end">
              <Input id="disc-end" type="datetime-local" value={form.endDate} onChange={setInput("endDate")} />
            </Field>

            <Field label="Seller" hint="Restrict this discount to a specific seller. Leave empty to apply to all.">
              <EntityPicker
                endpoint="/seller/discounts/options/sellers"
                value={form.sellerId}
                onChange={set("sellerId")}
                placeholder="Enter to Search Seller"
              />
            </Field>

            <Field label="Number of time used" hint="How many times this discount has been used so far.">
              <Input value={form.timesUsed} readOnly disabled className="max-w-40" aria-readonly="true" />
            </Field>
          </div>
        )}
      </div>
    </form>
  )
}
