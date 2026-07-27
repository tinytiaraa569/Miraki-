"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import {
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Loader2,
  MinusCircle,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Search,
  Store,
  Trash2,
} from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreateSellerDialog } from "@/components/create-seller-dialog"
import { SellerDetailsDialog } from "@/components/seller-details-dialog"
import { api, fetcher } from "@/lib/api"
import { cn } from "@/lib/utils"

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "suspended", label: "Suspended" },
]

function SortableHeader({ column, children }) {
  const sorted = column.getIsSorted()
  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className="flex items-center gap-1.5 font-medium hover:text-foreground"
    >
      {children}
      {sorted === "asc" ? (
        <ArrowUp className="size-3.5" aria-hidden="true" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3.5" aria-hidden="true" />
      ) : (
        <ArrowUpDown className="size-3.5 opacity-40" aria-hidden="true" />
      )}
    </button>
  )
}

export function SellersView() {
  const { mutate } = useSWRConfig()
  const [showTrash, setShowTrash] = useState(false)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [sorting, setSorting] = useState([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState("")

  // Dialog state
  const [detailsSellerId, setDetailsSellerId] = useState(null)
  const [editSeller, setEditSeller] = useState(null)
  const [trashSeller, setTrashSeller] = useState(null)
  const [purgeSeller, setPurgeSeller] = useState(null)

  // Debounce the search box so we don't hit the API on every keystroke.
  // Both states update in one batched render, so the SWR key changes exactly
  // once (query applied + page reset together) with no wasted request.
  const [debouncedQuery, setDebouncedQuery] = useState("")
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query.trim())
      setPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }))
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  // Server-side pagination: only the current page is fetched.
  const listKey = useMemo(() => {
    const params = new URLSearchParams({
      page: String(pagination.pageIndex + 1),
      limit: String(pagination.pageSize),
    })
    if (showTrash) params.set("deleted", "true")
    else if (status !== "all") params.set("status", status)
    if (debouncedQuery) params.set("q", debouncedQuery)
    return `/platform/sellers?${params.toString()}`
  }, [pagination.pageIndex, pagination.pageSize, showTrash, status, debouncedQuery])

  const { data, isLoading } = useSWR(listKey, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })
  const sellers = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1

  async function refreshLists() {
    await mutate((key) => typeof key === "string" && key.startsWith("/platform/"))
  }

  async function run(id, fn) {
    setBusyId(id)
    setError("")
    try {
      await fn()
      await refreshLists()
    } catch (e) {
      setError(e.message || "Action failed")
    } finally {
      setBusyId(null)
    }
  }

  const toggleStatus = (seller) =>
    run(seller._id, () =>
      api.patch(`/platform/sellers/${seller._id}/status`, {
        status: seller.status === "active" ? "suspended" : "active",
      }),
    )

  const columns = useMemo(() => {
    const base = [
      {
        accessorKey: "businessName",
        header: ({ column }) => <SortableHeader column={column}>Business</SortableHeader>,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold uppercase text-primary"
            >
              {row.original.businessName
                ?.split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
            </span>
            <div className="flex min-w-0 flex-col">
              <button
                type="button"
                onClick={() => setDetailsSellerId(row.original._id)}
                className="truncate text-left font-medium text-foreground underline-offset-4 hover:underline"
              >
                {row.original.businessName}
              </button>
              <span className="truncate font-mono text-[11px] text-muted-foreground">{row.original.slug}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "ownerEmail",
        header: ({ column }) => <SortableHeader column={column}>Owner</SortableHeader>,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.ownerEmail}</span>,
      },
    ]

    if (showTrash) {
      return [
        ...base,
        {
          accessorKey: "deletedAt",
          header: ({ column }) => <SortableHeader column={column}>Deleted</SortableHeader>,
          cell: ({ row }) => (
            <span className="text-muted-foreground">
              {row.original.deletedAt ? new Date(row.original.deletedAt).toLocaleString() : "—"}
            </span>
          ),
        },
        {
          id: "actions",
          header: () => <span className="sr-only">Actions</span>,
          cell: ({ row }) => {
            const seller = row.original
            const busy = busyId === seller._id
            return (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => run(seller._id, () => api.post(`/platform/sellers/${seller._id}/restore`))}
                >
                  {busy ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <RotateCcw className="size-4" aria-hidden="true" />
                  )}
                  Restore
                </Button>
                <Button variant="destructive" size="sm" disabled={busy} onClick={() => setPurgeSeller(seller)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete forever
                </Button>
              </div>
            )
          },
        },
      ]
    }

    return [
      ...base,
      {
        accessorKey: "status",
        header: ({ column }) => <SortableHeader column={column}>Status</SortableHeader>,
        cell: ({ row }) => {
          const active = row.original.status === "active"
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                active
                  ? "border-primary/20 bg-primary/10 text-primary"
                  : "border-destructive/20 bg-destructive/10 text-destructive",
              )}
            >
              <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
              {row.original.status}
            </span>
          )
        },
      },
      {
        accessorKey: "multistoreEnabled",
        header: "Multistore",
        cell: ({ row }) =>
          row.original.multistoreEnabled ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
              <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
              Enabled
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <MinusCircle className="size-4" aria-hidden="true" />
              Disabled
            </span>
          ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => <SortableHeader column={column}>Created</SortableHeader>,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const seller = row.original
          const busy = busyId === seller._id
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8" disabled={busy} aria-label="Seller actions">
                    {busy ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <MoreHorizontal className="size-4" aria-hidden="true" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuLabel>Manage</DropdownMenuLabel>
                  <DropdownMenuItem onSelect={() => setDetailsSellerId(seller._id)}>
                    <Eye className="size-4" aria-hidden="true" />
                    View details
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setEditSeller(seller)}>
                    <Pencil className="size-4" aria-hidden="true" />
                    Edit details
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => toggleStatus(seller)}>
                    {seller.status === "active" ? (
                      <>
                        <Ban className="size-4" aria-hidden="true" />
                        Suspend
                      </>
                    ) : (
                      <>
                        <RotateCcw className="size-4" aria-hidden="true" />
                        Reactivate
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setTrashSeller(seller)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    Move to trash
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTrash, busyId])

  const table = useReactTable({
    data: sellers,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Pagination + filtering happen on the server; the table only renders the current page.
    manualPagination: true,
    manualFiltering: true,
    pageCount: totalPages,
    rowCount: total,
  })

  const rows = table.getRowModel().rows
  const pageCount = table.getPageCount()

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold text-foreground">{showTrash ? "Deleted sellers" : "Sellers"}</h1>
              <Badge variant="secondary" className="rounded-full px-2.5 tabular-nums">
                {total}
              </Badge>
              {showTrash && (
                <Badge variant="destructive" className="rounded-full px-2.5">
                  Trash
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {showTrash
                ? "Trashed tenants — restore them or delete permanently."
                : "Provision and manage tenant accounts."}
            </p>
          </div>
        </div>
        {!showTrash && <CreateSellerDialog />}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Unified data-grid panel: toolbar + table + footer in one card */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Search by name, email, or slug…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 bg-background pl-9"
              aria-label="Search sellers"
            />
          </div>
          {!showTrash && (
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1" role="tablist">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={status === f.id}
                  onClick={() => {
                    setStatus(f.id)
                    setPagination((p) => (p.pageIndex === 0 ? p : { ...p, pageIndex: 0 }))
                  }}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    status === f.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Table body */}
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            {showTrash ? (
              <Trash2 className="size-8 text-muted-foreground" aria-hidden="true" />
            ) : (
              <Store className="size-8 text-muted-foreground" aria-hidden="true" />
            )}
            <p className="text-sm font-medium text-foreground">
              {showTrash
                ? "Trash is empty"
                : debouncedQuery || status !== "all"
                  ? "No sellers match your filters"
                  : "No sellers yet"}
            </p>
            <p className="text-sm text-muted-foreground">
              {showTrash
                ? "Deleted sellers will appear here and can be restored."
                : debouncedQuery || status !== "all"
                  ? "Try a different search or status filter."
                  : "Create your first seller to provision a tenant."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-10 bg-muted/60 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
                        header.column.id === "actions" && "text-right",
                      )}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className={cn("transition-colors", showTrash && "opacity-90")}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Footer bar — attached to the grid, always visible */}
        <div className="flex flex-col gap-3 border-t border-border bg-muted/40 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Show Deleted toggle — left corner */}
            <div className="flex items-center gap-2">
              <Switch
                id="show-deleted"
                checked={showTrash}
                onCheckedChange={(checked) => {
                  setShowTrash(checked)
                  setPagination((p) => ({ ...p, pageIndex: 0 }))
                  setError("")
                }}
                aria-label="Show deleted sellers"
              />
              <Label
                htmlFor="show-deleted"
                className="flex cursor-pointer items-center gap-1.5 text-sm font-normal text-muted-foreground"
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Show Deleted
              </Label>
            </div>

            <Separator orientation="vertical" className="hidden h-5 sm:block" />

            {/* Rows per page — shadcn Select */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select value={String(pagination.pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}>
                <SelectTrigger size="sm" className="w-[72px] bg-background" aria-label="Rows per page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator orientation="vertical" className="hidden h-5 sm:block" />

            {/* Range indicator */}
            <span className="text-sm tabular-nums text-muted-foreground">
              {total === 0
                ? "0 of 0"
                : `${pagination.pageIndex * pagination.pageSize + 1}-${Math.min(
                    (pagination.pageIndex + 1) * pagination.pageSize,
                    total,
                  )} of ${total}`}
            </span>
          </div>

          {/* Pager */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-8 bg-background"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="First page"
            >
              <ChevronsLeft className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 bg-background"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <span className="px-2 text-sm tabular-nums text-muted-foreground">
              Page {pagination.pageIndex + 1} of {Math.max(1, pageCount)}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8 bg-background"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 bg-background"
              onClick={() => table.setPageIndex(pageCount - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Last page"
            >
              <ChevronsRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      {/* Details modal — full profile, logo, stores, tenant meta */}
      <SellerDetailsDialog
        sellerId={detailsSellerId}
        open={Boolean(detailsSellerId)}
        onOpenChange={(open) => !open && setDetailsSellerId(null)}
      />

      {/* Edit dialog */}
      <EditSellerDialog
        seller={editSeller}
        onClose={() => setEditSeller(null)}
        onSaved={async () => {
          setEditSeller(null)
          await refreshLists()
        }}
      />

      {/* Soft delete confirm */}
      <ConfirmDialog
        open={Boolean(trashSeller)}
        onClose={() => setTrashSeller(null)}
        title="Move seller to trash?"
        description={
          trashSeller
            ? `"${trashSeller.businessName}" will be hidden and all its users locked out immediately. You can restore it from the Deleted view.`
            : ""
        }
        confirmLabel="Move to trash"
        onConfirm={async () => {
          const s = trashSeller
          setTrashSeller(null)
          await run(s._id, () => api.delete(`/platform/sellers/${s._id}`))
        }}
      />

      {/* Permanent delete confirm — requires typing the business name */}
      <PurgeDialog
        seller={purgeSeller}
        onClose={() => setPurgeSeller(null)}
        onConfirm={async () => {
          const s = purgeSeller
          setPurgeSeller(null)
          await run(s._id, () => api.delete(`/platform/sellers/${s._id}/permanent`))
        }}
      />
    </div>
  )
}

function EditSellerDialog({ seller, onClose, onSaved }) {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Initialize form when a seller is passed in
  const current =
    form && form._id === seller?._id
      ? form
      : seller
        ? {
            _id: seller._id,
            businessName: seller.businessName,
            ownerEmail: seller.ownerEmail,
            multistoreEnabled: seller.multistoreEnabled,
          }
        : null

  async function submit(e) {
    e.preventDefault()
    if (!current) return
    setSaving(true)
    setError("")
    try {
      await api.patch(`/platform/sellers/${current._id}`, {
        businessName: current.businessName,
        ownerEmail: current.ownerEmail,
        multistoreEnabled: current.multistoreEnabled,
      })
      setForm(null)
      await onSaved()
    } catch (err) {
      setError(err.message || "Failed to update seller")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={Boolean(seller)}
      onOpenChange={(open) => {
        if (!open) {
          setForm(null)
          setError("")
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit seller</DialogTitle>
          <DialogDescription>Update business details. Changing the name regenerates the slug.</DialogDescription>
        </DialogHeader>
        {current && (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-business-name">Business name</Label>
              <Input
                id="edit-business-name"
                value={current.businessName}
                onChange={(e) => setForm({ ...current, businessName: e.target.value })}
                required
                minLength={2}
                maxLength={120}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-owner-email">Owner email</Label>
              <Input
                id="edit-owner-email"
                type="email"
                value={current.ownerEmail}
                onChange={(e) => setForm({ ...current, ownerEmail: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Multistore</p>
                <p className="text-xs text-muted-foreground">Allow this seller to create substores.</p>
              </div>
              <Switch
                checked={current.multistoreEnabled}
                onCheckedChange={(v) => setForm({ ...current, multistoreEnabled: v })}
                aria-label="Toggle multistore"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ConfirmDialog({ open, onClose, title, description, confirmLabel, onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PurgeDialog({ seller, onClose, onConfirm }) {
  const [typed, setTyped] = useState("")
  const match = seller && typed.trim() === seller.businessName

  return (
    <Dialog
      open={Boolean(seller)}
      onOpenChange={(o) => {
        if (!o) {
          setTyped("")
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" aria-hidden="true" />
            Permanently delete seller?
          </DialogTitle>
          <DialogDescription>
            This cannot be undone. All stores, users, and access for{" "}
            <span className="font-semibold text-foreground">{seller?.businessName}</span> will be erased forever.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="purge-confirm">
            Type <span className="font-mono font-semibold">{seller?.businessName}</span> to confirm
          </Label>
          <Input
            id="purge-confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={seller?.businessName}
            autoComplete="off"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setTyped("")
              onClose()
            }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!match}
            onClick={() => {
              setTyped("")
              onConfirm()
            }}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete forever
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
