// // "use client"

// // import { useEffect, useMemo, useRef, useState } from "react"
// // import { ImageIcon, Loader2, Plus, Save, Trash2, Upload, X } from "lucide-react"
// // import { toast } from "sonner"
// // import useSWR from "swr"
// // import useSWRInfinite from "swr/infinite"
// // import { Button } from "@/components/ui/button"
// // import { Input } from "@/components/ui/input"
// // import { Label } from "@/components/ui/label"
// // import {
// //   Select,
// //   SelectContent,
// //   SelectItem,
// //   SelectTrigger,
// //   SelectValue,
// // } from "@/components/ui/select"
// // import { Switch } from "@/components/ui/switch"
// // import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// // import { Textarea } from "@/components/ui/textarea"
// // import { RichTextEditor } from "@/components/ui/rich-text-editor"
// // import { MultiSelect } from "@/components/hub/multi-select"
// // import { api, fetcher } from "@/lib/api"
// // import { imgUrl } from "@/Server"
// // import { cn } from "@/lib/utils"
// // import { CATEGORY_SORT_ORDERS, CATEGORY_STATUSES, SITEMAP_FREQUENCIES } from "@/lib/store-data"

// // const NO_PARENT = "__root__" // Select can't hold an empty-string value.

// // const EMPTY_FORM = {
// //   name: "",
// //   alias: "",
// //   description: "",
// //   parentId: null,
// //   sortOrder: 0,
// //   isActive: true,
// //   status: "active",
// //   defaultSortOrder: "manual",
// //   widget: "",
// //   seoTitle: "",
// //   seoDescription: "",
// //   seoKeywords: "",
// //   seoCanonicalUrl: "",
// //   sitemapPriority: 0.5,
// //   sitemapFrequency: "weekly",
// //   sitemapDisableForBots: false,
// //   substoreIds: [],
// //   metafields: [],
// // }

// // function docToForm(doc) {
// //   if (!doc) return EMPTY_FORM
// //   return {
// //     name: doc.name ?? "",
// //     alias: doc.alias ?? "",
// //     description: doc.description ?? "",
// //     parentId: doc.parentId ? String(doc.parentId) : null,
// //     sortOrder: doc.sortOrder ?? 0,
// //     isActive: doc.isActive !== false,
// //     status: doc.status ?? "active",
// //     defaultSortOrder: doc.defaultSortOrder ?? "manual",
// //     widget: doc.widget ?? "",
// //     seoTitle: doc.seo?.title ?? "",
// //     seoDescription: doc.seo?.description ?? "",
// //     seoKeywords: (doc.seo?.keywords ?? []).join(", "),
// //     seoCanonicalUrl: doc.seo?.canonicalUrl ?? "",
// //     sitemapPriority: doc.sitemap?.priority ?? 0.5,
// //     sitemapFrequency: doc.sitemap?.frequency ?? "weekly",
// //     sitemapDisableForBots: Boolean(doc.sitemap?.disableForBots),
// //     substoreIds: (doc.substoreIds ?? []).map(String),
// //     metafields: (doc.metafields ?? []).map((m) => ({ key: m.key ?? "", value: String(m.value ?? "") })),
// //   }
// // }

// // function num(value, fallback) {
// //   if (value === "" || value === null || value === undefined) return fallback
// //   const n = Number(value)
// //   return Number.isFinite(n) ? n : fallback
// // }

// // // Shared bit of payload for both create & update (parent goes through /move).
// // function formToBasePayload(form, images) {
// //   return {
// //     name: form.name.trim(),
// //     alias: form.alias.trim() || undefined,
// //     description: form.description ?? "",
// //     images,
// //     sortOrder: num(form.sortOrder, 0),
// //     isActive: form.isActive,
// //     status: form.status,
// //     defaultSortOrder: form.defaultSortOrder,
// //     widget: form.widget.trim() || null,
// //     seo: {
// //       title: form.seoTitle.trim(),
// //       description: form.seoDescription.trim(),
// //       keywords: form.seoKeywords
// //         .split(",")
// //         .map((k) => k.trim())
// //         .filter(Boolean),
// //       canonicalUrl: form.seoCanonicalUrl.trim(),
// //     },
// //     sitemap: {
// //       priority: num(form.sitemapPriority, 0.5),
// //       frequency: form.sitemapFrequency,
// //       disableForBots: form.sitemapDisableForBots,
// //     },
// //     substoreIds: form.substoreIds,
// //     metafields: form.metafields
// //       .filter((m) => m.key.trim())
// //       .map((m) => ({ key: m.key.trim(), value: m.value, type: "text" })),
// //   }
// // }

// // /**
// //  * Auto-generate an alias slug from the name, matching the backend rule
// //  * (lowercase, hyphenated, only [a-z0-9-]).
// //  */
// // function slugify(value) {
// //   return value
// //     .toLowerCase()
// //     .trim()
// //     .replace(/[^a-z0-9]+/g, "-")
// //     .replace(/^-+|-+$/g, "")
// // }

// // /**
// //  * Given the flat category list and a node id, return the set of ids that must
// //  * be excluded from the Parent picker: the node itself plus its whole subtree.
// //  */
// // function collectSubtreeIds(flat, rootId) {
// //   const excluded = new Set([String(rootId)])
// //   let changed = true
// //   while (changed) {
// //     changed = false
// //     for (const c of flat) {
// //       const pid = c.parentId ? String(c.parentId) : null
// //       if (pid && excluded.has(pid) && !excluded.has(String(c._id))) {
// //         excluded.add(String(c._id))
// //         changed = true
// //       }
// //     }
// //   }
// //   return excluded
// // }

// // // Build depth-ordered options ("└ " indent per level) from the flat list.
// // function buildParentOptions(flat, excluded) {
// //   const byParent = new Map()
// //   for (const c of flat) {
// //     const pid = c.parentId ? String(c.parentId) : "root"
// //     if (!byParent.has(pid)) byParent.set(pid, [])
// //     byParent.get(pid).push(c)
// //   }
// //   for (const list of byParent.values()) {
// //     list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
// //   }
// //   const out = []
// //   const walk = (pid, depth) => {
// //     for (const c of byParent.get(pid) ?? []) {
// //       if (excluded.has(String(c._id))) continue
// //       out.push({ value: String(c._id), label: `${"\u00A0\u00A0".repeat(depth)}${depth ? "\u2514 " : ""}${c.name}` })
// //       walk(String(c._id), depth + 1)
// //     }
// //   }
// //   walk("root", 0)
// //   return out
// // }

// // function Field({ label, hint, children, htmlFor, className }) {
// //   return (
// //     <div className={cn("flex flex-col gap-1.5", className)}>
// //       {label && (
// //         <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
// //           {label}
// //         </Label>
// //       )}
// //       {children}
// //       {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
// //     </div>
// //   )
// // }

// // function SectionHeading({ children }) {
// //   return <h3 className="text-base font-semibold text-foreground">{children}</h3>
// // }

// // function ImageUpload({ currentUrl, pending, onPick }) {
// //   const inputRef = useRef(null)
// //   const [dragOver, setDragOver] = useState(false)
// //   const preview = pending || (currentUrl ? imgUrl(currentUrl) : null)

// //   function readFile(file) {
// //     if (!file) return
// //     if (!file.type.startsWith("image/")) {
// //       toast.error("Please choose an image file")
// //       return
// //     }
// //     if (file.size > 2 * 1024 * 1024) {
// //       toast.error("Image too large (max 2 MB)")
// //       return
// //     }
// //     const reader = new FileReader()
// //     reader.onload = () => onPick(reader.result)
// //     reader.readAsDataURL(file)
// //   }

// //   return (
// //     <div
// //       role="button"
// //       tabIndex={0}
// //       onClick={() => inputRef.current?.click()}
// //       onKeyDown={(e) => {
// //         if (e.key === "Enter" || e.key === " ") {
// //           e.preventDefault()
// //           inputRef.current?.click()
// //         }
// //       }}
// //       onDragOver={(e) => {
// //         e.preventDefault()
// //         setDragOver(true)
// //       }}
// //       onDragLeave={() => setDragOver(false)}
// //       onDrop={(e) => {
// //         e.preventDefault()
// //         setDragOver(false)
// //         readFile(e.dataTransfer.files?.[0])
// //       }}
// //       className={cn(
// //         "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
// //         dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40",
// //       )}
// //     >
// //       {preview ? (
// //         <>
// //           <img src={preview || "/placeholder.svg"} alt="Category preview" className="max-h-28 max-w-full object-contain" />
// //           <div className="flex items-center gap-2">
// //             <Button type="button" variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
// //               <Upload className="size-3.5" aria-hidden="true" />
// //               Replace
// //             </Button>
// //             <Button
// //               type="button"
// //               variant="outline"
// //               size="sm"
// //               onClick={(e) => {
// //                 e.stopPropagation()
// //                 onPick(null)
// //               }}
// //             >
// //               <Trash2 className="size-3.5" aria-hidden="true" />
// //               Remove
// //             </Button>
// //           </div>
// //         </>
// //       ) : (
// //         <>
// //           <div className="flex size-10 items-center justify-center rounded-full bg-muted">
// //             <ImageIcon className="size-5 text-muted-foreground" aria-hidden="true" />
// //           </div>
// //           <p className="text-sm text-muted-foreground">
// //             <span className="font-medium text-foreground">Click to upload</span> or drag &amp; drop
// //           </p>
// //          <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, AVIF or SVG (max 2 MB)</p>
// //         </>
// //       )}
// //       <input
// //         ref={inputRef}
// //         type="file"
// //         accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
// //         className="sr-only"
// //         onChange={(e) => {
// //           readFile(e.target.files?.[0])
// //           e.target.value = ""
// //         }}
// //         aria-label="Upload category image"
// //       />
// //     </div>
// //   )
// // }

