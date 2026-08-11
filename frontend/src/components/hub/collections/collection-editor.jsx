"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ImageIcon, Loader2, Plus, RefreshCw, Save, Trash2, Upload, X } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"
import useSWRInfinite from "swr/infinite"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { MultiSelect } from "@/components/hub/multi-select"
import { RuleBuilder } from "@/components/hub/collections/rule-builder"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { api, fetcher } from "@/lib/api"
import { imgUrl } from "@/Server"
import { cn } from "@/lib/utils"
import { CATEGORY_SORT_ORDERS, SITEMAP_FREQUENCIES } from "@/lib/store-data"

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i

const EMPTY_FORM = {
  name: "",
  alias: "",
  description: "",
  type: "manual",
  productIdsText: "",
  rules: { match: "all", conditions: [] },
  sortOrder: 0,
  isPublished: true,
  defaultSortOrder: "manual",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  seoCanonicalUrl: "",
  sitemapPriority: 0.5,
  sitemapFrequency: "weekly",
  sitemapDisableForBots: false,
  substoreIds: [],
  facetGroupId: "",
  metafields: [],
}

function docToForm(doc) {
  if (!doc) return EMPTY_FORM
  return {
    name: doc.name ?? "",
    alias: doc.alias ?? "",
    description: doc.description ?? "",
    type: doc.type ?? "manual",
    productIdsText: (doc.productIds ?? []).map(String).join("\n"),
    rules: {
      match: doc.rules?.match ?? "all",
      conditions: (doc.rules?.conditions ?? []).map((c) => ({
        field: c.field,
        operator: c.operator,
        optionKey: c.optionKey ?? null,
        value: c.value ?? "",
      })),
    },
    sortOrder: doc.sortOrder ?? 0,
    isPublished: doc.isPublished !== false,
    defaultSortOrder: doc.defaultSortOrder ?? "manual",
    seoTitle: doc.seo?.title ?? "",
    seoDescription: doc.seo?.description ?? "",
    seoKeywords: (doc.seo?.keywords ?? []).join(", "),
    seoCanonicalUrl: doc.seo?.canonicalUrl ?? "",
    sitemapPriority: doc.sitemap?.priority ?? 0.5,
    sitemapFrequency: doc.sitemap?.frequency ?? "weekly",
    sitemapDisableForBots: Boolean(doc.sitemap?.disableForBots),
    substoreIds: (doc.substoreIds ?? []).map(String),
    facetGroupId: doc.facetGroupId ? String(doc.facetGroupId) : "",
    metafields: (doc.metafields ?? []).map((m) => ({ key: m.key ?? "", value: String(m.value ?? "") })),
  }
}

function num(value, fallback) {
  if (value === "" || value === null || value === undefined) return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

// Parse the manual product-id textarea into a deduped list of valid ObjectIds.
function parseProductIds(text) {
  const ids = text
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => OBJECT_ID_RE.test(s))
  return [...new Set(ids)]
}

function formToPayload(form, images) {
  const facet = form.facetGroupId.trim()
  const payload = {
    name: form.name.trim(),
    alias: form.alias.trim() || undefined,
    description: form.description ?? "",
    images,
    type: form.type,
    sortOrder: num(form.sortOrder, 0),
    isPublished: form.isPublished,
    defaultSortOrder: form.defaultSortOrder,
    seo: {
      title: form.seoTitle.trim(),
      description: form.seoDescription.trim(),
      keywords: form.seoKeywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      canonicalUrl: form.seoCanonicalUrl.trim(),
    },
    sitemap: {
      priority: num(form.sitemapPriority, 0.5),
      frequency: form.sitemapFrequency,
      disableForBots: form.sitemapDisableForBots,
    },
    substoreIds: form.substoreIds,
    facetGroupId: OBJECT_ID_RE.test(facet) ? facet : null,
    metafields: form.metafields
      .filter((m) => m.key.trim())
      .map((m) => ({ key: m.key.trim(), value: m.value, type: "text" })),
  }
  // Only send the membership input relevant to the chosen type.
  if (form.type === "manual") {
    payload.productIds = parseProductIds(form.productIdsText)
    payload.rules = { match: "all", conditions: [] }
  } else {
    payload.rules = {
      match: form.rules.match,
      conditions: form.rules.conditions.map((c) => {
        const out = { field: c.field, operator: c.operator, value: c.value }
        if (c.field === "option") out.optionKey = c.optionKey ?? null
        return out
      }),
    }
    payload.productIds = []
  }
  return payload
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function Field({ label, hint, children, htmlFor, className }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
        </Label>
      )}
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function SectionHeading({ children }) {
  return <h3 className="text-base font-semibold text-foreground">{children}</h3>
}

