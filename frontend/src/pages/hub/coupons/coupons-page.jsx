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
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  TicketPercent,
  Trash2,
  Users,
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
import { CouponFormSheet } from "@/components/hub/coupons/coupon-form-sheet"
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

function formatDate(iso) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

/** Discount amount, formatted per type (% vs currency-agnostic flat amount). */
function DiscountCell({ discountType, amount }) {
  return (
    <div className="flex items-center gap-1.5">
      <TicketPercent className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="text-sm font-medium text-foreground">
        {discountType === "percentage" ? `${amount}%` : amount}
      </span>
      <span className="text-xs text-muted-foreground">{discountType === "percentage" ? "off" : "flat off"}</span>
    </div>
  )
}

function ValidityCell({ startDate, endDate }) {
  const now = new Date()
  const expired = endDate && new Date(endDate) < now
  const upcoming = startDate && new Date(startDate) > now
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-foreground">
        {formatDate(startDate)} - {formatDate(endDate)}
      </span>
      {expired && <span className="text-xs text-destructive">Expired</span>}
      {!expired && upcoming && <span className="text-xs text-amber-600 dark:text-amber-400">Upcoming</span>}
    </div>
  )
}

function UsageCell({ usageCount, usageLimit }) {
  return (
    <div className="flex items-center gap-1.5">
      <Users className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="text-xs text-foreground">
        {usageCount ?? 0}
        {usageLimit != null ? ` / ${usageLimit}` : ""}
      </span>
    </div>
  )
}

/** /hub/coupons — discount codes shoppers can redeem at checkout. */
export function HubCouponsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [sort, setSort] = useState("-createdAt")
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

  const { data, isLoading, error, mutate } = useSWR(`/seller/coupons?${params}`, fetcher, {
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
            aria-label={`Select ${row.original.code}`}
          />
        ),
        size: 32,
      },
      {
        accessorKey: "code",
        header: () => <SortHeader label="Code" field="code" sort={sort} onSort={handleSort} />,
        cell: ({ row }) => <span className="font-mono text-sm font-medium text-foreground">{row.original.code}</span>,
      },
      {
        id: "discount",
        header: "Discount",
        cell: ({ row }) => <DiscountCell discountType={row.original.discountType} amount={row.original.amount} />,
      },
      {
        id: "validity",
        header: () => <SortHeader label="Validity" field="endDate" sort={sort} onSort={handleSort} />,
        cell: ({ row }) => <ValidityCell startDate={row.original.startDate} endDate={row.original.endDate} />,
      },
      {
        id: "usage",
        header: "Usage",
        cell: ({ row }) => <UsageCell usageCount={row.original.usageCount} usageLimit={row.original.usageLimit} />,
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
              <Button variant="ghost" size="icon" className="size-8" aria-label={`Actions for ${row.original.code}`}>
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
                    <TicketPercent className="size-4" aria-hidden="true" />
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
      await api.patch(`/seller/coupons/${doc._id}`, { status: next })
      toast.success(`${doc.code} is now ${next}`)
      mutate()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function restoreOne(doc) {
    setRestoring(true)
    try {
      await api.post(`/seller/coupons/${doc._id}/restore`)
      toast.success(`Restored ${doc.code}`)
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
      await Promise.all(ids.map((id) => api.post(`/seller/coupons/${id}/restore`)))
      toast.success(`Restored ${ids.length} coupon${ids.length === 1 ? "" : "s"}`)
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
        await Promise.all(ids.map((id) => api.delete(`/seller/coupons/${id}${suffix}`)))
        toast.success(
          `${showDeleted ? "Permanently deleted" : "Deleted"} ${ids.length} coupon${ids.length === 1 ? "" : "s"}`,
        )
        setRowSelection({})
      } else {
        await api.delete(`/seller/coupons/${deleteTarget._id}${suffix}`)
        toast.success(`${showDeleted ? "Permanently deleted" : "Deleted"} ${deleteTarget.code}`)
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-balance text-foreground md:text-2xl">Coupons</h1>
          <p className="text-sm text-muted-foreground">
            Discount codes shoppers can redeem at checkout, with usage limits and eligibility conditions.
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
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-3.5" aria-hidden="true" />
            Add coupon
          </Button>
        </div>
      </div>

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
            placeholder="Search by code…"
            className="h-9 pl-8"
            aria-label="Search coupons by code"
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
          {total} coupon{total === 1 ? "" : "s"}
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
                    <TicketPercent className="size-6 text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">
                      {q || status !== "all" ? "No coupons match your filters." : "No coupons yet."}
                    </p>
                    {!q && status === "all" && (
                      <Button variant="outline" size="sm" onClick={openCreate}>
                        <Plus className="size-3.5" aria-hidden="true" />
                        Create your first coupon
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
              id="coupons-show-deleted"
              checked={showDeleted}
              onCheckedChange={(v) => {
                setShowDeleted(v)
                setPage(1)
                setRowSelection({})
              }}
              aria-label="Show deleted coupons"
            />
            <Label htmlFor="coupons-show-deleted" className="text-xs font-normal text-muted-foreground">
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

      <CouponFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        couponId={editingId}
        onSaved={() => mutate()}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {deleteTarget === "bulk"
                ? `${showDeleted ? "Permanently delete" : "Delete"} ${selectedCount} coupon${selectedCount === 1 ? "" : "s"}?`
                : `${showDeleted ? "Permanently delete" : "Delete"} ${deleteTarget?.code}?`}
            </DialogTitle>
            <DialogDescription>
              {showDeleted
                ? "This permanently removes the coupon. This action cannot be undone."
                : "This moves the coupon to the trash — shoppers can no longer redeem it. You can restore it later from the \u201CShow deleted\u201D view."}
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

export default HubCouponsPage