// // /**
// //  * Inline create / edit panel for a Category. Rendered in the right pane of the
// //  * categories page (StoreHippo-style two-pane manager). The parent remounts this
// //  * component with a fresh `key` on each selection, so state simply initializes
// //  * from props — no open/close lifecycle to track.
// //  *
// //  * Parent selection is only sent on CREATE; on EDIT a changed parent is routed
// //  * through the dedicated PATCH /:id/move endpoint so the server can safely
// //  * recompute the moved subtree.
// //  */
// // export function CategoryEditor({ categoryId, initialParentId, onSaved, onCancel }) {
// //   const isEdit = Boolean(categoryId)
// //   const [form, setForm] = useState({ ...EMPTY_FORM, parentId: initialParentId ?? null })
// //   // Committed images (each a saved { url } or freshly picked { dataUrl }). These
// //   // render as rows in the images table below the upload area. `selectedImage`
// //   // is the row currently loaded into the upload area for replace/remove; when
// //   // null the upload area is an empty dropzone that appends a new image.
// //   const [images, setImages] = useState([])
// //   const [selectedImage, setSelectedImage] = useState(null)
// //   const [originalParentId, setOriginalParentId] = useState(initialParentId ?? null)
// //   const [aliasTouched, setAliasTouched] = useState(false)
// //   const [saving, setSaving] = useState(false)
// //   const [tab, setTab] = useState("general")

// //   // The full flat tree is only needed to render the Parent picker's indented
// //   // options (and to exclude the current subtree). Defer downloading it until the
// //   // picker is actually opened. On EDIT we still fetch once we know the category
// //   // has a parent, so its label renders in the closed trigger.
// //   const [parentPickerOpen, setParentPickerOpen] = useState(false)
// //   const needsFlat = parentPickerOpen || Boolean(originalParentId)
// //   const { data: flatData } = useSWR(needsFlat ? "/seller/categories?flat=true" : null, fetcher, {
// //     revalidateOnFocus: false,
// //   })
// //   const flat = flatData?.rows ?? []

// //   // Substores are loaded 5 at a time and appended as the picker is scrolled.
// //   // Nothing is fetched while the category loads — the request only fires once
// //   // the picker is actually opened, and hits a lean /options endpoint that
// //   // returns just _id/name/alias.
// //   const SUBSTORE_PAGE_SIZE = 5
// //   const [substoreQuery, setSubstoreQuery] = useState("")
// //   const [substorePickerOpen, setSubstorePickerOpen] = useState(false)
// //   const getSubstoreKey = (index, prev) => {
// //     if (!substorePickerOpen) return null // lazy: don't fetch until opened
// //     // Stop once the previous page returned fewer rows than a full page.
// //     if (prev && prev.rows.length < SUBSTORE_PAGE_SIZE) return null
// //     const params = new URLSearchParams({
// //       page: String(index + 1),
// //       limit: String(SUBSTORE_PAGE_SIZE),
// //     })
// //     if (substoreQuery) params.set("q", substoreQuery)
// //     return `/seller/substores/options?${params.toString()}`
// //   }
// //   const {
// //     data: substorePages,
// //     size: substoreSize,
// //     setSize: setSubstoreSize,
// //     isLoading: substoreLoading,
// //     isValidating: substoreValidating,
// //   } = useSWRInfinite(getSubstoreKey, fetcher, {
// //     revalidateOnFocus: false,
// //     revalidateFirstPage: false,
// //     shouldRetryOnError: false,
// //   })

// //   const substoreRows = (substorePages ?? []).flatMap((p) => p?.rows ?? [])
// //   const substoreTotal = substorePages?.[0]?.total ?? 0
// //   const substoreOptions = substoreRows.map((s) => ({
// //     value: String(s._id),
// //     label: s.name,
// //     sublabel: s.alias,
// //   }))
// //   const substoreHasMore = substoreOptions.length < substoreTotal
// //   const substoreLoadingMore =
// //     substoreValidating && substorePages && substoreSize > substorePages.length

// //   // Load the category via SWR so React StrictMode's double-mount (and any
// //   // remount) is deduped into a SINGLE network request instead of two.
// //   const { data: detailData, error: detailError } = useSWR(
// //     isEdit ? `/seller/categories/${categoryId}` : null,
// //     fetcher,
// //     { revalidateOnFocus: false, shouldRetryOnError: false },
// //   )
// //   const loading = isEdit && !detailData && !detailError

// //   useEffect(() => {
// //     if (detailError) toast.error(detailError.message || "Failed to load category")
// //   }, [detailError])

// //   useEffect(() => {
// //     const category = detailData?.category
// //     if (!category) return
// //     setForm(docToForm(category))
// //     setAliasTouched(true) // don't auto-overwrite an existing slug
// //     setImages((category.images ?? []).map((i) => ({ url: i.url, dataUrl: null })))
// //     setSelectedImage(null)
// //     setOriginalParentId(category.parentId ? String(category.parentId) : null)
// //   }, [detailData])

// //   const setInput = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
// //   const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

// //   // Keep the alias auto-synced to the name until the user edits it directly.
// //   function onNameChange(e) {
// //     const name = e.target.value
// //     setForm((f) => ({ ...f, name, alias: aliasTouched ? f.alias : slugify(name) }))
// //   }
// //   function onAliasChange(e) {
// //     setAliasTouched(true)
// //     setForm((f) => ({ ...f, alias: e.target.value }))
// //   }

// //   const parentOptions = useMemo(() => {
// //     const excluded = isEdit ? collectSubtreeIds(flat, categoryId) : new Set()
// //     return buildParentOptions(flat, excluded)
// //   }, [flat, isEdit, categoryId])

// //   function imagesPayload() {
// //     return images
// //       .map((img) => (img.dataUrl ? { dataUrl: img.dataUrl } : img.url ? { url: img.url } : null))
// //       .filter(Boolean)
// //   }

// //   // Upload-area pick handler. With no row selected, a pick appends a new image;
// //   // with a row selected, a pick replaces that row and null (Remove) deletes it.
// //   function handlePick(dataUrl) {
// //     if (selectedImage === null) {
// //       if (dataUrl) setImages((imgs) => [...imgs, { url: null, dataUrl }])
// //       return
// //     }
// //     if (dataUrl === null) {
// //       setImages((imgs) => imgs.filter((_, i) => i !== selectedImage))
// //       setSelectedImage(null)
// //     } else {
// //       setImages((imgs) => imgs.map((img, i) => (i === selectedImage ? { url: null, dataUrl } : img)))
// //     }
// //   }

// //   function removeImageAt(index) {
// //     setImages((imgs) => imgs.filter((_, i) => i !== index))
// //     // Keep selection pointing at the right row after a splice.
// //     setSelectedImage((sel) => (sel === null ? null : sel === index ? null : sel > index ? sel - 1 : sel))
// //   }

// //   function addMetafield() {
// //     setForm((f) => ({ ...f, metafields: [...f.metafields, { key: "", value: "" }] }))
// //   }
// //   function updateMetafield(index, key, value) {
// //     setForm((f) => ({
// //       ...f,
// //       metafields: f.metafields.map((m, i) => (i === index ? { ...m, [key]: value } : m)),
// //     }))
// //   }
// //   function removeMetafield(index) {
// //     setForm((f) => ({ ...f, metafields: f.metafields.filter((_, i) => i !== index) }))
// //   }

// //   async function submit(e) {
// //     e.preventDefault()
// //     if (!form.name.trim()) {
// //       toast.error("Name is required")
// //       setTab("general")
// //       return
// //     }
// //     setSaving(true)
// //     try {
// //       const base = formToBasePayload(form, imagesPayload())
// //       if (isEdit) {
// //         await api.patch(`/seller/categories/${categoryId}`, base)
// //         const nextParent = form.parentId ?? null
// //         if (nextParent !== originalParentId) {
// //           await api.patch(`/seller/categories/${categoryId}/move`, { parentId: nextParent })
// //         }
// //         toast.success("Category updated")
// //       } else {
// //         await api.post("/seller/categories", { ...base, parentId: form.parentId ?? null })
// //         toast.success("Category created")
// //       }
// //       onSaved?.({ parentId: form.parentId ?? null, originalParentId })
// //     } catch (err) {
// //       toast.error(err.message || "Failed to save category")
// //     } finally {
// //       setSaving(false)
// //     }
// //   }

// //   if (loading) {
// //     return (
// //       <div className="flex h-full items-center justify-center">
// //         <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading category" />
// //       </div>
// //     )
// //   }

// //   return (
// //     <form onSubmit={submit} className="flex h-full min-h-0 flex-col">
// //       {/* Header: title + Save / Cancel (mirrors the reference layout) */}
// //       <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
// //         <h2 className="text-lg font-semibold text-foreground md:text-xl">
// //           {isEdit ? "Edit Category" : "Add Category"}
// //         </h2>
// //         <div className="flex items-center gap-2">
// //           <Button type="submit" size="sm" disabled={saving || !form.name.trim()}>
// //             {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
// //             Save
// //           </Button>
// //           <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
// //             <X className="size-4" aria-hidden="true" />
// //             Cancel
// //           </Button>
// //         </div>
// //       </div>

