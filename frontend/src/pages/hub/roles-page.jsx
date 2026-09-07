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
  ShieldCheck,
  ShieldHalf,
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
import { RoleFormSheet } from "@/components/hub/role-form-sheet"
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

/** Where a role's users can act — own store, listed substores, or all. */
function AccessCell({ dataAccess, substores }) {
  if (dataAccess === "all_substores") {
    return <span className="text-xs text-foreground">All substores</span>
  }
  if (dataAccess === "multiple_substores") {
    const names = (substores ?? []).map((s) => s.name)
    return (
      <span className="truncate text-xs text-foreground">
        {names.length > 0 ? names.join(", ") : "Multiple Substores"}
      </span>
    )
  }
  if (dataAccess === "own_substore") {
    return <span className="text-xs text-muted-foreground">Own substore only</span>
  }
  return <span className="text-xs text-muted-foreground">—</span>
}

/** /hub/staff/roles — Roles list with a side panel for create/edit. */
export function HubRolesPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [sort, setSort] = useState("displayName")
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

  const { data, isLoading, error, mutate } = useSWR(`/seller/roles?${params}`, fetcher, {
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
            aria-label={`Select ${row.original.displayName}`}
          />
        ),
        size: 32,
      },
      {
        accessorKey: "displayName",
        header: () => <SortHeader label="Role" field="displayName" sort={sort} onSort={handleSort} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: row.original.color }}
              aria-hidden="true"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {row.original.displayName}
                {row.original.isSystem && (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">(system)</span>
                )}
              </span>
              <span className="max-w-md truncate text-xs text-muted-foreground">
                {row.original.description || ""}
              </span>
            </div>
          </div>
        ),
      },
      {
        id: "permissions",
        header: "Permissions",
        cell: ({ row }) => (
          <Badge variant="outline" className="gap-1 font-normal">
            <ShieldCheck className="size-3" aria-hidden="true" />
            {row.original.permissionCount}
          </Badge>
        ),
        size: 110,
      },
      {
        id: "access",
        header: "Substore access",
        cell: ({ row }) => (
          <AccessCell dataAccess={row.original.dataAccess} substores={row.original.substores} />
        ),
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
        size: 100,
      },
      {
        id: "actions",
        header: "",
        size: 40,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`Actions for ${row.original.displayName}`}
              >
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
                  {!row.original.isSystem && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(row.original)}>
                        <Trash2 className="size-4" aria-hidden="true" />
                        Delete permanently
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => openEdit(row.original._id)}>
                    <Pencil className="size-4" aria-hidden="true" />
                    Edit
                  </DropdownMenuItem>
                  {!row.original.isSystem && (
                    <>
                      <DropdownMenuItem onClick={() => toggleStatus(row.original)}>
                        <ShieldHalf className="size-4" aria-hidden="true" />
                        {row.original.status === "active" ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(row.original)}>
                        <Trash2 className="size-4" aria-hidden="true" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
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
      await api.patch(`/seller/roles/${doc._id}`, { status: next })
      toast.success(`${doc.displayName} is now ${next}`)
      mutate()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function restoreOne(doc) {
    setRestoring(true)
    try {
      await api.post(`/seller/roles/${doc._id}/restore`)
      toast.success(`Restored ${doc.displayName}`)
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
      await Promise.all(ids.map((id) => api.post(`/seller/roles/${id}/restore`)))
      toast.success(`Restored ${ids.length} role${ids.length === 1 ? "" : "s"}`)
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
        await Promise.all(ids.map((id) => api.delete(`/seller/roles/${id}${suffix}`)))
        toast.success(
          `${showDeleted ? "Permanently deleted" : "Deleted"} ${ids.length} role${ids.length === 1 ? "" : "s"}`,
        )
        setRowSelection({})
      } else {
        await api.delete(`/seller/roles/${deleteTarget._id}${suffix}`)
        toast.success(`${showDeleted ? "Permanently deleted" : "Deleted"} ${deleteTarget.displayName}`)
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
          <h1 className="text-xl font-semibold text-balance text-foreground md:text-2xl">Roles</h1>
          <p className="text-sm text-muted-foreground">
            Define what staff can see and do — assign a role to control their access.
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
            Add role
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
            placeholder="Search roles…"
            className="h-9 pl-8"
            aria-label="Search roles by name"
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
          {total} role{total === 1 ? "" : "s"}
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
                    <ShieldHalf className="size-6 text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">
                      {q || status !== "all" ? "No roles match your filters." : "No roles yet."}
                    </p>
                    {!q && status === "all" && (
                      <Button variant="outline" size="sm" onClick={openCreate}>
                        <Plus className="size-3.5" aria-hidden="true" />
                        Create your first role
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
              id="roles-show-deleted"
              checked={showDeleted}
              onCheckedChange={(v) => {
                setShowDeleted(v)
                setPage(1)
                setRowSelection({})
              }}
              aria-label="Show deleted roles"
            />
            <Label htmlFor="roles-show-deleted" className="text-xs font-normal text-muted-foreground">
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

      <RoleFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        roleId={editingId}
        onSaved={() => mutate()}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {deleteTarget === "bulk"
                ? `${showDeleted ? "Permanently delete" : "Delete"} ${selectedCount} role${selectedCount === 1 ? "" : "s"}?`
                : `${showDeleted ? "Permanently delete" : "Delete"} ${deleteTarget?.displayName}?`}
            </DialogTitle>
            <DialogDescription>
              {showDeleted
                ? "This permanently removes the role. This action cannot be undone."
                : "Staff currently assigned this role will lose the permissions it grants. You can restore it later from the \u201CShow deleted\u201D view."}
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

export default HubRolesPage