"use client"

import { useEffect, useRef, useState } from "react"
  import { ImageIcon, Loader2, Plus, Trash2, Upload } from "lucide-react"
  import { cn } from "@/lib/utils"
import { toast } from "sonner"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { MultiSelect } from "@/components/hub/multi-select"
import { api } from "@/lib/api"
import {
  COUNTRIES,
  CURRENCIES,
  CURRENCY_SYMBOL_BY_CODE,
  LANGUAGES,
  PAYMENT_METHODS,
  RTL_LANGUAGES,
  SOCIAL_PROVIDERS,
  SUBSTORE_STATUSES,
  TIMEZONES,
} from "@/lib/store-data"

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }))
const LANGUAGE_OPTIONS = LANGUAGES.map((l) => ({ value: l.code, label: l.name }))

const EMPTY_FORM = {
  // Basic
  name: "",
  alias: "",
  sortOrder: 0,
  status: "active",
  // Geo & routing
  countryCodes: [],
  isDefault: false,
  domain: "",
  pathPrefix: "",
  geoRedirectMode: "off",
  timezone: "",
  // Visibility
  visibilityMode: "all",
  includedTags: [],
  excludedTags: [],
  hideOutOfStock: false,
  defaultProductStatus: "active",
  // Commerce
  currency: "",
  currencySymbolPosition: "before",
  currencyDisplay: "symbol",
  decimalPrecision: 2,
  pricingMode: "shared",
  exchangeRate: "",
  roundingRule: "none",
  taxInclusive: false,
  taxRate: "",
  paymentMethods: [],
  minOrderValue: "",
  freeShippingThreshold: "",
  // Localization
  defaultLanguage: "",
  supportedLanguages: [],
  rtl: false,
  weightUnit: "kg",
  dimensionUnit: "cm",
  // Branding settings
  storeName: "",
  pageTitle: "",
  customizedTheme: false,
  description: "",
  contactEmail: "",
  contactPhone: "",
  defaultCountryOfOrigin: "",
  copyright: "",
  socialLinks: [],
  metaTags: [],
  // SEO & analytics
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  seoRobots: "",
  gaId: "",
  gtmId: "",
  metaPixelId: "",
  // Operations
  maintenanceMode: false,
  launchDate: "",
  opsEmail: "",
  opsPhone: "",
  opsWhatsapp: "",
  opsAddress: "",
}

