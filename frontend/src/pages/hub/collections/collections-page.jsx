"use client"

import { useState } from "react"
import { FolderOpen, Plus, Search } from "lucide-react"
import { toast } from "sonner"
import useSWR, { useSWRConfig } from "swr"
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
import { CollectionList } from "@/components/hub/collections/collection-list"
import { CollectionEditor } from "@/components/hub/collections/collection-editor"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { api, fetcher } from "@/lib/api"

/**
 * /hub/products/collections — StoreHippo-style two-pane collection manager.
 *
 * Left pane: a flat, paginated, searchable list split by Published / Unpublished
 * tabs (plus a Show Deleted trash toggle). Each row shows a Manual/Dynamic type
 * badge and a product-count badge read straight off the cached membership count.
 * Right pane: an inline create/edit editor supporting both collection types.
 * Every mutation revalidates all `/seller/collections` SWR keys so the list and
 * badges stay in sync.
 */
export default function HubCollectionsPage() {
  const { mutate: globalMutate } = useSWRConfig()

  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("published") // "published" | "unpublished"
  const [showDeleted, setShowDeleted] = useState(false)
  const [selection, setSelection] = useState(null) // null | { mode: "edit", id } | { mode: "create" }
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const q = useDebouncedValue(search, 300)
  const searching = Boolean(q.trim())

  const params = new URLSearchParams()
  if (searching) params.set("q", q.trim())
  else params.set("published", tab === "published" ? "true" : "false")
  if (showDeleted) params.set("deleted", "true")

  const { data, isLoading } = useSWR(`/seller/collections?${params}`, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })
  const rows = data?.rows ?? []

  function refreshList() {
    globalMutate((key) => typeof key === "string" && key.startsWith("/seller/collections"))
  }

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
        await api.post(`/seller/collections/${node._id}/restore`)
        toast.success(`Restored ${node.name}`)
        refreshList()
      } catch (err) {
        toast.error(err.message)
      }
    },
  }

  function openCreate() {
    setSelection({ mode: "create" })
  }

  function handleSaved() {
    refreshList()
    setSelection(null)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const suffix = showDeleted ? "?permanent=true" : ""
    try {
      await api.delete(`/seller/collections/${deleteTarget._id}${suffix}`)
      toast.success(`${showDeleted ? "Permanently deleted" : "Deleted"} ${deleteTarget.name}`)
      if (selectedId === deleteTarget._id) setSelection(null)
      setDeleteTarget(null)
      refreshList()
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
            <h1 className="text-lg font-semibold text-foreground">Collections</h1>
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search collections..."
                className="h-9 pl-8"
                aria-label="Search collections by name"
              />
            </div>
          </div>

          {!showDeleted && !searching && (
            <div className="px-4 pb-3">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="published">Published</TabsTrigger>
                  <TabsTrigger value="unpublished">Unpublished</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto border-t border-border px-2 py-2">
            <CollectionList
              rows={rows}
              isLoading={isLoading}
              showDeleted={showDeleted}
              selectedId={selectedId}
              handlers={handlers}
            />
          </div>

          <div className="flex items-center gap-2 border-t border-border px-4 py-3">
            <Switch
              id="collection-show-deleted"
              checked={showDeleted}
              onCheckedChange={(v) => {
                setShowDeleted(v)
                setSelection(null)
              }}
              aria-label="Show deleted collections"
            />
            <Label htmlFor="collection-show-deleted" className="text-sm font-normal text-muted-foreground">
              Show Deleted
            </Label>
          </div>
        </aside>

        {/* -------------------------------------------------- RIGHT: EDITOR */}
        <section className="flex min-h-0  flex-col !overflow-hidden rounded-xl border border-border bg-card">
          {editorKey ? (
            <CollectionEditor
              key={editorKey}
              collectionId={selection.mode === "edit" ? selection.id : null}
              onSaved={handleSaved}
              onCancel={() => setSelection(null)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <FolderOpen className="size-6 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-foreground">No collection selected</p>
                <p className="max-w-xs text-sm text-muted-foreground">
                  Select a collection from the list to edit it, or add a new one to get started.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={openCreate}>
                <Plus className="size-3.5" aria-hidden="true" />
                Add collection
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
                ? "This permanently removes the collection, its images, and its materialized membership. This action cannot be undone."
                : "This moves the collection to the trash. You can restore it later from the “Show Deleted” view."}
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