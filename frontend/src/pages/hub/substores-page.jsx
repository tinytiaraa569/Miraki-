"use client"

import { useMemo, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Globe,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Store,
  Trash2,
  Wrench,
} from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SubstoreFormSheet } from "@/components/hub/substore-form-sheet"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { imgUrl } from "@/Server"
import { api, fetcher } from "@/lib/api"
import { COUNTRIES, SUBSTORE_STATUSES } from "@/lib/store-data"

const COUNTRY_NAME = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.name]))
const PAGE_SIZES = [10, 20, 50]

const STATUS_STYLES = {
  active: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  inactive: "border-transparent bg-muted text-muted-foreground",
  maintenance: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
}

/**
 * Row thumbnail for a substore. `logoUrl` is often a relative path stored in
 * the DB, so we resolve it through `imgUrl` (which prefixes IMGDB_URL). Falls
 * back to the Store icon when there's no logo or the image fails to load.
 */
function SubstoreLogo({ logoUrl }) {
  const [failed, setFailed] = useState(false)
  const src = failed ? null : imgUrl(logoUrl)
  return (
    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
      {src ? (
        <img
          src={src || "/placeholder.svg"}
          alt=""
          className="size-full object-contain"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <Store className="size-4 text-muted-foreground" aria-hidden="true" />
      )}
    </div>
  )
}

/** Column header button that cycles server-side sorting. */
function SortHeader({ label, field, sort, onSort }) {
  const active = sort === field || sort === `-${field}`
  const desc = sort === `-${field}`
  return (
    <button
      type="button"
      className="flex items-center gap-1 text-xs font-medium hover:text-foreground"
      onClick={() => onSort(active && !desc ? `-${field}` : field)}
    >
      {label}
      {active ? (
        desc ? (
          <ArrowDown className="size-3" aria-hidden="true" />
        ) : (
          <ArrowUp className="size-3" aria-hidden="true" />
        )
      ) : (
        <ArrowUpDown className="size-3 opacity-40" aria-hidden="true" />
      )}
    </button>
  )
}

/**
 * Builds the visible page-number buttons: always first & last, a window
 * around the current page, and "…" gaps. e.g. [1, "…", 4, 5, 6, "…", 12]
 */
function pageItems(page, pageCount) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const items = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(pageCount - 1, page + 1)
  if (start > 2) items.push("…")
  for (let p = start; p <= end; p++) items.push(p)
  if (end < pageCount - 1) items.push("…")
  items.push(pageCount)
  return items
}