// //       <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">
// //         <div className="border-b border-border px-6 pt-3">
// //           <TabsList variant="line" className="h-auto w-full justify-start gap-6 bg-transparent p-0">
// //             {[
// //               ["general", "General"],
// //               ["seo", "SEO & Sitemap"],
// //               ["advanced", "Advanced"],
// //             ].map(([value, label]) => (
// //               <TabsTrigger
// //                 key={value}
// //                 value={value}
// //                 className="flex-none rounded-none border-transparent px-1 pb-2.5 text-sm text-muted-foreground shadow-none after:bottom-[-1px] after:bg-primary hover:text-foreground focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=active]:border-transparent data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent"
// //               >
// //                 {label}
// //               </TabsTrigger>
// //             ))}
// //           </TabsList>
// //         </div>

// //         <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
// //           {/* ---------------------------------------------------- GENERAL */}
// //           <TabsContent value="general" className="mt-0 flex flex-col gap-6">
// //             <div className="flex flex-col gap-4">
// //               <SectionHeading>Basic Information</SectionHeading>

// //               <div className="grid gap-4 md:grid-cols-2">
// //                 <Field label="Name" htmlFor="cat-name">
// //                   <Input
// //                     id="cat-name"
// //                     value={form.name}
// //                     onChange={onNameChange}
// //                     placeholder="e.g. Consumables"
// //                     required
// //                     maxLength={160}
// //                     aria-required="true"
// //                   />
// //                 </Field>
// //                 <Field
// //                   label="Alias"
// //                   htmlFor="cat-alias"
// //                   hint="Only lowercase letters, numbers, and hyphens allowed."
// //                 >
// //                   <Input
// //                     id="cat-alias"
// //                     value={form.alias}
// //                     onChange={onAliasChange}
// //                     placeholder="consumables"
// //                     maxLength={200}
// //                   />
// //                 </Field>
// //               </div>

// //               <Field label="Parent Category">
// //                 <Select
// //                   value={form.parentId ?? NO_PARENT}
// //                   onValueChange={(v) => set("parentId")(v === NO_PARENT ? null : v)}
// //                   onOpenChange={(open) => open && setParentPickerOpen(true)}
// //                 >
// //                   <SelectTrigger aria-label="Parent category">
// //                     <SelectValue />
// //                   </SelectTrigger>
// //                   <SelectContent>
// //                     <SelectItem value={NO_PARENT}>No Parent</SelectItem>
// //                     {parentOptions.map((o) => (
// //                       <SelectItem key={o.value} value={o.value}>
// //                         {o.label}
// //                       </SelectItem>
// //                     ))}
// //                   </SelectContent>
// //                 </Select>
// //               </Field>

// //               <Field label="Description" htmlFor="cat-desc">
// //                 <RichTextEditor
// //                   id="cat-desc"
// //                   value={form.description}
// //                   onChange={set("description")}
// //                   maxLength={8000}
// //                   minHeight={220}
// //                   placeholder="Enter category description…"
// //                   ariaLabel="Category description"
// //                 />
// //               </Field>

// //               <div className="flex items-center gap-3">
// //                 <Switch id="cat-active" checked={form.isActive} onCheckedChange={set("isActive")} aria-label="Active" />
// //                 <Label htmlFor="cat-active" className="text-sm font-medium text-foreground">
// //                   Active
// //                 </Label>
// //                 <span className="text-sm text-muted-foreground">(Inactive categories are hidden from users)</span>
// //               </div>
// //             </div>

// //             <div className="flex flex-col gap-4 border-t border-border pt-6">
// //               <SectionHeading>Media &amp; Display</SectionHeading>
// //               <Field label="Images">
// //                 <div className="flex flex-col gap-3">
// //                   <ImageUpload
// //                     currentUrl={selectedImage !== null ? (images[selectedImage]?.url ?? null) : null}
// //                     pending={selectedImage !== null ? (images[selectedImage]?.dataUrl ?? null) : null}
// //                     onPick={handlePick}
// //                   />
// //                   {selectedImage !== null && (
// //                     <button
// //                       type="button"
// //                       onClick={() => setSelectedImage(null)}
// //                       className="self-start text-xs font-medium text-muted-foreground hover:text-foreground"
// //                     >
// //                       Done editing — add another image
// //                     </button>
// //                   )}

// //                   {images.length > 0 && (
// //                     <div className="overflow-hidden rounded-lg border border-border">
// //                       <table className="w-full text-sm">
// //                         <thead>
// //                           <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground">
// //                             <th className="px-3 py-2">Summary</th>
// //                             <th className="px-3 py-2 text-right">Actions</th>
// //                           </tr>
// //                         </thead>
// //                         <tbody>
// //                           {images.map((img, index) => (
// //                             <tr
// //                               key={index}
// //                               onClick={() => setSelectedImage(index)}
// //                               className={cn(
// //                                 "cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/40",
// //                                 selectedImage === index && "bg-primary/10 hover:bg-primary/10",
// //                               )}
// //                             >
// //                               <td className="px-3 py-2">
// //                                 <img
// //                                   src={img.dataUrl || (img.url ? imgUrl(img.url) : "/placeholder.svg")}
// //                                   alt={`Category image ${index + 1}`}
// //                                   className="size-12 rounded-md border border-border object-cover"
// //                                 />
// //                               </td>
// //                               <td className="px-3 py-2 text-right">
// //                                 <Button
// //                                   type="button"
// //                                   variant="ghost"
// //                                   size="icon"
// //                                   className="text-muted-foreground hover:text-destructive"
// //                                   onClick={(e) => {
// //                                     e.stopPropagation()
// //                                     removeImageAt(index)
// //                                   }}
// //                                   aria-label={`Remove image ${index + 1}`}
// //                                 >
// //                                   <Trash2 className="size-4" aria-hidden="true" />
// //                                 </Button>
// //                               </td>
// //                             </tr>
// //                           ))}
// //                         </tbody>
// //                       </table>
// //                     </div>
// //                   )}
// //                 </div>
// //               </Field>
// //               <div className="grid gap-4 md:grid-cols-2">
// //                 <Field label="Sort order" htmlFor="cat-sort">
// //                   <Input id="cat-sort" type="number" min={0} value={form.sortOrder} onChange={setInput("sortOrder")} />
// //                 </Field>
// //                 <Field label="Status">
// //                   <Select value={form.status} onValueChange={set("status")}>
// //                     <SelectTrigger aria-label="Status">
// //                       <SelectValue />
// //                     </SelectTrigger>
// //                     <SelectContent>
// //                       {CATEGORY_STATUSES.map((s) => (
// //                         <SelectItem key={s.value} value={s.value}>
// //                           {s.label}
// //                         </SelectItem>
// //                       ))}
// //                     </SelectContent>
// //                   </Select>
// //                 </Field>
// //               </div>
// //               <Field label="Default product sort order" hint="How products in this category are ordered on the storefront.">
// //                 <Select value={form.defaultSortOrder} onValueChange={set("defaultSortOrder")}>
// //                   <SelectTrigger aria-label="Default product sort order">
// //                     <SelectValue />
// //                   </SelectTrigger>
// //                   <SelectContent>
// //                     {CATEGORY_SORT_ORDERS.map((s) => (
// //                       <SelectItem key={s.value} value={s.value}>
// //                         {s.label}
// //                       </SelectItem>
// //                     ))}
// //                   </SelectContent>
// //                 </Select>
// //               </Field>
// //             </div>
// //           </TabsContent>

// //           {/* -------------------------------------------------------- SEO */}
// //           <TabsContent value="seo" className="mt-0 flex flex-col gap-4">
// //             <SectionHeading>Search engine listing</SectionHeading>
// //             <Field label="SEO title" htmlFor="cat-seotitle">
// //               <Input id="cat-seotitle" value={form.seoTitle} onChange={setInput("seoTitle")} maxLength={200} />
// //             </Field>
// //             <Field label="Meta description" htmlFor="cat-seodesc">
// //               <Textarea id="cat-seodesc" value={form.seoDescription} onChange={setInput("seoDescription")} rows={3} maxLength={500} />
// //             </Field>
// //             <Field label="Keywords" htmlFor="cat-seokw" hint="Comma-separated.">
// //               <Input id="cat-seokw" value={form.seoKeywords} onChange={setInput("seoKeywords")} placeholder="rings, gold, diamond" />
// //             </Field>
// //             <Field label="Canonical URL" htmlFor="cat-canon">
// //               <Input id="cat-canon" value={form.seoCanonicalUrl} onChange={setInput("seoCanonicalUrl")} placeholder="https://…" maxLength={500} />
// //             </Field>

// //             <div className="mt-2 flex flex-col gap-4 border-t border-border pt-6">
// //               <SectionHeading>Sitemap hints</SectionHeading>
// //               <div className="grid gap-4 md:grid-cols-2">
// //               <Field label="Priority" htmlFor="cat-priority" hint="0.0 – 1.0">
// //                 <Input
// //                   id="cat-priority"
// //                   type="number"
// //                   step="0.1"
// //                   min="0"
// //                   max="1"
// //                   value={form.sitemapPriority}
// //                   onChange={setInput("sitemapPriority")}
// //                 />
// //               </Field>
// //               <Field label="Change frequency">
// //                 <Select value={form.sitemapFrequency} onValueChange={set("sitemapFrequency")}>
// //                   <SelectTrigger aria-label="Change frequency">
// //                     <SelectValue />
// //                   </SelectTrigger>
// //                   <SelectContent>
// //                     {SITEMAP_FREQUENCIES.map((f) => (
// //                       <SelectItem key={f.value} value={f.value}>
// //                         {f.label}
// //                       </SelectItem>
// //                     ))}
// //                   </SelectContent>
// //                 </Select>
// //               </Field>
// //               </div>
// //               <div className="flex items-center gap-3">
// //                 <Switch
// //                   id="cat-bots"
// //                   checked={form.sitemapDisableForBots}
// //                   onCheckedChange={set("sitemapDisableForBots")}
// //                   aria-label="Disable for bots"
// //                 />
// //                 <Label htmlFor="cat-bots" className="text-sm font-normal text-muted-foreground">
// //                   Disable for search-engine bots
// //                 </Label>
// //               </div>
// //             </div>
// //           </TabsContent>

