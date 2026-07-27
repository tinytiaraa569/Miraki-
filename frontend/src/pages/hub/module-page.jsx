"use client"

import { useMemo } from "react"
import { Link, useLocation } from "react-router-dom"
import { ArrowRight, FolderKanban, Inbox } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { findNavMatch } from "@/lib/seller-nav"

/**
 * Generic frontend-only module page for every deep-linkable nav URL that
 * doesn't have a dedicated page yet (Products, Diamonds, Orders, ...).
 * Resolves its own title/icon from the URL, and cross-links the sibling
 * pages of the same group so every module stays one click away.
 */
export function HubModulePage() {
  const { pathname } = useLocation()

  const match = useMemo(() => findNavMatch(pathname), [pathname])
  const item = match?.item
  const parent = match?.parent
  const Icon = item?.icon ?? FolderKanban

  const siblings = useMemo(() => {
    if (!parent?.items) return []
    return parent.items.filter((c) => c.url !== item?.url)
  }, [parent, item])

  return (
    <div className="flex flex-col gap-6">
      {/* Page heading */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-col">
            <h1 className="text-xl font-semibold text-balance text-foreground md:text-2xl">
              {item?.title ?? "Module"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {parent ? `${parent.title} · Seller Hub module` : "Seller Hub module"}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="shrink-0 rounded-full">
          Coming soon
        </Badge>
      </div>

      {/* Empty state */}
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Inbox className="size-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">
              {item?.title ?? "This module"} is not connected yet
            </p>
            <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground">
              The page shell, URL and navigation are ready. Data and actions for this module will appear here once
              the backend is wired up.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sibling pages in the same group */}
      {siblings.length > 0 && (
        <section aria-labelledby="related-heading" className="flex flex-col gap-3">
          <h2 id="related-heading" className="text-sm font-semibold text-foreground">
            More in {parent.title}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {siblings.map((sib) => (
              <Link
                key={sib.url}
                to={sib.url}
                className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-ring"
              >
                {sib.icon ? (
                  <sib.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                ) : null}
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">{sib.title}</span>
                <ArrowRight
                  className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default HubModulePage