"use client"

import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldTree } from "@/components/hub/metafields/field-tree"
import {
  useMetafield,
  useMetafieldMutations,
  useMetafieldsInfinite,
} from "@/components/hub/metafields/use-metafields"
import {
  docToForm,
  emptyForm,
  formToPayload,
  MODULES,
  moduleLabel,
  validateForm,
} from "@/components/hub/metafields/metafield-utils"

/**
 * Full-page Add/Edit metafield editor (StoreHippo "Metafields / Add"). Create
 * mode starts empty; edit mode fetches the full definition via GET /:id and
 * hydrates the recursive fields[] tree. One Save sends the whole nested payload
 * in a single POST (create) or PATCH (update). The module binding is fixed once
 * created, so it becomes read-only in edit mode.
 */
export function MetafieldEditor({ mode, metafieldId }) {
  const isEdit = mode === "edit"
  const navigate = useNavigate()
  const { metafield, isLoading, error } = useMetafield(isEdit ? metafieldId : null)
  const { save } = useMetafieldMutations()

  // In create mode, pull the existing definitions so already-bound modules can
  // be disabled in the Name dropdown (one definition per module per tenant).
  // Loaded 10 at a time via infinite scroll; edit mode skips the fetch entirely.
  const { rows, hasMore, isLoadingMore, loadMore } = useMetafieldsInfinite({
    limit: 10,
    enabled: !isEdit,
  })
  const usedModules = new Set(rows.map((r) => r.module))

  // Sentinel at the bottom of the dropdown — when it scrolls into view we pull
  // the next 10-10 batch.
  const sentinelRef = useCallback(
    (node) => {
      if (!node || !hasMore) return
      const observer = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) loadMore()
      })
      observer.observe(node)
      return () => observer.disconnect()
    },
    [hasMore, isLoadingMore, loadMore],
  )

  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  // Hydrate once the detail arrives (edit mode); start blank for create.
  useEffect(() => {
    if (isEdit && metafield) setForm(docToForm(metafield))
  }, [isEdit, metafield])

  useEffect(() => {
    if (error) toast.error(error.message || "Failed to load metafield")
  }, [error])

  async function submit(e) {
    e?.preventDefault()
    const problem = validateForm(form)
    if (problem) {
      toast.error(problem)
      return
    }
    setSaving(true)
    try {
      const body = formToPayload(form, { includeModule: !isEdit })
      const saved = await save({ id: isEdit ? metafieldId : undefined, body })
      toast.success(isEdit ? "Metafield updated" : "Metafield created")
      if (!isEdit && saved?._id) {
        navigate(`/hub/advanced/metafields/${saved._id}/edit`, { replace: true })
      }
    } catch (err) {
      toast.error(err.message || "Failed to save metafield")
    } finally {
      setSaving(false)
    }
  }

  const loadingDetail = isEdit && isLoading && !metafield

  if (loadingDetail) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading metafield" />
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {/* ----------------------------------------------------------- header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => navigate("/hub/advanced/metafields")} aria-label="Back to metafields">
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold text-foreground">
              {isEdit ? "Edit metafield" : "Add metafield"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Define a module-bound schema. Everything saves in one step.
            </p>
          </div>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
          Save
        </Button>
      </div>

      {/* -------------------------------------------------------- identity */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mf-module">
              Name <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.module || undefined}
              onValueChange={(value) =>
                setForm((f) => ({
                  ...f,
                  module: value,
                  // Auto-fill the label from the module the first time it's empty.
                  label: f.label?.trim() ? f.label : moduleLabel(value),
                }))
              }
              disabled={isEdit}
            >
              <SelectTrigger id="mf-module" className="w-full">
                <SelectValue placeholder="Select a module" />
              </SelectTrigger>
              <SelectContent>
                {form.module && !MODULES.some((m) => m.value === form.module) && (
                  <SelectItem value={form.module}>{moduleLabel(form.module)}</SelectItem>
                )}
                {MODULES.map((m) => {
                  const taken = usedModules.has(m.value) && m.value !== form.module
                  return (
                    <SelectItem key={m.value} value={m.value} disabled={taken}>
                      {m.label}
                      {taken && <span className="text-xs text-muted-foreground"> · in use</span>}
                    </SelectItem>
                  )
                })}
                {/* Infinite-scroll sentinel: loads the next 10 bound modules. */}
                {hasMore && (
                  <div ref={sentinelRef} className="flex items-center justify-center py-2">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Loading more modules" />
                  </div>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Module binding, e.g. <code className="font-mono">ms.categories</code>. Fixed once created;
              a module already bound to a metafield can&apos;t be picked again.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mf-label">Label</Label>
            <Input
              id="mf-label"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Categories"
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="mf-description">Description</Label>
            <Textarea
              id="mf-description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Optional — what this metafield is for"
            />
          </div>
          <label htmlFor="mf-active" className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <Checkbox
              id="mf-active"
              checked={form.isActive}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: Boolean(v) }))}
            />
            Active
          </label>
        </div>
      </div>

      {/* ----------------------------------------------------------- fields */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Fields <span className="text-destructive">*</span>
          </h2>
          <span className="text-sm text-muted-foreground">
            {form.fields.length} {form.fields.length === 1 ? "field" : "fields"}
          </span>
        </div>
        {form.fields.length === 0 && (
          <p className="mb-3 rounded-md border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            No fields yet. Add your first field to build the schema.
          </p>
        )}
        <FieldTree
          fields={form.fields}
          depth={0}
          onChange={(fields) => setForm((f) => ({ ...f, fields }))}
          addLabel="Add Field"
        />
      </div>

      {/* ----------------------------------------------------- sticky save */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate("/hub/advanced/metafields")} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
          {isEdit ? "Save changes" : "Create metafield"}
        </Button>
      </div>
    </form>
  )
}