// //           {/* --------------------------------------------------- ADVANCED */}
// //           <TabsContent value="advanced" className="mt-0 flex flex-col gap-4">
// //             <SectionHeading>Visibility</SectionHeading>
// //             <Field label="Substores" hint="Leave empty to show in all substores.">
// //               <MultiSelect
// //                 options={substoreOptions}
// //                 selected={form.substoreIds}
// //                 onChange={set("substoreIds")}
// //                 placeholder="All substores"
// //                 emptyText="No substores"
// //                 onOpenChange={(open) => open && setSubstorePickerOpen(true)}
// //                 loading={substoreLoading}
// //                 hasMore={substoreHasMore}
// //                 isLoadingMore={substoreLoadingMore}
// //                 onLoadMore={() => setSubstoreSize(substoreSize + 1)}
// //                 onSearch={(q) => {
// //                   setSubstoreQuery(q)
// //                   setSubstoreSize(1) // new query → start from the first page again
// //                 }}
// //               />
// //             </Field>
// //             <Field label="Widget" htmlFor="cat-widget" hint="Optional widget key rendered on the category page.">
// //               <Input id="cat-widget" value={form.widget} onChange={setInput("widget")} maxLength={120} />
// //             </Field>

// //             <SectionHeading>Metafields</SectionHeading>
// //             <div className="flex flex-col gap-2">
// //               {form.metafields.map((row, index) => (
// //                 <div key={index} className="flex items-center gap-2">
// //                   <Input
// //                     value={row.key}
// //                     onChange={(e) => updateMetafield(index, "key", e.target.value)}
// //                     placeholder="key"
// //                     className="h-9"
// //                     maxLength={80}
// //                   />
// //                   <Input
// //                     value={row.value}
// //                     onChange={(e) => updateMetafield(index, "value", e.target.value)}
// //                     placeholder="value"
// //                     className="h-9"
// //                     maxLength={2000}
// //                   />
// //                   <Button
// //                     type="button"
// //                     variant="ghost"
// //                     size="icon"
// //                     className="size-9 shrink-0 text-muted-foreground hover:text-destructive"
// //                     onClick={() => removeMetafield(index)}
// //                     aria-label="Remove metafield"
// //                   >
// //                     <Trash2 className="size-4" aria-hidden="true" />
// //                   </Button>
// //                 </div>
// //               ))}
// //               <Button type="button" variant="outline" size="sm" className="w-fit bg-transparent" onClick={addMetafield}>
// //                 <Plus className="size-3.5" aria-hidden="true" />
// //                 Add metafield
// //               </Button>
// //             </div>
// //           </TabsContent>
// //         </div>
// //       </Tabs>
// //     </form>
// //   )
// // }


// "use client"

// import { useEffect, useMemo, useRef, useState } from "react"
// import { ImageIcon, Loader2, Save, Trash2, Upload, X } from "lucide-react"
// import { toast } from "sonner"
// import useSWR from "swr"
// import useSWRInfinite from "swr/infinite"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import { Switch } from "@/components/ui/switch"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Textarea } from "@/components/ui/textarea"
// import { RichTextEditor } from "@/components/ui/rich-text-editor"
// import { MultiSelect } from "@/components/hub/multi-select"
// import { MetafieldValuesForm } from "@/components/hub/metafields/metafield-values-form"
// import {
//   useMetafieldDefinition,
//   useMetafieldValues,
//   useMetafieldValueMutations,
// } from "@/components/hub/metafields/use-metafields"
// import { api, fetcher } from "@/lib/api"
// import { imgUrl } from "@/Server"
// import { cn } from "@/lib/utils"
// import { CATEGORY_SORT_ORDERS, CATEGORY_STATUSES, SITEMAP_FREQUENCIES } from "@/lib/store-data"

// const NO_PARENT = "__root__" // Select can't hold an empty-string value.

// // The metafield module this editor binds its values to. The hooks normalize
// // this to the stored binding (ms.categories) before hitting the API.
// const CATEGORY_MODULE = "categories"

// const EMPTY_FORM = {
//   name: "",
//   alias: "",
//   description: "",
//   parentId: null,
//   sortOrder: 0,
//   isActive: true,
//   status: "active",
//   defaultSortOrder: "manual",
//   widget: "",
//   seoTitle: "",
//   seoDescription: "",
//   seoKeywords: "",
//   seoCanonicalUrl: "",
//   sitemapPriority: 0.5,
//   sitemapFrequency: "weekly",
//   sitemapDisableForBots: false,
//   substoreIds: [],
// }

// function docToForm(doc) {
//   if (!doc) return EMPTY_FORM
//   return {
//     name: doc.name ?? "",
//     alias: doc.alias ?? "",
//     description: doc.description ?? "",
//     parentId: doc.parentId ? String(doc.parentId) : null,
//     sortOrder: doc.sortOrder ?? 0,
//     isActive: doc.isActive !== false,
//     status: doc.status ?? "active",
//     defaultSortOrder: doc.defaultSortOrder ?? "manual",
//     widget: doc.widget ?? "",
//     seoTitle: doc.seo?.title ?? "",
//     seoDescription: doc.seo?.description ?? "",
//     seoKeywords: (doc.seo?.keywords ?? []).join(", "),
//     seoCanonicalUrl: doc.seo?.canonicalUrl ?? "",
//     sitemapPriority: doc.sitemap?.priority ?? 0.5,
//     sitemapFrequency: doc.sitemap?.frequency ?? "weekly",
//     sitemapDisableForBots: Boolean(doc.sitemap?.disableForBots),
//     substoreIds: (doc.substoreIds ?? []).map(String),
//   }
// }

// function num(value, fallback) {
//   if (value === "" || value === null || value === undefined) return fallback
//   const n = Number(value)
//   return Number.isFinite(n) ? n : fallback
// }

// // Shared bit of payload for both create & update (parent goes through /move).
// function formToBasePayload(form, images) {
//   return {
//     name: form.name.trim(),
//     alias: form.alias.trim() || undefined,
//     description: form.description ?? "",
//     images,
//     sortOrder: num(form.sortOrder, 0),
//     isActive: form.isActive,
//     status: form.status,
//     defaultSortOrder: form.defaultSortOrder,
//     widget: form.widget.trim() || null,
//     seo: {
//       title: form.seoTitle.trim(),
//       description: form.seoDescription.trim(),
//       keywords: form.seoKeywords
//         .split(",")
//         .map((k) => k.trim())
//         .filter(Boolean),
//       canonicalUrl: form.seoCanonicalUrl.trim(),
//     },
//     sitemap: {
//       priority: num(form.sitemapPriority, 0.5),
//       frequency: form.sitemapFrequency,
//       disableForBots: form.sitemapDisableForBots,
//     },
//     substoreIds: form.substoreIds,
//   }
// }

// /**
//  * Auto-generate an alias slug from the name, matching the backend rule
//  * (lowercase, hyphenated, only [a-z0-9-]).
//  */
// function slugify(value) {
//   return value
//     .toLowerCase()
//     .trim()
//     .replace(/[^a-z0-9]+/g, "-")
//     .replace(/^-+|-+$/g, "")
// }

// /**
//  * Given the flat category list and a node id, return the set of ids that must
//  * be excluded from the Parent picker: the node itself plus its whole subtree.
//  */
// function collectSubtreeIds(flat, rootId) {
//   const excluded = new Set([String(rootId)])
//   let changed = true
//   while (changed) {
//     changed = false
//     for (const c of flat) {
//       const pid = c.parentId ? String(c.parentId) : null
//       if (pid && excluded.has(pid) && !excluded.has(String(c._id))) {
//         excluded.add(String(c._id))
//         changed = true
//       }
//     }
//   }
//   return excluded
// }

// // Build depth-ordered options ("└ " indent per level) from the flat list.
// function buildParentOptions(flat, excluded) {
//   const byParent = new Map()
//   for (const c of flat) {
//     const pid = c.parentId ? String(c.parentId) : "root"
//     if (!byParent.has(pid)) byParent.set(pid, [])
//     byParent.get(pid).push(c)
//   }
//   for (const list of byParent.values()) {
//     list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
//   }
//   const out = []
//   const walk = (pid, depth) => {
//     for (const c of byParent.get(pid) ?? []) {
//       if (excluded.has(String(c._id))) continue
//       out.push({ value: String(c._id), label: `${"\u00A0\u00A0".repeat(depth)}${depth ? "\u2514 " : ""}${c.name}` })
//       walk(String(c._id), depth + 1)
//     }
//   }
//   walk("root", 0)
//   return out
// }

// function Field({ label, hint, children, htmlFor, className }) {
//   return (
//     <div className={cn("flex flex-col gap-1.5", className)}>
//       {label && (
//         <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
//           {label}
//         </Label>
//       )}
//       {children}
//       {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
//     </div>
//   )
// }

// function SectionHeading({ children }) {
//   return <h3 className="text-base font-semibold text-foreground">{children}</h3>
// }

