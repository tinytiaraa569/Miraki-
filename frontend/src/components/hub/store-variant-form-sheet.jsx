"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, ChevronsUpDown, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import useSWRInfinite from "swr/infinite"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
import { MultiSelect } from "@/components/hub/multi-select"
import { api, fetcher } from "@/lib/api"
import { COUNTRIES, CURRENCIES, CURRENCY_SYMBOL_BY_CODE, LANGUAGES } from "@/lib/store-data"
import { cn } from "@/lib/utils"

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }))

const CONDITION_TYPES = [
  { value: "location_countries", label: "Visitor country (geo-IP)" },
  { value: "domain", label: "Domain / host" },
  { value: "path", label: "URL path prefix" },
  { value: "manual", label: "Manual (picker only)" },
]

const EMPTY_FORM = {
  name: "",
  sortOrder: 0,
  status: "active",
  conditionType: "location_countries",
  locationCountries: [],
  domains: [],
  pathPrefix: "",
  substoreId: "",
  themeId: "",
  canvasId: "",
  currency: "",
  language: "",
  rtl: null,
}

function docToForm(doc) {
  if (!doc) return { ...EMPTY_FORM }
  return {
    name: doc.name ?? "",
    sortOrder: doc.sortOrder ?? 0,
    status: doc.status ?? "active",
    conditionType: doc.conditions?.type ?? "location_countries",
    locationCountries: doc.conditions?.locationCountries ?? [],
    domains: doc.conditions?.domains ?? [],
    pathPrefix: doc.conditions?.pathPrefix ?? "",
    substoreId: doc.action?.substoreId ? String(doc.action.substoreId) : "",
    themeId: doc.action?.themeId ?? "",
    canvasId: doc.action?.canvasId ?? "",
    currency: doc.action?.currency ?? "",
    language: doc.action?.language ?? "",
    rtl: typeof doc.action?.rtl === "boolean" ? doc.action.rtl : null,
  }
}

function formToPayload(form) {
  return {
    name: form.name.trim(),
    sortOrder: Number(form.sortOrder) || 0,
    status: form.status,
    conditions: {
      type: form.conditionType,
      locationCountries: form.conditionType === "location_countries" ? form.locationCountries : [],
      domains: form.conditionType === "domain" ? form.domains.filter(Boolean) : [],
      pathPrefix: form.conditionType === "path" ? form.pathPrefix.trim() : "",
    },
    action: {
      substoreId: form.substoreId || null,
      themeId: form.themeId.trim(),
      canvasId: form.canvasId.trim(),
      currency: form.currency,
      language: form.language,
      rtl: form.rtl,
    },
  }
}

/** A single option row in the substore combobox. */
function SubstoreOption({ active, onSelect, label, meta }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent/50",
      )}
    >
      <Check className={cn("size-4 shrink-0", active ? "opacity-100 text-primary" : "opacity-0")} aria-hidden="true" />
      <span className="truncate">{label}</span>
      {meta ? <span className="ml-auto text-xs uppercase text-muted-foreground">{meta}</span> : null}
    </button>
  )
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

