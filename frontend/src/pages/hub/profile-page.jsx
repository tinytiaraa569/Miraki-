"use client"

import useSWR from "swr"
import { Skeleton } from "@/components/ui/skeleton"
import { ProfilePanel } from "@/components/hub/profile-panel"
import { fetcher } from "@/lib/api"

/** /hub/profile — business profile & branding. */
export function HubProfilePage() {
  const { data: hub, isLoading, mutate } = useSWR("/seller/hub", fetcher, { revalidateOnFocus: false })

  if (isLoading || !hub) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-balance text-foreground md:text-2xl">Business Profile</h1>
        <p className="text-sm text-muted-foreground">Your public business details and branding.</p>
      </div>
      <ProfilePanel seller={hub.seller} onSaved={mutate} />
    </div>
  )
}

export default HubProfilePage