// function ImageUpload({ currentUrl, pending, onPick }) {
//   const inputRef = useRef(null)
//   const [dragOver, setDragOver] = useState(false)
//   const preview = pending || (currentUrl ? imgUrl(currentUrl) : null)

//   function readFile(file) {
//     if (!file) return
//     if (!file.type.startsWith("image/")) {
//       toast.error("Please choose an image file")
//       return
//     }
//     if (file.size > 2 * 1024 * 1024) {
//       toast.error("Image too large (max 2 MB)")
//       return
//     }
//     const reader = new FileReader()
//     reader.onload = () => onPick(reader.result)
//     reader.readAsDataURL(file)
//   }

//   return (
//     <div
//       role="button"
//       tabIndex={0}
//       onClick={() => inputRef.current?.click()}
//       onKeyDown={(e) => {
//         if (e.key === "Enter" || e.key === " ") {
//           e.preventDefault()
//           inputRef.current?.click()
//         }
//       }}
//       onDragOver={(e) => {
//         e.preventDefault()
//         setDragOver(true)
//       }}
//       onDragLeave={() => setDragOver(false)}
//       onDrop={(e) => {
//         e.preventDefault()
//         setDragOver(false)
//         readFile(e.dataTransfer.files?.[0])
//       }}
//       className={cn(
//         "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
//         dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40",
//       )}
//     >
//       {preview ? (
//         <>
//           <img src={preview || "/placeholder.svg"} alt="Category preview" className="max-h-28 max-w-full object-contain" />
//           <div className="flex items-center gap-2">
//             <Button type="button" variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
//               <Upload className="size-3.5" aria-hidden="true" />
//               Replace
//             </Button>
//             <Button
//               type="button"
//               variant="outline"
//               size="sm"
//               onClick={(e) => {
//                 e.stopPropagation()
//                 onPick(null)
//               }}
//             >
//               <Trash2 className="size-3.5" aria-hidden="true" />
//               Remove
//             </Button>
//           </div>
//         </>
//       ) : (
//         <>
//           <div className="flex size-10 items-center justify-center rounded-full bg-muted">
//             <ImageIcon className="size-5 text-muted-foreground" aria-hidden="true" />
//           </div>
//           <p className="text-sm text-muted-foreground">
//             <span className="font-medium text-foreground">Click to upload</span> or drag &amp; drop
//           </p>
//           <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, AVIF or SVG (max 2 MB)</p>
//         </>
//       )}
//       <input
//         ref={inputRef}
//         type="file"
//         accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
//         className="sr-only"
//         onChange={(e) => {
//           readFile(e.target.files?.[0])
//           e.target.value = ""
//         }}
//         aria-label="Upload category image"
//       />
//     </div>
//   )
// }

// /**
//  * Inline create / edit panel for a Category. Rendered in the right pane of the
//  * categories page (StoreHippo-style two-pane manager). The parent remounts this
//  * component with a fresh `key` on each selection, so state simply initializes
//  * from props — no open/close lifecycle to track.
//  *
//  * Parent selection is only sent on CREATE; on EDIT a changed parent is routed
//  * through the dedicated PATCH /:id/move endpoint so the server can safely
//  * recompute the moved subtree.
//  */
// export function CategoryEditor({ categoryId, initialParentId, onSaved, onCancel }) {
//   const isEdit = Boolean(categoryId)
//   const [form, setForm] = useState({ ...EMPTY_FORM, parentId: initialParentId ?? null })
//   // Committed images (each a saved { url } or freshly picked { dataUrl }). These
//   // render as rows in the images table below the upload area. `selectedImage`
//   // is the row currently loaded into the upload area for replace/remove; when
//   // null the upload area is an empty dropzone that appends a new image.
//   const [images, setImages] = useState([])
//   const [selectedImage, setSelectedImage] = useState(null)
//   const [originalParentId, setOriginalParentId] = useState(initialParentId ?? null)
//   const [aliasTouched, setAliasTouched] = useState(false)
//   const [saving, setSaving] = useState(false)
//   const [tab, setTab] = useState("general")

//   // The full flat tree is only needed to render the Parent picker's indented
//   // options (and to exclude the current subtree). Defer downloading it until the
//   // picker is actually opened. On EDIT we still fetch once we know the category
//   // has a parent, so its label renders in the closed trigger.
//   const [parentPickerOpen, setParentPickerOpen] = useState(false)
//   const needsFlat = parentPickerOpen || Boolean(originalParentId)
//   const { data: flatData } = useSWR(needsFlat ? "/seller/categories?flat=true" : null, fetcher, {
//     revalidateOnFocus: false,
//   })
//   const flat = flatData?.rows ?? []

//   // Substores are loaded 5 at a time and appended as the picker is scrolled.
//   // Nothing is fetched while the category loads — the request only fires once
//   // the picker is actually opened, and hits a lean /options endpoint that
//   // returns just _id/name/alias.
//   const SUBSTORE_PAGE_SIZE = 5
//   const [substoreQuery, setSubstoreQuery] = useState("")
//   const [substorePickerOpen, setSubstorePickerOpen] = useState(false)
//   const getSubstoreKey = (index, prev) => {
//     if (!substorePickerOpen) return null // lazy: don't fetch until opened
//     // Stop once the previous page returned fewer rows than a full page.
//     if (prev && prev.rows.length < SUBSTORE_PAGE_SIZE) return null
//     const params = new URLSearchParams({
//       page: String(index + 1),
//       limit: String(SUBSTORE_PAGE_SIZE),
//     })
//     if (substoreQuery) params.set("q", substoreQuery)
//     return `/seller/substores/options?${params.toString()}`
//   }
//   const {
//     data: substorePages,
//     size: substoreSize,
//     setSize: setSubstoreSize,
//     isLoading: substoreLoading,
//     isValidating: substoreValidating,
//   } = useSWRInfinite(getSubstoreKey, fetcher, {
//     revalidateOnFocus: false,
//     revalidateFirstPage: false,
//     shouldRetryOnError: false,
//   })

//   const substoreRows = (substorePages ?? []).flatMap((p) => p?.rows ?? [])
//   const substoreTotal = substorePages?.[0]?.total ?? 0
//   const substoreOptions = substoreRows.map((s) => ({
//     value: String(s._id),
//     label: s.name,
//     sublabel: s.alias,
//   }))
//   const substoreHasMore = substoreOptions.length < substoreTotal
//   const substoreLoadingMore =
//     substoreValidating && substorePages && substoreSize > substorePages.length

//   // Load the category via SWR so React StrictMode's double-mount (and any
//   // remount) is deduped into a SINGLE network request instead of two.
//   const { data: detailData, error: detailError } = useSWR(
//     isEdit ? `/seller/categories/${categoryId}` : null,
//     fetcher,
//     { revalidateOnFocus: false, shouldRetryOnError: false },
//   )
//   const loading = isEdit && !detailData && !detailError

//   // Metafields: load the ms.categories DEFINITION (the schema this editor
//   // renders) and, in edit mode, the category's SAVED values. `mfValues` is the
//   // live form state; it is persisted to the values endpoint on save.
//   const { definition: mfDefinition } = useMetafieldDefinition(CATEGORY_MODULE)
//   const { values: mfSavedValues } = useMetafieldValues(CATEGORY_MODULE, isEdit ? categoryId : null)
//   const { saveValues: saveMetafieldValues } = useMetafieldValueMutations()
//   const [mfValues, setMfValues] = useState({})

//   useEffect(() => {
//     if (mfSavedValues) setMfValues(mfSavedValues)
//   }, [mfSavedValues])

//   useEffect(() => {
//     if (detailError) toast.error(detailError.message || "Failed to load category")
//   }, [detailError])

//   useEffect(() => {
//     const category = detailData?.category
//     if (!category) return
//     setForm(docToForm(category))
//     setAliasTouched(true) // don't auto-overwrite an existing slug
//     setImages((category.images ?? []).map((i) => ({ url: i.url, dataUrl: null })))
//     setSelectedImage(null)
//     setOriginalParentId(category.parentId ? String(category.parentId) : null)
//   }, [detailData])

//   const setInput = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
//   const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

//   // Keep the alias auto-synced to the name until the user edits it directly.
//   function onNameChange(e) {
//     const name = e.target.value
//     setForm((f) => ({ ...f, name, alias: aliasTouched ? f.alias : slugify(name) }))
//   }
//   function onAliasChange(e) {
//     setAliasTouched(true)
//     setForm((f) => ({ ...f, alias: e.target.value }))
//   }

//   const parentOptions = useMemo(() => {
//     const excluded = isEdit ? collectSubtreeIds(flat, categoryId) : new Set()
//     return buildParentOptions(flat, excluded)
//   }, [flat, isEdit, categoryId])

//   function imagesPayload() {
//     return images
//       .map((img) => (img.dataUrl ? { dataUrl: img.dataUrl } : img.url ? { url: img.url } : null))
//       .filter(Boolean)
//   }

//   // Upload-area pick handler. With no row selected, a pick appends a new image;
//   // with a row selected, a pick replaces that row and null (Remove) deletes it.
//   function handlePick(dataUrl) {
//     if (selectedImage === null) {
//       if (dataUrl) setImages((imgs) => [...imgs, { url: null, dataUrl }])
//       return
//     }
//     if (dataUrl === null) {
//       setImages((imgs) => imgs.filter((_, i) => i !== selectedImage))
//       setSelectedImage(null)
//     } else {
//       setImages((imgs) => imgs.map((img, i) => (i === selectedImage ? { url: null, dataUrl } : img)))
//     }
//   }

