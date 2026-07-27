"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import useSWR from "swr"
import { Bell, Check, ChevronDown, Loader2, LogOut, Menu, Monitor, Moon, Settings, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { SettingsDialog } from "@/components/settings-dialog"
import { fetcher } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { useTheme } from "@/hooks/use-theme"

const VIEW_TITLES = {
  overview: "Dashboard",
  sellers: "Sellers",
  superadmins: "Superadmins",
  audit: "Audit logs",
}

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function NotificationsMenu() {
  const [open, setOpen] = useState(false)

  // Fetches ONLY while the menu is open — no background polling.
  const { data, isLoading } = useSWR(open ? "/platform/audit?limit=8" : null, fetcher, {
    revalidateOnFocus: false,
  })
  const items = data?.items ?? data?.logs ?? (Array.isArray(data) ? data : [])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Recent activity</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading && (
          <div className="flex items-center justify-center gap-2 px-3 py-6 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Loading…
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">No recent activity.</p>
        )}
        {!isLoading &&
          items.slice(0, 8).map((log) => (
            <div key={log._id} className="flex flex-col gap-0.5 rounded-sm px-2.5 py-2 hover:bg-accent/50">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-xs text-foreground">{log.action}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(log.createdAt)}</span>
              </div>
              <span className="truncate text-[11px] text-muted-foreground">{log.actorRole ?? "system"}</span>
            </div>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
]

function ThemeMenu() {
  const { theme, preference, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change theme">
          {theme === "dark" ? (
            <Moon className="size-4" aria-hidden="true" />
          ) : (
            <Sun className="size-4" aria-hidden="true" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onSelect={() => setTheme(value)}
          >
            <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
            {label}
            {preference === value && <Check className="ml-auto size-3.5" aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DashboardHeader({ view }) {
  const { user, logout } = useAuth()
  const { toggleSidebar } = useSidebar()
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)

  async function handleSignOut() {
    await logout()
    navigate("/platform/super-admin/login", { replace: true })
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-3 md:px-8">
        <div className="flex items-center gap-2">
          {/* Hamburger opens the off-canvas sidebar on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 md:hidden"
            aria-label="Open menu"
            onClick={toggleSidebar}
          >
            <Menu className="size-5" aria-hidden="true" />
          </Button>
          {/* Panel toggle on desktop */}
          <SidebarTrigger aria-label="Toggle sidebar" className="hidden md:inline-flex" />
          {/* Brand logo beside the hamburger on mobile (sidebar is off-canvas there) */}
          <div className="flex items-center md:hidden">
            <img src="/images/logo-full.png" alt="Secure Access Tech" className="h-7 w-auto dark:hidden" />
            <img
              src="/images/logo-full-white.png"
              alt="Secure Access Tech"
              className="hidden h-7 w-auto dark:block"
            />
          </div>
          <Separator orientation="vertical" className="hidden h-4 md:block" />
          <h1 className="hidden text-sm font-semibold text-foreground md:block">{VIEW_TITLES[view] ?? "Dashboard"}</h1>
        </div>

        <div className="flex items-center gap-1">
          <ThemeMenu />

          <NotificationsMenu />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 pl-1.5 pr-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-secondary font-mono text-[10px] font-semibold uppercase text-foreground">
                  {user?.email?.slice(0, 2) ?? "SA"}
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="truncate font-medium text-foreground">{user?.email}</span>
                <span className="font-normal">Superadmin</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => setSettingsOpen(true)}
              >
                <Settings className="size-4 text-muted-foreground" aria-hidden="true" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignOut}>
                <LogOut className="size-4 text-muted-foreground" aria-hidden="true" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        </div>
      </header>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
