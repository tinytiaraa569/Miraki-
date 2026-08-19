"use client"

import { memo, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft, ChevronRight, LogOut, Search, Store, X } from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import useSWR from "swr"
import { useHubAuth } from "@/hooks/use-hub-auth"
import { useTheme } from "@/hooks/use-theme"
import { canAccessNavItem, filterSellerNav, isPathActive } from "@/lib/seller-nav"
import { fetcher } from "@/lib/api"
import { imgUrl } from "@/Server"
import { cn } from "@/lib/utils"

function getInitials(name) {
  if (!name) return "U"
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * A single nav row. Memoized so typing in the search box or opening a
 * submenu doesn't re-render every row — only rows whose props change.
 */
const NavRow = memo(function NavRow({ item, isActive, onOpenSubmenu, onNavigated }) {
  const hasChildren = !!item.items?.length

  if (hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={item.title}
          isActive={isActive}
          onClick={() => onOpenSubmenu(item)}
          aria-haspopup="dialog"
          className={cn(
          "relative h-9 cursor-pointer transition-colors [&>svg]:size-4",
          "before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-sidebar-primary before:opacity-0 before:transition-opacity",
          "data-[active=true]:bg-sidebar-primary/10 data-[active=true]:font-semibold data-[active=true]:text-sidebar-primary data-[active=true]:before:opacity-100",
          "hover:bg-sidebar-accent group-data-[collapsible=icon]:before:hidden",
          )}
        >
          <item.icon aria-hidden="true" />
          <span>{item.title}</span>
          <ChevronRight className="ml-auto size-4 text-muted-foreground" aria-hidden="true" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.title}
        isActive={isActive}
        asChild
        className={cn(
          "relative h-9 transition-colors [&>svg]:size-4",
          "before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-sidebar-primary before:opacity-0 before:transition-opacity",
          "data-[active=true]:bg-sidebar-primary/10 data-[active=true]:font-semibold data-[active=true]:text-sidebar-primary data-[active=true]:before:opacity-100",
          "hover:bg-sidebar-accent group-data-[collapsible=icon]:before:hidden",
        )}
      >
        <Link to={item.url} aria-current={isActive ? "page" : undefined} onClick={onNavigated}>
          <item.icon aria-hidden="true" />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
})

export function SellerSidebar({ onOpenSubmenu }) {
  const { user, seller, isOwner, isStoreAdmin, permissions, logout } = useHubAuth()
  const { isMobile, openMobile, setOpenMobile } = useSidebar()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  // Deferring the filter keeps keystrokes instant on slower devices.
  const deferredQuery = useDeferredValue(query)

  // On mobile the sidebar lives inside a modal Sheet (focus-trapped portal),
  // so the desktop slide-out overlay can't be shown over it. Instead we drill
  // down IN PLACE inside the Sheet. Desktop keeps using the overlay via the
  // onOpenSubmenu prop.
  const [mobileSubmenu, setMobileSubmenu] = useState(null)

  const handleOpenSubmenu = useCallback(
    (item) => {
      if (isMobile) setMobileSubmenu(item)
      else onOpenSubmenu(item)
    },
    [isMobile, onOpenSubmenu],
  )

  // Always reset the drill-down when the Sheet closes so it reopens at the top.
  useEffect(() => {
    if (!openMobile) setMobileSubmenu(null)
  }, [openMobile])

  const filteredNav = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    const baseNav = filterSellerNav(permissions ?? [], isOwner)

    if (!q) return baseNav
    return baseNav.map((item) => {
      const parentMatch = item.title.toLowerCase().includes(q)
      const children = item.items?.filter((c) => c.title.toLowerCase().includes(q))
      if (parentMatch) return item
      if (children?.length) return { ...item, items: children }
      return null
    }).filter(Boolean)
  }, [deferredQuery, permissions, isOwner])

  const closeMobile = useCallback(() => {
    if (isMobile) setOpenMobile(false)
  }, [isMobile, setOpenMobile])

  async function handleSignOut() {
    await logout()
    navigate("/seller/login", { replace: true })
  }

  // Branding micro-payload — same SWR key as the layout, so this never
  // triggers a second network request. Dark mode prefers the dark logo.
  const { theme } = useTheme()
  const { data: branding } = useSWR("/seller/branding", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })
  const logoUrl = imgUrl(
    theme === "dark"
      ? (branding?.logoDarkUrl ?? seller?.profile?.logoDarkUrl ?? branding?.logoLightUrl ?? seller?.profile?.logoLightUrl ?? seller?.profile?.logoUrl)
      : (branding?.logoLightUrl ?? seller?.profile?.logoLightUrl ?? seller?.profile?.logoUrl),
  )
  // Dedicated square icon for the collapsed rail. Dark mode prefers the dark
  // icon, then the light icon, then falls back to the main logo.
  const iconLogoUrl =
    imgUrl(
      theme === "dark"
        ? (branding?.logoIconDarkUrl ?? branding?.logoIconUrl)
        : branding?.logoIconUrl,
    ) || logoUrl

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-1">
            <SidebarMenuButton
              size="lg"
              asChild
              tooltip={seller?.businessName ?? "Seller Hub"}
              className="!h-16 justify-center group-data-[collapsible=icon]:!h-12 group-data-[collapsible=icon]:!p-1"
            >
              <Link to="/hub" onClick={closeMobile} className="flex items-center justify-center">
                {logoUrl ? (
                  <>
                    {/* Logo uploaded: show the full logo, no brand name text.
                        Expanded -> tall centered logo; collapsed -> compact branded tile. */}
                    <img
                      src={logoUrl || "/placeholder.svg"}
                      alt={`${seller?.businessName ?? "Store"} logo`}
                      className="mx-auto h-12 w-auto max-w-[85%] shrink-0 object-contain object-center group-data-[collapsible=icon]:hidden"
                    />
                    <span
                      aria-hidden="true"
                      className="hidden size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-sidebar-border bg-sidebar-accent p-1 group-data-[collapsible=icon]:flex"
                    >
                      <img
                        src={iconLogoUrl || "/placeholder.svg"}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                      />
                    </span>
                    <span className="sr-only">{seller?.businessName ?? "Seller Hub"}</span>
                  </>
                ) : (
                  <>
                    <span
                      aria-hidden="true"
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/10 text-sidebar-primary"
                    >
                      <Store className="size-4" />
                    </span>
                    <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="truncate text-sm font-semibold">{seller?.businessName ?? "Seller Hub"}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {isOwner ? "Owner" : isStoreAdmin ? "Store admin" : "Team member"}
                      </span>
                    </div>
                  </>
                )}
              </Link>
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
        {isMobile && mobileSubmenu ? (
          // ── Mobile in-place drill-down: replaces the menu with the group's
          //    child links. Rendered INSIDE the Sheet so it's focusable and on
          //    top, unlike the desktop slide-out overlay.
          <SidebarGroup>
            <div className="flex items-center gap-2 pb-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileSubmenu(null)}
                aria-label="Back to main menu"
                className="size-8 shrink-0 cursor-pointer"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
              </Button>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {mobileSubmenu.icon ? (
                  <mobileSubmenu.icon className="size-4 shrink-0 text-sidebar-primary" aria-hidden="true" />
                ) : null}
                <span className="truncate text-sm font-semibold">{mobileSubmenu.title}</span>
              </div>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {mobileSubmenu.items
                  ?.filter((child) => {
                    return canAccessNavItem(child, permissions, isOwner)
                  })
                  .map((child) => {
                    const active = child.url === activeChildUrl(pathname, mobileSubmenu.items)
                    return (
                      <SidebarMenuItem key={child.url}>
                        <SidebarMenuButton
                          isActive={active}
                          asChild
                          className={cn(
                            "relative h-9 transition-colors [&>svg]:size-4",
                            "before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-sidebar-primary before:opacity-0 before:transition-opacity",
                            "data-[active=true]:bg-sidebar-primary/10 data-[active=true]:font-semibold data-[active=true]:text-sidebar-primary data-[active=true]:before:opacity-100",
                            "hover:bg-sidebar-accent",
                          )}
                        >
                          <Link
                            to={child.url}
                            aria-current={active ? "page" : undefined}
                            onClick={() => {
                              setMobileSubmenu(null)
                              closeMobile()
                            }}
                          >
                            {child.icon ? <child.icon aria-hidden="true" /> : null}
                            <span>{child.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <>
            <SidebarGroup className="pb-0 group-data-[collapsible=icon]:hidden">
              <div className="relative">
                <Search
                  className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Search menu..."
                  aria-label="Search menu"
                  className="h-8 pl-8 text-sm"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredNav.map((item) => {
                    const isActive = item.items
                      ? item.items.some((c) => isPathActive(pathname, c.url))
                      : isPathActive(pathname, item.url)
                    return (
                      <NavRow
                        key={item.title}
                        item={item}
                        isActive={isActive}
                        onOpenSubmenu={handleOpenSubmenu}
                        onNavigated={closeMobile}
                      />
                    )
                  })}
                  {filteredNav.length === 0 && (
                    <li className="px-2 py-6 text-center text-xs text-muted-foreground">No matching menu items</li>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0">
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={user?.avatarUrl || undefined} alt="" />
                <AvatarFallback className="rounded-lg bg-sidebar-primary/10 font-mono text-xs font-semibold uppercase text-sidebar-primary">
                  {getInitials(user?.name ?? user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-xs font-medium text-sidebar-foreground">
                  {user?.name ?? user?.email}
                </span>
                <span className="truncate text-[11px] text-muted-foreground">{user?.email}</span>
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