//   function removeImageAt(index) {
//     setImages((imgs) => imgs.filter((_, i) => i !== index))
//     // Keep selection pointing at the right row after a splice.
//     setSelectedImage((sel) => (sel === null ? null : sel === index ? null : sel > index ? sel - 1 : sel))
//   }

//   // Persist the metafield values for a category record against the live
//   // definition. Skipped when no definition exists. Failures surface but never
//   // block the category save that already succeeded.
//   async function persistMetafields(recordId) {
//     if (!recordId || !mfDefinition?.fields?.length) return
//     try {
//       await saveMetafieldValues({ module: CATEGORY_MODULE, recordId, data: mfValues })
//     } catch (err) {
//       toast.error(err.message || "Category saved, but metafields failed to save")
//     }
//   }

//   async function submit(e) {
//     e.preventDefault()
//     if (!form.name.trim()) {
//       toast.error("Name is required")
//       setTab("general")
//       return
//     }
//     setSaving(true)
//     try {
//       const base = formToBasePayload(form, imagesPayload())
//       if (isEdit) {
//         await api.patch(`/seller/categories/${categoryId}`, base)
//         const nextParent = form.parentId ?? null
//         if (nextParent !== originalParentId) {
//           await api.patch(`/seller/categories/${categoryId}/move`, { parentId: nextParent })
//         }
//         await persistMetafields(categoryId)
//         toast.success("Category updated")
//       } else {
//         const res = await api.post("/seller/categories", { ...base, parentId: form.parentId ?? null })
//         await persistMetafields(res?.category?._id)
//         toast.success("Category created")
//       }
//       onSaved?.({ parentId: form.parentId ?? null, originalParentId })
//     } catch (err) {
//       toast.error(err.message || "Failed to save category")
//     } finally {
//       setSaving(false)
//     }
//   }

//   if (loading) {
//     return (
//       <div className="flex h-full items-center justify-center">
//         <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading category" />
//       </div>
//     )
//   }

//   return (
//     <form onSubmit={submit} className="flex h-full min-h-0 flex-col">
//       {/* Header: title + Save / Cancel (mirrors the reference layout) */}
//       <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
//         <h2 className="text-lg font-semibold text-foreground md:text-xl">
//           {isEdit ? "Edit Category" : "Add Category"}
//         </h2>
//         <div className="flex items-center gap-2">
//           <Button type="submit" size="sm" disabled={saving || !form.name.trim()}>
//             {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
//             Save
//           </Button>
//           <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
//             <X className="size-4" aria-hidden="true" />
//             Cancel
//           </Button>
//         </div>
//       </div>

//       <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-0">
//         <div className="border-b border-border px-6 pt-3">
//           <TabsList variant="line" className="h-auto w-full justify-start gap-6 bg-transparent p-0">
//             {[
//               ["general", "General"],
//               ["seo", "SEO & Sitemap"],
//               ["advanced", "Advanced"],
//             ].map(([value, label]) => (
//               <TabsTrigger
//                 key={value}
//                 value={value}
//                 className="flex-none rounded-none border-transparent px-1 pb-2.5 text-sm text-muted-foreground shadow-none after:bottom-[-1px] after:bg-primary hover:text-foreground focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-0 data-[state=active]:border-transparent data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent"
//               >
//                 {label}
//               </TabsTrigger>
//             ))}
//           </TabsList>
//         </div>

//         <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
//           {/* ---------------------------------------------------- GENERAL */}
//           <TabsContent value="general" className="mt-0 flex flex-col gap-6">
//             <div className="flex flex-col gap-4">
//               <SectionHeading>Basic Information</SectionHeading>

//               <div className="grid gap-4 md:grid-cols-2">
//                 <Field label="Name" htmlFor="cat-name">
//                   <Input
//                     id="cat-name"
//                     value={form.name}
//                     onChange={onNameChange}
//                     placeholder="e.g. Consumables"
//                     required
//                     maxLength={160}
//                     aria-required="true"
//                   />
//                 </Field>
//                 <Field
//                   label="Alias"
//                   htmlFor="cat-alias"
//                   hint="Only lowercase letters, numbers, and hyphens allowed."
//                 >
//                   <Input
//                     id="cat-alias"
//                     value={form.alias}
//                     onChange={onAliasChange}
//                     placeholder="consumables"
//                     maxLength={200}
//                   />
//                 </Field>
//               </div>

//               <Field label="Parent Category">
//                 <Select
//                   value={form.parentId ?? NO_PARENT}
//                   onValueChange={(v) => set("parentId")(v === NO_PARENT ? null : v)}
//                   onOpenChange={(open) => open && setParentPickerOpen(true)}
//                 >
//                   <SelectTrigger aria-label="Parent category">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value={NO_PARENT}>No Parent</SelectItem>
//                     {parentOptions.map((o) => (
//                       <SelectItem key={o.value} value={o.value}>
//                         {o.label}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </Field>

//               <Field label="Description" htmlFor="cat-desc">
//                 <RichTextEditor
//                   id="cat-desc"
//                   value={form.description}
//                   onChange={set("description")}
//                   maxLength={8000}
//                   minHeight={140}
//                   placeholder="Enter category description…"
//                   ariaLabel="Category description"
//                 />
//               </Field>

//               <div className="flex items-center gap-3">
//                 <Switch id="cat-active" checked={form.isActive} onCheckedChange={set("isActive")} aria-label="Active" />
//                 <Label htmlFor="cat-active" className="text-sm font-medium text-foreground">
//                   Active
//                 </Label>
//                 <span className="text-sm text-muted-foreground">(Inactive categories are hidden from users)</span>
//               </div>
//             </div>

//             <div className="flex flex-col gap-4 border-t border-border pt-6">
//               <SectionHeading>Media &amp; Display</SectionHeading>
//               <Field label="Images">
//                 <div className="flex flex-col gap-3">
//                   <ImageUpload
//                     currentUrl={selectedImage !== null ? (images[selectedImage]?.url ?? null) : null}
//                     pending={selectedImage !== null ? (images[selectedImage]?.dataUrl ?? null) : null}
//                     onPick={handlePick}
//                   />
//                   {selectedImage !== null && (
//                     <button
//                       type="button"
//                       onClick={() => setSelectedImage(null)}
//                       className="self-start text-xs font-medium text-muted-foreground hover:text-foreground"
//                     >
//                       Done editing — add another image
//                     </button>
//                   )}

//                   {images.length > 0 && (
//                     <div className="overflow-hidden rounded-lg border border-border">
//                       <table className="w-full text-sm">
//                         <thead>
//                           <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground">
//                             <th className="px-3 py-2">Summary</th>
//                             <th className="px-3 py-2 text-right">Actions</th>
//                           </tr>
//                         </thead>
//                         <tbody>
//                           {images.map((img, index) => (
//                             <tr
//                               key={index}
//                               onClick={() => setSelectedImage(index)}
//                               className={cn(
//                                 "cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/40",
//                                 selectedImage === index && "bg-primary/10 hover:bg-primary/10",
//                               )}
//                             >
//                               <td className="px-3 py-2">
//                                 <img
//                                   src={img.dataUrl || (img.url ? imgUrl(img.url) : "/placeholder.svg")}
//                                   alt={`Category image ${index + 1}`}
//                                   className="size-12 rounded-md border border-border object-cover"
//                                 />
//                               </td>
//                               <td className="px-3 py-2 text-right">
//                                 <Button
//                                   type="button"
//                                   variant="ghost"
//                                   size="icon"
//                                   className="text-muted-foreground hover:text-destructive"
//                                   onClick={(e) => {
//                                     e.stopPropagation()
//                                     removeImageAt(index)
//                                   }}
//                                   aria-label={`Remove image ${index + 1}`}
//                                 >
//                                   <Trash2 className="size-4" aria-hidden="true" />
//                                 </Button>
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   )}
//                 </div>
//               </Field>
//               <div className="grid gap-4 md:grid-cols-2">
//                 <Field label="Sort order" htmlFor="cat-sort">
//                   <Input id="cat-sort" type="number" min={0} value={form.sortOrder} onChange={setInput("sortOrder")} />
//                 </Field>
//                 <Field label="Status">
//                   <Select value={form.status} onValueChange={set("status")}>
//                     <SelectTrigger aria-label="Status">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {CATEGORY_STATUSES.map((s) => (
//                         <SelectItem key={s.value} value={s.value}>
//                           {s.label}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </Field>
//               </div>
//               <Field label="Default product sort order" hint="How products in this category are ordered on the storefront.">
//                 <Select value={form.defaultSortOrder} onValueChange={set("defaultSortOrder")}>
//                   <SelectTrigger aria-label="Default product sort order">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {CATEGORY_SORT_ORDERS.map((s) => (
//                       <SelectItem key={s.value} value={s.value}>
//                         {s.label}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </Field>
//             </div>
//           </TabsContent>

//           {/* -------------------------------------------------------- SEO */}
//           <TabsContent value="seo" className="mt-0 flex flex-col gap-4">
//             <SectionHeading>Search engine listing</SectionHeading>
//             <Field label="SEO title" htmlFor="cat-seotitle">
//               <Input id="cat-seotitle" value={form.seoTitle} onChange={setInput("seoTitle")} maxLength={200} />
//             </Field>
//             <Field label="Meta description" htmlFor="cat-seodesc">
//               <Textarea id="cat-seodesc" value={form.seoDescription} onChange={setInput("seoDescription")} rows={3} maxLength={500} />
//             </Field>
//             <Field label="Keywords" htmlFor="cat-seokw" hint="Comma-separated.">
//               <Input id="cat-seokw" value={form.seoKeywords} onChange={setInput("seoKeywords")} placeholder="rings, gold, diamond" />
//             </Field>
//             <Field label="Canonical URL" htmlFor="cat-canon">
//               <Input id="cat-canon" value={form.seoCanonicalUrl} onChange={setInput("seoCanonicalUrl")} placeholder="https://…" maxLength={500} />
//             </Field>

