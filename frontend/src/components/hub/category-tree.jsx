"use client"

import { useState } from "react"
import {
  ArchiveRestore,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderTree,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { fetcher } from "@/lib/api"

/**
 * A single category row. Owns its own `open` state and only fetches its direct
 * children (`?parentId=<id>`) once expanded — the N-level lazy-load core. The
 * expand chevron is drawn purely from `hasChildren` (a denormalized count on
 * the server), so we know a node is expandable without any extra request.
 *
 * Indentation + the vertical guide lines come entirely from nested wrappers
 * (`border-l`), so every depth renders with the exact same row markup.
 */
function CategoryNode({ node, depth, showDeleted, selectedId, handlers }) {
  const [open, setOpen] = useState(false)
  const hasChildren = node.hasChildren ?? (node.childrenCount ?? 0) > 0
  const selected = selectedId === node._id

  // Only fetch children while expanded (and in the matching trash view).
  const key =
    open && hasChildren
      ? `/seller/categories?parentId=${node._id}${showDeleted ? "&deleted=true" : ""}`
      : null
  const { data, isLoading } = useSWR(key, fetcher, { revalidateOnFocus: false })
  const children = data?.rows ?? []

  const FolderIcon = open && hasChildren ? FolderOpen : Folder

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1.5 rounded-md py-1.5 pl-1 pr-1.5 transition-colors",
          selected ? "bg-muted" : "hover:bg-muted/60",
        )}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
            aria-label={open ? `Collapse ${node.name}` : `Expand ${node.name}`}
            aria-expanded={open}
          >
            <ChevronRight className={cn("size-4 transition-transform", open && "rotate-90")} aria-hidden="true" />
          </button>
        ) : (
          <span className="size-5 shrink-0" aria-hidden="true" />
        )}

        <button
          type="button"
          onClick={() => handlers.onSelect(node)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <FolderIcon
            className={cn(
              "size-4 shrink-0",
              open && hasChildren ? "text-amber-500" : "text-muted-foreground",
            )}
            aria-hidden="true"
          />
          <span
            className={cn(
              "truncate text-sm",
              selected ? "font-semibold text-foreground" : "font-medium text-foreground",
            )}
          >
            {node.name}
          </span>
          {node.status === "inactive" && (
            <span className="shrink-0 rounded bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Inactive
            </span>
          )}
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          {(node.childrenCount ?? 0) > 0 && (
            <span
              className={cn(
                "min-w-6 rounded-md px-1.5 py-0.5 text-center text-xs font-medium tabular-nums text-muted-foreground",
                !showDeleted && "group-hover:hidden",
              )}
            >
              {node.childrenCount}
            </span>
          )}

          {!showDeleted && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 opacity-0 group-hover:opacity-100"
                    aria-label={`Add subcategory to ${node.name}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpen(true)
                      handlers.onAddChild(node)
                    }}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Add subcategory</TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
                  <DropdownMenuItem
                    onClick={() => {
                      setOpen(true)
                      handlers.onAddChild(node)
                    }}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Add subcategory
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

      {open && hasChildren && (
        <div className="ml-[0.9375rem] border-l border-border pl-2">
          {isLoading && children.length === 0 ? (
            <div className="flex flex-col gap-1 py-1 pl-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ) : children.length === 0 ? (
            <p className="py-1 pl-3 text-xs text-muted-foreground">No subcategories.</p>
          ) : (
            children.map((child) => (
              <CategoryNode
                key={child._id}
                node={child}
                depth={depth + 1}
                showDeleted={showDeleted}
                selectedId={selectedId}
                handlers={handlers}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Root of the tree. Fetches only the top-level categories (`parentId=null`);
 * deeper levels are loaded lazily by each expanded node.
 */
export function CategoryTree({ rows, isLoading, showDeleted, selectedId, handlers }) {
  if (isLoading && rows.length === 0) {
    return (
      <div className="flex flex-col gap-2 p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <FolderTree className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          {showDeleted ? "No deleted categories." : "No categories yet."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0.5">
      {rows.map((node) => (
        <CategoryNode
          key={node._id}
          node={node}
          depth={0}
          showDeleted={showDeleted}
          selectedId={selectedId}
          handlers={handlers}
        />
      ))}
    </div>
  )
}
