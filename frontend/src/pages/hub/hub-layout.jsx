"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import useSWR from "swr"
import { Loader2 } from "lucide-react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SellerSidebar } from "@/components/hub/seller-sidebar"
import { NavSubmenuOverlay } from "@/components/hub/nav-submenu-overlay"
import { HubHeader } from "@/components/hub/hub-header"
import { fetcher } from "@/lib/api"
import { isPathActive } from "@/lib/seller-nav"
import { useSellerTheme } from "@/hooks/use-seller-theme"

// ---------------------------------------------------------------------------
// BRAND THEMING — the seller's brandColor/accentColor (hex, from the tiny
// aggregation-backed /seller/branding payload) are written into the CSS
// design tokens, so the sidebar, buttons, rings, and highlights all follow
// the seller's brand everywhere without touching any component.
// ---------------------------------------------------------------------------
const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

// Pick a readable foreground (near-white or near-black) for a hex background.
function contrastFor(hex) {
  let h = hex.slice(1)
  if (h.length === 3) h = h.replace(/./g, (c) => c + c)
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16) / 255)
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return lum > 0.55 ? "#1a1a1a" : "#ffffff"
}

const BRAND_VARS = ["--primary", "--primary-foreground", "--ring", "--sidebar-primary", "--sidebar-primary-foreground", "--sidebar-ring"]
const ACCENT_VARS = ["--accent", "--accent-foreground", "--sidebar-accent", "--sidebar-accent-foreground"]

function useBrandTheme(brandColor, accentColor) {
  useEffect(() => {
    const root = document.documentElement
    const brand = HEX_RE.test(brandColor ?? "") ? brandColor : null
    const accent = HEX_RE.test(accentColor ?? "") ? accentColor : null

    if (brand) {
      const fg = contrastFor(brand)
      root.style.setProperty("--primary", brand)
      root.style.setProperty("--primary-foreground", fg)
      root.style.setProperty("--ring", brand)
      root.style.setProperty("--sidebar-primary", brand)
      root.style.setProperty("--sidebar-primary-foreground", fg)
      root.style.setProperty("--sidebar-ring", brand)
    } else {
      for (const v of BRAND_VARS) root.style.removeProperty(v)
    }

    if (accent) {
      const fg = contrastFor(accent)
      root.style.setProperty("--accent", accent)
      root.style.setProperty("--accent-foreground", fg)
      root.style.setProperty("--sidebar-accent", accent)
      root.style.setProperty("--sidebar-accent-foreground", fg)
    } else {
      for (const v of ACCENT_VARS) root.style.removeProperty(v)
    }

    // Leaving the Hub restores the default theme completely.
    return () => {
      for (const v of [...BRAND_VARS, ...ACCENT_VARS]) root.style.removeProperty(v)
    }
  }, [brandColor, accentColor])
}

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="size-5 animate-spin text-muted-foreground" aria-label="Loading page" />
    </div>
  )
}

/**
 * Shell for every /hub/* route: sidebar + sticky header + routed content.
 * Groups with children open a slide-out submenu panel next to the sidebar.
 * Route content is lazy-loaded, so the shell paints instantly and each
 * module's code is only downloaded when it's first visited.
 */
export function HubLayout() {
  const [submenuParent, setSubmenuParent] = useState(null)
  const { pathname } = useLocation()

  // Micro-payload: business name + logos + colors only (aggregation $project
  // server-side). Cached by SWR, so the theme applies instantly on revisits.
  const { data: branding } = useSWR("/seller/branding", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })

  // Full tweakcn-style token overrides from the SEPARATE SellerTheme
  // collection. The appearance editor live-previews by mutating this same
  // SWR key locally, so edits re-theme the whole dashboard instantly.
  const { data: sellerTheme } = useSWR("/seller/theme", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })
  useSellerTheme(sellerTheme)

  // Brand colors are applied as INLINE styles on <html>, which always beat
  // the seller-theme <style> tag in the cascade. So whenever the seller has
  // ANY theme overrides saved (a preset or custom tokens), the theme wins and
  // the branding vars are skipped — otherwise the sidebar/primary/accent
  // would stay stuck on the brand colors no matter which theme is picked.
  const hasThemeOverrides =
    Object.keys(sellerTheme?.light ?? {}).length > 0 || Object.keys(sellerTheme?.dark ?? {}).length > 0
  useBrandTheme(
    hasThemeOverrides ? null : branding?.brandColor,
    hasThemeOverrides ? null : branding?.accentColor,
  )

  const openSubmenu = useCallback((item) => {
    // Toggle: clicking the already-open group closes it.
    setSubmenuParent((prev) => (prev?.title === item.title ? null : item))
  }, [])

  const closeSubmenu = useCallback(() => setSubmenuParent(null), [])

  // Safety net: close the slide-out submenu when navigating OUTSIDE the open
  // group (back/forward, deep links, header links). Navigating to one of the
  // group's own children keeps the panel open with the new link highlighted.
  useEffect(() => {
    setSubmenuParent((prev) => {
      if (!prev) return null
      const stillInGroup = prev.items?.some((c) => isPathActive(pathname, c.url))
      return stillInGroup ? prev : null
    })
  }, [pathname])

  return (
    <SidebarProvider>
      <SellerSidebar onOpenSubmenu={openSubmenu} />

      {submenuParent ? <NavSubmenuOverlay parent={submenuParent} onClose={closeSubmenu} /> : null}

      <SidebarInset>
        <HubHeader />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-screen-2xl px-4 py-6 md:px-8 md:py-8">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
