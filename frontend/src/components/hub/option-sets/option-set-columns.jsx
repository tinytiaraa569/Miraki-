"use client"

import { ArchiveRestore, Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Relative "time ago" for the Updated column — small, dependency-free.
function timeAgo(input) {
  if (!input) return "—"
  const then = new Date(input).getTime()
  if (Number.isNaN(then)) return "—"
  const secs = Math.round((Date.now() - then) / 1000)
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ]
  for (const [label, size] of units) {
    const value = Math.floor(secs / size)
    if (value >= 1) return `${value} ${label}${value > 1 ? "s" : ""} ago`
  }
  return "just now"
}

/**
 * Plain column descriptors for the server-driven Option Sets list. No TanStack —
 * each column is `{ id, header, sortable, className, cell(node) }` and the table
 * (option-set-table.jsx) maps over them directly. `sortable` columns toggle the
 * §6.1 sort enum through the page's SORT_KEY map (id → server sort key).
 */
export function buildOptionSetColumns({ showDeleted, onEdit, onDuplicate, onDelete, onRestore }) {
  return [
    {
      id: "name",
      header: "Name",
      sortable: true,
      cell: (node) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-foreground">{node.name}</span>
          {node.alias && <span className="truncate text-xs text-muted-foreground">{node.alias}</span>}
        </div>
      ),
    },
    {
      id: "optionCount",
      header: "Options",
      sortable: true,
      cell: (node) => {
        const summary = (node.optionSummary ?? []).filter(Boolean)
        return (
          <div className="flex min-w-0 flex-col gap-1">
            <Badge variant="secondary" className="w-fit">
              {node.optionCount ?? 0} {node.optionCount === 1 ? "option" : "options"}
            </Badge>
            {summary.length > 0 && (
              <span className="truncate text-xs text-muted-foreground" title={summary.join(", ")}>
                {summary.join(", ")}
              </span>
            )}
          </div>
        )
      },
    },
    {
      id: "usageCount",
      header: "Used by",
      sortable: false,
      cell: (node) => {
        const n = node.usageCount ?? 0
        return (
          <span className="text-sm text-muted-foreground">
            {n} {n === 1 ? "product" : "products"}
          </span>
        )
      },
    },
    {
      id: "updatedAt",
      header: "Updated",
      sortable: true,
      cell: (node) => <span className="text-sm text-muted-foreground">{timeAgo(node.updatedAt)}</span>,
    },
    {
      id: "actions",
      header: "",
      sortable: false,
      className: "w-12 text-right",
      cell: (node) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7" aria-label={`Actions for ${node.name}`}>
                <MoreHorizontal className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {showDeleted ? (
                <>
                  <DropdownMenuItem onClick={() => onRestore(node)}>
                    <ArchiveRestore className="size-4" aria-hidden="true" />
                    Restore
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(node)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete permanently
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => onEdit(node)}>
                    <Pencil className="size-4" aria-hidden="true" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(node)}>
                    <Copy className="size-4" aria-hidden="true" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(node)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]
}
