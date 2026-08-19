"use client"

import useSWR from "swr"
import { Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TeamPanel } from "@/components/hub/team-panel"
import { useHubAuth, hasPermission } from "@/hooks/use-hub-auth"
import { fetcher } from "@/lib/api"

/** /hub/team — substore admin management (owner only). */
export function HubTeamPage() {
  const { isOwner, permissions } = useHubAuth()
  const canManageTeam = isOwner || hasPermission(permissions, "team", "read")
  const { data: hub, isLoading } = useSWR("/seller/hub", fetcher, { revalidateOnFocus: false })

  if (!canManageTeam) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Lock className="size-4" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-foreground">Owner access required</p>
          <p className="text-xs text-muted-foreground">Only the business owner can manage team members.</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading || !hub) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-balance text-foreground md:text-2xl">Team</h1>
        <p className="text-sm text-muted-foreground">Invite and manage the admins who run your stores.</p>
      </div>
      <TeamPanel hub={hub} />
    </div>
  )
}

export default HubTeamPage