/** /hub/stores/substores — Substores list (TanStack table, server-driven). */
export function HubSubstoresPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [sort, setSort] = useState("sortOrder")
  const [rowSelection, setRowSelection] = useState({})
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null) // single doc or "bulk"
  const [deleting, setDeleting] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [restoring, setRestoring] = useState(false)

  const q = useDebouncedValue(search, 300)

  const params = new URLSearchParams({ page: String(page), limit: String(limit), sort })
  if (q.trim()) params.set("q", q.trim())
  if (status !== "all") params.set("status", status)
  if (showDeleted) params.set("deleted", "true")

  const { data, isLoading, error, mutate } = useSWR(`/seller/substores?${params}`, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / limit))

  const columns = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(Boolean(v))}
            aria-label="Select all rows"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(Boolean(v))}
            aria-label={`Select ${row.original.name}`}
          />
        ),
        size: 32,
      },
      {
        accessorKey: "name",
        header: () => <SortHeader label="Name" field="name" sort={sort} onSort={handleSort} />,
        cell: ({ row }) => {
          const doc = row.original
          return (
            <div className="flex items-center gap-3">
              <SubstoreLogo logoUrl={doc.logoUrl} />
              <div className="flex min-w-0 flex-col">
                <span className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
                  {doc.name}
                  {doc.isDefault && (
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                      Default
                    </Badge>
                  )}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {doc.alias ? `/${doc.alias}` : doc.storeName || "—"}
                </span>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "countryCodes",
        header: "Countries",
        cell: ({ row }) => {
          const codes = row.original.countryCodes ?? []
          if (codes.length === 0) return <span className="text-xs text-muted-foreground">All countries</span>
          const shown = codes.slice(0, 3)
          return (
            <div className="flex flex-wrap items-center gap-1">
              {shown.map((code) => (
                <Badge key={code} variant="secondary" className="h-5 px-1.5 text-[10px]" title={COUNTRY_NAME[code]}>
                  {code}
                </Badge>
              ))}
              {codes.length > 3 && (
                <span className="text-xs text-muted-foreground">+{codes.length - 3}</span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: "currency",
        header: "Currency",
        cell: ({ row }) => (
          <span className="text-sm text-foreground">{row.original.currency || "—"}</span>
        ),
      },
      {
        accessorKey: "defaultLanguage",
        header: "Language",
        cell: ({ row }) => (
          <span className="text-sm uppercase text-foreground">{row.original.defaultLanguage || "—"}</span>
        ),
      },
      {
        accessorKey: "sortOrder",
        header: () => <SortHeader label="Sort" field="sortOrder" sort={sort} onSort={handleSort} />,
        cell: ({ row }) => <span className="text-sm tabular-nums text-muted-foreground">{row.original.sortOrder}</span>,
        size: 60,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const doc = row.original
          if (doc.isDeleted || doc.deletedAt) {
            return (
              <Badge variant="outline" className="border-transparent bg-destructive/10 text-destructive">
                Deleted
              </Badge>
            )
          }
          const value = doc.maintenanceMode ? "maintenance" : doc.status
          return (
            <Badge variant="outline" className={`capitalize ${STATUS_STYLES[value] ?? ""}`}>
              {value === "maintenance" && <Wrench className="size-3" aria-hidden="true" />}
              {value}
            </Badge>
          )
        },
      },
      {
        id: "actions",
        header: "",
        size: 40,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${row.original.name}`}>
                <MoreHorizontal className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {showDeleted ? (
                <>
                  <DropdownMenuItem onClick={() => restoreOne(row.original)}>
                    <ArchiveRestore className="size-4" aria-hidden="true" />
                    Restore
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(row.original)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete permanently
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => openEdit(row.original._id)}>
                    <Pencil className="size-4" aria-hidden="true" />
                    Edit
                  </DropdownMenuItem>
                  {!row.original.isDefault && (
                    <DropdownMenuItem onClick={() => makeDefault(row.original)}>
                      <Globe className="size-4" aria-hidden="true" />
                      Make default
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(row.original)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sort, showDeleted],
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row._id,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  })

  function handleSort(next) {
    setSort(next)
    setPage(1)
  }

  function openCreate() {
    setEditingId(null)
    setSheetOpen(true)
  }

  function openEdit(id) {
    setEditingId(id)
    setSheetOpen(true)
  }

  async function makeDefault(doc) {
    try {
      await api.patch(`/seller/substores/${doc._id}`, { isDefault: true })
      toast.success(`${doc.name} is now the default substore`)
      mutate()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function restoreOne(doc) {
    try {
      await api.post(`/seller/substores/${doc._id}/restore`)
      toast.success(`Restored ${doc.name}`)
      mutate()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function restoreSelected() {
    setRestoring(true)
    try {
      const ids = Object.keys(rowSelection)
      await Promise.all(ids.map((id) => api.post(`/seller/substores/${id}/restore`)))
      toast.success(`Restored ${ids.length} substore${ids.length === 1 ? "" : "s"}`)
      setRowSelection({})
      mutate()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setRestoring(false)
    }
  }

  async function confirmDelete() {
    setDeleting(true)
    // In the trash view, delete means permanent destroy; otherwise soft delete.
    const suffix = showDeleted ? "?permanent=true" : ""
    try {
      if (deleteTarget === "bulk") {
        const ids = Object.keys(rowSelection)
        await Promise.all(ids.map((id) => api.delete(`/seller/substores/${id}${suffix}`)))
        toast.success(
          `${showDeleted ? "Permanently deleted" : "Deleted"} ${ids.length} substore${ids.length === 1 ? "" : "s"}`,
        )
        setRowSelection({})
      } else {
        await api.delete(`/seller/substores/${deleteTarget._id}${suffix}`)
        toast.success(`${showDeleted ? "Permanently deleted" : "Deleted"} ${deleteTarget.name}`)
      }
      setDeleteTarget(null)
      mutate()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const selectedCount = Object.keys(rowSelection).length
  const multistoreDisabled = error?.status === 403

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-balance text-foreground md:text-2xl">Substores</h1>
          <p className="text-sm text-muted-foreground">
            Regional storefronts under your main store — each with its own branding, currency and languages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && showDeleted && (
            <Button variant="outline" size="sm" onClick={restoreSelected} disabled={restoring}>
              <ArchiveRestore className="size-3.5" aria-hidden="true" />
              {restoring ? "Restoring…" : `Restore (${selectedCount})`}
            </Button>
          )}
          {selectedCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget("bulk")}>
              <Trash2 className="size-3.5" aria-hidden="true" />
              {showDeleted ? `Delete permanently (${selectedCount})` : `Delete (${selectedCount})`}
            </Button>
          )}
          <Button size="sm" onClick={openCreate} disabled={multistoreDisabled}>
            <Plus className="size-3.5" aria-hidden="true" />
            Add substore
          </Button>
        </div>
      </div>

      {multistoreDisabled ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <Store className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">Multistore is not enabled</p>
          <p className="max-w-sm text-sm text-muted-foreground">{error.message}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
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
                placeholder="Search by name…"
                className="h-9 pl-8"
                aria-label="Search substores by name"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-9 w-36" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {SUBSTORE_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs text-muted-foreground">
              {total} {showDeleted ? "deleted " : ""}substore{total === 1 ? "" : "s"}
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="bg-muted/50 hover:bg-muted/50">
                    {hg.headers.map((header) => (
                      <TableHead key={header.id} style={{ width: header.column.columnDef.size }}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading && rows.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={columns.length}>
                        <Skeleton className="h-9 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-40 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Store className="size-6 text-muted-foreground" aria-hidden="true" />
                        <p className="text-sm text-muted-foreground">
                          {showDeleted
                            ? "No deleted substores."
                            : q || status !== "all"
                              ? "No substores match your filters."
                              : "No substores yet."}
                        </p>
                        {!q && status === "all" && !showDeleted && (
                          <Button variant="outline" size="sm" onClick={openCreate}>
                            <Plus className="size-3.5" aria-hidden="true" />
                            Create your first substore
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="show-deleted"
                  checked={showDeleted}
                  onCheckedChange={(v) => {
                    setShowDeleted(v)
                    setPage(1)
                    setRowSelection({})
                  }}
                  aria-label="Show deleted substores"
                />
                <Label htmlFor="show-deleted" className="text-xs font-normal text-muted-foreground">
                  Show deleted
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rows per page</span>
                <Select
                  value={String(limit)}
                  onValueChange={(v) => {
                    setLimit(Number(v))
                    setPage(1)
                  }}
                >
                  <SelectTrigger className="h-8 w-18" aria-label="Rows per page">
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
            </div>
            <nav className="flex items-center gap-1" aria-label="Pagination">
              <span className="mr-2 hidden text-xs text-muted-foreground sm:inline">
                {total === 0 ? "0" : `${(page - 1) * limit + 1}–${Math.min(page * limit, total)}`} of {total}
              </span>
              <Button variant="outline" size="icon" className="size-8 bg-transparent" disabled={page <= 1} onClick={() => setPage(1)} aria-label="First page">
                <ChevronsLeft className="size-4" aria-hidden="true" />
              </Button>
              <Button variant="outline" size="icon" className="size-8 bg-transparent" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
              {pageItems(page, pageCount).map((item, i) =>
                item === "…" ? (
                  <span key={`gap-${i}`} className="px-1 text-xs text-muted-foreground" aria-hidden="true">
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === page ? "default" : "outline"}
                    size="icon"
                    className={`size-8 text-xs tabular-nums ${item === page ? "" : "bg-transparent"}`}
                    onClick={() => setPage(item)}
                    aria-label={`Page ${item}`}
                    aria-current={item === page ? "page" : undefined}
                  >
                    {item}
                  </Button>
                ),
              )}
              <Button variant="outline" size="icon" className="size-8 bg-transparent" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
              <Button variant="outline" size="icon" className="size-8 bg-transparent" disabled={page >= pageCount} onClick={() => setPage(pageCount)} aria-label="Last page">
                <ChevronsRight className="size-4" aria-hidden="true" />
              </Button>
            </nav>
          </div>
        </>
      )}

      <SubstoreFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        substoreId={editingId}
        onSaved={() => mutate()}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {deleteTarget === "bulk"
                ? `${showDeleted ? "Permanently delete" : "Delete"} ${selectedCount} substore${selectedCount === 1 ? "" : "s"}?`
                : `${showDeleted ? "Permanently delete" : "Delete"} ${deleteTarget?.name}?`}
            </DialogTitle>
            <DialogDescription>
              {showDeleted
                ? "This permanently removes the substore and its uploaded assets. This action cannot be undone."
                : "This moves the substore to the trash and detaches any store variants pointing at it. You can restore it later from the \u201CShow deleted\u201D view."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : showDeleted ? "Delete permanently" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HubSubstoresPage
