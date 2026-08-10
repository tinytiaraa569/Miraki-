"use client"

import { useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ImageOff,
  List,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { api, fetcher } from "@/lib/api"
import { imgUrl } from "@/Server"
import { CreateProductVariantSheet } from "@/components/hub/products/create-product-variant-sheet"
import { ProductImageGalleryDialog } from "@/components/hub/products/product-image-gallery-dialog"

const PAGE_SIZES = [10, 20, 50, 100]

// Sort keys the aggregation endpoint understands (product.validation.js).
const SORTABLE = { price: "price", createdAt: "createdAt", updatedAt: "updatedAt" }

/**
 * /hub/products/variants — every latest variant across all products, served by
 * the backend aggregation pipeline (listAllVariants) that joins each variant to
 * its parent product for name / SKU / thumbnail. Add opens a right-side sheet
 * (product picker → variant config) that can never create a duplicate combo.
 */
export default function HubProductVariantsPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" })
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [galleryTarget, setGalleryTarget] = useState(null)

  const q = useDebouncedValue(search, 300)

  const params = new URLSearchParams()
  if (q.trim()) params.set("q", q.trim())
  params.set("page", String(page))
  params.set("limit", String(pageSize))
  params.set("sort", `${sort.dir === "desc" ? "-" : ""}${SORTABLE[sort.key] ?? "createdAt"}`)

  const { data, isLoading, mutate } = useSWR(`/seller/products/variants?${params}`, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  function toggleSort(key) {
    setSort((s) => {
      if (s.key !== key) return { key, dir: "asc" }
      if (s.dir === "asc") return { key, dir: "desc" }
      return { key: "createdAt", dir: "desc" }
    })
    setPage(1)
  }

  function openCreate() {
    setEditTarget(null)
    setSheetOpen(true)
  }

  function openEdit(row) {
    setEditTarget({ productId: row.productId, variant: row })
    setSheetOpen(true)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/seller/products/${deleteTarget.productId}/variants/${deleteTarget._id}`)
      toast.success("Variant deleted")
      setDeleteTarget(null)
      mutate()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: "image", label: "Image", sortable: false },
    { key: "product", label: "Product", sortable: false },
    { key: "options", label: "Options", sortable: false },
    { key: "sku", label: "SKU", sortable: false },
    { key: "price", label: "Price", sortable: true },
    { key: "available", label: "Stock", sortable: false },
    { key: "actions", label: "Row Actions", sortable: false },
  ]

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-balance text-foreground">Product Variants</h1>
          <Badge variant="secondary" className="rounded-full tabular-nums">
            {total}
          </Badge>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" aria-hidden="true" />
          Add Variant
        </Button>
      </header>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by product, SKU or option value…"
            className="h-9 pl-8"
            aria-label="Search variants"
          />
        </div>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-2.5 ${col.key === "actions" ? "text-right" : ""}`}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex items-center gap-1.5 uppercase tracking-wide transition-colors hover:text-foreground"
                      >
                        {col.label}
                        {sort.key === col.key ? (
                          sort.dir === "asc" ? (
                            <ArrowUp className="size-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowDown className="size-3.5" aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3.5 opacity-50" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && rows.length === 0 ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-3"><Skeleton className="size-14 rounded-md" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-4 py-3"><Skeleton className="ml-auto h-8 w-28 rounded-md" /></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-16">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <List className="size-8 text-muted-foreground" aria-hidden="true" />
                      <p className="text-sm text-muted-foreground">
                        {q.trim() ? "No variants match your search." : "No product variants yet."}
                      </p>
                      {!q.trim() && (
                        <Button variant="outline" size="sm" onClick={openCreate}>
                          <Plus className="size-3.5" aria-hidden="true" />
                          Create your first variant
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  // A variant's OWN gallery (array of { url }); fall back to the
                  // legacy single image and finally the parent product thumbnail.
                  const galleryImages = (row.images ?? [])
                    .map((i) => i?.url)
                    .filter(Boolean)
                  if (galleryImages.length === 0 && row.image) galleryImages.push(row.image)
                  const thumb = galleryImages[0] || row.productThumbnail
                  const imageCount = galleryImages.length
                  return (
                    <tr
                      key={row._id}
                      className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 align-middle">
                        {thumb ? (
                          <button
                            type="button"
                            onClick={() =>
                              setGalleryTarget({
                                title: row.productName,
                                images: galleryImages.length ? galleryImages : [thumb],
                              })
                            }
                            className="relative block size-14 rounded-md transition-shadow hover:ring-2 hover:ring-primary/40"
                            aria-label={`View ${Math.max(imageCount, 1)} image${Math.max(imageCount, 1) === 1 ? "" : "s"} of ${row.productName || "variant"}`}
                          >
                            <img
                              src={imgUrl(thumb) || "/placeholder.svg"}
                              alt=""
                              className="size-full overflow-hidden rounded-md border border-border bg-muted object-cover"
                            />
                            {imageCount > 1 && (
                              <span className="absolute -right-1.5 -top-1.5 z-10 rounded-full bg-foreground px-1.5 text-[10px] font-medium leading-4 text-background shadow-md ring-2 ring-background">
                                +{imageCount - 1}
                              </span>
                            )}
                          </button>
                        ) : (
                          <div className="flex size-14 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                            <ImageOff className="size-4 text-muted-foreground" aria-hidden="true" />
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <span className="font-medium text-foreground">{row.productName || "—"}</span>
                        {row.productSku && (
                          <span className="block text-xs text-muted-foreground">{row.productSku}</span>
                        )}
                      </td>

                      <td className="px-4 py-3 align-middle">
                        {row.options?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {row.options.map((o) => (
                              <Badge
                                key={`${o.name}:${o.value}`}
                                variant="outline"
                                className="rounded-md font-normal"
                              >
                                <span className="text-muted-foreground">{o.name}:</span>&nbsp;{o.value}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Default</span>
                        )}
                      </td>

                      <td className="px-4 py-3 align-middle text-xs text-muted-foreground">
                        {row.sku || "—"}
                      </td>

                      <td className="px-4 py-3 align-middle font-medium tabular-nums text-foreground">
                        ${Number(row.price ?? 0).toFixed(2)}
                      </td>

                      <td className="px-4 py-3 align-middle tabular-nums text-muted-foreground">
                        {row.inventoryManagement === "none" ? "—" : row.available ?? 0}
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                            <Pencil className="size-4" aria-hidden="true" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteTarget(row)}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* footer */}
        <div className="flex flex-col gap-4 pt-1 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-muted-foreground tabular-nums">
            {total} variant{total === 1 ? "" : "s"} total
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v))
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-8 w-[72px]" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-muted-foreground tabular-nums">
              Page {page} of {pageCount}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                aria-label="First page"
              >
                <ChevronsLeft className="size-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setPage(pageCount)}
                disabled={page >= pageCount}
                aria-label="Last page"
              >
                <ChevronsRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <CreateProductVariantSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editTarget={editTarget}
        onSaved={() => mutate()}
      />

      <ProductImageGalleryDialog
        open={Boolean(galleryTarget)}
        onOpenChange={(v) => !v && setGalleryTarget(null)}
        title={galleryTarget?.title}
        images={galleryTarget?.images ?? []}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete variant?</DialogTitle>
            <DialogDescription>
              This permanently removes the variant
              {deleteTarget?.productName ? ` from ${deleteTarget.productName}` : ""}. This can&apos;t be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
