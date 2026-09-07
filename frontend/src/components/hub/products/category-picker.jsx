"use client"

import { useState } from "react"
import { ChevronRight, FolderTree, Loader2 } from "lucide-react"
import useSWR from "swr"
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
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { fetcher } from "@/lib/api"

/**
 * Categories tree picker (plan C.13). A lazy, checkbox-per-node variant of the
 * category tree used ONLY for assigning `categoryIds` on a product — the
 * standalone category MANAGER (`category-tree.jsx`) is left untouched.
 *
 * - Lazy-loads children via the existing `GET /seller/categories?parentId=`
 *   feed, one level at a time (same contract the manager uses).
 * - Every node is selectable; selection is id-valued (`categoryIds: [ObjectId]`)
 *   and emits `{ id: name }` label pairs so the parent can render chips without
 *   a refetch (the ObjectId rule, B.2/B.3).
 */
function PickerNode({ node, depth, parentPath = [], selectedIds, onToggle }) {
  const [open, setOpen] = useState(false)
  const hasChildren = node.hasChildren ?? (node.childrenCount ?? 0) > 0
  const checked = selectedIds.includes(String(node._id))
  const path = [...parentPath, node.name]

  const key = open && hasChildren ? `/seller/categories?parentId=${node._id}` : null
  const { data, isLoading } = useSWR(key, fetcher, { revalidateOnFocus: false })
  const children = data?.rows ?? []

  return (
    <div>
      <div className="group flex items-center gap-1.5 rounded-md py-1 pl-1 pr-1.5 transition-colors hover:bg-muted/60">
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

        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-1">
          <Checkbox
            checked={checked}
            onCheckedChange={() => onToggle(node, path)}
            aria-label={`Select ${node.name}`}
          />
          <span className="truncate text-sm font-medium text-foreground">{node.name}</span>
          {(node.childrenCount ?? 0) > 0 && (
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{node.childrenCount}</span>
          )}
        </label>
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
              <PickerNode
                key={child._id}
                node={child}
                depth={depth + 1}
                parentPath={path}
                selectedIds={selectedIds}
                onToggle={onToggle}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

export function CategoryPicker({ open, onOpenChange, value = [], onChange, onLabels }) {
  const { data, isLoading } = useSWR(open ? "/seller/categories?parentId=null" : null, fetcher, {
    revalidateOnFocus: false,
  })
  const roots = data?.rows ?? []
  const selectedIds = Array.isArray(value) ? value.map(String) : []

  function toggle(node, path = [node.name]) {
    const id = String(node._id)
    const next = selectedIds.includes(id) ? selectedIds.filter((v) => v !== id) : [...selectedIds, id]
    onChange(next)
    // Cache the full ancestry path so the field can render a breadcrumb.
    onLabels?.({ [id]: path })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Categories</DialogTitle>
          <DialogDescription>
            Choose the categories this product belongs to. Expand a branch to reach its subcategories.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[24rem] overflow-y-auto rounded-md border border-border p-2">
          {isLoading && roots.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Loading categories…
            </div>
          ) : roots.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <FolderTree className="size-7 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">No categories yet.</p>
            </div>
          ) : (
            roots.map((node) => (
              <PickerNode key={node._id} node={node} depth={0} selectedIds={selectedIds} onToggle={toggle} />
            ))
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
