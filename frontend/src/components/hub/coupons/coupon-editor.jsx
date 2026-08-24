"use client"

import { useEffect,useMemo, useState } from "react"
import { Loader2, Save, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CouponConditionsBuilder } from "./coupon-conditions-builder"
import { useCoupon, useCouponMutations } from "./use-coupons"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { MultiSelect } from "../multi-select"
import useSWR from "swr"
import useSWRInfinite from "swr/infinite"
import { api, fetcher } from "@/lib/api"


const EMPTY_FORM = {
  code: "",
  name: "",
  description: "",
  discountType: "percentage", // "percentage" | "fixed"
  amount: "",
  maxDiscount: "",
  minOrderAmount: "",
  conditions: [],
  isPrivate: false,
  enabled: true,
  maxUsage: "",
  maxUsagePerUser: "",
  startDate: "",
  endDate: "",
  substoreIds: [], 
}

function num(value, fallback) {
  if (value === "" || value === null || value === undefined) return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function toDateTimeInput(value) {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toIsoOrNull(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function docToForm(doc) {
  if (!doc) return EMPTY_FORM
  return {
    code: doc.code ?? "",
    name: doc.name ?? "",
    description: doc.description ?? "",
    discountType: doc.discountType ?? "percentage",
    amount: doc.amount ?? "",
    maxDiscount: doc.maxDiscount ?? "",
    minOrderAmount: doc.minOrderAmount ?? "", 
    conditions: doc.conditions ?? [],
    isPrivate: Boolean(doc.isPrivate),
    enabled: doc.enabled !== false,
    maxUsage: doc.maxUsage ?? "",
    maxUsagePerUser: doc.maxUsagePerUser ?? "",
    startDate: toDateTimeInput(doc.startDate),
    endDate: toDateTimeInput(doc.endDate),
    substoreIds: (doc.substoreIds ?? []).map(String), 
  }
}

function formToPayload(form) {
  return {
    code: form.code.trim(),
    name: form.name.trim() || undefined,
    description: form.description.trim() || undefined,
    discountType: form.discountType,
    amount: num(form.amount, 0),
    maxDiscount: form.discountType === "percentage" && form.maxDiscount !== "" ? num(form.maxDiscount, null) : null,
    minOrderAmount: form.minOrderAmount === "" ? null : num(form.minOrderAmount, null),
    conditions: form.conditions,
    isPrivate: form.isPrivate,
    enabled: form.enabled,
    maxUsage: form.maxUsage === "" ? null : num(form.maxUsage, null),
    maxUsagePerUser: form.maxUsagePerUser === "" ? null : num(form.maxUsagePerUser, null),
    startDate: toIsoOrNull(form.startDate),
    endDate: toIsoOrNull(form.endDate),
    substoreIds: form.substoreIds,
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

export function CouponEditor({ couponId, onSaved, onCancel }) {
  const isEdit = Boolean(couponId)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [saving, setSaving] = useState(false)

  const { coupon, error: detailError, isLoading: detailLoading } = useCoupon(couponId)
  const { save } = useCouponMutations()
  const loading = isEdit && detailLoading

   const SUBSTORE_PAGE_SIZE = 5
  const [substoreQuery, setSubstoreQuery] = useState("")
  const [substorePickerOpen, setSubstorePickerOpen] = useState(false)
  const getSubstoreKey = (index, prev) => {
    if (!substorePickerOpen) return null
    if (prev && prev.rows.length < SUBSTORE_PAGE_SIZE) return null
    const params = new URLSearchParams({ page: String(index + 1), limit: String(SUBSTORE_PAGE_SIZE) })
    if (substoreQuery) params.set("q", substoreQuery)
    return `/seller/coupons/options/substores?${params.toString()}`
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

  const initialSubstoreIds = useMemo(() => (coupon?.substoreIds ?? []).map(String), [coupon])
  const { data: selectedSubstoreData } = useSWR(
    initialSubstoreIds.length ? `/seller/coupons/options/substores?ids=${initialSubstoreIds.join(",")}` : null,
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

  const setInput = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  useEffect(() => {
    if (detailError) toast.error(detailError.message || "Failed to load coupon")
  }, [detailError])

  useEffect(() => {
    if (!coupon) return
    const next = docToForm(coupon)
    setForm(next)
    setShowAdvanced(Boolean(next.maxUsage || next.maxUsagePerUser || next.startDate || next.endDate || next.maxDiscount || next.minOrderAmount))
  }, [coupon])

  async function submit(e) {
    e.preventDefault()
    if (!form.code.trim()) {
      toast.error("Coupon code is required")
      return
    }
    const amt = Number(form.amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a discount amount greater than 0")
      return
    }
    if (form.discountType === "percentage" && amt > 100) {
      toast.error("Percentage cannot exceed 100")
      return
    }
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      toast.error("End date must be after start date")
      return
    }
    setSaving(true)
    try {
      await save({ id: isEdit ? couponId : undefined, body: formToPayload(form) })
      toast.success(isEdit ? "Coupon updated" : "Coupon created")
      onSaved?.()
    } catch (err) {
      toast.error(err.message || "Failed to save coupon")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading coupon" />
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="h-full flex flex-col max-h-screen">
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground md:text-xl">
          Coupons <span className="text-muted-foreground">/ {isEdit ? "Edit" : "Add"}</span>
        </h2>
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={saving || !form.code.trim()}>
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            Save
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
            <X className="size-4" aria-hidden="true" /> Cancel
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1  max-h-[70vh] ">
        <div className="px-6 py-6 space-y-4">

        <Field label="Coupon Code" htmlFor="cpn-code" required hint="Customers enter this at checkout. Stored uppercase.">
          <Input
            id="cpn-code"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            placeholder="e.g. DIWALI20"
            required
            maxLength={50}
            className="font-mono"
            aria-required="true"
          />
        </Field>

        <Field label="Name" htmlFor="cpn-name">
          <Input id="cpn-name" value={form.name} onChange={setInput("name")} placeholder="e.g. Diwali Sale" maxLength={160} />
        </Field>

        <Field label="Description" htmlFor="cpn-desc">
          <Input id="cpn-desc" value={form.description} onChange={setInput("description")} placeholder="Short description (optional)" maxLength={500} />
        </Field>

        <Field label="Amount" required>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={form.discountType} onValueChange={set("discountType")}>
              <SelectTrigger className="w-40" aria-label="Discount type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              {form.discountType === "fixed" && <span className="text-sm text-muted-foreground">$</span>}
              <Input
                type="number"
                min={0}
                max={form.discountType === "percentage" ? 100 : undefined}
                step="0.01"
                value={form.amount}
                onChange={setInput("amount")}
                placeholder={form.discountType === "percentage" ? "e.g. 20" : "e.g. 500"}
                className="w-40"
                aria-label="Amount value"
              />
              {form.discountType === "percentage" && <span className="text-sm text-muted-foreground">%</span>}
            </div>
          </div>
        </Field>

      

        <Field label="Conditions" hint="Coupon only applies when every condition is met. Leave empty to apply to any eligible cart.">
          <CouponConditionsBuilder value={form.conditions} onChange={set("conditions")} />
        </Field>

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

        <div className="flex items-center gap-3">
          <Checkbox id="cpn-private" checked={form.isPrivate} onCheckedChange={(v) => set("isPrivate")(Boolean(v))} />
          <Label htmlFor="cpn-private" className="text-sm font-medium text-foreground">Private (not publicly listed)</Label>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox id="cpn-enabled" checked={form.enabled} onCheckedChange={(v) => set("enabled")(Boolean(v))} />
          <Label htmlFor="cpn-enabled" className="text-sm font-medium text-foreground">Enabled</Label>
        </div>

        <div className="flex items-center gap-3">
          <Checkbox id="cpn-advanced" checked={showAdvanced} onCheckedChange={(v) => setShowAdvanced(Boolean(v))} />
          <Label htmlFor="cpn-advanced" className="text-sm font-medium text-foreground">Show advance settings</Label>
        </div>

        {showAdvanced && (
          <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
              {form.discountType === "percentage" && (
          <Field label="Maximum Discount" htmlFor="cpn-maxdiscount" hint="Cap the discount amount. Empty = no cap.">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input id="cpn-maxdiscount" type="number" min={0} step="0.01" value={form.maxDiscount} onChange={setInput("maxDiscount")} placeholder="No cap" className="w-40" />
            </div>
          </Field>
        )}
        <Field label="Minimum Order Amount" htmlFor="cpn-minorder" hint="Cart total must reach this before the coupon applies. Empty = no minimum.">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">$</span>
        <Input id="cpn-minorder" type="number" min={0} step="0.01" value={form.minOrderAmount} onChange={setInput("minOrderAmount")} placeholder="No minimum" className="w-40" />
      </div>
    </Field>
            <Field label="Maximum usage" htmlFor="cpn-maxusage" hint="Total times this coupon can be redeemed. Empty = unlimited.">
              <Input id="cpn-maxusage" type="number" min={0} value={form.maxUsage} onChange={setInput("maxUsage")} placeholder="Unlimited" />
            </Field>
            <Field label="Maximum usage per user" htmlFor="cpn-maxuser" hint="How many times a single customer can redeem it. Empty = unlimited.">
              <Input id="cpn-maxuser" type="number" min={0} value={form.maxUsagePerUser} onChange={setInput("maxUsagePerUser")} placeholder="Unlimited" />
            </Field>
            <Field label="Start Date & Time" htmlFor="cpn-start">
              <Input id="cpn-start" type="datetime-local" value={form.startDate} onChange={setInput("startDate")} />
            </Field>
            <Field label="End Date & Time" htmlFor="cpn-end">
              <Input id="cpn-end" type="datetime-local" value={form.endDate} onChange={setInput("endDate")} />
            </Field>
          </div>
        )}

        {isEdit && coupon && (
             <div className="flex items-center justify-between pt-4 border-t">
              <Label className="text-sm font-medium">Current Usage</Label>
              <Badge  className="text-xs">
                {coupon.currentUsage || 0} times used
              </Badge>
            </div>
        )}
        {isEdit && coupon?.usageByUser && coupon.usageByUser.length > 0 && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Usage By User</Label>
                <Badge variant="secondary">{coupon.usageByUser.length} users</Badge>
              </div>
              <div className="border rounded-md overflow-hidden">
                <div className="flex items-center px-4 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
                  <div className="flex-1">Email</div>
                  <div className="w-20 text-center">Count</div>
                </div>
                <ScrollArea className="max-h-[200px]">
                  {coupon.usageByUser.map((usage, idx) => (
                    <div
                      key={usage._id || idx}
                      className="flex items-center px-4 py-2.5 border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 text-sm truncate">{usage.email || "Unknown"}</div>
                      <div className="w-20 text-center">
                        <Badge variant="outline">{usage.count}</Badge>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          )}
        </div>

      </ScrollArea>
    </form>
  )
}