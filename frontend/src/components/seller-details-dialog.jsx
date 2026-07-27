"use client"

import useSWR from "swr"
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  Database,
  Globe,
  Mail,
  MapPin,
  Phone,
  Store,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { fetcher } from "@/lib/api"
import { cn } from "@/lib/utils"

function InfoRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="flex min-w-0 flex-col">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={cn("break-words text-sm text-foreground", mono && "font-mono text-xs")}>{value || "—"}</span>
      </div>
    </div>
  )
}

function LogoBlock({ seller }) {
  const logoUrl = seller?.profile?.logoUrl
  const initials = seller?.businessName
    ?.split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")

  if (logoUrl) {
    return (
      <img
        src={logoUrl || "/placeholder.svg"}
        alt={`${seller.businessName} logo`}
        className="size-14 shrink-0 rounded-lg border border-border bg-background object-contain p-1"
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg font-semibold uppercase text-primary"
    >
      {initials}
    </span>
  )
}

export function SellerDetailsDialog({ sellerId, open, onOpenChange }) {
  const { data, error, isLoading } = useSWR(open && sellerId ? `/platform/sellers/${sellerId}` : null, fetcher, {
    revalidateOnFocus: false,
  })

  const seller = data?.seller
  const stores = data?.stores ?? []
  const profile = seller?.profile ?? {}
  const address = [profile.addressLine1, profile.city, profile.state, profile.postalCode, profile.country]
    .filter(Boolean)
    .join(", ")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Seller details</DialogTitle>
          <DialogDescription>Business profile, stores, and tenant information.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            {error.message || "Failed to load seller details"}
          </div>
        ) : seller ? (
          <div className="flex flex-col gap-5">
            {/* Identity header */}
            <div className="flex items-center gap-4">
              <LogoBlock seller={seller} />
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-foreground">{seller.businessName}</h3>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
                      seller.deletedAt
                        ? "border-destructive/20 bg-destructive/10 text-destructive"
                        : seller.status === "active"
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-destructive/20 bg-destructive/10 text-destructive",
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                    {seller.deletedAt ? "trashed" : seller.status}
                  </span>
                </div>
                <span className="truncate font-mono text-xs text-muted-foreground">{seller.slug}</span>
              </div>
            </div>

            <Separator />

            {/* Business profile */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Business profile
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoRow icon={Mail} label="Owner email" value={seller.ownerEmail} />
                <InfoRow icon={Phone} label="Phone" value={profile.phone} />
                <InfoRow icon={Globe} label="Website" value={profile.website} />
                <InfoRow icon={MapPin} label="Address" value={address} />
              </div>
              {profile.description && (
                <InfoRow icon={Building2} label="Description" value={profile.description} />
              )}
            </div>

            <Separator />

            {/* Stores */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stores</h4>
                <Badge variant={seller.multistoreEnabled ? "default" : "secondary"} className="rounded-full text-[11px]">
                  Multistore {seller.multistoreEnabled ? "enabled" : "disabled"}
                </Badge>
              </div>
              {stores.length === 0 ? (
                <p className="text-sm text-muted-foreground">Tenant store data unavailable.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {stores.map((store) => (
                    <li
                      key={store.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Store className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="truncate text-sm text-foreground">{store.name}</span>
                      </div>
                      <Badge
                        variant={store.type === "MAIN" ? "default" : "outline"}
                        className="shrink-0 rounded-full text-[10px]"
                      >
                        {store.type === "MAIN" ? "MAIN — HUB" : "SUB"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Separator />

            {/* Tenant meta */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoRow icon={Database} label="Tenant database" value={seller.dbName} mono />
              <InfoRow
                icon={Users}
                label="Team members"
                value={data.userCount === null ? "—" : String(data.userCount)}
              />
              <InfoRow
                icon={CalendarDays}
                label="Created"
                value={seller.createdAt ? new Date(seller.createdAt).toLocaleString() : "—"}
              />
              <InfoRow
                icon={CalendarDays}
                label="Last updated"
                value={seller.updatedAt ? new Date(seller.updatedAt).toLocaleString() : "—"}
              />
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