//             <div className="mt-2 flex flex-col gap-4 border-t border-border pt-6">
//               <SectionHeading>Sitemap hints</SectionHeading>
//               <div className="grid gap-4 md:grid-cols-2">
//               <Field label="Priority" htmlFor="cat-priority" hint="0.0 – 1.0">
//                 <Input
//                   id="cat-priority"
//                   type="number"
//                   step="0.1"
//                   min="0"
//                   max="1"
//                   value={form.sitemapPriority}
//                   onChange={setInput("sitemapPriority")}
//                 />
//               </Field>
//               <Field label="Change frequency">
//                 <Select value={form.sitemapFrequency} onValueChange={set("sitemapFrequency")}>
//                   <SelectTrigger aria-label="Change frequency">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {SITEMAP_FREQUENCIES.map((f) => (
//                       <SelectItem key={f.value} value={f.value}>
//                         {f.label}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </Field>
//               </div>
//               <div className="flex items-center gap-3">
//                 <Switch
//                   id="cat-bots"
//                   checked={form.sitemapDisableForBots}
//                   onCheckedChange={set("sitemapDisableForBots")}
//                   aria-label="Disable for bots"
//                 />
//                 <Label htmlFor="cat-bots" className="text-sm font-normal text-muted-foreground">
//                   Disable for search-engine bots
//                 </Label>
//               </div>
//             </div>
//           </TabsContent>

//           {/* --------------------------------------------------- ADVANCED */}
//           <TabsContent value="advanced" className="mt-0 flex flex-col gap-4">
//             <SectionHeading>Visibility</SectionHeading>
//             <Field label="Substores" hint="Leave empty to show in all substores.">
//               <MultiSelect
//                 options={substoreOptions}
//                 selected={form.substoreIds}
//                 onChange={set("substoreIds")}
//                 placeholder="All substores"
//                 emptyText="No substores"
//                 onOpenChange={(open) => open && setSubstorePickerOpen(true)}
//                 loading={substoreLoading}
//                 hasMore={substoreHasMore}
//                 isLoadingMore={substoreLoadingMore}
//                 onLoadMore={() => setSubstoreSize(substoreSize + 1)}
//                 onSearch={(q) => {
//                   setSubstoreQuery(q)
//                   setSubstoreSize(1) // new query → start from the first page again
//                 }}
//               />
//             </Field>
//             <Field label="Widget" htmlFor="cat-widget" hint="Optional widget key rendered on the category page.">
//               <Input id="cat-widget" value={form.widget} onChange={setInput("widget")} maxLength={120} />
//             </Field>

//             <SectionHeading>Metafields</SectionHeading>
//             {mfDefinition?.fields?.length ? (
//               <MetafieldValuesForm definition={mfDefinition} values={mfValues} onChange={setMfValues} />
//             ) : (
//               <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
//                 No metafields are defined for categories yet. Define fields for the{" "}
//                 <span className="font-medium text-foreground">categories</span> module under Metafields, and they will
//                 appear here.
//               </p>
//             )}
//           </TabsContent>
//         </div>
//       </Tabs>
//     </form>
//   )
// }


"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ImageIcon, Loader2, Save, Trash2, Upload, X } from "lucide-react"
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
import { MetafieldValuesForm } from "@/components/hub/metafields/metafield-values-form"
import { useMetafieldDefinition } from "@/components/hub/metafields/use-metafields"
import { api, fetcher } from "@/lib/api"
import { imgUrl } from "@/Server"
import { cn } from "@/lib/utils"
import { CATEGORY_SORT_ORDERS, CATEGORY_STATUSES, SITEMAP_FREQUENCIES } from "@/lib/store-data"

const NO_PARENT = "__root__" // Select can't hold an empty-string value.

// The metafield module this editor loads the DEFINITION for. VALUES now live
// directly on the category document (`form.metafields`) and are saved in the
// category body — there is no separate metafieldValues collection round-trip.
const CATEGORY_MODULE = "categories"

const EMPTY_FORM = {
  name: "",
  alias: "",
  description: "",
  parentId: null,
  sortOrder: 0,
  isActive: true,
  status: "active",
  defaultSortOrder: "manual",
  widget: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  seoCanonicalUrl: "",
  sitemapPriority: 0.5,
  sitemapFrequency: "weekly",
  sitemapDisableForBots: false,
  substoreIds: [],
  // StoreHippo-style keyed object of definition-driven values, embedded on the
  // category doc (NOT a legacy [{key,value}] array).
  metafields: {},
}

function docToForm(doc) {
  if (!doc) return EMPTY_FORM
  return {
    name: doc.name ?? "",
    alias: doc.alias ?? "",
    description: doc.description ?? "",
    parentId: doc.parentId ? String(doc.parentId) : null,
    sortOrder: doc.sortOrder ?? 0,
    isActive: doc.isActive !== false,
    status: doc.status ?? "active",
    defaultSortOrder: doc.defaultSortOrder ?? "manual",
    widget: doc.widget ?? "",
    seoTitle: doc.seo?.title ?? "",
    seoDescription: doc.seo?.description ?? "",
    seoKeywords: (doc.seo?.keywords ?? []).join(", "),
    seoCanonicalUrl: doc.seo?.canonicalUrl ?? "",
    sitemapPriority: doc.sitemap?.priority ?? 0.5,
    sitemapFrequency: doc.sitemap?.frequency ?? "weekly",
    sitemapDisableForBots: Boolean(doc.sitemap?.disableForBots),
    substoreIds: (doc.substoreIds ?? []).map(String),
    // Read the embedded keyed object straight off the category doc. Guard
    // against a legacy array shape from pre-migration records.
    metafields: doc.metafields && !Array.isArray(doc.metafields) ? doc.metafields : {},
  }
}

function num(value, fallback) {
  if (value === "" || value === null || value === undefined) return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

// Shared bit of payload for both create & update (parent goes through /move).
function formToBasePayload(form, images) {
  return {
    name: form.name.trim(),
    alias: form.alias.trim() || undefined,
    description: form.description ?? "",
    images,
    sortOrder: num(form.sortOrder, 0),
    isActive: form.isActive,
    status: form.status,
    defaultSortOrder: form.defaultSortOrder,
    widget: form.widget.trim() || null,
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
    // Embedded metafields ride along in the body; the server validates +
    // coerces them against the live ms.categories definition.
    metafields: form.metafields ?? {},
  }
}

/**
 * Auto-generate an alias slug from the name, matching the backend rule
 * (lowercase, hyphenated, only [a-z0-9-]).
 */
function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Given the flat category list and a node id, return the set of ids that must
 * be excluded from the Parent picker: the node itself plus its whole subtree.
 */
function collectSubtreeIds(flat, rootId) {
  const excluded = new Set([String(rootId)])
  let changed = true
  while (changed) {
    changed = false
    for (const c of flat) {
      const pid = c.parentId ? String(c.parentId) : null
      if (pid && excluded.has(pid) && !excluded.has(String(c._id))) {
        excluded.add(String(c._id))
        changed = true
      }
    }
  }
  return excluded
}

// Build depth-ordered options ("└ " indent per level) from the flat list.
function buildParentOptions(flat, excluded) {
  const byParent = new Map()
  for (const c of flat) {
    const pid = c.parentId ? String(c.parentId) : "root"
    if (!byParent.has(pid)) byParent.set(pid, [])
    byParent.get(pid).push(c)
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
  }
  const out = []
  const walk = (pid, depth) => {
    for (const c of byParent.get(pid) ?? []) {
      if (excluded.has(String(c._id))) continue
      out.push({ value: String(c._id), label: `${"\u00A0\u00A0".repeat(depth)}${depth ? "\u2514 " : ""}${c.name}` })
      walk(String(c._id), depth + 1)
    }
  }
  walk("root", 0)
  return out
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
          <img src={preview || "/placeholder.svg"} alt="Category preview" className="max-h-28 max-w-full object-contain" />
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
        aria-label="Upload category image"
      />
    </div>
  )
}

/**
 * Inline create / edit panel for a Category. Rendered in the right pane of the
 * categories page (StoreHippo-style two-pane manager). The parent remounts this
 * component with a fresh `key` on each selection, so state simply initializes
 * from props — no open/close lifecycle to track.
 *
 * Parent selection is only sent on CREATE; on EDIT a changed parent is routed
 * through the dedicated PATCH /:id/move endpoint so the server can safely
 * recompute the moved subtree.
 */
