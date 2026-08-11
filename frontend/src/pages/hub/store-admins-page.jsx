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
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserRound,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StoreAdminFormSheet } from "@/components/hub/storeadmin-form-sheet"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { api, fetcher } from "@/lib/api"

const PAGE_SIZES = [10, 20, 50]

const STATUS_STYLES = {
  active: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  invited: "border-transparent bg-blue-500/15 text-blue-600 dark:text-blue-400",
  suspended: "border-transparent bg-destructive/10 text-destructive",
}

function AdminAvatar({ name }) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-medium text-muted-foreground">
      {initials || <UserRound className="size-4" aria-hidden="true" />}
    </div>
  )
}

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
        desc ? <ArrowDown className="size-3" aria-hidden="true" /> : <ArrowUp className="size-3" aria-hidden="true" />
      ) : (
        <ArrowUpDown className="size-3 opacity-40" aria-hidden="true" />
      )}
    </button>
  )
}

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

export function HubStoreAdminsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [sort, setSort] = useState("-createdAt")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const q = useDebouncedValue(search, 300)

  const params = new URLSearchParams({ page: String(page), limit: String(limit), sort })
  if (q.trim()) params.set("q", q.trim())
  if (status !== "all") params.set("status", status)

  const { data, isLoading, mutate } = useSWR(`/seller/store-admins?${params}`, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / limit))


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

  async function toggleSuspend(admin) {
    const nextStatus = admin.status === "suspended" ? "active" : "suspended"
    try {
      await api.patch(`/seller/store-admins/${admin._id}`, { status: nextStatus })
      toast.success(nextStatus === "suspended" ? `Suspended ${admin.name}` : `Reactivated ${admin.name}`)
      mutate()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function resetTwoFactor(admin) {
    try {
      await api.post(`/seller/store-admins/${admin._id}/2fa/reset`)
      toast.success(`2FA reset for ${admin.name} — they'll re-enroll on next login`)
      mutate()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function confirmDelete() {
    setDeleting(true)
    try {
      await api.delete(`/seller/store-admins/${deleteTarget._id}`)
      toast.success(`Removed ${deleteTarget.name}`)
      setDeleteTarget(null)
      mutate()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: () => <SortHeader label="Name" field="name" sort={sort} onSort={handleSort} />,
        cell: ({ row }) => {
          const doc = row.original
          return (
            <div className="flex items-center gap-3">
              <AdminAvatar name={doc.name} />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">{doc.name}</span>
                <span className="truncate text-xs text-muted-foreground">{doc.email}</span>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <span className="text-sm text-foreground">{row.original.role?.displayName ?? "—"}</span>
        ),
      },
      {
        accessorKey: "substores",
        header: "Substores",
        cell: ({ row }) => {
          const role = row.original.roleId
          if (role?.dataAccess === "all_substores") {
            return <span className="text-xs text-muted-foreground">All substores</span>
          }
          const names = row.original.substores ?? []
          if (names.length === 0) return <span className="text-xs text-muted-foreground">All</span>
          const shown = names.slice(0, 2)
          return (
            <div className="flex flex-wrap items-center gap-1">
              {shown.map((s) => (
                <Badge key={s._id} variant="secondary" className="h-5 px-1.5 text-[10px]">
                  {s.name}
                </Badge>
              ))}
              {names.length > 2 && <span className="text-xs text-muted-foreground">+{names.length - 2}</span>}
            </div>
          )
        },
      },
      {
        accessorKey: "twoFactor",
        header: "2FA",
        cell: ({ row }) => {
          const doc = row.original
          if (!doc.twoFactorRequired) {
            return <span className="text-xs text-muted-foreground">Not required</span>
          }
          return doc.totpEnabled ? (
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Enrolled
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <ShieldOff className="size-3.5" aria-hidden="true" />
              Pending
            </span>
          )
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="outline" className={`capitalize ${STATUS_STYLES[row.original.status] ?? ""}`}>
            {row.original.status}
          </Badge>
        ),
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
              <DropdownMenuItem onClick={() => openEdit(row.original._id)}>
                <Pencil className="size-4" aria-hidden="true" />
                Edit
              </DropdownMenuItem>
              {row.original.twoFactorRequired && row.original.totpEnabled && (
                <DropdownMenuItem onClick={() => resetTwoFactor(row.original)}>
                  <KeyRound className="size-4" aria-hidden="true" />
                  Reset 2FA
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => toggleSuspend(row.original)}>
                {row.original.status === "suspended" ? (
                  <>
                    <ShieldCheck className="size-4" aria-hidden="true" />
                    Reactivate
                  </>
                ) : (
                  <>
                    <ShieldOff className="size-4" aria-hidden="true" />
                    Suspend
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(row.original)}>
                <Trash2 className="size-4" aria-hidden="true" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sort],
  )

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row._id,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-balance text-foreground md:text-2xl">Store admins</h1>
          <p className="text-sm text-muted-foreground">
            Accounts that can manage this seller's stores — each with a role, optional two-step verification, and
            substore access.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-3.5" aria-hidden="true" />
          Add store admin
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Search by name or email…"
            className="h-9 pl-8"
            aria-label="Search store admins"
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
            <SelectItem value="invited">Invited</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">
          {total} store admin{total === 1 ? "" : "s"}
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
                    <UserRound className="size-6 text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">
                      {q || status !== "all" ? "No store admins match your filters." : "No store admins yet."}
                    </p>
                    {!q && status === "all" && (
                      <Button variant="outline" size="sm" onClick={openCreate}>
                        <Plus className="size-3.5" aria-hidden="true" />
                        Add your first store admin
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
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

      <StoreAdminFormSheet open={sheetOpen} onOpenChange={setSheetOpen} adminId={editingId} onSaved={() => mutate()} />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove {deleteTarget?.name}?</DialogTitle>
            <DialogDescription>
              This revokes their access immediately and ends any active sessions. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HubStoreAdminsPage