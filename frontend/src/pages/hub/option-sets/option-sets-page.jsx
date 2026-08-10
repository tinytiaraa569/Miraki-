"use client"

import { useMemo, useState } from "react"
import { Plus, Search } from "lucide-react"
import { toast } from "sonner"
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
import { Input } from "@/components/ui/input"
import { OptionSetTable } from "@/components/hub/option-sets/option-set-table"
import { OptionSetEditor } from "@/components/hub/option-sets/option-set-editor"
import { useOptionSetsList, useOptionSetMutations } from "@/components/hub/option-sets/use-option-sets"
import { useDebouncedValue } from "@/hooks/use-debounced-value"

// Column id → server sort key (§6.5). `updatedAt` maps onto the `createdAt` sort
// enum the API whitelists.
const SORT_KEY = { name: "name", optionCount: "optionCount", updatedAt: "createdAt" }

function sortingToParam(sorting) {
  const s = sorting[0]
  if (!s) return undefined
  const key = SORT_KEY[s.id]
  if (!key) return undefined
  return `${s.desc ? "-" : ""}${key}`
}

/**
 * /hub/products/option-sets — StoreHippo-style Option Sets manager.
 *
 * A server-driven list table (pagination / sorting / search all handled by
 * the §6 `$facet` aggregation) fed by SWR, plus an Add/Edit sheet that edits the
 * whole nested Options → Values tree in one save. Mirrors the Brands/Collections
 * modules; data flows entirely through the SWR hooks in use-option-sets.js.
 */
export default function HubOptionSetsPage() {
  const [search, setSearch] = useState("")
  const [showDeleted, setShowDeleted] = useState(false)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [sorting, setSorting] = useState([{ id: "name", desc: false }])

  // Editor sheet: { open, mode: "create" | "edit", id }
  const [editor, setEditor] = useState({ open: false, mode: "create", id: null })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const q = useDebouncedValue(search, 300)

  const params = useMemo(
    () => ({
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      sort: sortingToParam(sorting),
      q,
      deleted: showDeleted,
    }),
    [pagination, sorting, q, showDeleted],
  )

  const { data, isLoading, isValidating } = useOptionSetsList(params)
  const { duplicate, restore, remove } = useOptionSetMutations()

  const total = data?.total ?? 0

  const handlers = {
    onEdit(node) {
      setEditor({ open: true, mode: "edit", id: node._id })
    },
    async onDuplicate(node) {
      try {
        await duplicate(node._id)
        toast.success(`Duplicated ${node.name}`)
      } catch (err) {
        toast.error(err.message || "Failed to duplicate")
      }
    },
    onDelete(node) {
      setDeleteTarget(node)
    },
    async onRestore(node) {
      try {
        await restore(node._id)
        toast.success(`Restored ${node.name}`)
      } catch (err) {
        toast.error(err.message || "Failed to restore")
      }
    },
  }

  function openCreate() {
    setEditor({ open: true, mode: "create", id: null })
  }

  // Changing search or trash view resets to the first page (§6.5 reset rule).
  function onSearchChange(e) {
    setSearch(e.target.value)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }
  function onToggleDeleted(v) {
    setShowDeleted(v)
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await remove({ id: deleteTarget._id, permanent: showDeleted })
      toast.success(`${showDeleted ? "Permanently deleted" : "Deleted"} ${deleteTarget.name}`)
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err.message || "Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-[560px] flex-col gap-4">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
        {/* --------------------------------------------------------- header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">Option sets</h1>
            <Badge variant="secondary">{total}</Badge>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-3.5" aria-hidden="true" />
            Add New
          </Button>
        </div>

        {/* --------------------------------------------------------- toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              value={search}
              onChange={onSearchChange}
              placeholder="Search option sets..."
              className="h-9 pl-8"
              aria-label="Search option sets by name"
            />
          </div>
        </div>

        {/* ----------------------------------------------------------- table */}
        <div className="flex min-h-0 flex-1 flex-col border-t border-border">
          <OptionSetTable
            data={data?.rows}
            pageCount={data?.pageCount}
            isLoading={isLoading}
            isValidating={isValidating}
            showDeleted={showDeleted}
            onToggleDeleted={onToggleDeleted}
            pagination={pagination}
            setPagination={setPagination}
            sorting={sorting}
            setSorting={setSorting}
            handlers={handlers}
          />
        </div>
      </div>

      <OptionSetEditor
        open={editor.open}
        mode={editor.mode}
        optionSetId={editor.id}
        onOpenChange={(open) => setEditor((e) => ({ ...e, open }))}
        onSaved={() => {}}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {showDeleted ? "Permanently delete" : "Delete"} {deleteTarget?.name}?
            </DialogTitle>
            <DialogDescription>
              {showDeleted
                ? "This permanently removes the option set and any uploaded swatch images. This action cannot be undone."
                : "This moves the option set to the trash. You can restore it later from the “Show Deleted” view."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : showDeleted ? "Delete permanently" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
