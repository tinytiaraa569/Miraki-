"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Plus, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"
import useSWRInfinite from "swr/infinite"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/hub/multi-select"
import { CategoryTreeField } from "./category-tree-picker"
import { CouponUsageDialog } from "./coupon-usage-dailog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { api, fetcher } from "@/lib/api"

const DISCOUNT_TYPES = [
  { value: "percentage", label: "Percentage" },
  { value: "fixed", label: "Fixed amount" },
]

const CONDITION_TYPES = [
  { value: "category", label: "Category" },
  { value: "collection", label: "Collection" },
  { value: "brand", label: "Brand" },
]

const OPERATORS = [
  { value: "equal", label: "Equals" },
  { value: "not_equal", label: "Does not equal" },
]


const OPTION_ENDPOINTS = {
  collection: "/seller/collections/options",
  brand: "/seller/brands/options",
}

const PAGE_SIZE = 10
const SUBSTORE_PAGE_SIZE = 10

const EMPTY_FORM = {
  code: "",
  discountType: "percentage",
  amount: "",
  startDate: "",
  endDate: "",
  usageLimit: "",
  usageLimitPerUser: "",
  minPurchaseAmount: "",
  maxDiscountAmount: "",
  status: "active",
  substoreIds: [],
  conditions: [],
}

/** "2026-08-14T10:30" (datetime-local value) <-> ISO string. */
function toInputDateTime(iso) {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toISOOrUndefined(inputValue) {
  if (!inputValue) return undefined
  const d = new Date(inputValue)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

function toNumberOrUndefined(value) {
  if (value === "" || value === null || value === undefined) return undefined
  const n = Number(value)
  return Number.isNaN(n) ? undefined : n
}

function docToForm(doc) {
  if (!doc) return { ...EMPTY_FORM }
  return {
    code: doc.code ?? "",
    discountType: doc.discountType ?? "percentage",
    amount: doc.amount ?? "",
    startDate: toInputDateTime(doc.startDate),
    endDate: toInputDateTime(doc.endDate),
    usageLimit: doc.usageLimit ?? "",
    usageLimitPerUser: doc.usageLimitPerUser ?? "",
    minPurchaseAmount: doc.minPurchaseAmount ?? "",
    maxDiscountAmount: doc.maxDiscountAmount ?? "",
    status: doc.status ?? "active",
    substoreIds: (doc.substoreIds ?? []).map((s) => (typeof s === "string" ? s : String(s._id ?? s))),
    conditions: (doc.conditions ?? []).map((c) => ({
      type: c.type ?? "category",
      operator: c.operator ?? "equal",
      valueIds: (c.valueIds ?? []).map((v) => (typeof v === "string" ? v : String(v._id ?? v))),
    })),
  }
}

function formToPayload(form) {
  const payload = {
    code: form.code.trim().toUpperCase(),
    discountType: form.discountType,
    amount: toNumberOrUndefined(form.amount),
    startDate: toISOOrUndefined(form.startDate),
    endDate: toISOOrUndefined(form.endDate),
    status: form.status,
    substoreIds: form.substoreIds,
    conditions: form.conditions
      .filter((c) => c.valueIds.length > 0)
      .map((c) => ({ type: c.type, operator: c.operator, valueIds: c.valueIds })),
  }
  const usageLimit = toNumberOrUndefined(form.usageLimit)
  const usageLimitPerUser = toNumberOrUndefined(form.usageLimitPerUser)
  const minPurchaseAmount = toNumberOrUndefined(form.minPurchaseAmount)
  const maxDiscountAmount = toNumberOrUndefined(form.maxDiscountAmount)
  if (usageLimit !== undefined) payload.usageLimit = usageLimit
  if (usageLimitPerUser !== undefined) payload.usageLimitPerUser = usageLimitPerUser
  if (minPurchaseAmount !== undefined) payload.minPurchaseAmount = minPurchaseAmount
  if (form.discountType === "percentage" && maxDiscountAmount !== undefined) {
    payload.maxDiscountAmount = maxDiscountAmount
  }
  return payload
}

function Field({ label, hint, children, htmlFor }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  )
}

function PagedMultiSelect({ endpoint, selectedIds, onChange, placeholder, emptyText }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const getKey = (index, prev) => {
    if (!open) return null
    if (prev && (prev.rows?.length ?? 0) < PAGE_SIZE) return null
    const params = new URLSearchParams({ page: String(index + 1), limit: String(PAGE_SIZE) })
    if (query) params.set("q", query)
    return `${endpoint}?${params.toString()}`
  }
  const {
    data: pages,
    size,
    setSize,
    isLoading,
    isValidating,
  } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
    revalidateFirstPage: false,
    shouldRetryOnError: false,
  })

  const rows = (pages ?? []).flatMap((p) => p?.rows ?? [])
  const total = pages?.[0]?.total ?? 0
  const hasMore = rows.length < total
  const loadingMore = isValidating && pages && size > pages.length
  const pickerOptions = rows.map((r) => ({ value: String(r._id), label: r.name }))

  const { data: selectedData, isLoading: selectedLoading } = useSWR(
    selectedIds.length ? `${endpoint}?ids=${selectedIds.join(",")}` : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )

  const options = useMemo(() => {
    const byValue = new Map()
    for (const r of selectedData?.rows ?? []) byValue.set(String(r._id), { value: String(r._id), label: r.name })
    for (const o of pickerOptions) byValue.set(o.value, o)
    return [...byValue.values()]
  }, [selectedData, rows.length])

  const resolvingSelected = selectedIds.length > 0 && selectedLoading

  return (
    <MultiSelect
      options={options}
      selected={selectedIds}
      onChange={onChange}
      placeholder={placeholder}
      emptyText={emptyText}
      onOpenChange={(o) => setOpen(o)}
      loading={isLoading || resolvingSelected}
      hasMore={hasMore}
      isLoadingMore={loadingMore}
      onLoadMore={() => setSize(size + 1)}
      onSearch={(q) => {
        setQuery(q)
        setSize(1)
      }}
    />
  )
}

