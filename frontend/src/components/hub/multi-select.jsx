"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

/**
 * Searchable multi-select with removable chips.
 * `options`: [{ value, label }] — `value` strings are stored in `selected`.
 *
 * Infinite scroll (all optional — omit for the classic client-side list):
 *   `onLoadMore`     () => void  — fired once when the list is scrolled near the bottom.
 *   `hasMore`        boolean     — whether another page can be fetched.
 *   `isLoadingMore`  boolean     — a page fetch is in flight (shows a spinner row).
 *   `loading`        boolean     — the first page is still loading.
 *   `onSearch`       (q) => void — switches search to SERVER mode (debounced); when
 *                                  provided, options are shown as-is (no local filter).
 */
export function MultiSelect({
  options,
  selected = [],
  onChange,
  placeholder = "Select options",
  emptyText = "No results",
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  loading = false,
  onSearch,
  onOpenChange,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const scrollRef = useRef(null)
  const serverSearch = typeof onSearch === "function"

  // Let callers react to the picker opening (e.g. lazy-fetch options on first open).
  function handleOpenChange(next) {
    setOpen(next)
    onOpenChange?.(next)
  }

  // SERVER search: debounce the input so we don't refetch on every keystroke.
  useEffect(() => {
    if (!serverSearch) return
    const id = setTimeout(() => onSearch(query.trim()), 300)
    return () => clearTimeout(id)
    // onSearch is intentionally excluded — callers pass a stable handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, serverSearch])

  // CLIENT search: filter the already-loaded options in memory.
  const filtered = useMemo(() => {
    if (serverSearch) return options
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
  }, [options, query, serverSearch])

  const labelByValue = useMemo(() => Object.fromEntries(options.map((o) => [o.value, o.label])), [options])

  function toggle(value) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }

  // Fetch the next page as soon as the user scrolls within ~48px of the bottom.
  function handleScroll(e) {
    if (!onLoadMore || !hasMore || isLoadingMore) return
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 48) onLoadMore()
  }

  const showEmpty = !loading && filtered.length === 0

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate text-muted-foreground">
              {selected.length > 0 ? `${selected.length} selected` : placeholder}
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
            ref={scrollRef}
            onScroll={handleScroll}
            className="max-h-52 overflow-y-auto overscroll-contain"
            onWheel={(e) => e.stopPropagation()}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Loading…
              </div>
            ) : showEmpty ? (
              <p className="px-2 py-4 text-center text-sm text-muted-foreground">{emptyText}</p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {filtered.map((option) => {
                  const isSelected = selected.includes(option.value)
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => toggle(option.value)}
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
                        <span className="truncate">{option.label}</span>
                      </button>
                    </li>
                  )
                })}
                {isLoadingMore && (
                  <li
                    className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground"
                    aria-live="polite"
                  >
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    Loading more…
                  </li>
                )}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((value) => (
            <Badge key={value} variant="secondary" className="gap-1 rounded-md pr-1 font-normal">
              {labelByValue[value] ?? value}
              <button
                type="button"
                onClick={() => toggle(value)}
                className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
                aria-label={`Remove ${labelByValue[value] ?? value}`}
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
