"use client"

import { useMemo, useState } from "react"
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GitBranch,
  Globe,
  Link2,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Route,
  Search,
  Trash2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StoreVariantFormSheet } from "@/components/hub/store-variant-form-sheet"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { api, fetcher } from "@/lib/api"

const PAGE_SIZES = [10, 20, 50]

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

/** Human-readable summary of a variant's match conditions. */
function ConditionsCell({ conditions }) {
  if (!conditions?.type || conditions.type === "manual") {
    return <span className="text-xs text-muted-foreground">Manual — store switcher only</span>
  }
  if (conditions.type === "location_countries") {
    const codes = conditions.locationCountries ?? []
    return (
      <div className="flex items-center gap-1.5">
        <Globe className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="text-xs text-foreground">
          {codes.length > 0 ? codes.join(", ") : "Any country"}
        </span>
      </div>
    )
  }
  if (conditions.type === "domain") {
    return (
      <div className="flex items-center gap-1.5">
        <Link2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="truncate text-xs text-foreground">{(conditions.domains ?? []).join(", ") || "—"}</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5">
      <Route className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="text-xs text-foreground">{conditions.pathPrefix || "—"}</span>
    </div>
  )
}

/** Stacked key/value summary of the variant's action (like StoreHippo's list). */
function ActionCell({ action, substore }) {
  const entries = [
    action?.themeId && ["theme", action.themeId],
    action?.canvasId && ["canvas", action.canvasId],
    action?.currency && ["currency", action.currency],
    action?.language && ["language", action.language],
    ["substore", substore?.name ?? "—"],
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-0.5">
      {entries.map(([key, value]) => (
        <span key={key} className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{key}:</span> {value}
        </span>
      ))}
    </div>
  )
}

/** /hub/stores/variants — routing rules mapping visitors to substores. */
export function HubStoreVariantsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [sort, setSort] = useState("sortOrder")
  const [rowSelection, setRowSelection] = useState({})
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [restoring, setRestoring] = useState(false)

  const q = useDebouncedValue(search, 300)

  const params = new URLSearchParams({ page: String(page), limit: String(limit), sort })
  if (q.trim()) params.set("q", q.trim())
  if (status !== "all") params.set("status", status)
  if (showDeleted) params.set("deleted", "true")

  const { data, isLoading, error, mutate } = useSWR(`/seller/store-variants?${params}`, fetcher, {
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
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{row.original.name}</span>
            <span className="text-xs capitalize text-muted-foreground">
              {row.original.conditions?.type?.replace(/_/g, " ") ?? "manual"}
            </span>
          </div>
        ),
      },
      {
        id: "conditions",
        header: "Conditions",
        cell: ({ row }) => <ConditionsCell conditions={row.original.conditions} />,
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => <ActionCell action={row.original.action} substore={row.original.substore} />,
      },
      {
        accessorKey: "sortOrder",
        header: () => <SortHeader label="Sort order" field="sortOrder" sort={sort} onSort={handleSort} />,
        cell: ({ row }) => <span className="text-sm tabular-nums text-muted-foreground">{row.original.sortOrder}</span>,
        size: 90,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          if (row.original.isDeleted || row.original.deletedAt) {
            return (
              <Badge variant="outline" className="border-transparent bg-destructive/15 text-destructive">
                Deleted
              </Badge>
            )
          }
          return (
            <Badge
              variant="outline"
              className={
                row.original.status === "active"
                  ? "border-transparent bg-emerald-500/15 capitalize text-emerald-600 dark:text-emerald-400"
                  : "border-transparent bg-muted capitalize text-muted-foreground"
              }
            >
              {row.original.status}
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
                    <RotateCcw className="size-4" aria-hidden="true" />
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
                  <DropdownMenuItem onClick={() => toggleStatus(row.original)}>
                    <GitBranch className="size-4" aria-hidden="true" />
                    {row.original.status === "active" ? "Deactivate" : "Activate"}
                  </DropdownMenuItem>
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

  async function toggleStatus(doc) {
    try {
      const next = doc.status === "active" ? "inactive" : "active"
      await api.patch(`/seller/store-variants/${doc._id}`, { status: next })
      toast.success(`${doc.name} is now ${next}`)
      mutate()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function restoreOne(doc) {
    setRestoring(true)
    try {
      await api.post(`/seller/store-variants/${doc._id}/restore`)
      toast.success(`Restored ${doc.name}`)
      mutate()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setRestoring(false)
    }
  }

  async function restoreSelected() {
    const ids = Object.keys(rowSelection)
    setRestoring(true)
    try {
      await Promise.all(ids.map((id) => api.post(`/seller/store-variants/${id}/restore`)))
      toast.success(`Restored ${ids.length} variant${ids.length === 1 ? "" : "s"}`)
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
    // In the trash view "Delete" means permanent destroy; otherwise soft delete.
    const suffix = showDeleted ? "?permanent=true" : ""
    try {
      if (deleteTarget === "bulk") {
        const ids = Object.keys(rowSelection)
        await Promise.all(ids.map((id) => api.delete(`/seller/store-variants/${id}${suffix}`)))
        toast.success(
          `${showDeleted ? "Permanently deleted" : "Deleted"} ${ids.length} variant${ids.length === 1 ? "" : "s"}`,
        )
        setRowSelection({})
      } else {
        await api.delete(`/seller/store-variants/${deleteTarget._id}${suffix}`)
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
          <h1 className="text-xl font-semibold text-balance text-foreground md:text-2xl">Store variants</h1>
          <p className="text-sm text-muted-foreground">
            Routing rules that send visitors to the right substore, theme, currency and language.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && showDeleted && (
            <Button variant="outline" size="sm" onClick={restoreSelected} disabled={restoring}>
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Restore ({selectedCount})
            </Button>
          )}
          {selectedCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget("bulk")}>
              <Trash2 className="size-3.5" aria-hidden="true" />
              {showDeleted ? "Delete permanently" : "Delete"} ({selectedCount})
            </Button>
          )}
          <Button size="sm" onClick={openCreate} disabled={multistoreDisabled}>
            <Plus className="size-3.5" aria-hidden="true" />
            Add variant
          </Button>
        </div>
      </div>

      {multistoreDisabled ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <GitBranch className="size-8 text-muted-foreground" aria-hidden="true" />
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
                aria-label="Search store variants by name"
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs text-muted-foreground">
              {total} variant{total === 1 ? "" : "s"}
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
                        <GitBranch className="size-6 text-muted-foreground" aria-hidden="true" />
                        <p className="text-sm text-muted-foreground">
                          {q || status !== "all" ? "No variants match your filters." : "No store variants yet."}
                        </p>
                        {!q && status === "all" && (
                          <Button variant="outline" size="sm" onClick={openCreate}>
                            <Plus className="size-3.5" aria-hidden="true" />
                            Create your first variant
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
                  id="variants-show-deleted"
                  checked={showDeleted}
                  onCheckedChange={(v) => {
                    setShowDeleted(v)
                    setPage(1)
                    setRowSelection({})
                  }}
                  aria-label="Show deleted store variants"
                />
                <Label htmlFor="variants-show-deleted" className="text-xs font-normal text-muted-foreground">
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
            <div className="flex items-center gap-1">
              <span className="mr-2 text-xs text-muted-foreground">
                Page {page} of {pageCount}
              </span>
              <Button variant="outline" size="icon" className="size-8 bg-transparent" disabled={page <= 1} onClick={() => setPage(1)} aria-label="First page">
                <ChevronsLeft className="size-4" aria-hidden="true" />
              </Button>
              <Button variant="outline" size="icon" className="size-8 bg-transparent" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
              <Button variant="outline" size="icon" className="size-8 bg-transparent" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
              <Button variant="outline" size="icon" className="size-8 bg-transparent" disabled={page >= pageCount} onClick={() => setPage(pageCount)} aria-label="Last page">
                <ChevronsRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </>
      )}

      <StoreVariantFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        variantId={editingId}
        onSaved={() => mutate()}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {deleteTarget === "bulk"
                ? `${showDeleted ? "Permanently delete" : "Delete"} ${selectedCount} variant${selectedCount === 1 ? "" : "s"}?`
                : `${showDeleted ? "Permanently delete" : "Delete"} ${deleteTarget?.name}?`}
            </DialogTitle>
            <DialogDescription>
              {showDeleted
                ? "This permanently removes the variant. This action cannot be undone."
                : "This moves the variant to the trash — visitors matched by it fall back to the default store. You can restore it later from the \u201CShow deleted\u201D view."}
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

export default HubStoreVariantsPage