function docToForm(doc) {
  if (!doc) return { ...EMPTY_FORM }
  return {
    name: doc.name ?? "",
    alias: doc.alias ?? "",
    sortOrder: doc.sortOrder ?? 0,
    status: doc.status ?? "active",
    countryCodes: doc.countryCodes ?? [],
    isDefault: Boolean(doc.isDefault),
    domain: doc.domains?.[0]?.host ?? "",
    pathPrefix: doc.pathPrefix ?? "",
    geoRedirectMode: doc.geoRedirectMode ?? "off",
    timezone: doc.timezone ?? "",
    visibilityMode: doc.visibility?.mode ?? "all",
    includedTags: doc.visibility?.includedTags ?? [],
    excludedTags: doc.visibility?.excludedTags ?? [],
    hideOutOfStock: Boolean(doc.visibility?.hideOutOfStock),
    defaultProductStatus: doc.visibility?.defaultProductStatus ?? "active",
    currency: doc.currency ?? "",
    currencySymbolPosition: doc.currencySymbolPosition ?? "before",
    currencyDisplay: doc.currencyDisplay ?? "symbol",
    decimalPrecision: doc.decimalPrecision ?? 2,
    pricingMode: doc.pricingMode ?? "shared",
    exchangeRate: doc.exchangeRate ?? "",
    roundingRule: doc.roundingRule ?? "none",
    taxInclusive: Boolean(doc.taxInclusive),
    taxRate: doc.taxRate ?? "",
    paymentMethods: doc.allowedPaymentMethods ?? [],
    minOrderValue: doc.minOrderValue ?? "",
    freeShippingThreshold: doc.freeShippingThreshold ?? "",
    defaultLanguage: doc.defaultLanguage ?? "",
    supportedLanguages: doc.supportedLanguages ?? [],
    rtl: Boolean(doc.rtl),
    weightUnit: doc.weightUnit ?? "kg",
    dimensionUnit: doc.dimensionUnit ?? "cm",
    storeName: doc.settings?.storeName ?? "",
    pageTitle: doc.settings?.pageTitle ?? "",
    customizedTheme: Boolean(doc.settings?.customizedTheme),
    description: doc.settings?.description ?? "",
    contactEmail: doc.settings?.contactEmail ?? "",
    contactPhone: doc.settings?.contactPhone ?? "",
    defaultCountryOfOrigin: doc.settings?.defaultCountryOfOrigin ?? "",
    copyright: doc.settings?.copyright ?? "",
    socialLinks: doc.settings?.socialLinks ?? [],
    metaTags: doc.settings?.metaTags ?? [],
    seoTitle: doc.seo?.title ?? "",
    seoDescription: doc.seo?.description ?? "",
    seoKeywords: (doc.seo?.keywords ?? []).join(", "),
    seoRobots: doc.seo?.robots ?? "",
    gaId: doc.analytics?.gaId ?? "",
    gtmId: doc.analytics?.gtmId ?? "",
    metaPixelId: doc.analytics?.metaPixelId ?? "",
    maintenanceMode: Boolean(doc.maintenanceMode),
    launchDate: doc.launchDate ? String(doc.launchDate).slice(0, 10) : "",
    opsEmail: doc.contact?.email ?? "",
    opsPhone: doc.contact?.phone ?? "",
    opsWhatsapp: doc.contact?.whatsapp ?? "",
    opsAddress: doc.contact?.address ?? "",
  }
}

