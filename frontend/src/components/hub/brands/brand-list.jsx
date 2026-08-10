"use client"

import { ArchiveRestore, ImageIcon, MoreHorizontal, Pencil, Tag, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { imgUrl } from "@/Server"

/**
 * A single brand row. Brands are FLAT (no tree), so every row renders with the
 * same markup: a thumbnail, name + alias, a published/unpublished badge, and an
 * actions menu (edit / delete, or restore / permanent-delete in the trash view).
 */
function BrandRow({ node, showDeleted, selected, handlers }) {
  const thumb = node.thumbnail ? imgUrl(node.thumbnail) : null

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-md px-2 py-2 transition-colors",
        selected ? "bg-muted" : "hover:bg-muted/60",
      )}
    >
      <button
        type="button"
        onClick={() => handlers.onSelect(node)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
          {thumb ? (
            <img src={thumb || "/placeholder.svg"} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          )}
        </span>
        <span className="flex min-w-0 flex-col">
          <span
            className={cn(
              "truncate text-sm text-foreground",
              selected ? "font-semibold" : "font-medium",
            )}
          >
            {node.name}
          </span>
          {node.alias && <span className="truncate text-xs text-muted-foreground">{node.alias}</span>}
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-1.5">
        {!showDeleted && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              node.isPublished
                ? "bg-primary/10 text-primary"
                : "bg-muted-foreground/15 text-muted-foreground",
            )}
          >
            {node.isPublished ? "Published" : "Unpublished"}
          </span>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
              aria-label={`Actions for ${node.name}`}
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {showDeleted ? (
              <>
                <DropdownMenuItem onClick={() => handlers.onRestore(node)}>
                  <ArchiveRestore className="size-4" aria-hidden="true" />
                  Restore
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => handlers.onDelete(node)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete permanently
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => handlers.onSelect(node)}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => handlers.onDelete(node)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

/**
 * The flat brand list. Loading renders skeletons; empty renders the
 * "No Records Found" state from the reference screen.
 */
export function BrandList({ rows, isLoading, showDeleted, selectedId, handlers }) {
  if (isLoading && rows.length === 0) {
    return (
      <div className="flex flex-col gap-2 p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <Tag className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">No Records Found</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          {showDeleted ? "There are no deleted brands." : "Add a brand to get started."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      {rows.map((node) => (
        <BrandRow
          key={node._id}
          node={node}
          showDeleted={showDeleted}
          selected={selectedId === node._id}
          handlers={handlers}
        />
      ))}
    </div>
  )
}