/** Simple string-list editor (used for domains). */
function StringListEditor({ values, onChange, placeholder, addLabel }) {
  return (
    <div className="flex flex-col gap-2">
      {values.map((value, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(values.map((v, i) => (i === index ? e.target.value : v)))}
            placeholder={placeholder}
            className="h-9"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onChange(values.filter((_, i) => i !== index))}
            aria-label="Remove entry"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-fit bg-transparent" onClick={() => onChange([...values, ""])}>
        <Plus className="size-3.5" aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  )
}

/**
 * Create / edit a Store Variant (routing rule) in a Sheet.
 * All API calls go straight to the Express backend via the shared client.
 */
export function StoreVariantFormSheet({ open, onOpenChange, variantId, onSaved }) {
  const isEdit = Boolean(variantId)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Substore picker: a Popover combobox with a real scroll container.
  // Fetches 10 at a time and pulls the next 10 only when scrolled near the
  // bottom (server-side search via ?q so large catalogs stay findable).
  const [substoreOpen, setSubstoreOpen] = useState(false)
  const [substoreQuery, setSubstoreQuery] = useState("")
  const SUBSTORE_PAGE_SIZE = 10
  const getSubstoreKey = (pageIndex, previousPageData) => {
    if (!open) return null
    if (previousPageData && previousPageData.rows.length < SUBSTORE_PAGE_SIZE) return null // reached the end
    const qs = new URLSearchParams({ limit: String(SUBSTORE_PAGE_SIZE), page: String(pageIndex + 1) })
    if (substoreQuery.trim()) qs.set("q", substoreQuery.trim())
    return `/seller/substores?${qs.toString()}`
  }
  const {
    data: substorePages,
    size: substoreSize,
    setSize: setSubstoreSize,
    isValidating: substoresLoading,
  } = useSWRInfinite(getSubstoreKey, fetcher, { revalidateOnFocus: false, revalidateFirstPage: false })

  const substores = useMemo(() => (substorePages ?? []).flatMap((p) => p.rows ?? []), [substorePages])
  const substoreTotal = substorePages?.[0]?.total ?? 0
  const hasMoreSubstores = substores.length < substoreTotal
  const selectedSubstore = useMemo(
    () => substores.find((s) => String(s._id) === form.substoreId),
    [substores, form.substoreId],
  )

  // Pull the next page of 10 when the scroll container nears the bottom.
  const handleSubstoreScroll = useCallback(
    (event) => {
      const el = event.currentTarget
      if (!el || !hasMoreSubstores || substoresLoading) return
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
        setSubstoreSize(substoreSize + 1)
      }
    },
    [hasMoreSubstores, substoresLoading, substoreSize, setSubstoreSize],
  )

  useEffect(() => {
    if (!open) return
    if (!variantId) {
      setForm({ ...EMPTY_FORM })
      return
    }
    let cancelled = false
    setLoading(true)
    api
      .get(`/seller/store-variants/${variantId}`)
      .then((res) => {
        // The backend wraps the record as { variant: {...} }. Unwrap it so the
        // form loads the saved conditions/action (countries, substore, currency,
        // language, theme id and canvas id) instead of resetting to blanks.
        if (!cancelled) setForm(docToForm(res?.variant ?? res))
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
  }, [open, variantId])

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    setSaving(true)
    try {
      const payload = formToPayload(form)
      if (isEdit) {
        await api.patch(`/seller/store-variants/${variantId}`, payload)
        toast.success("Store variant updated")
      } else {
        await api.post("/seller/store-variants", payload)
        toast.success("Store variant created")
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
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle>{isEdit ? "Edit store variant" : "Add store variant"}</SheetTitle>
          <SheetDescription>
            A routing rule: when the visitor matches the conditions, apply the action (substore, theme, currency,
            language).
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-20">
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading variant" />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Name *" htmlFor="variant-name">
                <Input
                  id="variant-name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="e.g. Oman"
                  className="h-9"
                />
              </Field>
              <Field label="Sort order" htmlFor="variant-sort" hint="Lower numbers are evaluated first.">
                <Input
                  id="variant-sort"
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => set("sortOrder", e.target.value)}
                  className="h-9"
                />
              </Field>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">Active</span>
                <span className="text-xs text-muted-foreground">Inactive rules are skipped by the resolver.</span>
              </div>
              <Switch
                checked={form.status === "active"}
                onCheckedChange={(v) => set("status", v ? "active" : "inactive")}
                aria-label="Toggle active status"
              />
            </div>

            <Separator />

            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground">Conditions</h3>
              <Field label="Match type" htmlFor="variant-condition-type">
                <Select value={form.conditionType} onValueChange={(v) => set("conditionType", v)}>
                  <SelectTrigger id="variant-condition-type" className="h-9">
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
              </Field>

              {form.conditionType === "location_countries" && (
                <Field label="Countries" hint="Visitors from these countries match this rule.">
                  <MultiSelect
                    options={COUNTRY_OPTIONS}
                    selected={form.locationCountries}
                    onChange={(v) => set("locationCountries", v)}
                    placeholder="Select countries…"
                  />
                </Field>
              )}

              {form.conditionType === "domain" && (
                <Field label="Domains" hint="Exact hostnames, e.g. om.mystore.com">
                  <StringListEditor
                    values={form.domains}
                    onChange={(v) => set("domains", v)}
                    placeholder="om.mystore.com"
                    addLabel="Add domain"
                  />
                </Field>
              )}

              {form.conditionType === "path" && (
                <Field label="Path prefix" htmlFor="variant-path" hint="e.g. /om — matches /om and everything below it.">
                  <Input
                    id="variant-path"
                    value={form.pathPrefix}
                    onChange={(e) => set("pathPrefix", e.target.value)}
                    placeholder="/om"
                    className="h-9"
                  />
                </Field>
              )}

              {form.conditionType === "manual" && (
                <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  Manual variants never auto-match — shoppers pick them from the storefront's store switcher.
                </p>
              )}
            </div>

            <Separator />

            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground">Action</h3>
              <Field label="Substore" htmlFor="variant-substore" hint="Leave empty to stay on the main store and only apply the overrides below.">
                <Popover open={substoreOpen} onOpenChange={setSubstoreOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="variant-substore"
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={substoreOpen}
                      className="h-9 w-full justify-between font-normal"
                    >
                      <span className="truncate">
                        {form.substoreId
                          ? selectedSubstore
                            ? `${selectedSubstore.name}${selectedSubstore.currency ? ` — ${selectedSubstore.currency}` : ""}`
                            : "Current substore"
                          : "Main store (no substore)"}
                      </span>
                      <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-(--radix-popover-trigger-width) p-2" align="start">
                    <Input
                      value={substoreQuery}
                      onChange={(e) => setSubstoreQuery(e.target.value)}
                      placeholder="Search substores..."
                      className="mb-2 h-8"
                    />
                    <div
                      className="max-h-52 overflow-y-auto overscroll-contain"
                      onScroll={handleSubstoreScroll}
                      onWheel={(e) => e.stopPropagation()}
                    >
                      <ul className="flex flex-col gap-0.5">
                        <li>
                          <SubstoreOption
                            active={!form.substoreId}
                            onSelect={() => {
                              set("substoreId", "")
                              setSubstoreOpen(false)
                            }}
                            label="Main store (no substore)"
                          />
                        </li>
                        {substores.map((s) => (
                          <li key={s._id}>
                            <SubstoreOption
                              active={String(s._id) === form.substoreId}
                              onSelect={() => {
                                set("substoreId", String(s._id))
                                setSubstoreOpen(false)
                              }}
                              label={s.name}
                              meta={s.currency || ""}
                            />
                          </li>
                        ))}
                      </ul>
                      {substoresLoading && (
                        <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
                          <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                          Loading…
                        </div>
                      )}
                      {!substoresLoading && substores.length === 0 && (
                        <p className="px-2 py-4 text-center text-sm text-muted-foreground">No substores found</p>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Currency override" htmlFor="variant-currency">
                  <Select value={form.currency || "none"} onValueChange={(v) => set("currency", v === "none" ? "" : v)}>
                    <SelectTrigger id="variant-currency" className="h-9">
                      <SelectValue placeholder="No override" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60">
                      <SelectItem value="none">No override</SelectItem>
                      {CURRENCIES.map((code) => (
                        <SelectItem key={code} value={code}>
                          <span className="mr-1 inline-block w-6 text-muted-foreground">
                            {CURRENCY_SYMBOL_BY_CODE[code] ?? ""}
                          </span>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Language override" htmlFor="variant-language">
                  <Select value={form.language || "none"} onValueChange={(v) => set("language", v === "none" ? "" : v)}>
                    <SelectTrigger id="variant-language" className="h-9">
                      <SelectValue placeholder="No override" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60">
                      <SelectItem value="none">No override</SelectItem>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.code} value={l.code}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Theme ID" htmlFor="variant-theme" hint="Optional custom theme id applied when this rule matches.">
                <Input
                  id="variant-theme"
                  value={form.themeId}
                  onChange={(e) => set("themeId", e.target.value)}
                  placeholder="e.g. 64e6f718e3b119e970f149be"
                  className="h-9"
                />
              </Field>
              <Field
                label="Canvas UI ID"
                htmlFor="variant-canvas"
                hint="Canvas / page-builder UI shown to this substore's or country's visitors."
              >
                <Input
                  id="variant-canvas"
                  value={form.canvasId}
                  onChange={(e) => set("canvasId", e.target.value)}
                  placeholder="e.g. canvas_home_uae"
                  className="h-9"
                />
              </Field>

              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">Force RTL layout</span>
                  <span className="text-xs text-muted-foreground">
                    Off = inherit from the substore / language default.
                  </span>
                </div>
                <Switch
                  checked={form.rtl === true}
                  onCheckedChange={(v) => set("rtl", v ? true : null)}
                  aria-label="Toggle RTL layout"
                />
              </div>
            </div>
          </div>
        )}

        <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {isEdit ? "Save changes" : "Create variant"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
