"use client"

import { useRef, useState } from "react"
import { ChevronDown, Loader2, Search, X } from "lucide-react"
import useSWRInfinite from "swr/infinite"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { fetcher } from "@/lib/api"
import { useDebouncedValue } from "@/hooks/use-debounced-value"

const PAGE_SIZE = 10


function useCouponEntityOptions({ entity, open, query }) {
  const getKey = (pageIndex, prevPage) => {
    if (!open) return null
    if (prevPage && prevPage.rows.length < PAGE_SIZE) return null
    const params = new URLSearchParams({ page: String(pageIndex + 1), limit: String(PAGE_SIZE) })
    if (query) params.set("q", query)
    return `/seller/coupons/options/${entity}?${params.toString()}`
  }

  const { data, size, setSize, isLoading, isValidating } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateFirstPage: false,
    revalidateIfStale: false,
    shouldRetryOnError: false,
  })

  const rows = (data ?? []).flatMap((p) => p?.rows ?? [])
  const total = data?.[0]?.total ?? 0
  const hasMore = rows.length < total
  const loadingMore = isValidating && data && size > data.length

  return { rows, hasMore, loadingMore, isLoading, loadMore: () => setSize(size + 1) }
}


export function CouponEntityPicker({ entity, value = [], onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const q = useDebouncedValue(search, 300)
  const listRef = useRef(null)

  const { rows, hasMore, loadingMore, isLoading, loadMore } = useCouponEntityOptions({ entity, open, query: q })
  const selectedIds = new Set(value.map((v) => String(v.id)))

  function toggle(row) {
    const id = String(row._id)
    onChange(
      selectedIds.has(id) ? value.filter((v) => String(v.id) !== id) : [...value, { id, name: row.name }],
    )
  }
  function remove(id) {
    onChange(value.filter((v) => String(v.id) !== id))
  }
  function onScroll(e) {
    if (!hasMore || loadingMore) return
    const el = e.currentTarget
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 48) loadMore()
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
            className="h-auto min-h-9 w-full justify-between font-normal"
          >
            <span className="truncate text-muted-foreground">
              {value.length ? `${value.length} selected` : (placeholder ?? "Select…")}
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${entity}...`}
              className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div ref={listRef} onScroll={onScroll} className="max-h-64 overflow-y-auto p-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
              </div>
            ) : rows.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">No results</p>
            ) : (
              rows.map((row) => (
                <button
                  key={row._id}
                  type="button"
                  onClick={() => toggle(row)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  <Checkbox checked={selectedIds.has(String(row._id))} className="pointer-events-none" />
                  <span className="truncate">{row.name}</span>
                </button>
              ))
            )}
            {loadingMore && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-hidden="true" />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((v) => (
            <span key={v.id} className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
              {v.name}
              <button type="button" onClick={() => remove(v.id)} aria-label={`Remove ${v.name}`}>
                <X className="size-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}