// Accessible two-option radio for Manual / Dynamic (no radio-group primitive in
// this project — built from buttons with the correct roles).
function TypeRadio({ value, onChange }) {
  const options = [
    { value: "manual", label: "Manual", hint: "Hand-pick and order products." },
    { value: "dynamic", label: "Dynamic", hint: "Auto-include products by rules." },
  ]
  return (
    <div role="radiogroup" aria-label="Collection type" className="grid gap-3 sm:grid-cols-2">
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                active ? "border-primary" : "border-input",
              )}
              aria-hidden="true"
            >
              {active && <span className="size-2 rounded-full bg-primary" />}
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{o.label}</span>
              <span className="text-xs text-muted-foreground">{o.hint}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function ImageUpload({ currentUrl, pending, onPick }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const preview = pending || (currentUrl ? imgUrl(currentUrl) : null)

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

  return (
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
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        readFile(e.dataTransfer.files?.[0])
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40",
      )}
    >
      {preview ? (
        <>
          <img src={preview || "/placeholder.svg"} alt="Collection preview" className="max-h-28 max-w-full object-contain" />
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
          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, AVIF or SVG (max 2 MB)</p>
        </>
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
        aria-label="Upload collection image"
      />
    </div>
  )
}

/**
 * Inline create / edit panel for a Collection. Rendered in the right pane of the
 * collections page. Supports MANUAL (ordered productIds) and DYNAMIC (rule set)
 * types; the type toggle swaps the Products ⇄ Filters section without losing the
 * rest of the form. The parent remounts this with a fresh `key` per selection.
 */
