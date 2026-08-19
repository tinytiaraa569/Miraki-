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
 * Plain column descriptors for the server-driven Metafields list. No TanStack —
 * each column is `{ id, header, sortable, className, cell(node) }` and the table
 * maps over them directly. Rows come from the lean `$facet` projection
 * ({ module, label, fieldCount, version, isActive, deletedAt, updatedAt }).
 */
export function buildMetafieldColumns({ showDeleted, onEdit, onDuplicate, onDelete, onRestore }) {
  return [
    {
      id: "module",
      header: "Name",
      sortable: true,
      cell: (node) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-foreground">{node.module}</span>
          {node.label ? <span className="truncate text-xs text-muted-foreground">{node.label}</span> : null}
        </div>
      ),
    },
    {
      id: "fieldCount",
      header: "Fields",
      sortable: true,
      cell: (node) => (
        <Badge variant="secondary" className="w-fit">
          {node.fieldCount ?? 0} {node.fieldCount === 1 ? "field" : "fields"}
        </Badge>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: false,
      cell: (node) =>
        node.isActive === false ? (
          <Badge variant="outline" className="text-muted-foreground">
            Inactive
          </Badge>
        ) : (
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
            Active
          </Badge>
        ),
    },
    {
      id: "updatedAt",
      header: "Updated",
      sortable: true,
      className: "hidden sm:table-cell",
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
              <Button variant="ghost" size="icon" className="size-7" aria-label={`Actions for ${node.module}`}>
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
