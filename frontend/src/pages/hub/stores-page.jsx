"use client"

import useSWR from "swr"
import { Skeleton } from "@/components/ui/skeleton"
import { StoresPanel } from "@/components/hub/stores-panel"
import { useHubAuth } from "@/hooks/use-hub-auth"
import { fetcher } from "@/lib/api"

/** /hub/stores — main store + substores management. */
export function HubStoresPage() {
  const { isOwner } = useHubAuth()
  const { data: hub, isLoading } = useSWR("/seller/hub", fetcher, { revalidateOnFocus: false })

  if (isLoading || !hub) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-balance text-foreground md:text-2xl">My Stores</h1>
        <p className="text-sm text-muted-foreground">Manage your main store and substores.</p>
      </div>
      <StoresPanel hub={hub} isOwner={isOwner} />
    </div>
  )
}

export default HubStoresPage