function num(value) {
  if (value === "" || value === null || value === undefined) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

// Builds a sample price string, e.g. "₹ 99.00", "INR 99.00", or "₹ 99.00 INR",
// honoring the currency display mode and symbol position.
function previewPrice(currency, display, position) {
  const symbol = CURRENCY_SYMBOL_BY_CODE[currency] || currency
  const amount = "99.00"
  if (display === "code") {
    return position === "after" ? `${amount} ${currency}` : `${currency} ${amount}`
  }
  if (display === "both") {
    return position === "after" ? `${amount} ${symbol} ${currency}` : `${symbol} ${amount} ${currency}`
  }
  // symbol (default)
  return position === "after" ? `${amount} ${symbol}` : `${symbol} ${amount}`
}

function formToPayload(form, images) {
  const settings = {
    storeName: form.storeName,
    pageTitle: form.pageTitle,
    customizedTheme: form.customizedTheme,
    description: form.description,
    contactEmail: form.contactEmail,
    contactPhone: form.contactPhone,
    defaultCountryOfOrigin: form.defaultCountryOfOrigin,
    defaultCurrency: form.currency || undefined,
    defaultLanguage: form.defaultLanguage || undefined,
    copyright: form.copyright,
    socialLinks: form.socialLinks.filter((r) => r.provider || r.link),
    metaTags: form.metaTags.filter((r) => r.name || r.content),
    languages: form.supportedLanguages,
  }
  // Base64 slots only when a new file was picked in this session.
  if (images.logo) settings.logoBase64 = images.logo
  if (images.mobileLogo) settings.mobileLogoBase64 = images.mobileLogo
  if (images.favicon) settings.faviconBase64 = images.favicon

  return {
    name: form.name.trim(),
    alias: form.alias.trim(),
    sortOrder: num(form.sortOrder) ?? 0,
    status: form.status,
    countryCodes: form.countryCodes,
    isDefault: form.isDefault,
    domains: form.domain.trim() ? [{ host: form.domain.trim(), isPrimary: true }] : [],
    pathPrefix: form.pathPrefix,
    geoRedirectMode: form.geoRedirectMode,
    timezone: form.timezone,
    visibility: {
      mode: form.visibilityMode,
      includedTags: form.includedTags,
      excludedTags: form.excludedTags,
      hideOutOfStock: form.hideOutOfStock,
      defaultProductStatus: form.defaultProductStatus,
    },
    currency: form.currency,
    currencySymbolPosition: form.currencySymbolPosition,
    currencyDisplay: form.currencyDisplay,
    decimalPrecision: num(form.decimalPrecision) ?? 2,
    pricingMode: form.pricingMode,
    exchangeRate: num(form.exchangeRate) ?? null,
    roundingRule: form.roundingRule,
    taxInclusive: form.taxInclusive,
    taxRate: num(form.taxRate) ?? null,
    allowedPaymentMethods: form.paymentMethods,
    minOrderValue: num(form.minOrderValue) ?? null,
    freeShippingThreshold: num(form.freeShippingThreshold) ?? null,
    defaultLanguage: form.defaultLanguage,
    supportedLanguages: form.supportedLanguages,
    rtl: form.rtl,
    weightUnit: form.weightUnit,
    dimensionUnit: form.dimensionUnit,
    settings,
    seo: {
      title: form.seoTitle,
      description: form.seoDescription,
      keywords: form.seoKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      robots: form.seoRobots,
    },
    analytics: { gaId: form.gaId, gtmId: form.gtmId, metaPixelId: form.metaPixelId },
    maintenanceMode: form.maintenanceMode,
    launchDate: form.launchDate ? new Date(form.launchDate).toISOString() : null,
    contact: { email: form.opsEmail, phone: form.opsPhone, whatsapp: form.opsWhatsapp, address: form.opsAddress },
  }
}

function SectionHeading({ children }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</h3>
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

function ImageUpload({ label, hint, currentUrl, pending, onPick }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const preview = pending || currentUrl

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
    reader.onload = () => onPick(reader.result)
    reader.readAsDataURL(file)
  }

  function handleFile(e) {
    readFile(e.target.files?.[0])
    e.target.value = ""
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    readFile(e.dataTransfer.files?.[0])
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40",
        )}
      >
        {preview ? (
          <>
            <img
              src={preview || "/placeholder.svg"}
              alt={`${label} preview`}
              className="max-h-24 max-w-full object-contain"
            />
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                <Upload className="size-3.5" aria-hidden="true" />
                Replace
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onPick(null)
                }}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Remove
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <ImageIcon className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Click to upload</span> or drag &amp; drop
            </p>
            <p className="text-xs text-muted-foreground/70">PNG, JPG, WEBP or SVG (max 2 MB)</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="sr-only"
          onChange={handleFile}
          aria-label={`Upload ${label}`}
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  )
}