/** One condition row: type + operator + the ids it matches against. */
function ConditionRow({ condition, onChange, onRemove }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="grid flex-1 grid-cols-2 gap-2">
          <Select
            value={condition.type}
            onValueChange={(v) => onChange({ ...condition, type: v, valueIds: [] })} // reset — ids don't carry across types
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_TYPES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={condition.operator} onValueChange={(v) => onChange({ ...condition, operator: v })}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATORS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          aria-label="Remove condition"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>

      {condition.type === "category" ? (
        <CategoryTreeField
          selectedIds={condition.valueIds}
          onChange={(v) => onChange({ ...condition, valueIds: v })}
          placeholder="Select categories"
        />
      ) : (
        <PagedMultiSelect
          endpoint={OPTION_ENDPOINTS[condition.type]}
          selectedIds={condition.valueIds}
          onChange={(v) => onChange({ ...condition, valueIds: v })}
          placeholder={`Select ${condition.type}s`}
          emptyText={`No ${condition.type}s found`}
        />
      )}
    </div>
  )
}

/**
 * Create / edit a Coupon in a Sheet.
 * All API calls go straight to the Express backend via the shared client.
 */
export function CouponFormSheet({ open, onOpenChange, couponId, onSaved }) {
  const isEdit = Boolean(couponId)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [usageOpen, setUsageOpen] = useState(false)

  // Substores — lazy, paged options feed, same pattern as RoleFormSheet.
  // Nothing is fetched until the picker is opened; then it hits the lean
  // /options endpoint (which supports `ids` filtering, unlike the plain
  // /seller/substores listing route) a page at a time.
  const [substoreQuery, setSubstoreQuery] = useState("")
  const [substorePickerOpen, setSubstorePickerOpen] = useState(false)

  const getSubstoreKey = (index, prev) => {
    if (!substorePickerOpen) return null // lazy: don't fetch until opened
    if (prev && (prev.rows?.length ?? 0) < SUBSTORE_PAGE_SIZE) return null
    const params = new URLSearchParams({ page: String(index + 1), limit: String(SUBSTORE_PAGE_SIZE) })
    if (substoreQuery) params.set("q", substoreQuery)
    return `/seller/substores/options?${params.toString()}`
  }
  const {
    data: substorePages,
    size: substoreSize,
    setSize: setSubstoreSize,
    isLoading: substorePickerLoading,
    isValidating: substoreValidating,
  } = useSWRInfinite(getSubstoreKey, fetcher, {
    revalidateOnFocus: false,
    revalidateFirstPage: false,
    shouldRetryOnError: false,
  })

  const substoreRows = (substorePages ?? []).flatMap((p) => p?.rows ?? [])
  const substoreTotal = substorePages?.[0]?.total ?? 0
  const pickerSubstoreOptions = substoreRows.map((s) => ({ value: String(s._id), label: s.name }))
  const substoreHasMore = substoreRows.length < substoreTotal
  const substoreLoadingMore = substoreValidating && substorePages && substoreSize > substorePages.length

  // Resolve labels for already-selected ids (edit mode) so chips aren't blank
  // before the paged list has scrolled far enough to include them.
  const { data: selectedSubstoreData, isLoading: selectedSubstoreLoading } = useSWR(
    open && form.substoreIds.length ? `/seller/substores/options?ids=${form.substoreIds.join(",")}` : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const substoreOptions = useMemo(() => {
    const byValue = new Map()
    for (const s of selectedSubstoreData?.rows ?? []) byValue.set(String(s._id), { value: String(s._id), label: s.name })
    for (const o of pickerSubstoreOptions) byValue.set(o.value, o)
    return [...byValue.values()]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubstoreData, substoreRows.length])

  const substoreLoading = substorePickerLoading || (form.substoreIds.length > 0 && selectedSubstoreLoading)

  useEffect(() => {
    if (!open) return
    if (!couponId) {
      setForm({ ...EMPTY_FORM })
      return
    }
    let cancelled = false
    setLoading(true)
    api
      .get(`/seller/coupons/${couponId}`)
      .then((res) => {
        if (!cancelled) setForm(docToForm(res?.coupon ?? res))
      })
      .catch((err) => {
        toast.error(err.message)
        onOpenChange(false)
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, couponId])

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function addCondition() {
    set("conditions", [...form.conditions, { type: "category", operator: "equal", valueIds: [] }])
  }

  function updateCondition(index, next) {
    set("conditions", form.conditions.map((c, i) => (i === index ? next : c)))
  }

  function removeCondition(index) {
    set("conditions", form.conditions.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!form.code.trim()) {
      toast.error("Coupon code is required")
      return
    }
    if (!form.amount) {
      toast.error("Discount amount is required")
      return
    }
    if (!form.startDate || !form.endDate) {
      toast.error("Start and end dates are required")
      return
    }
    setSaving(true)
    try {
      const payload = formToPayload(form)
      if (isEdit) {
        await api.patch(`/seller/coupons/${couponId}`, payload)
        toast.success("Coupon updated")
      } else {
        await api.post("/seller/coupons", payload)
        toast.success("Coupon created")
      }
      onSaved?.()
      onOpenChange(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="flex-row items-start justify-between gap-2 space-y-0 border-b border-border px-6 py-4">
          <div>
            <SheetTitle>{isEdit ? "Edit coupon" : "Add coupon"}</SheetTitle>
            <SheetDescription>
              A discount code shoppers can apply at checkout, with optional limits and eligibility conditions.
            </SheetDescription>
          </div>
          {isEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 bg-transparent"
              onClick={() => setUsageOpen(true)}
            >
              <Users className="size-3.5" aria-hidden="true" />
              Usage
            </Button>
          )}
        </SheetHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading coupon" />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Code *" htmlFor="coupon-code" hint="Shoppers type this at checkout. Stored uppercase.">
                <Input
                  id="coupon-code"
                  value={form.code}
                  onChange={(e) => set("code", e.target.value)}
                  placeholder="e.g. WELCOME10"
                  className="h-9 uppercase"
                />
              </Field>
              <Field label="Discount type" htmlFor="coupon-discount-type">
                <Select value={form.discountType} onValueChange={(v) => set("discountType", v)}>
                  <SelectTrigger id="coupon-discount-type" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISCOUNT_TYPES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field
              label="Amount *"
              htmlFor="coupon-amount"
              hint={form.discountType === "percentage" ? "Percent off, up to 100." : "Flat amount off, in your store currency."}
            >
              <Input
                id="coupon-amount"
                type="number"
                min="0"
                max={form.discountType === "percentage" ? 100 : undefined}
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder={form.discountType === "percentage" ? "e.g. 10" : "e.g. 500"}
                className="h-9"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Start date *" htmlFor="coupon-start">
                <Input
                  id="coupon-start"
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                  className="h-9"
                />
              </Field>
              <Field label="End date *" htmlFor="coupon-end">
                <Input
                  id="coupon-end"
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => set("endDate", e.target.value)}
                  className="h-9"
                />
              </Field>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Active</span>
                <span className="text-xs text-muted-foreground">Inactive coupons can't be redeemed even within their date window.</span>
              </div>
              <Switch
                checked={form.status === "active"}
                onCheckedChange={(v) => set("status", v ? "active" : "inactive")}
                aria-label="Toggle active status"
              />
            </div>

            <Separator />

            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground">Limits</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Total uses" htmlFor="coupon-usage-limit" hint="Leave blank for unlimited.">
                  <Input
                    id="coupon-usage-limit"
                    type="number"
                    min="1"
                    value={form.usageLimit}
                    onChange={(e) => set("usageLimit", e.target.value)}
                    placeholder="Unlimited"
                    className="h-9"
                  />
                </Field>
                <Field label="Uses per shopper" htmlFor="coupon-usage-limit-per-user" hint="Leave blank for unlimited.">
                  <Input
                    id="coupon-usage-limit-per-user"
                    type="number"
                    min="1"
                    value={form.usageLimitPerUser}
                    onChange={(e) => set("usageLimitPerUser", e.target.value)}
                    placeholder="Unlimited"
                    className="h-9"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Minimum cart total" htmlFor="coupon-min-purchase" hint="Leave blank for no minimum.">
                  <Input
                    id="coupon-min-purchase"
                    type="number"
                    min="0"
                    value={form.minPurchaseAmount}
                    onChange={(e) => set("minPurchaseAmount", e.target.value)}
                    placeholder="None"
                    className="h-9"
                  />
                </Field>
                {form.discountType === "percentage" && (
                  <Field label="Max discount cap" htmlFor="coupon-max-discount" hint="Caps the payout on a percentage coupon.">
                    <Input
                      id="coupon-max-discount"
                      type="number"
                      min="0"
                      value={form.maxDiscountAmount}
                      onChange={(e) => set("maxDiscountAmount", e.target.value)}
                      placeholder="None"
                      className="h-9"
                    />
                  </Field>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-4">
              <Field label="Substores" hint="Leave empty to apply across all substores.">
                <MultiSelect
                  options={substoreOptions}
                  selected={form.substoreIds}
                  onChange={(v) => set("substoreIds", v)}
                  placeholder="All substores"
                  emptyText="No substores found"
                  onOpenChange={(o) => o && setSubstorePickerOpen(true)}
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
            </div>

            <Separator />

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Eligibility conditions</h3>
              </div>
              <p className="text-xs text-muted-foreground/70">
                Restrict this coupon to carts containing (or excluding) specific categories, collections, or brands. Leave empty to apply to any cart.
              </p>
              {form.conditions.map((condition, index) => (
                <ConditionRow
                  key={index}
                  condition={condition}
                  onChange={(next) => updateCondition(index, next)}
                  onRemove={() => removeCondition(index)}
                />
              ))}
              <Button type="button" variant="outline" size="sm" className="w-fit bg-transparent" onClick={addCondition}>
                <Plus className="size-3.5" aria-hidden="true" />
                Add condition
              </Button>
            </div>
          </div>
        )}

        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {isEdit ? "Save changes" : "Create coupon"}
          </Button>
        </SheetFooter>
      </SheetContent>

      {isEdit && (
        <CouponUsageDialog open={usageOpen} onOpenChange={setUsageOpen} couponId={couponId} couponCode={form.code} />
      )}
    </Sheet>
  )
}