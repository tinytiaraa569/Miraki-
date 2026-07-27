"use client"

import useSWR from "swr"
import { Users, Store, Ban, Activity, ArrowRight, ScrollText, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetcher } from "@/lib/api"
import { cn } from "@/lib/utils"

// Color-coded audit badges: security/red, creations/brand, everything else neutral.
function actionBadgeClass(action) {
  if (action.includes("rejected") || action.includes("failed") || action.includes("suspend")) {
    return "border-destructive/30 bg-destructive/10 text-destructive"
  }
  if (action.includes("create")) {
    return "border-success/30 bg-success/10 text-success"
  }
  if (action.startsWith("auth.") || action.includes("superadmin")) {
    return "border-primary/30 bg-primary/10 text-primary"
  }
  return "border-border bg-muted text-muted-foreground"
}

const TONES = {
  primary: { chip: "bg-primary/10 text-primary", bar: "bg-primary" },
  success: { chip: "bg-success/10 text-success", bar: "bg-success" },
  destructive: { chip: "bg-destructive/10 text-destructive", bar: "bg-destructive" },
  neutral: { chip: "bg-muted text-muted-foreground", bar: "bg-muted-foreground/40" },
}

function StatCard({ label, value, icon: Icon, hint, loading, tone = "primary", onClick }) {
  const t = TONES[tone] ?? TONES.primary
  const Wrapper = onClick ? "button" : "div"
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn("group text-left", onClick && "cursor-pointer")}
    >
      <Card className="relative overflow-hidden transition-shadow group-hover:shadow-md">
        {/* Top accent bar in the card's tone */}
        <span className={cn("absolute inset-x-0 top-0 h-0.5", t.bar)} aria-hidden="true" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
            {label}
            <span className={cn("flex size-9 items-center justify-center rounded-lg", t.chip)}>
              <Icon className="size-4" aria-hidden="true" />
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {loading ? (
            <Skeleton className="h-9 w-16" />
          ) : (
            <span className="text-3xl font-semibold tabular-nums text-foreground">{value}</span>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {hint}
            {onClick && (
              <ArrowRight
                className="size-3 opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden="true"
              />
            )}
          </span>
        </CardContent>
      </Card>
    </Wrapper>
  )
}

export function OverviewView({ onNavigate }) {
  // ONE stats request covers all seller counts (single $group aggregation server-side).
  const { data: statsData, isLoading: sellersLoading } = useSWR("/platform/stats", fetcher, {
    revalidateOnFocus: false,
  })
  const { data: auditData, isLoading: auditLoading } = useSWR("/platform/audit?limit=6", fetcher, {
    revalidateOnFocus: false,
  })
  const { data: adminsData, isLoading: adminsLoading } = useSWR("/platform/superadmins", fetcher, {
    revalidateOnFocus: false,
  })

  const totalSellers = statsData?.total ?? 0
  const active = statsData?.active ?? 0
  const suspended = statsData?.suspended ?? 0
  const recentAudit = auditData?.items ?? []
  const admins = adminsData?.items ?? []

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Platform health at a glance.</p>
      </div>

      <section aria-label="Overview stats" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total sellers"
          value={totalSellers}
          icon={Users}
          hint="Provisioned tenants"
          tone="primary"
          loading={sellersLoading}
          onClick={() => onNavigate("sellers")}
        />
        <StatCard
          label="Active"
          value={active}
          icon={Store}
          hint="Currently operating"
          tone="success"
          loading={sellersLoading}
          onClick={() => onNavigate("sellers")}
        />
        <StatCard
          label="Suspended"
          value={suspended}
          icon={Ban}
          hint="Access revoked"
          tone="destructive"
          loading={sellersLoading}
          onClick={() => onNavigate("sellers")}
        />
        <StatCard
          label="Superadmins"
          value={admins.length}
          icon={ShieldCheck}
          hint="Platform administrators"
          tone="primary"
          loading={adminsLoading}
          onClick={() => onNavigate("superadmins")}
        />
      </section>

      <section aria-label="Recent activity">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex size-7 items-center justify-center rounded-md bg-primary/10">
                  <ScrollText className="size-3.5 text-primary" aria-hidden="true" />
                </span>
                Recent activity
              </CardTitle>
              <CardDescription>Latest platform-level actions.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("audit")}>
              View all
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </CardHeader>
          <CardContent>
            {auditLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentAudit.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No audit entries yet.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {recentAudit.map((entry) => (
                  <li
                    key={entry._id}
                    className="flex items-start justify-between gap-3 border-b border-border pb-2.5 last:border-0 last:pb-0"
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <Badge
                        variant="outline"
                        className={cn("w-fit font-mono text-[11px]", actionBadgeClass(entry.action))}
                      >
                        {entry.action}
                      </Badge>
                      <span className="truncate text-xs text-muted-foreground">
                        {entry.actorRole ?? "system"}
                        {entry.ip ? ` · ${entry.ip}` : ""}
                      </span>
                    </div>
                    <time dateTime={entry.createdAt} className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

    </div>
  )
}
