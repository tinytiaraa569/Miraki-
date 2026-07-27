"use client"

import { LayoutDashboard, Store, ScrollText, LogOut, ShieldCheck, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

const NAV_GROUPS = [
  {
    label: "Platform",
    items: [
      { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      { id: "sellers", label: "Sellers", icon: Store },
      { id: "audit", label: "Audit logs", icon: ScrollText },
    ],
  },
  {
    label: "Administration",
    items: [{ id: "superadmins", label: "Superadmins", icon: ShieldCheck }],
  },
]

export function AppSidebar({ view, onNavigate }) {
  const { user, logout } = useAuth()
  const { isMobile, setOpenMobile } = useSidebar()
  const navigate = useNavigate()

  async function handleSignOut() {
    await logout()
    navigate("/platform/super-admin/login", { replace: true })
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-1">
            <SidebarMenuButton
              size="lg"
              className="pointer-events-none group-data-[collapsible=icon]:!w-auto group-data-[collapsible=icon]:justify-center"
              tooltip="Secure Access Tech"
            >
              {/* Collapsed: shield icon only (left edge of the logo, cropped) */}
              <div className="hidden h-8 w-10 shrink-0 overflow-hidden group-data-[collapsible=icon]:block">
                <img
                  src="/images/logo-full.png"
                  alt="Secure Access Tech logo"
                  className="h-8 w-auto max-w-none object-left dark:hidden"
                />
                <img
                  src="/images/logo-full-white.png"
                  alt="Secure Access Tech logo"
                  className="hidden h-8 w-auto max-w-none object-left dark:block"
                />
              </div>
              {/* Expanded: full logo, height-constrained so it never gets clipped.
                  Centered on mobile, left-aligned on desktop. */}
              <div className="flex min-w-0 flex-1 items-center justify-center overflow-hidden px-2 py-1.5 md:justify-start group-data-[collapsible=icon]:hidden">
                <img
                  src="/images/logo-full.png"
                  alt="Secure Access Tech"
                  className="h-8 w-auto max-w-full object-contain dark:hidden"
                />
                <img
                  src="/images/logo-full-white.png"
                  alt="Secure Access Tech"
                  className="hidden h-8 w-auto max-w-full object-contain dark:block"
                />
              </div>
            </SidebarMenuButton>
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpenMobile(false)}
                aria-label="Close menu"
                className="size-8 shrink-0 cursor-pointer"
              >
                <X aria-hidden="true" />
              </Button>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-sm">{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={view === item.id}
                      tooltip={item.label}
                      onClick={() => onNavigate(item.id)}
                      className="relative h-9 cursor-pointer text-[0.95rem] transition-colors [&>svg]:size-[18px] data-[active=true]:bg-primary/10 data-[active=true]:font-semibold data-[active=true]:text-primary data-[active=true]:hover:bg-primary/15 [&[data-active=true]>svg]:text-primary before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-primary before:opacity-0 before:transition-opacity data-[active=true]:before:opacity-100 group-data-[collapsible=icon]:before:hidden hover:bg-primary/5"
                    >
                      <item.icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary/10 font-mono text-xs font-semibold uppercase text-primary">
                  {user?.email?.slice(0, 2) ?? "SA"}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-xs font-medium text-sidebar-foreground">{user?.email}</span>
                <span className="text-[11px] text-muted-foreground">Superadmin</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                aria-label="Sign out"
                className="size-8 shrink-0 cursor-pointer group-data-[collapsible=icon]:hidden"
              >
                <LogOut aria-hidden="true" />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
