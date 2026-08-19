"use client"

import { useEffect, useState } from "react"
import { BadgePercent, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react"
import { toast } from "sonner"
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
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DiscountList } from "@/components/hub/discounts/discount-list"
import { DiscountEditor } from "@/components/hub/discounts/discount-editor"
import { useDiscountsList, useDiscountMutations } from "@/components/hub/discounts/use-discounts"
import { useDebouncedValue } from "@/hooks/use-debounced-value"


const PAGE_SIZE = 10

export default function HubDiscountsPage() {
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("enabled") // "enabled" | "disabled"
  const [showDeleted, setShowDeleted] = useState(false)
  const [page, setPage] = useState(1)
  const [selection, setSelection] = useState(null) // null | { mode: "edit", id } | { mode: "create" }
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const q = useDebouncedValue(search, 300)
  const searching = Boolean(q.trim())

  const { data, isLoading } = useDiscountsList({
    page,
    limit: PAGE_SIZE,
    q: searching ? q.trim() : undefined,
    enabled: searching ? undefined : tab === "enabled",
    deleted: showDeleted || undefined,
  })

  const rows = data?.rows ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  
  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const { restore, remove } = useDiscountMutations()

  const selectedId = selection?.mode === "edit" ? selection.id : null
  const editorKey =
    selection?.mode === "edit" ? `edit:${selection.id}` : selection?.mode === "create" ? "create" : null

  const handlers = {
    onSelect(node) {
      if (showDeleted) return
      setSelection({ mode: "edit", id: node._id })
    },
    onDelete(node) {
      setDeleteTarget(node)
    },
    async onRestore(node) {
      try {
        await restore(node._id)
        toast.success(`Restored ${node.name}`)
      } catch (err) {
        toast.error(err.message)
      }
    },
  }

  function openCreate() {
    setSelection({ mode: "create" })
  }

  function handleSaved() {
    setSelection(null)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await remove({ id: deleteTarget._id, permanent: showDeleted })
      toast.success(`${showDeleted ? "Permanently deleted" : "Deleted"} ${deleteTarget.name}`)
      if (selectedId === deleteTarget._id) setSelection(null)
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-[560px] flex-col gap-4">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(300px,380px)_1fr]">
        {/* ---------------------------------------------------- LEFT: LIST */}
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <h1 className="text-lg font-semibold text-foreground">Discounts</h1>
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-3.5" aria-hidden="true" />
              Add New
            </Button>
          </div>

          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search discounts..."
                className="h-9 pl-8"
                aria-label="Search discounts by name"
              />
            </div>
          </div>

          {!showDeleted && !searching && (
            <div className="px-4 pb-3">
              <Tabs
                value={tab}
                onValueChange={(v) => {
                  setTab(v)
                  setPage(1)
                }}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="enabled">Enabled</TabsTrigger>
                  <TabsTrigger value="disabled">Disabled</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto border-t border-border px-2 py-2">
            <DiscountList
              rows={rows}
              isLoading={isLoading}
              showDeleted={showDeleted}
              selectedId={selectedId}
              handlers={handlers}
            />
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Switch
                id="discount-show-deleted"
                checked={showDeleted}
                onCheckedChange={(v) => {
                  setShowDeleted(v)
                  setSelection(null)
                  setPage(1)
                }}
                aria-label="Show deleted discounts"
              />
              <Label htmlFor="discount-show-deleted" className="text-sm font-normal text-muted-foreground">
                Show Deleted
              </Label>
            </div>

            {/* Compact pager — always shown (even on a single page), beside Show
                Deleted. The buttons simply disable at the range ends. */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-7"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
              <span className="px-1 text-xs tabular-nums text-muted-foreground">
                {page} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="size-7"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </aside>

        {/* -------------------------------------------------- RIGHT: EDITOR */}
        <section className="flex min-h-0 flex-col !overflow-hidden rounded-xl border border-border bg-card">
          {editorKey ? (
            <DiscountEditor
              key={editorKey}
              discountId={selection.mode === "edit" ? selection.id : null}
              onSaved={handleSaved}
              onCancel={() => setSelection(null)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <BadgePercent className="size-6 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">No discount selected</p>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Select a discount from the list to edit it, or add a new one to get started.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={openCreate}>
                <Plus className="size-3.5" aria-hidden="true" />
                Add discount
              </Button>
            </div>
          )}
        </section>
      </div>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {showDeleted ? "Permanently delete" : "Delete"} {deleteTarget?.name}?
            </DialogTitle>
            <DialogDescription>
              {showDeleted
                ? "This permanently removes the discount. This action cannot be undone."
                : "This moves the discount to the trash. You can restore it later from the “Show Deleted” view."}
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
