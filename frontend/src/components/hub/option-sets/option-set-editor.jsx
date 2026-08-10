"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import useSWRInfinite from "swr/infinite"
import { Loader2, Save, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { MultiSelect } from "@/components/hub/multi-select"
import { fetcher } from "@/lib/api"
import { OptionTable } from "@/components/hub/option-sets/option-table"
import {
  docToForm,
  formToPayload,
  isValueBearing,
  slugify,
} from "@/components/hub/option-sets/option-set-utils"
import { useOptionSet, useOptionSetMutations } from "@/components/hub/option-sets/use-option-sets"

const EMPTY_FORM = { name: "", displayName: "", alias: "", substoreIds: [], options: [] }

/**
 * The "Option sets / Add" editor, rendered in a right-side sheet (§10.4). Create
 * mode starts empty; edit mode fetches full detail via GET /:id and hydrates the
 * nested Options + Values tables. One Save sends the whole nested payload in a
 * single POST (create) or PATCH (update), matching the embedded-document design.
 */
export function OptionSetEditor({ open, mode, optionSetId, onOpenChange, onSaved }) {
  const isEdit = mode === "edit"
  const { optionSet, isLoading, error } = useOptionSet(isEdit && open ? optionSetId : null)
  const { save } = useOptionSetMutations()

  const [form, setForm] = useState(EMPTY_FORM)
  const [aliasTouched, setAliasTouched] = useState(false)
  const [saving, setSaving] = useState(false)

  // ---- Substore picker (lazy, paged) — same pattern as the collection/category
  // editors. Nothing is fetched until the picker is opened; it then hits the lean
  // /options endpoint (5 at a time) that returns just _id/name/alias. ----
  const SUBSTORE_PAGE_SIZE = 5
  const [substoreQuery, setSubstoreQuery] = useState("")
  const [substorePickerOpen, setSubstorePickerOpen] = useState(false)
  const getSubstoreKey = (index, prev) => {
    if (!substorePickerOpen) return null // lazy: don't fetch until opened
    if (prev && prev.rows.length < SUBSTORE_PAGE_SIZE) return null
    const params = new URLSearchParams({ page: String(index + 1), limit: String(SUBSTORE_PAGE_SIZE) })
    if (substoreQuery) params.set("q", substoreQuery)
    return `/seller/substores/options?${params.toString()}`
  }
  const {
    data: substorePages,
    size: substoreSize,
    setSize: setSubstoreSize,
    isLoading: substoreLoading,
    isValidating: substoreValidating,
  } = useSWRInfinite(getSubstoreKey, fetcher, {
    revalidateOnFocus: false,
    revalidateFirstPage: false,
    shouldRetryOnError: false,
  })
  const substoreRows = (substorePages ?? []).flatMap((p) => p?.rows ?? [])
  const substoreTotal = substorePages?.[0]?.total ?? 0
  const pickerSubstoreOptions = substoreRows.map((s) => ({ value: String(s._id), label: s.name, sublabel: s.alias }))
  const substoreHasMore = substoreRows.length < substoreTotal
  const substoreLoadingMore = substoreValidating && substorePages && substoreSize > substorePages.length

  // Resolve labels for already-selected ids (edit mode) so chips aren't blank
  // before the paged list has scrolled far enough to include them.
  const initialSubstoreIds = useMemo(
    () => (optionSet?.substoreIds ?? []).map(String),
    [optionSet],
  )
  const { data: selectedSubstoreData } = useSWR(
    initialSubstoreIds.length ? `/seller/substores/options?ids=${initialSubstoreIds.join(",")}` : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const substoreOptions = useMemo(() => {
    const byValue = new Map()
    for (const s of selectedSubstoreData?.rows ?? []) {
      byValue.set(String(s._id), { value: String(s._id), label: s.name, sublabel: s.alias })
    }
    for (const o of pickerSubstoreOptions) byValue.set(o.value, o)
    return [...byValue.values()]
  }, [selectedSubstoreData, pickerSubstoreOptions])

  // Reset / hydrate whenever the sheet opens for a different target.
  useEffect(() => {
    if (!open) return
    if (isEdit) {
      if (optionSet) {
        setForm(docToForm(optionSet))
        setAliasTouched(true)
      }
    } else {
      setForm(EMPTY_FORM)
      setAliasTouched(false)
    }
  }, [open, isEdit, optionSet])

  useEffect(() => {
    if (error) toast.error(error.message || "Failed to load option set")
  }, [error])

  function onNameChange(e) {
    const name = e.target.value
    setForm((f) => ({ ...f, name, alias: aliasTouched ? f.alias : slugify(name) }))
  }

  async function submit(e) {
    e?.preventDefault()
    if (!form.name.trim()) {
      toast.error("Name is required")
      return
    }
    // Guard the §8 rule client-side so the user gets an inline message.
    const bad = form.options.find((o) => isValueBearing(o.type) && (o.values?.length ?? 0) === 0)
    if (bad) {
      toast.error(`Option "${bad.name || "untitled"}" needs at least one value`)
      return
    }
    setSaving(true)
    try {
      await save({ id: isEdit ? optionSetId : undefined, body: formToPayload(form) })
      toast.success(isEdit ? "Option set updated" : "Option set created")
      onSaved?.()
      onOpenChange(false)
    } catch (err) {
      toast.error(err.message || "Failed to save option set")
    } finally {
      setSaving(false)
    }
  }

  const loadingDetail = isEdit && open && isLoading && !optionSet

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} className="w-full gap-0 p-0 sm:max-w-4xl lg:max-w-5xl">
        <form onSubmit={submit} className="flex h-full min-h-0 flex-col">
          {/* ---------------------------------------------- fixed header */}
          <SheetHeader className="flex-row items-center justify-between border-b border-border p-4">
            <div className="flex min-w-0 flex-col gap-1">
              <SheetTitle className="text-lg">{isEdit ? "Edit option set" : "Add option set"}</SheetTitle>
              <SheetDescription className="truncate">
                Define reusable options and their values. Everything saves in one step.
              </SheetDescription>
            </div>
            <Button type="submit" size="sm" disabled={saving || !form.name.trim()}>
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
              Save
            </Button>
          </SheetHeader>

          {/* -------------------------------- scrollable middle (only) */}
          {loadingDetail ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading option set" />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="os-name" className="text-sm font-medium text-foreground">
                    Name
                  </Label>
                  <Input id="os-name" value={form.name} onChange={onNameChange} placeholder="Gemstone Solitaire Pendant" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="os-display" className="text-sm font-medium text-foreground">
                    Display name
                  </Label>
                  <Input
                    id="os-display"
                    value={form.displayName}
                    onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                    placeholder="Optional — used in export"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="os-alias" className="text-sm font-medium text-foreground">
                    Alias
                  </Label>
                  <Input
                    id="os-alias"
                    value={form.alias}
                    onChange={(e) => {
                      setAliasTouched(true)
                      setForm((f) => ({ ...f, alias: e.target.value }))
                    }}
                    placeholder="auto-generated from name"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-medium text-foreground">Substores</Label>
                  <MultiSelect
                    options={substoreOptions}
                    selected={form.substoreIds}
                    onChange={(substoreIds) => setForm((f) => ({ ...f, substoreIds }))}
                    placeholder="All substores"
                    emptyText="No substores"
                    onOpenChange={(open) => open && setSubstorePickerOpen(true)}
                    loading={substoreLoading}
                    hasMore={substoreHasMore}
                    isLoadingMore={substoreLoadingMore}
                    onLoadMore={() => setSubstoreSize(substoreSize + 1)}
                    onSearch={(q) => {
                      setSubstoreQuery(q)
                      setSubstoreSize(1) // new query → start from the first page again
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty to show in all substores.</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-foreground">Options</h3>
                  <span className="text-sm text-muted-foreground">
                    {form.options.length} {form.options.length === 1 ? "option" : "options"}
                  </span>
                </div>
                <OptionTable options={form.options} onChange={(options) => setForm((f) => ({ ...f, options }))} />
              </div>
            </div>
          )}

          {/* ---------------------------------------------- fixed footer */}
          <SheetFooter className="flex-row items-center justify-end gap-2 border-t border-border p-4">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
              <X className="size-4" aria-hidden="true" />
              Close
            </Button>
            <Button type="submit" size="sm" disabled={saving || !form.name.trim()}>
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
              {isEdit ? "Save changes" : "Create option set"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
