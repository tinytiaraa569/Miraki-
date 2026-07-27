"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { ScrollText, Loader2, RefreshCw, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetcher } from "@/lib/api"

const PAGE_SIZE = 25

function actionVariant(action) {
  if (action.includes("failed") || action.includes("suspend")) return "destructive"
  if (action.includes("create")) return "default"
  return "secondary"
}

export function AuditView() {
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")

  // Fetched only while this view is mounted. No polling — manual refresh only.
  const { data, isLoading, isValidating, mutate } = useSWR(
    `/platform/audit?limit=${PAGE_SIZE}&page=${page}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true },
  )

  const entries = data?.items ?? []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(
      (e) =>
        e.action?.toLowerCase().includes(q) ||
        e.actorRole?.toLowerCase().includes(q) ||
        e.targetType?.toLowerCase().includes(q) ||
        e.ip?.toLowerCase().includes(q),
    )
  }, [entries, query])

  const hasNextPage = entries.length === PAGE_SIZE

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Audit logs</h1>
          <p className="text-sm text-muted-foreground">Immutable, append-only trail of platform actions.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()} disabled={isValidating}>
          {isValidating ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="size-4" aria-hidden="true" />
          )}
          Refresh
        </Button>
      </div>

      {/* Toolbar */}
      <div className="relative w-full sm:max-w-xs">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Filter by action, role, target, IP…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          aria-label="Filter audit entries"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
          <ScrollText className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground">
            {entries.length === 0 ? "No audit entries yet" : "No entries match your filter"}
          </p>
          <p className="text-sm text-muted-foreground">
            {entries.length === 0
              ? "Actions taken on the platform will appear here."
              : "Try a different search term."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>IP address</TableHead>
                <TableHead className="text-right">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry._id}>
                  <TableCell>
                    <Badge variant={actionVariant(entry.action)} className="font-mono text-[11px]">
                      {entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{entry.actorRole ?? "system"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.targetId ? (
                      <span className="flex flex-col">
                        <span className="text-xs">{entry.targetType ?? "—"}</span>
                        <span className="font-mono text-[11px] text-muted-foreground/70">{entry.targetId}</span>
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{entry.ip ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <time dateTime={entry.createdAt} className="text-xs tabular-nums text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </time>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && entries.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} · {filtered.length} entr{filtered.length === 1 ? "y" : "ies"} shown
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isValidating}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNextPage || isValidating}
            >
              Next
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
