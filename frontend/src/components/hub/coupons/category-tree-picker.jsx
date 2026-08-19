"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, FolderTree, Loader2 } from "lucide-react"
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
import { cn } from "@/lib/utils"
import { fetcher } from "@/lib/api"


function PickerNode({ node, depth, parentPath, selectedIds, onToggle }) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = Boolean(node.hasChildren ?? node.childCount > 0)
  const path = [...parentPath, node.name]

  const { data, isLoading } = useSWR(
    expanded && hasChildren ? `/seller/categories?parentId=${node._id}` : null,
    fetcher,
    { revalidateOnFocus: false },
  )
  const children = data?.rows ?? []
  const checked = selectedIds.includes(String(node._id))

  return (
    <div>
      <div
        className="flex items-center gap-2 rounded-md py-1.5 pr-2 hover:bg-muted/60"
        style={{ paddingLeft: `${depth * 1.25 + 0.5}rem` }}
      >
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground",
            !hasChildren && "invisible",
          )}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {isLoading ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : expanded ? (
            <ChevronDown className="size-3.5" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-3.5" aria-hidden="true" />
          )}
        </button>
        <Checkbox
          id={`cat-${node._id}`}
          checked={checked}
          onCheckedChange={() => onToggle(node, path)}
        />
        <label htmlFor={`cat-${node._id}`} className="flex-1 cursor-pointer truncate text-sm text-foreground">
          {node.name}
        </label>
      </div>

      {expanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <PickerNode
              key={child._id}
              node={child}
              depth={depth + 1}
              parentPath={path}
              selectedIds={selectedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}

      {expanded && !isLoading && hasChildren && children.length === 0 && (
        <p
          className="py-1 text-xs text-muted-foreground"
          style={{ paddingLeft: `${(depth + 1) * 1.25 + 0.5}rem` }}
        >
          No subcategories
        </p>
      )}
    </div>
  )
}

export function CategoryTreePicker({ open, onOpenChange, value = [], onChange, onLabels }) {
  const { data, isLoading } = useSWR(open ? "/seller/categories?parentId=null" : null, fetcher, {
    revalidateOnFocus: false,
  })
  const roots = data?.rows ?? []
  const selectedIds = Array.isArray(value) ? value.map(String) : []

  function toggle(node, path) {
    const id = String(node._id)
    const next = selectedIds.includes(id) ? selectedIds.filter((v) => v !== id) : [...selectedIds, id]
    onChange(next)
    onLabels?.({ [id]: path })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select categories</DialogTitle>
          <DialogDescription>
            Choose the categories this condition matches. Expand a branch to reach its subcategories.
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
              <PickerNode
                key={node._id}
                node={node}
                depth={0}
                parentPath={[]}
                selectedIds={selectedIds}
                onToggle={toggle}
              />
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


export function CategoryTreeField({ selectedIds, onChange, placeholder = "Select categories" }) {
  const [open, setOpen] = useState(false)
  const [labels, setLabels] = useState({}) 

  const { data: resolved } = useSWR(
    selectedIds.length ? `/seller/categories/options?ids=${selectedIds.join(",")}` : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )

  function labelFor(id) {
    if (labels[id]) return labels[id].join(" > ")
    const row = resolved?.rows?.find((r) => String(r._id) === id)
    return row?.name ?? id
  }

  function remove(id) {
    onChange(selectedIds.filter((v) => v !== id))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border p-2 min-h-9">
        {selectedIds.length === 0 && <span className="px-1 text-sm text-muted-foreground">{placeholder}</span>}
        {selectedIds.map((id) => (
          <span
            key={id}
            className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-foreground"
          >
            {labelFor(id)}
            <button
              type="button"
              onClick={() => remove(id)}
              className="text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${labelFor(id)}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" className="w-fit bg-transparent" onClick={() => setOpen(true)}>
        Browse categories
      </Button>
      <CategoryTreePicker
        open={open}
        onOpenChange={setOpen}
        value={selectedIds}
        onChange={onChange}
        onLabels={(next) => setLabels((l) => ({ ...l, ...next }))}
      />
    </div>
  )
}