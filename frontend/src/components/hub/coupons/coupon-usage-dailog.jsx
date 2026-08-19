"use client"

import { useState } from "react"
import { Loader2, Search, Users } from "lucide-react"
import useSWRInfinite from "swr/infinite"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { fetcher } from "@/lib/api"

const PAGE_SIZE = 20


export function CouponUsageDialog({ open, onOpenChange, couponId, couponCode }) {
  const [query, setQuery] = useState("")

  const getKey = (index, prev) => {
    if (!open || !couponId) return null
    if (prev && (prev.rows?.length ?? 0) < PAGE_SIZE) return null
    const params = new URLSearchParams({ page: String(index + 1), limit: String(PAGE_SIZE) })
    if (query) params.set("q", query)
    return `/seller/coupons/${couponId}/usage?${params.toString()}`
  }

  const { data: pages, size, setSize, isLoading, isValidating } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
    revalidateFirstPage: false,
    shouldRetryOnError: false,
  })

  const rows = (pages ?? []).flatMap((p) => p?.rows ?? [])
  const total = pages?.[0]?.total ?? 0
  const totalRedemptions = pages?.[0]?.totalRedemptions
  const uniqueUsers = pages?.[0]?.uniqueUsers ?? total
  const hasMore = rows.length < total
  const loadingMore = isValidating && pages && size > pages.length
  const initialLoading = isLoading && rows.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Usage {couponCode ? `— ${couponCode}` : ""}</DialogTitle>
          <DialogDescription>Every shopper who has redeemed this coupon, and how many times.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" aria-hidden="true" />
            {uniqueUsers} shopper{uniqueUsers === 1 ? "" : "s"}
          </span>
          {typeof totalRedemptions === "number" && <span>{totalRedemptions} total redemptions</span>}
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSize(1)
            }}
            placeholder="Search by name or email"
            className="h-9 pl-8"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-md border border-border">
          {initialLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Loading usage…
            </div>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No redemptions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/60 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Shopper</th>
                  <th className="px-3 py-2 text-right font-medium">Times used</th>
                  <th className="px-3 py-2 text-right font-medium">Last used</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.userId}>
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <span className="text-foreground">{r.name || "—"}</span>
                        <span className="text-xs text-muted-foreground">{r.email}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-foreground">{r.usageCount}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {r.lastUsedAt ? new Date(r.lastUsedAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {hasMore && (
          <Button variant="outline" size="sm" className="w-fit bg-transparent" onClick={() => setSize(size + 1)} disabled={loadingMore}>
            {loadingMore && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
            Load more
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}