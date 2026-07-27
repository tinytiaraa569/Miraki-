"use client"

import { useState } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { OverviewView } from "@/views/overview-view"
import { SellersView } from "@/views/sellers-view"
import { SuperadminsView } from "@/views/superadmins-view"
import { AuditView } from "@/views/audit-view"

export function DashboardPage() {
  const [view, setView] = useState("overview")

  return (
    <SidebarProvider>
      <AppSidebar view={view} onNavigate={setView} />

      <SidebarInset>
        <DashboardHeader view={view} />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-screen-2xl px-4 py-6 md:px-8 md:py-8">
            {/* Only the active view is mounted, so its data loads on demand. */}
            {view === "overview" && <OverviewView onNavigate={setView} />}
            {view === "sellers" && <SellersView />}
            {view === "superadmins" && <SuperadminsView />}
            {view === "audit" && <AuditView />}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
