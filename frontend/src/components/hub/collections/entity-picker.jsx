"use client"

import { useMemo, useState } from "react"
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react"
import useSWR from "swr"
import useSWRInfinite from "swr/infinite"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { fetcher } from "@/lib/api"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

/**
 * Searchable async picker for a lean `/options` feed ({ rows:[{_id,name,alias}],
 * total }). Lazy-loads a page at a time on open, searches server-side, and
 * resolves already-selected ids → labels so chips/labels always read nicely.
 *
 *   endpoint   e.g. "/seller/brands/options"
 *   multiple   true → array of ids, chips; false → single id string
 *   value      string id (single) | string[] (multiple)
 *   onChange   (nextValue, selectedOptions) => void   selectedOptions: [{value,label}]
 *   onLabels   (map) => void                          id → label, for parent caches
 */
export function EntityPicker({
  endpoint,
  multiple = false,
  value,
  onChange,
  onLabels,
  placeholder = "Enter to Search Value",
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebouncedValue(query, 300)

  const selectedIds = useMemo(
    () => (multiple ? (Array.isArray(value) ? value : []) : value ? [value] : []),
    [multiple, value],
  )

  // Resolve labels for the current selection (may not be on the loaded page).
  const { data: selectedData } = useSWR(
    selectedIds.length ? `${endpoint}?ids=${selectedIds.join(",")}` : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )

  // Lazy, paged option feed — only fetched once the popover is opened.
  const getKey = (index, prev) => {
    if (!open) return null
    if (prev && prev.rows.length < PAGE_SIZE) return null
    const params = new URLSearchParams({ page: String(index + 1), limit: String(PAGE_SIZE) })
    if (debouncedQuery) params.set("q", debouncedQuery)
    return `${endpoint}?${params.toString()}`
  }
  const {
    data: pages,
    size,
    setSize,
    isLoading,
    isValidating,
  } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
    revalidateFirstPage: false,
    shouldRetryOnError: false,
  })

  const rows = (pages ?? []).flatMap((p) => p?.rows ?? [])
  const total = pages?.[0]?.total ?? 0
  const hasMore = rows.length < total
  const loadingMore = isValidating && pages && size > pages.length

  // Merge selected (resolved) + currently loaded rows into a de-duped label map.
  const labelById = useMemo(() => {
    const map = {}
    for (const r of selectedData?.rows ?? []) map[String(r._id)] = r.name
    for (const r of rows) map[String(r._id)] = r.name
    return map
  }, [selectedData, rows])

  function emitLabels(extra) {
    if (!onLabels) return
    onLabels({ ...labelById, ...extra })
  }

  function selectSingle(row) {
    const id = String(row._id)
    // Clicking the already-selected option clears it (toggle off).
    if (selectedIds[0] === id) {
      onChange("", [])
      setOpen(false)
      return
    }
    onChange(id, [{ value: id, label: row.name }])
    emitLabels({ [id]: row.name })
    setOpen(false)
  }

  function toggleMulti(row) {
    const id = String(row._id)
    const next = selectedIds.includes(id) ? selectedIds.filter((v) => v !== id) : [...selectedIds, id]
    const selectedOptions = next.map((v) => ({ value: v, label: labelById[v] ?? v }))
    onChange(next, selectedOptions)
    emitLabels({ [id]: row.name })
  }

  function removeChip(id) {
    const next = selectedIds.filter((v) => v !== id)
    onChange(next, next.map((v) => ({ value: v, label: labelById[v] ?? v })))
  }

  const showEmpty = !isLoading && rows.length === 0

  const triggerLabel = multiple
    ? selectedIds.length > 0
      ? `${selectedIds.length} selected`
      : placeholder
    : selectedIds[0]
      ? (labelById[selectedIds[0]] ?? "1 selected")
      : placeholder

  function handleScroll(e) {
    if (!hasMore || loadingMore) return
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 48) setSize(size + 1)
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className={cn("truncate", selectedIds.length ? "text-foreground" : "text-muted-foreground")}>
              {triggerLabel}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-2" align="start">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="mb-2 h-8"
            autoFocus
          />
          <div
            onScroll={handleScroll}
            className="max-h-52 overflow-y-auto overscroll-contain"
            onWheel={(e) => e.stopPropagation()}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Loading…
              </div>
            ) : showEmpty ? (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">No results</p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {rows.map((row) => {
                  const id = String(row._id)
                  const isSelected = selectedIds.includes(id)
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => (multiple ? toggleMulti(row) : selectSingle(row))}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                          isSelected && "bg-accent/50",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input",
                            isSelected && "border-primary bg-primary text-primary-foreground",
                          )}
                          aria-hidden="true"
                        >
                          {isSelected && <Check className="size-3" />}
                        </span>
                        <span className="truncate">{row.name}</span>
                      </button>
                    </li>
                  )
                })}
                {loadingMore && (
                  <li className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground" aria-live="polite">
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    Loading more…
                  </li>
                )}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {multiple && selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedIds.map((id) => (
            <Badge key={id} variant="secondary" className="gap-1 rounded-md pr-1 font-normal">
              {labelById[id] ?? id}
              <button
                type="button"
                onClick={() => removeChip(id)}
                className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
                aria-label={`Remove ${labelById[id] ?? id}`}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
