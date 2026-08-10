"use client"

import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  ImageOff,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import useSWR, { useSWRConfig } from "swr"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { api, fetcher } from "@/lib/api"
import { imgUrl } from "@/Server"
import { ProductImageGalleryDialog } from "@/components/hub/products/product-image-gallery-dialog"

/**
 * /hub/products — advanced product data table. A search box that spans every
 * tab, four status tabs, and a table with multi-select, a left-aligned image
 * thumbnail + count, sortable columns, a Variants badge, a status pill and
 * inline View / Edit / Delete row actions. The footer holds the selection
 * count, a "Show deleted" toggle, a rows-per-page selector, pagination and a
 * bulk-delete button.
 */

const TABS = [
  { value: "published", label: "Published" },
  { value: "unpublished", label: "Unpublished" },
  { value: "pending", label: "Pending Approval" },
  { value: "rejected", label: "Rejected" },
]

const APPROVE_BADGE = {
  approved: { label: "approved", className: "bg-foreground text-background" },
  pending: { label: "pending", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  rejected: { label: "rejected", className: "bg-destructive/15 text-destructive" },
}

const PAGE_SIZES = [10, 20, 50, 100]

// Column sort keys the backend understands (see product.service.js SORTS).
const SORTABLE = { name: "name", price: "price" }

export default function HubProductsPage() {
  const navigate = useNavigate()
  const { mutate: globalMutate } = useSWRConfig()

  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("published")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sort, setSort] = useState({ key: "", dir: "asc" })
  const [showDeleted, setShowDeleted] = useState(false)
  const [selected, setSelected] = useState(() => new Set())
  const [deleteTarget, setDeleteTarget] = useState(null) // row | "bulk"
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [galleryTarget, setGalleryTarget] = useState(null)

  const q = useDebouncedValue(search, 300)
  const searching = Boolean(q.trim())

  const params = new URLSearchParams()
  if (searching) params.set("q", q.trim())
  else params.set("tab", tab)
  params.set("page", String(page))
  params.set("limit", String(pageSize))
  if (sort.key) params.set("sort", `${sort.dir === "desc" ? "-" : ""}${SORTABLE[sort.key]}`)
  if (showDeleted) params.set("deleted", "true")

  const { data, isLoading } = useSWR(`/seller/products?${params}`, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })
  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  const allChecked = rows.length > 0 && rows.every((r) => selected.has(r._id))
  const someChecked = rows.some((r) => selected.has(r._id))
  const selectedCount = selected.size

  const selectAllState = useMemo(() => {
    if (allChecked) return true
    if (someChecked) return "indeterminate"
    return false
  }, [allChecked, someChecked])

  function refreshList() {
    globalMutate((key) => typeof key === "string" && key.startsWith("/seller/products"))
  }

  // Reset paging / selection whenever the query scope changes.
  function resetScope(fn) {
    return (...args) => {
      fn(...args)
      setPage(1)
      setSelected(new Set())
    }
  }

  function toggleSort(key) {
    setSort((s) => {
      if (s.key !== key) return { key, dir: "asc" }
      if (s.dir === "asc") return { key, dir: "desc" }
      return { key: "", dir: "asc" }
    })
    setPage(1)
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allChecked) rows.forEach((r) => next.delete(r._id))
      else rows.forEach((r) => next.add(r._id))
      return next
    })
  }

  function toggleRow(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function togglePublish(row) {
    setTogglingId(row._id)
    try {
      await api.patch(`/seller/products/${row._id}`, { isPublished: !row.isPublished })
      refreshList()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setTogglingId(null)
    }
  }

  async function restore(row) {
    try {
      await api.post(`/seller/products/${row._id}/restore`)
      toast.success(`Restored ${row.name}`)
      refreshList()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget === "bulk") {
        const ids = [...selected]
        await Promise.all(ids.map((id) => api.delete(`/seller/products/${id}`)))
        toast.success(`Deleted ${ids.length} product${ids.length === 1 ? "" : "s"}`)
        setSelected(new Set())
      } else {
        await api.delete(`/seller/products/${deleteTarget._id}`)
        toast.success(`Deleted ${deleteTarget.name}`)
        setSelected((prev) => {
          const next = new Set(prev)
          next.delete(deleteTarget._id)
          return next
        })
      }
      setDeleteTarget(null)
      refreshList()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    { key: "images", label: "Images", sortable: false },
    { key: "name", label: "Name", sortable: true },
    { key: "sku", label: "SKU", sortable: false },
    { key: "price", label: "Price", sortable: true },
    { key: "variants", label: "Variants", sortable: false },
    { key: "status", label: "Status", sortable: false },
    { key: "actions", label: "Row Actions", sortable: false },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* -------------------------------------------------------- header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground text-balance">Products</h1>
          <Badge variant="secondary" className="rounded-full tabular-nums">
            {total}
          </Badge>
        </div>
        <Button onClick={() => navigate("/hub/products/create")}>
          <Plus className="size-4" aria-hidden="true" />
          Add New
        </Button>
      </header>

      {/* --------------------------------------------------- tabs + search */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <Tabs value={searching ? "" : tab} onValueChange={resetScope(setTab)}>
          <TabsList className="flex-wrap">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

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
            placeholder="Search by Name, SKU, Alias..."
            className="h-9 pl-8"
            aria-label="Search products"
          />
        </div>

        {/* ---------------------------------------------------------- table */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="w-10 px-4 py-2.5">
                  <Checkbox
                    checked={selectAllState}
                    onCheckedChange={toggleAll}
                    aria-label="Select all rows on this page"
                    disabled={rows.length === 0}
                  />
                </th>
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
                    <td className="px-4 py-3"><Skeleton className="size-4 rounded" /></td>
                    <td className="px-4 py-3"><Skeleton className="size-14 rounded-md" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-16 rounded-md" /></td>
                    <td className="px-4 py-3"><Skeleton className="ml-auto h-8 w-40 rounded-md" /></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-4 py-16">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Package className="size-8 text-muted-foreground" aria-hidden="true" />
                      <p className="text-sm text-muted-foreground">
                        {showDeleted
                          ? "No deleted products."
                          : searching
                            ? "No products match your search."
                            : "No products in this view yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const badge = APPROVE_BADGE[row.approve] ?? APPROVE_BADGE.pending
                  const isSelected = selected.has(row._id)
                  const variantCount = row.variantCount ?? 0
                  return (
                    <tr
                      key={row._id}
                      className={`border-b border-border transition-colors last:border-0 hover:bg-muted/40 ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3 align-middle">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleRow(row._id)}
                          aria-label={`Select ${row.name}`}
                        />
                      </td>

                      {/* Images (left) */}
                      <td className="px-4 py-3 align-middle">
                        {row.thumbnail ? (
                          <button
                            type="button"
                            onClick={() => setGalleryTarget(row)}
                            className="relative block size-14 rounded-md transition-shadow hover:ring-2 hover:ring-primary/40"
                            aria-label={`View ${row.imageCount ?? 1} image${(row.imageCount ?? 1) === 1 ? "" : "s"} of ${row.name}`}
                          >
                            <img
                              src={imgUrl(row.thumbnail) || "/placeholder.svg"}
                              alt=""
                              className="size-full overflow-hidden rounded-md border border-border bg-muted object-cover"
                            />
                            {row.imageCount > 1 && (
                              <span className="absolute -right-1.5 -top-1.5 z-10 rounded-full bg-foreground px-1.5 text-[10px] font-medium leading-4 text-background shadow-md ring-2 ring-background">
                                +{row.imageCount - 1}
                              </span>
                            )}
                          </button>
                        ) : (
                          <div className="flex size-14 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                            <ImageOff className="size-4 text-muted-foreground" aria-hidden="true" />
                          </div>
                        )}
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3 align-middle">
                        <button
                          type="button"
                          onClick={() => navigate(`/hub/products/${row._id}/edit`)}
                          className="text-left font-medium text-foreground hover:underline"
                        >
                          {row.name}
                        </button>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3 align-middle text-xs text-muted-foreground">
                        {row.sku || "—"}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3 align-middle font-medium tabular-nums text-foreground">
                        ${Number(row.price ?? 0).toFixed(2)}
                      </td>

                      {/* Variants */}
                      <td className="px-4 py-3 align-middle">
                        {variantCount > 0 ? (
                          <Badge variant="outline" className="rounded-md font-normal tabular-nums">
                            {variantCount} Variant{variantCount === 1 ? "" : "s"}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 align-middle">
                        <Badge className={`rounded-md font-medium capitalize hover:bg-current/90 ${badge.className}`}>
                          {badge.label}
                        </Badge>
                      </td>

                      {/* Row Actions */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center justify-end gap-2">
                          {showDeleted ? (
                            <Button variant="outline" size="sm" onClick={() => restore(row)}>
                              <RotateCcw className="size-4" aria-hidden="true" />
                              Restore
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/hub/products/${row._id}`)}
                              >
                                <Eye className="size-4" aria-hidden="true" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/hub/products/${row._id}/edit`)}
                              >
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
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ---------------------------------------------------------- footer */}
        <div className="flex flex-col gap-4 pt-1 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm text-muted-foreground tabular-nums">
              {selectedCount} of {total} row(s) selected.
            </p>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch
                checked={showDeleted}
                onCheckedChange={resetScope((v) => setShowDeleted(v))}
                aria-label="Show deleted products"
              />
              Show deleted
            </label>
            {selectedCount > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteTarget("bulk")}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete ({selectedCount})
              </Button>
            )}
          </div>

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
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <span className="px-2 text-sm text-muted-foreground tabular-nums">
                Page {page} of {pageCount}
              </span>
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

      <ProductImageGalleryDialog
        open={Boolean(galleryTarget)}
        onOpenChange={(v) => !v && setGalleryTarget(null)}
        title={galleryTarget?.name}
        images={galleryTarget?.images ?? []}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {deleteTarget === "bulk"
                ? `Delete ${selectedCount} product${selectedCount === 1 ? "" : "s"}?`
                : `Delete ${deleteTarget?.name}?`}
            </DialogTitle>
            <DialogDescription>
              This moves {deleteTarget === "bulk" ? "these products" : "the product"} to the trash.
              You can restore {deleteTarget === "bulk" ? "them" : "it"} later from the deleted view.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
