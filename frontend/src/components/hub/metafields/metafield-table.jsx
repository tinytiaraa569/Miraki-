"use client"

import { useMemo } from "react"
import { ChevronLeft, ChevronRight, ChevronsUpDown, ChevronDown, ChevronUp, Braces } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { buildMetafieldColumns } from "@/components/hub/metafields/metafield-columns"
import { cn } from "@/lib/utils"

const PAGE_SIZES = [10, 25, 50, 100]

/**
 * Server-driven Metafields list table, rendered with plain React (no TanStack).
 * Pagination, sorting and filtering all happen on the server via the `$facet`
 * aggregation, so `data`/`pageCount` come straight off the SWR envelope and this
 * component only reflects that state and emits changes back up.
 */
export function MetafieldTable({
  data,
  pageCount,
  isLoading,
  isValidating,
  showDeleted,
  onToggleDeleted,
  pagination,
  setPagination,
  sorting,
  setSorting,
  handlers,
}) {
  const columns = useMemo(
    () =>
      buildMetafieldColumns({
        showDeleted,
        onEdit: handlers.onEdit,
        onDuplicate: handlers.onDuplicate,
        onDelete: handlers.onDelete,
        onRestore: handlers.onRestore,
      }),
    [showDeleted, handlers],
  )

  const rows = data ?? []
  const totalPages = Math.max(1, pageCount ?? 1)
  const canPrev = pagination.pageIndex > 0
  const canNext = pagination.pageIndex < totalPages - 1
  const showSkeleton = isLoading && rows.length === 0
  const active = sorting?.[0]

  // Toggle the sort for a column id. Changing the sort resets to the first page
  // so a deep page of the old result set can't 404 against the new one.
  function toggleSort(colId) {
    setSorting((prev) => {
      const cur = prev?.[0]
      if (cur?.id === colId) return [{ id: colId, desc: !cur.desc }]
      return [{ id: colId, desc: false }]
    })
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => {
                const sorted = active?.id === col.id ? (active.desc ? "desc" : "asc") : false
                return (
                  <TableHead key={col.id} className={col.className}>
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.id)}
                        className="inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {col.header}
                        {sorted === "asc" ? (
                          <ChevronUp className="size-3.5" aria-hidden="true" />
                        ) : sorted === "desc" ? (
                          <ChevronDown className="size-3.5" aria-hidden="true" />
                        ) : (
                          <ChevronsUpDown className="size-3.5 opacity-50" aria-hidden="true" />
                        )}
                      </button>
                    ) : col.header ? (
                      <span className="font-medium text-muted-foreground">{col.header}</span>
                    ) : (
                      <span className="sr-only">Actions</span>
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {showSkeleton ? (
              Array.from({ length: pagination.pageSize > 10 ? 10 : pagination.pageSize }).map((_, i) => (
                <TableRow key={`sk-${i}`} className="hover:bg-transparent">
                  {columns.map((col, ci) => (
                    <TableCell key={ci} className={col.className}>
                      <Skeleton className="h-5 w-full max-w-[180px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="h-48">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Braces className="size-8 text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm font-medium text-foreground">No Records Found</p>
                    <p className="max-w-xs text-sm text-muted-foreground">
                      {showDeleted ? "There are no deleted metafields." : "Add a metafield to get started."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((node) => (
                <TableRow
                  key={node._id}
                  className={cn("cursor-pointer", isValidating && "opacity-60")}
                  onClick={(e) => {
                    if (e.target.closest("[data-slot='dropdown-menu-trigger'],[role='menuitem'],button")) return
                    if (!showDeleted) handlers.onEdit(node)
                  }}
                >
                  {columns.map((col) => (
                    <TableCell key={col.id} className={col.className}>
                      {col.cell(node)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ------------------------------------------------------------ pager */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(v) => setPagination({ pageIndex: 0, pageSize: Number(v) })}
            >
              <SelectTrigger className="h-8 w-[76px]">
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

          {onToggleDeleted ? (
            <div className="flex items-center gap-2">
              <Switch
                id="mf-show-deleted"
                checked={showDeleted}
                onCheckedChange={onToggleDeleted}
                aria-label="Show deleted metafields"
              />
              <Label htmlFor="mf-show-deleted" className="text-sm font-normal text-muted-foreground">
                Show Deleted
              </Label>
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Page {pagination.pageIndex + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.max(0, p.pageIndex - 1) }))}
              disabled={!canPrev}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.min(totalPages - 1, p.pageIndex + 1) }))}
              disabled={!canNext}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