export function CategoryEditor({ categoryId, initialParentId, onSaved, onCancel }) {
  const isEdit = Boolean(categoryId)
  const [form, setForm] = useState({ ...EMPTY_FORM, parentId: initialParentId ?? null })
  // Committed images (each a saved { url } or freshly picked { dataUrl }). These
  // render as rows in the images table below the upload area. `selectedImage`
  // is the row currently loaded into the upload area for replace/remove; when
  // null the upload area is an empty dropzone that appends a new image.
  const [images, setImages] = useState([])
  const [selectedImage, setSelectedImage] = useState(null)
  const [originalParentId, setOriginalParentId] = useState(initialParentId ?? null)
  const [aliasTouched, setAliasTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState("general")

  // The full flat tree is only needed to render the Parent picker's indented
  // options (and to exclude the current subtree). Defer downloading it until the
  // picker is actually opened. On EDIT we still fetch once we know the category
  // has a parent, so its label renders in the closed trigger.
  const [parentPickerOpen, setParentPickerOpen] = useState(false)
  const needsFlat = parentPickerOpen || Boolean(originalParentId)
  const { data: flatData } = useSWR(needsFlat ? "/seller/categories?flat=true" : null, fetcher, {
    revalidateOnFocus: false,
  })
  const flat = flatData?.rows ?? []

  // Substores are loaded 5 at a time and appended as the picker is scrolled.
  // Nothing is fetched while the category loads — the request only fires once
  // the picker is actually opened, and hits a lean /options endpoint that
  // returns just _id/name/alias.
  const SUBSTORE_PAGE_SIZE = 5
  const [substoreQuery, setSubstoreQuery] = useState("")
  const [substorePickerOpen, setSubstorePickerOpen] = useState(false)
  const getSubstoreKey = (index, prev) => {
    if (!substorePickerOpen) return null // lazy: don't fetch until opened
    // Stop once the previous page returned fewer rows than a full page.
    if (prev && prev.rows.length < SUBSTORE_PAGE_SIZE) return null
    const params = new URLSearchParams({
      page: String(index + 1),
      limit: String(SUBSTORE_PAGE_SIZE),
    })
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
  const substoreOptions = substoreRows.map((s) => ({
    value: String(s._id),
    label: s.name,
    sublabel: s.alias,
  }))
  const substoreHasMore = substoreOptions.length < substoreTotal
  const substoreLoadingMore =
    substoreValidating && substorePages && substoreSize > substorePages.length

  // Load the category via SWR so React StrictMode's double-mount (and any
  // remount) is deduped into a SINGLE network request instead of two.
  const { data: detailData, error: detailError } = useSWR(
    isEdit ? `/seller/categories/${categoryId}` : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const loading = isEdit && !detailData && !detailError

  // Metafields: load ONLY the ms.categories DEFINITION (the schema this editor
  // renders). The actual VALUES live on `form.metafields` and are seeded from
  // the category doc + saved in the category body — no separate values endpoint.
  const { definition: mfDefinition } = useMetafieldDefinition(CATEGORY_MODULE)

  useEffect(() => {
    if (detailError) toast.error(detailError.message || "Failed to load category")
  }, [detailError])

  useEffect(() => {
    const category = detailData?.category
    if (!category) return
    setForm(docToForm(category))
    setAliasTouched(true) // don't auto-overwrite an existing slug
    setImages((category.images ?? []).map((i) => ({ url: i.url, dataUrl: null })))
    setSelectedImage(null)
    setOriginalParentId(category.parentId ? String(category.parentId) : null)
  }, [detailData])

  const setInput = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  // Keep the alias auto-synced to the name until the user edits it directly.
  function onNameChange(e) {
    const name = e.target.value
    setForm((f) => ({ ...f, name, alias: aliasTouched ? f.alias : slugify(name) }))
  }
  function onAliasChange(e) {
    setAliasTouched(true)
    setForm((f) => ({ ...f, alias: e.target.value }))
  }

  const parentOptions = useMemo(() => {
    const excluded = isEdit ? collectSubtreeIds(flat, categoryId) : new Set()
    return buildParentOptions(flat, excluded)
  }, [flat, isEdit, categoryId])

  function imagesPayload() {
    return images
      .map((img) => (img.dataUrl ? { dataUrl: img.dataUrl } : img.url ? { url: img.url } : null))
      .filter(Boolean)
  }

  // Upload-area pick handler. With no row selected, a pick appends a new image;
  // with a row selected, a pick replaces that row and null (Remove) deletes it.
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
    // Keep selection pointing at the right row after a splice.
    setSelectedImage((sel) => (sel === null ? null : sel === index ? null : sel > index ? sel - 1 : sel))
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
      const base = formToBasePayload(form, imagesPayload())
      if (isEdit) {
        // metafields ride along in `base` and are validated + embedded on the
        // category server-side.
        await api.patch(`/seller/categories/${categoryId}`, base)
        const nextParent = form.parentId ?? null
        if (nextParent !== originalParentId) {
          await api.patch(`/seller/categories/${categoryId}/move`, { parentId: nextParent })
        }
        toast.success("Category updated")
      } else {
        await api.post("/seller/categories", { ...base, parentId: form.parentId ?? null })
        toast.success("Category created")
      }
      onSaved?.({ parentId: form.parentId ?? null, originalParentId })
    } catch (err) {
      toast.error(err.message || "Failed to save category")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading category" />
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex h-full min-h-0 flex-col">
      {/* Header: title + Save / Cancel (mirrors the reference layout) */}
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground md:text-xl">
          {isEdit ? "Edit Category" : "Add Category"}
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
                <Field label="Name" htmlFor="cat-name">
                  <Input
                    id="cat-name"
                    value={form.name}
                    onChange={onNameChange}
                    placeholder="e.g. Consumables"
                    required
                    maxLength={160}
                    aria-required="true"
                  />
                </Field>
                <Field
                  label="Alias"
                  htmlFor="cat-alias"
                  hint="Only lowercase letters, numbers, and hyphens allowed."
                >
                  <Input
                    id="cat-alias"
                    value={form.alias}
                    onChange={onAliasChange}
                    placeholder="consumables"
                    maxLength={200}
                  />
                </Field>
              </div>

              <Field label="Parent Category">
                <Select
                  value={form.parentId ?? NO_PARENT}
                  onValueChange={(v) => set("parentId")(v === NO_PARENT ? null : v)}
                  onOpenChange={(open) => open && setParentPickerOpen(true)}
                >
                  <SelectTrigger aria-label="Parent category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PARENT}>No Parent</SelectItem>
                    {parentOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Description" htmlFor="cat-desc">
                <RichTextEditor
                  id="cat-desc"
                  value={form.description}
                  onChange={set("description")}
                  maxLength={8000}
                  minHeight={140}
                  placeholder="Enter category description…"
                  ariaLabel="Category description"
                />
              </Field>

              <div className="flex items-center gap-3">
                <Switch id="cat-active" checked={form.isActive} onCheckedChange={set("isActive")} aria-label="Active" />
                <Label htmlFor="cat-active" className="text-sm font-medium text-foreground">
                  Active
                </Label>
                <span className="text-sm text-muted-foreground">(Inactive categories are hidden from users)</span>
              </div>
            </div>

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
                                  alt={`Category image ${index + 1}`}
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
                <Field label="Sort order" htmlFor="cat-sort">
                  <Input id="cat-sort" type="number" min={0} value={form.sortOrder} onChange={setInput("sortOrder")} />
                </Field>
                <Field label="Status">
                  <Select value={form.status} onValueChange={set("status")}>
                    <SelectTrigger aria-label="Status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Default product sort order" hint="How products in this category are ordered on the storefront.">
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
          </TabsContent>

          {/* -------------------------------------------------------- SEO */}
          <TabsContent value="seo" className="mt-0 flex flex-col gap-4">
            <SectionHeading>Search engine listing</SectionHeading>
            <Field label="SEO title" htmlFor="cat-seotitle">
              <Input id="cat-seotitle" value={form.seoTitle} onChange={setInput("seoTitle")} maxLength={200} />
            </Field>
            <Field label="Meta description" htmlFor="cat-seodesc">
              <Textarea id="cat-seodesc" value={form.seoDescription} onChange={setInput("seoDescription")} rows={3} maxLength={500} />
            </Field>
            <Field label="Keywords" htmlFor="cat-seokw" hint="Comma-separated.">
              <Input id="cat-seokw" value={form.seoKeywords} onChange={setInput("seoKeywords")} placeholder="rings, gold, diamond" />
            </Field>
            <Field label="Canonical URL" htmlFor="cat-canon">
              <Input id="cat-canon" value={form.seoCanonicalUrl} onChange={setInput("seoCanonicalUrl")} placeholder="https://…" maxLength={500} />
            </Field>

            <div className="mt-2 flex flex-col gap-4 border-t border-border pt-6">
              <SectionHeading>Sitemap hints</SectionHeading>
              <div className="grid gap-4 md:grid-cols-2">
              <Field label="Priority" htmlFor="cat-priority" hint="0.0 – 1.0">
                <Input
                  id="cat-priority"
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={form.sitemapPriority}
                  onChange={setInput("sitemapPriority")}
                />
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
                <Switch
                  id="cat-bots"
                  checked={form.sitemapDisableForBots}
                  onCheckedChange={set("sitemapDisableForBots")}
                  aria-label="Disable for bots"
                />
                <Label htmlFor="cat-bots" className="text-sm font-normal text-muted-foreground">
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
                  setSubstoreSize(1) // new query → start from the first page again
                }}
              />
            </Field>
            <Field label="Widget" htmlFor="cat-widget" hint="Optional widget key rendered on the category page.">
              <Input id="cat-widget" value={form.widget} onChange={setInput("widget")} maxLength={120} />
            </Field>

            <SectionHeading>Metafields</SectionHeading>
            {mfDefinition?.fields?.length ? (
              <MetafieldValuesForm definition={mfDefinition} values={form.metafields} onChange={set("metafields")} />
            ) : (
              <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
                No metafields are defined for categories yet. Define fields for the{" "}
                <span className="font-medium text-foreground">categories</span> module under Metafields, and they will
                appear here.
              </p>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </form>
  )
}