export function CollectionEditor({ collectionId, onSaved, onCancel }) {
  const isEdit = Boolean(collectionId)
  const [form, setForm] = useState(EMPTY_FORM)
  const [images, setImages] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [aliasTouched, setAliasTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [rebuilding, setRebuilding] = useState(false)
  const [tab, setTab] = useState("general")

  // ---- Substore picker (lazy, paged) — same pattern as the brand editor. ----
  const SUBSTORE_PAGE_SIZE = 5
  const [substoreQuery, setSubstoreQuery] = useState("")
  const [substorePickerOpen, setSubstorePickerOpen] = useState(false)
  const getSubstoreKey = (index, prev) => {
    if (!substorePickerOpen) return null
    if (prev && prev.rows.length < SUBSTORE_PAGE_SIZE) return null
    const params = new URLSearchParams({ page: String(index + 1), limit: String(SUBSTORE_PAGE_SIZE) })
    if (substoreQuery) params.set("q", substoreQuery)
    return `/seller/substores/options?${params.toString()}`
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

  const { data: detailData, error: detailError } = useSWR(
    isEdit ? `/seller/collections/${collectionId}` : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const loading = isEdit && !detailData && !detailError

  const initialSubstoreIds = useMemo(
    () => (detailData?.collection?.substoreIds ?? []).map(String),
    [detailData],
  )
  const { data: selectedSubstoreData } = useSWR(
    initialSubstoreIds.length ? `/seller/substores/options?ids=${initialSubstoreIds.join(",")}` : null,
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
    if (detailError) toast.error(detailError.message || "Failed to load collection")
  }, [detailError])

  useEffect(() => {
    const collection = detailData?.collection
    if (!collection) return
    setForm(docToForm(collection))
    setAliasTouched(true)
    setImages((collection.images ?? []).map((i) => ({ url: i.url, dataUrl: null })))
    setSelectedImage(null)
  }, [detailData])

  // ---- Live "N products match" preview for dynamic collections. ------------
  const debouncedRules = useDebouncedValue(form.rules, 400)
  const previewKey =
    form.type === "dynamic" && (debouncedRules.conditions?.length ?? 0) > 0
      ? ["/seller/collections/preview", JSON.stringify(debouncedRules)]
      : null
  const { data: previewData, isValidating: previewLoading } = useSWR(
    previewKey,
    ([url, body]) => api.post(url, { rules: JSON.parse(body) }),
    { revalidateOnFocus: false, shouldRetryOnError: false, keepPreviousData: true },
  )
  const preview =
    form.type === "dynamic" && (form.rules.conditions?.length ?? 0) > 0
      ? { count: previewData?.count ?? 0, pending: Boolean(previewData?.productsPending), loading: previewLoading }
      : null

  const setInput = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  function onNameChange(e) {
    const name = e.target.value
    setForm((f) => ({ ...f, name, alias: aliasTouched ? f.alias : slugify(name) }))
  }
  function onAliasChange(e) {
    setAliasTouched(true)
    setForm((f) => ({ ...f, alias: e.target.value }))
  }

  function handlePick(dataUrl) {
    if (selectedImage === null) {
      if (dataUrl) setImages((imgs) => [...imgs, { url: null, dataUrl }])
      return
    }
    if (dataUrl === null) {
      setImages((imgs) => imgs.filter((_, i) => i !== selectedImage))
      setSelectedImage(null)
    } else {
      setImages((imgs) => imgs.map((img, i) => (i === selectedImage ? { url: null, dataUrl } : img)))
    }
  }

  function removeImageAt(index) {
    setImages((imgs) => imgs.filter((_, i) => i !== index))
    setSelectedImage((sel) => (sel === null ? null : sel === index ? null : sel > index ? sel - 1 : sel))
  }

  function imagesPayload() {
    return images
      .map((img) => (img.dataUrl ? { dataUrl: img.dataUrl } : img.url ? { url: img.url } : null))
      .filter(Boolean)
  }

  function addMetafield() {
    setForm((f) => ({ ...f, metafields: [...f.metafields, { key: "", value: "" }] }))
  }
  function updateMetafield(index, key, value) {
    setForm((f) => ({
      ...f,
      metafields: f.metafields.map((m, i) => (i === index ? { ...m, [key]: value } : m)),
    }))
  }
  function removeMetafield(index) {
    setForm((f) => ({ ...f, metafields: f.metafields.filter((_, i) => i !== index) }))
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
      const payload = formToPayload(form, imagesPayload())
      if (isEdit) {
        await api.patch(`/seller/collections/${collectionId}`, payload)
        toast.success("Collection updated")
      } else {
        await api.post("/seller/collections", payload)
        toast.success("Collection created")
      }
      onSaved?.()
    } catch (err) {
      toast.error(err.message || "Failed to save collection")
    } finally {
      setSaving(false)
    }
  }

  async function rebuildNow() {
    if (!isEdit) return
    setRebuilding(true)
    try {
      const res = await api.post(`/seller/collections/${collectionId}/rebuild`)
      if (res?.reason === "products_pending") {
        toast.info("Membership will build once the Products module is added.")
      } else {
        toast.success(`Rebuilt — ${res?.productCount ?? 0} products`)
      }
      onSaved?.()
    } catch (err) {
      toast.error(err.message || "Failed to rebuild")
    } finally {
      setRebuilding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading collection" />
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground md:text-xl">
          {isEdit ? "Edit Collection" : "Add Collection"}
        </h2>
        <div className="flex items-center gap-2">
          {isEdit && (
            <Button type="button" size="sm" variant="outline" onClick={rebuildNow} disabled={rebuilding || saving}>
              {rebuilding ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="size-4" aria-hidden="true" />
              )}
              Rebuild
            </Button>
          )}
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

      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">
        <div className="border-b border-border px-6 pt-3">
          <TabsList variant="line" className="h-auto w-full justify-start gap-6 bg-transparent p-0">
            {[
              ["general", "General"],
              ["seo", "SEO & Sitemap"],
              ["advanced", "Advanced"],
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

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {/* ---------------------------------------------------- GENERAL */}
          <TabsContent value="general" className="mt-0 flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <SectionHeading>Basic Information</SectionHeading>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Name" htmlFor="col-name">
                  <Input
                    id="col-name"
                    value={form.name}
                    onChange={onNameChange}
                    placeholder="e.g. Summer Collection"
                    required
                    maxLength={160}
                    aria-required="true"
                  />
                </Field>
                <Field label="Alias" htmlFor="col-alias" hint="Only lowercase letters, numbers, and hyphens allowed.">
                  <Input id="col-alias" value={form.alias} onChange={onAliasChange} placeholder="summer-collection" maxLength={200} />
                </Field>
              </div>

              <Field label="Type" hint="Manual = hand-picked products. Dynamic = products matched by filters.">
                <TypeRadio value={form.type} onChange={set("type")} />
              </Field>

              {/* MANUAL products ⇄ DYNAMIC filters — sits directly below Type */}
              {form.type === "manual" ? (
                <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center">
                  <p className="text-sm font-medium text-foreground">Visual product picker coming soon</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Hand-picking products arrives with the Products module. For now, use a{" "}
                    <span className="font-medium text-foreground">Dynamic</span> collection to match products by
                    filters.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <SectionHeading>Filters</SectionHeading>
                  <RuleBuilder rules={form.rules} onChange={set("rules")} preview={preview} />
                </div>
              )}

              <Field label="Description" htmlFor="col-desc">
                <RichTextEditor
                  id="col-desc"
                  value={form.description}
                  onChange={set("description")}
                  maxLength={20000}
                  minHeight={140}
                  placeholder="Enter collection description…"
                  ariaLabel="Collection description"
                />
              </Field>

              <div className="flex items-center gap-3">
                <Switch id="col-publish" checked={form.isPublished} onCheckedChange={set("isPublished")} aria-label="Publish" />
                <Label htmlFor="col-publish" className="text-sm font-medium text-foreground">
                  Publish
                </Label>
                <span className="text-sm text-muted-foreground">(Unpublished collections are hidden from the storefront)</span>
              </div>
            </div>

            {/* Media + display */}
            <div className="flex flex-col gap-4 border-t border-border pt-6">
              <SectionHeading>Media &amp; Display</SectionHeading>
              <Field label="Images">
                <div className="flex flex-col gap-3">
                  <ImageUpload
                    currentUrl={selectedImage !== null ? (images[selectedImage]?.url ?? null) : null}
                    pending={selectedImage !== null ? (images[selectedImage]?.dataUrl ?? null) : null}
                    onPick={handlePick}
                  />
                  {selectedImage !== null && (
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="self-start text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Done editing — add another image
                    </button>
                  )}

                  {images.length > 0 && (
                    <div className="overflow-hidden rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                            <th className="px-3 py-2">Summary</th>
                            <th className="px-3 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {images.map((img, index) => (
                            <tr
                              key={index}
                              onClick={() => setSelectedImage(index)}
                              className={cn(
                                "cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/40",
                                selectedImage === index && "bg-primary/10 hover:bg-primary/10",
                              )}
                            >
                              <td className="px-3 py-2">
                                <img
                                  src={img.dataUrl || (img.url ? imgUrl(img.url) : "/placeholder.svg")}
                                  alt={`Collection image ${index + 1}`}
                                  className="size-12 rounded-md border border-border object-cover"
                                />
                              </td>
                              <td className="px-3 py-2 text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeImageAt(index)
                                  }}
                                  aria-label={`Remove image ${index + 1}`}
                                >
                                  <Trash2 className="size-4" aria-hidden="true" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Sort order" htmlFor="col-sort">
                  <Input id="col-sort" type="number" min={0} value={form.sortOrder} onChange={setInput("sortOrder")} />
                </Field>
                <Field label="Default product sort order" hint="How products in this collection are ordered on the storefront.">
                  <Select value={form.defaultSortOrder} onValueChange={set("defaultSortOrder")}>
                    <SelectTrigger aria-label="Default product sort order">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_SORT_ORDERS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </div>
          </TabsContent>

          {/* -------------------------------------------------------- SEO */}
          <TabsContent value="seo" className="mt-0 flex flex-col gap-4">
            <SectionHeading>Search engine listing</SectionHeading>
            <Field label="SEO title" htmlFor="col-seotitle">
              <Input id="col-seotitle" value={form.seoTitle} onChange={setInput("seoTitle")} maxLength={200} />
            </Field>
            <Field label="Meta description" htmlFor="col-seodesc">
              <Textarea id="col-seodesc" value={form.seoDescription} onChange={setInput("seoDescription")} rows={3} maxLength={500} />
            </Field>
            <Field label="Keywords" htmlFor="col-seokw" hint="Comma-separated.">
              <Input id="col-seokw" value={form.seoKeywords} onChange={setInput("seoKeywords")} placeholder="summer, gold, new" />
            </Field>
            <Field label="Canonical URL" htmlFor="col-canon">
              <Input id="col-canon" value={form.seoCanonicalUrl} onChange={setInput("seoCanonicalUrl")} placeholder="https://…" maxLength={500} />
            </Field>

            <div className="mt-2 flex flex-col gap-4 border-t border-border pt-6">
              <SectionHeading>Sitemap hints</SectionHeading>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Priority" htmlFor="col-priority" hint="0.0 – 1.0">
                  <Input id="col-priority" type="number" step="0.1" min="0" max="1" value={form.sitemapPriority} onChange={setInput("sitemapPriority")} />
                </Field>
                <Field label="Change frequency">
                  <Select value={form.sitemapFrequency} onValueChange={set("sitemapFrequency")}>
                    <SelectTrigger aria-label="Change frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SITEMAP_FREQUENCIES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="col-bots" checked={form.sitemapDisableForBots} onCheckedChange={set("sitemapDisableForBots")} aria-label="Disable for bots" />
                <Label htmlFor="col-bots" className="text-sm font-normal text-muted-foreground">
                  Disable for search-engine bots
                </Label>
              </div>
            </div>
          </TabsContent>

          {/* --------------------------------------------------- ADVANCED */}
          <TabsContent value="advanced" className="mt-0 flex flex-col gap-4">
            <SectionHeading>Visibility</SectionHeading>
            <Field label="Substores" hint="Leave empty to show in all substores.">
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

            <SectionHeading>Collection references</SectionHeading>
            <Field
              label="Facet Group"
              htmlFor="col-facet"
              hint="Optional facet group id. Wire this to a live picker once the facets module exists."
            >
              <Input id="col-facet" value={form.facetGroupId} onChange={setInput("facetGroupId")} placeholder="Facet group id" maxLength={24} />
            </Field>

            <SectionHeading>Metafields</SectionHeading>
            <div className="flex flex-col gap-2">
              {form.metafields.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input value={row.key} onChange={(e) => updateMetafield(index, "key", e.target.value)} placeholder="key" className="h-9" maxLength={80} />
                  <Input value={row.value} onChange={(e) => updateMetafield(index, "value", e.target.value)} placeholder="value" className="h-9" maxLength={2000} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeMetafield(index)}
                    aria-label="Remove metafield"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="w-fit bg-transparent" onClick={addMetafield}>
                <Plus className="size-3.5" aria-hidden="true" />
                Add metafield
              </Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </form>
  )
}