function RepeatableRows({ rows, onChange, columns, addLabel }) {
  function update(index, key, value) {
    onChange(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)))
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          {columns.map((col) =>
            col.options ? (
              <Select key={col.key} value={row[col.key] ?? ""} onValueChange={(v) => update(index, col.key, v)}>
                <SelectTrigger className="h-9 w-36 shrink-0">
                  <SelectValue placeholder={col.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {col.options.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                key={col.key}
                value={row[col.key] ?? ""}
                onChange={(e) => update(index, col.key, e.target.value)}
                placeholder={col.placeholder}
                className="h-9"
              />
            ),
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
            aria-label="Remove row"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit bg-transparent"
        onClick={() => onChange([...rows, Object.fromEntries(columns.map((c) => [c.key, ""]))])}
      >
        <Plus className="size-3.5" aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  )
}

/**
 * Create / edit Substore in a Sheet side panel.
 * All API calls run right here against the Express backend via the shared
 * `api` client — no server actions anywhere.
 */
export function SubstoreFormSheet({ open, onOpenChange, substoreId, onSaved }) {
  const isEdit = Boolean(substoreId)
  const [form, setForm] = useState(EMPTY_FORM)
  const [images, setImages] = useState({}) // freshly picked base64 slots
  const [currentDoc, setCurrentDoc] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState("general")

  // Load the full document when editing — the list only carries table columns.
  useEffect(() => {
    if (!open) return
    setTab("general")
    setImages({})
    if (!substoreId) {
      setForm({ ...EMPTY_FORM })
      setCurrentDoc(null)
      return
    }
    let cancelled = false
    setLoading(true)
    api
      .get(`/seller/substores/${substoreId}`)
      .then(({ substore }) => {
        if (cancelled) return
        setCurrentDoc(substore)
        setForm(docToForm(substore))
      })
      .catch((err) => toast.error(err.message || "Failed to load substore"))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [open, substoreId])

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))
  const setInput = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  // Picking an RTL default language auto-enables the RTL toggle (still overridable).
  function pickLanguage(code) {
    setForm((f) => ({ ...f, defaultLanguage: code, rtl: RTL_LANGUAGES.has(code) ? true : f.rtl }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error("Name is required")
      setTab("general")
      return
    }
    setSaving(true)
    try {
      const payload = formToPayload(form, images)
      if (isEdit) {
        await api.patch(`/seller/substores/${substoreId}`, payload)
        toast.success("Substore updated")
      } else {
        await api.post("/seller/substores", payload)
        toast.success("Substore created")
      }
      onOpenChange(false)
      onSaved?.()
    } catch (err) {
      toast.error(err.message || "Failed to save substore")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle>{isEdit ? "Edit substore" : "Add substore"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update this country store's catalog, branding, and localization."
              : "A substore is a country/region storefront under your main store. Only the name is required."}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading substore" />
          </div>
        ) : (
          <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
            <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">
              <div className="border-b border-border px-6 pt-3">
                <TabsList variant="line" className="h-auto w-full justify-start gap-6 bg-transparent p-0">
                  {[
                    ["general", "General"],
                    ["commerce", "Commerce & Localization"],
                    ["branding", "Branding & SEO"],
                  ].map(([value, label]) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className="flex-none rounded-none border-transparent px-1 pb-2.5 text-sm text-muted-foreground shadow-none after:bottom-[-1px] after:bg-primary hover:text-foreground focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=active]:border-transparent data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent"
                    >
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                {/* ------------------------------------------------ GENERAL */}
                <TabsContent value="general" className="mt-0 flex flex-col gap-4">
                  <SectionHeading>Basics</SectionHeading>
                  <Field label="Name *" htmlFor="ss-name">
                    <Input id="ss-name" value={form.name} onChange={setInput("name")} placeholder="e.g. Oman" required maxLength={120} />
                  </Field>
                  <Field label="Alias" htmlFor="ss-alias" hint="URL slug — auto-generated from the name when left blank.">
                    <Input id="ss-alias" value={form.alias} onChange={setInput("alias")} placeholder="e.g. oman" maxLength={140} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Sort order" htmlFor="ss-sort">
                      <Input id="ss-sort" type="number" min={0} value={form.sortOrder} onChange={setInput("sortOrder")} />
                    </Field>
                    <Field label="Status">
                      <Select value={form.status} onValueChange={set("status")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBSTORE_STATUSES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>

                  <Separator className="my-2" />
                  <SectionHeading>Geo &amp; Routing</SectionHeading>
                  <Field label="Countries" hint="Countries this substore serves. Matching rules live in Store Variants.">
                    <MultiSelect
                      options={COUNTRY_OPTIONS}
                      selected={form.countryCodes}
                      onChange={set("countryCodes")}
                      placeholder="Select countries"
                    />
                  </Field>
                  <Field
                    label="Domain"
                    htmlFor="ss-domain"
                    hint='Dedicated domain or subdomain for this substore, e.g. "om.mystore.com". Leave blank to use the path prefix.'
                  >
                    <Input
                      id="ss-domain"
                      value={form.domain}
                      onChange={setInput("domain")}
                      placeholder="om.mystore.com"
                      maxLength={253}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Path prefix" htmlFor="ss-path" hint='e.g. "/oman" when routing by path.'>
                      <Input id="ss-path" value={form.pathPrefix} onChange={setInput("pathPrefix")} placeholder="/oman" maxLength={60} />
                    </Field>
                    <Field label="Geo redirect mode">
                      <Select value={form.geoRedirectMode} onValueChange={set("geoRedirectMode")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="off">Off</SelectItem>
                          <SelectItem value="suggest">Suggest (banner)</SelectItem>
                          <SelectItem value="auto">Auto-redirect</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field label="Timezone">
                    <Select value={form.timezone || "none"} onValueChange={(v) => set("timezone")(v === "none" ? "" : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Default substore</p>
                      <p className="text-xs text-muted-foreground">Fallback when no country matches. Only one can be default.</p>
                    </div>
                    <Switch checked={form.isDefault} onCheckedChange={set("isDefault")} aria-label="Default substore" />
                  </div>

                  <Separator className="my-2" />
                  <SectionHeading>Visibility</SectionHeading>
                  <Field label="Catalog mode" hint="Broad rules only — per-product overrides come later from the product editor.">
                    <Select value={form.visibilityMode} onValueChange={set("visibilityMode")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Show all products</SelectItem>
                        <SelectItem value="include">Only include matching</SelectItem>
                        <SelectItem value="exclude">Exclude matching</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  {form.visibilityMode === "include" && (
                    <Field label="Included tags" hint="Comma-free chips — press Enter in search to add.">
                      <MultiSelect
                        options={form.includedTags.map((t) => ({ value: t, label: t }))}
                        selected={form.includedTags}
                        onChange={set("includedTags")}
                        placeholder="No tags yet — type below"
                      />
                      <TagInput onAdd={(t) => set("includedTags")([...new Set([...form.includedTags, t])])} />
                    </Field>
                  )}
                  {form.visibilityMode === "exclude" && (
                    <Field label="Excluded tags">
                      <MultiSelect
                        options={form.excludedTags.map((t) => ({ value: t, label: t }))}
                        selected={form.excludedTags}
                        onChange={set("excludedTags")}
                        placeholder="No tags yet — type below"
                      />
                      <TagInput onAdd={(t) => set("excludedTags")([...new Set([...form.excludedTags, t])])} />
                    </Field>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Default product status">
                      <Select value={form.defaultProductStatus} onValueChange={set("defaultProductStatus")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="hidden">Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 text-sm text-foreground">
                        <Checkbox checked={form.hideOutOfStock} onCheckedChange={(v) => set("hideOutOfStock")(v === true)} />
                        Hide out-of-stock products
                      </label>
                    </div>
                  </div>
                </TabsContent>

                {/* ------------------------------------------------ COMMERCE & LOCALIZATION */}
                <TabsContent value="commerce" className="mt-0 flex flex-col gap-4">
                  <SectionHeading>Commerce</SectionHeading>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field label="Currency">
                      <Select value={form.currency || "none"} onValueChange={(v) => set("currency")(v === "none" ? "" : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-64">
                          <SelectItem value="none">None</SelectItem>
                          {CURRENCIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                              <span className="ml-1 text-muted-foreground">
                                {CURRENCY_SYMBOL_BY_CODE[c] ? `— ${CURRENCY_SYMBOL_BY_CODE[c]}` : ""}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Symbol position">
                      <Select value={form.currencySymbolPosition} onValueChange={set("currencySymbolPosition")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="before">Before amount</SelectItem>
                          <SelectItem value="after">After amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field
                      label="Currency display"
                      hint={
                        form.currency
                          ? `Preview: ${previewPrice(form.currency, form.currencyDisplay, form.currencySymbolPosition)}`
                          : "How the currency appears next to prices."
                      }
                    >
                      <Select value={form.currencyDisplay} onValueChange={set("currencyDisplay")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="symbol">Symbol only</SelectItem>
                          <SelectItem value="code">Code only</SelectItem>
                          <SelectItem value="both">Symbol + code</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Decimal precision" htmlFor="ss-precision">
                      <Input id="ss-precision" type="number" min={0} max={6} value={form.decimalPrecision} onChange={setInput("decimalPrecision")} />
                    </Field>
                    <Field label="Pricing mode">
                      <Select value={form.pricingMode} onValueChange={set("pricingMode")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shared">Shared base prices</SelectItem>
                          <SelectItem value="perStore">Per-store prices</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Exchange rate" htmlFor="ss-fx" hint="Multiplier from the base currency.">
                      <Input id="ss-fx" type="number" min={0} step="0.0001" value={form.exchangeRate} onChange={setInput("exchangeRate")} placeholder="1.0" />
                    </Field>
                    <Field label="Rounding rule" hint="e.g. Nearest 10 rounds 63.25 to 60 and 67.87 to 70.">
                      <Select value={form.roundingRule} onValueChange={set("roundingRule")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="nearest">Nearest whole</SelectItem>
                          <SelectItem value="up">Round up</SelectItem>
                          <SelectItem value="down">Round down</SelectItem>
                          <SelectItem value="nearest5">Nearest 5</SelectItem>
                          <SelectItem value="nearest10">Nearest 10</SelectItem>
                          <SelectItem value="nearest50">Nearest 50</SelectItem>
                          <SelectItem value="nearest100">Nearest 100</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Min order value" htmlFor="ss-mov">
                      <Input id="ss-mov" type="number" min={0} value={form.minOrderValue} onChange={setInput("minOrderValue")} placeholder="0" />
                    </Field>
                    <Field label="Free shipping threshold" htmlFor="ss-fst">
                      <Input id="ss-fst" type="number" min={0} value={form.freeShippingThreshold} onChange={setInput("freeShippingThreshold")} placeholder="0" />
                    </Field>
                  </div>
                  <Separator className="my-2" />
                  <SectionHeading>Tax &amp; VAT</SectionHeading>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Tax / VAT rate (%)" htmlFor="ss-taxrate" hint="e.g. 5 for UAE VAT.">
                      <Input
                        id="ss-taxrate"
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={form.taxRate}
                        onChange={setInput("taxRate")}
                        placeholder="5"
                      />
                    </Field>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 text-sm text-foreground">
                        <Checkbox checked={form.taxInclusive} onCheckedChange={(v) => set("taxInclusive")(v === true)} />
                        Prices include VAT
                      </label>
                    </div>
                  </div>

                  <Separator className="my-2" />
                  <SectionHeading>Payment Methods</SectionHeading>
                  <Field
                    label="Accepted payment methods"
                    hint="Region-specific gateways shown at checkout. Leave empty to allow all store-level methods."
                  >
                    <MultiSelect
                      options={PAYMENT_METHODS}
                      selected={form.paymentMethods}
                      onChange={set("paymentMethods")}
                      placeholder="Select payment methods"
                    />
                  </Field>

                  <Separator className="my-2" />
                  <SectionHeading>Localization</SectionHeading>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Default language">
                      <Select value={form.defaultLanguage || "none"} onValueChange={(v) => pickLanguage(v === "none" ? "" : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="max-h-64">
                          <SelectItem value="none">None</SelectItem>
                          {LANGUAGES.map((l) => (
                            <SelectItem key={l.code} value={l.code}>
                              {l.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2 text-sm text-foreground">
                        <Switch checked={form.rtl} onCheckedChange={set("rtl")} aria-label="Right-to-left layout" />
                        Right-to-left (RTL)
                      </label>
                    </div>
                  </div>
                  <Field label="Supported languages">
                    <MultiSelect
                      options={LANGUAGE_OPTIONS}
                      selected={form.supportedLanguages}
                      onChange={set("supportedLanguages")}
                      placeholder="Select languages"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Weight unit">
                      <Select value={form.weightUnit} onValueChange={set("weightUnit")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">Kilograms (kg)</SelectItem>
                          <SelectItem value="lb">Pounds (lb)</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Dimension unit">
                      <Select value={form.dimensionUnit} onValueChange={set("dimensionUnit")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cm">Centimeters (cm)</SelectItem>
                          <SelectItem value="in">Inches (in)</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </TabsContent>

                {/* ------------------------------------------------ BRANDING & SEO */}
                <TabsContent value="branding" className="mt-0 flex flex-col gap-4">
                  <SectionHeading>Branding</SectionHeading>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Store name" htmlFor="ss-storename" hint="Display name on the storefront.">
                      <Input id="ss-storename" value={form.storeName} onChange={setInput("storeName")} maxLength={120} />
                    </Field>
                    <Field label="Page title" htmlFor="ss-pagetitle" hint="Browser tabs and search results.">
                      <Input id="ss-pagetitle" value={form.pageTitle} onChange={setInput("pageTitle")} maxLength={200} />
                    </Field>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox checked={form.customizedTheme} onCheckedChange={(v) => set("customizedTheme")(v === true)} />
                    Customized theme for this substore
                  </label>
                  <div className="flex flex-col gap-4">
                    <ImageUpload
                      label="Logo"
                      hint="Storefront logo."
                      currentUrl={currentDoc?.settings?.logoUrl}
                      pending={images.logo}
                      onPick={(b64) => setImages((im) => ({ ...im, logo: b64 }))}
                    />
                    <ImageUpload
                      label="Mobile logo"
                      hint="Logo for mobile devices."
                      currentUrl={currentDoc?.settings?.mobileLogoUrl}
                      pending={images.mobileLogo}
                      onPick={(b64) => setImages((im) => ({ ...im, mobileLogo: b64 }))}
                    />
                    <ImageUpload
                      label="Favicon"
                      hint="Browser tab icon."
                      currentUrl={currentDoc?.settings?.faviconUrl}
                      pending={images.favicon}
                      onPick={(b64) => setImages((im) => ({ ...im, favicon: b64 }))}
                    />
                  </div>
                  <Field label="Description" htmlFor="ss-desc">
                    <Textarea id="ss-desc" value={form.description} onChange={setInput("description")} rows={4} maxLength={5000} placeholder="About this store..." />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Contact email" htmlFor="ss-cemail">
                      <Input id="ss-cemail" type="email" value={form.contactEmail} onChange={setInput("contactEmail")} placeholder="store@example.com" />
                    </Field>
                    <Field label="Contact phone" htmlFor="ss-cphone">
                      <Input id="ss-cphone" value={form.contactPhone} onChange={setInput("contactPhone")} placeholder="+968 ..." maxLength={30} />
                    </Field>
                    <Field label="Default country of origin">
                      <Select
                        value={form.defaultCountryOfOrigin || "none"}
                        onValueChange={(v) => set("defaultCountryOfOrigin")(v === "none" ? "" : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Copyright" htmlFor="ss-copy">
                      <Input id="ss-copy" value={form.copyright} onChange={setInput("copyright")} placeholder="© 2026 My Store" maxLength={300} />
                    </Field>
                  </div>
                  <Separator />
                  <Field label="Social links">
                    <RepeatableRows
                      rows={form.socialLinks}
                      onChange={set("socialLinks")}
                      addLabel="Add social link"
                      columns={[
                        { key: "provider", placeholder: "Provider", options: SOCIAL_PROVIDERS },
                        { key: "link", placeholder: "https://..." },
                      ]}
                    />
                  </Field>
                  <Field label="Meta tags">
                    <RepeatableRows
                      rows={form.metaTags}
                      onChange={set("metaTags")}
                      addLabel="Add meta tag"
                      columns={[
                        { key: "name", placeholder: "Name" },
                        { key: "content", placeholder: "Content" },
                      ]}
                    />
                  </Field>

                  <Separator className="my-2" />
                  <SectionHeading>SEO &amp; Analytics</SectionHeading>
                  <Field label="SEO title" htmlFor="ss-seotitle">
                    <Input id="ss-seotitle" value={form.seoTitle} onChange={setInput("seoTitle")} maxLength={200} />
                  </Field>
                  <Field label="SEO description" htmlFor="ss-seodesc">
                    <Textarea id="ss-seodesc" value={form.seoDescription} onChange={setInput("seoDescription")} rows={3} maxLength={500} />
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Keywords" htmlFor="ss-seokw" hint="Comma-separated.">
                      <Input id="ss-seokw" value={form.seoKeywords} onChange={setInput("seoKeywords")} placeholder="jewelry, gold, oman" />
                    </Field>
                    <Field label="Robots" htmlFor="ss-robots">
                      <Input id="ss-robots" value={form.seoRobots} onChange={setInput("seoRobots")} placeholder="index,follow" maxLength={60} />
                    </Field>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Google Analytics ID" htmlFor="ss-ga">
                      <Input id="ss-ga" value={form.gaId} onChange={setInput("gaId")} placeholder="G-XXXXXXX" maxLength={40} />
                    </Field>
                    <Field label="Google Tag Manager ID" htmlFor="ss-gtm">
                      <Input id="ss-gtm" value={form.gtmId} onChange={setInput("gtmId")} placeholder="GTM-XXXXXXX" maxLength={40} />
                    </Field>
                    <Field label="Meta Pixel ID" htmlFor="ss-pixel">
                      <Input id="ss-pixel" value={form.metaPixelId} onChange={setInput("metaPixelId")} maxLength={40} />
                    </Field>
                  </div>

                  <Separator className="my-2" />
                  <SectionHeading>Operations</SectionHeading>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Maintenance mode</p>
                      <p className="text-xs text-muted-foreground">Temporarily take this substore offline for visitors.</p>
                    </div>
                    <Switch checked={form.maintenanceMode} onCheckedChange={set("maintenanceMode")} aria-label="Maintenance mode" />
                  </div>
                  <Field label="Launch date" htmlFor="ss-launch" hint="Stage the store ahead of a country launch.">
                    <Input id="ss-launch" type="date" value={form.launchDate} onChange={setInput("launchDate")} />
                  </Field>
                  <Separator />
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Support contact</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Email" htmlFor="ss-opsemail">
                      <Input id="ss-opsemail" type="email" value={form.opsEmail} onChange={setInput("opsEmail")} />
                    </Field>
                    <Field label="Phone" htmlFor="ss-opsphone">
                      <Input id="ss-opsphone" value={form.opsPhone} onChange={setInput("opsPhone")} maxLength={30} />
                    </Field>
                    <Field label="WhatsApp" htmlFor="ss-opswa">
                      <Input id="ss-opswa" value={form.opsWhatsapp} onChange={setInput("opsWhatsapp")} maxLength={30} />
                    </Field>
                  </div>
                  <Field label="Address" htmlFor="ss-opsaddr">
                    <Textarea id="ss-opsaddr" value={form.opsAddress} onChange={setInput("opsAddress")} rows={2} maxLength={500} />
                  </Field>
                </TabsContent>
              </div>
            </Tabs>

            <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-6 py-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !form.name.trim()}>
                {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {isEdit ? "Save changes" : "Create substore"}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}

function TagInput({ onAdd }) {
  const [value, setValue] = useState("")
  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key !== "Enter") return
        if (e.nativeEvent.isComposing || e.keyCode === 229) return
        e.preventDefault()
        const tag = value.trim()
        if (tag) {
          onAdd(tag)
          setValue("")
        }
      }}
      placeholder="Type a tag and press Enter"
      className="h-9"
    />
  )
}
