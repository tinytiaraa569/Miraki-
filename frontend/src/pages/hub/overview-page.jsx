"use client"

import useSWR from "swr"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  Boxes,
  Building2,
  Gem,
  Megaphone,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { useSellerAuth } from "@/hooks/use-seller-auth"
import { fetcher } from "@/lib/api"
import { cn } from "@/lib/utils"

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

const QUICK_LINKS = [
  { title: "Products", desc: "Catalog, categories, brands and variants", url: "/hub/products", icon: Boxes },
  { title: "Diamonds", desc: "Diamond catalog, option and filter sets", url: "/hub/diamonds", icon: Gem },
  { title: "Orders", desc: "Orders, B2B enquiries and checkouts", url: "/hub/orders", icon: ShoppingCart },
  { title: "Marketing", desc: "Coupons, discounts and subscribers", url: "/hub/marketing/tools", icon: Megaphone },
  { title: "Customers", desc: "Customers, groups and wishlists", url: "/hub/customers", icon: Users },
  { title: "My Stores", desc: "Main store and substores overview", url: "/hub/stores", icon: Store },
]

export function HubOverviewPage() {
  const { user, seller, isOwner } = useSellerAuth()
  const { data: hub, isLoading } = useSWR("/seller/hub", fetcher, { revalidateOnFocus: false })

  const stats = hub?.stats ?? {}
  const stores = hub?.stores ?? []
  const mainStoreId = hub?.seller?.mainStoreId

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-balance text-foreground md:text-2xl">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          {seller?.businessName ?? "Your business"} · {isOwner ? "Owner" : "Store admin"} console
        </p>
      </div>

      {/* Stats */}
      {isLoading || !hub ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Store} label="Total stores" value={stats.totalStores ?? 0} />
          <StatCard icon={Building2} label="Substores" value={stats.subStores ?? 0} />
          <StatCard icon={Users} label="Team members" value={stats.teamMembers ?? "—"} />
        </div>
      )}

      {/* Quick links into the modules */}
      <section aria-labelledby="modules-heading" className="flex flex-col gap-3">
        <h2 id="modules-heading" className="text-sm font-semibold text-foreground">
          Jump to a module
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.url}
              to={link.url}
              className="group rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <link.icon className="size-4" aria-hidden="true" />
                </span>
                <ArrowRight
                  className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                  aria-hidden="true"
                />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{link.title}</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{link.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Stores snapshot */}
      <section aria-labelledby="stores-heading" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 id="stores-heading" className="text-sm font-semibold text-foreground">
            Your stores
          </h2>
          <Link to="/hub/stores" className="text-xs font-medium text-primary hover:underline">
            Manage stores
          </Link>
        </div>
        <Card>
          <CardContent className="p-0">
            {isLoading || !hub ? (
              <div className="p-4">
                <Skeleton className="h-24 w-full" />
              </div>
            ) : stores.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">No stores yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {stores.slice(0, 5).map((store) => {
                  const isMain = store.type === "MAIN" || String(store._id) === String(mainStoreId)
                  return (
                    <li key={store._id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg",
                            isMain ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                          )}
                          aria-hidden="true"
                        >
                          <Store className="size-4" />
                        </span>
                        <span className="truncate text-sm font-medium text-foreground">{store.name}</span>
                      </div>
                      <Badge variant={isMain ? "default" : "outline"} className="shrink-0 rounded-full text-[10px]">
                        {isMain ? "MAIN" : "SUB"}
                      </Badge>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default HubOverviewPage
