"use client"

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import useSWR, { useSWRConfig } from "swr"
import {
  Building2,
  Check,
  ChevronRight,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Palette,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  UserCog,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { useHubAuth } from "@/hooks/use-hub-auth"
import { useTheme } from "@/hooks/use-theme"
import { FONT_OPTIONS, RADIUS_OPTIONS, THEME_PRESETS } from "@/hooks/use-seller-theme"
import { api, fetcher } from "@/lib/api"
import { canAccessNavItem, findNavMatch } from "@/lib/seller-nav"
import { cn } from "@/lib/utils"

/** Derives up-to-two initials from a name or email for the avatar fallback. */
function getInitials(name) {
  if (!name) return "U"
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const THEME_KEY = "/seller/theme"

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="cursor-pointer"
    >
      {theme === "dark" ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </Button>
  )
}

/** Segmented button-group row, like the reference popover's Scale/Radius. */
function SegmentGroup({ label, options, value, onChange, disabled }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="grid auto-cols-fr grid-flow-col overflow-hidden rounded-md border border-input" role="group" aria-label={label}>
        {options.map((opt, i) => (
          <button
            key={opt.label}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            aria-pressed={value === opt.value}
            className={cn(
              "h-8 cursor-pointer px-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              i > 0 && "border-l border-input",
              value === opt.value ? "bg-accent text-accent-foreground" : "bg-transparent text-foreground hover:bg-muted",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// Static option lists, built ONCE at module load — re-creating ~20 preset
// rows with swatch spans on every popover render was part of the open lag.
const PRESET_ITEMS = THEME_PRESETS.map((p) => (
  <SelectItem key={p.name} value={p.name}>
    <span className="flex items-center gap-2">
      <span className="flex gap-0.5" aria-hidden="true">
        {p.swatches.slice(0, 3).map((c, i) => (
          <span key={i} className="size-2.5 rounded-full border border-border/50" style={{ backgroundColor: c }} />
        ))}
      </span>
      {p.name}
    </span>
  </SelectItem>
))

const FONT_ITEMS = FONT_OPTIONS.sans.map((f) => (
  <SelectItem key={f.name} value={f.name}>
    {f.name}
    {f.name === "Inter" ? " (default)" : ""}
  </SelectItem>
))

/** Normalizes a saved theme payload into a stable draft snapshot. */
function snapshotTheme(saved) {
  return {
    light: { ...(saved?.light ?? {}) },
    dark: { ...(saved?.dark ?? {}) },
    radius: saved?.radius ?? null,
    fonts: { sans: saved?.fonts?.sans ?? null, mono: saved?.fonts?.mono ?? null },
  }
}

/**
 * Popover body — only mounted while the popover is OPEN, so all of its state,
 * SWR subscription, and effects cost nothing while closed (fixes open lag).
 *
 * DRAFT MODEL: every change edits a local draft that live-previews via the
 * shared SWR cache (no revalidate) — NOTHING is written to the backend until
 * "Apply changes" is pressed. Closing without applying reverts the preview.
 */
function ThemePopoverBody({ saved, onClose }) {
  const navigate = useNavigate()
  const { theme: mode, setTheme } = useTheme()
  const { mutate } = useSWRConfig()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  // Baseline = what the server currently has; draft = local edits on top.
  const baselineRef = useRef(snapshotTheme(saved))
  const [draft, setDraft] = useState(() => snapshotTheme(saved))
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(baselineRef.current),
    [draft],
  )

  // LIVE PREVIEW — push the draft into the shared SWR cache so the whole hub
  // re-themes instantly. This never hits the network.
  useEffect(() => {
    mutate(THEME_KEY, draft, { revalidate: false })
  }, [draft, mutate])

  // Closing without applying restores the saved theme (cache-only, instant).
  const appliedRef = useRef(false)
  useEffect(() => {
    return () => {
      if (!appliedRef.current) mutate(THEME_KEY, baselineRef.current, { revalidate: false })
    }
  }, [mutate])

  // Which built-in preset the DRAFT currently matches.
  const overrideCount = Object.keys(draft.light).length + Object.keys(draft.dark).length
  const activePreset =
    overrideCount === 0
      ? "Default"
      : (THEME_PRESETS.find((p) => !p.reset && p.light.primary === draft.light.primary)?.name ?? null)

  function applyPreset(name) {
    const preset = THEME_PRESETS.find((p) => p.name === name)
    if (!preset) return
    setError("")
    setDraft((d) =>
      preset.reset
        ? { ...d, light: {}, dark: {} }
        : { ...d, light: { ...preset.light }, dark: { ...preset.dark } },
    )
  }

  function resetDraft() {
    setError("")
    setDraft({ light: {}, dark: {}, radius: null, fonts: { sans: null, mono: null } })
  }

  async function applyChanges() {
    setBusy(true)
    setError("")
    try {
      const result = await api.put(THEME_KEY, draft)
      appliedRef.current = true
      await mutate(THEME_KEY, result, { revalidate: false })
      onClose()
    } catch (err) {
      setError(err?.message || "Failed to apply theme")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Theme preset */}
      <div className="flex flex-col gap-1.5">
        <span className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          Theme preset
          {busy && <Loader2 className="size-3 animate-spin" aria-hidden="true" />}
        </span>
        <Select value={activePreset ?? "custom"} onValueChange={applyPreset} disabled={busy}>
          <SelectTrigger className="h-9 w-full cursor-pointer" aria-label="Theme preset">
            <SelectValue placeholder="Custom" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {activePreset === null && (
              <SelectItem value="custom" disabled>
                Custom (edited)
              </SelectItem>
            )}
            {PRESET_ITEMS}
          </SelectContent>
        </Select>
      </div>

      {/* Font family */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Font family</span>
        <Select
          value={draft.fonts.sans ?? "Inter"}
          onValueChange={(name) =>
            setDraft((d) => ({ ...d, fonts: { ...d.fonts, sans: name === "Inter" ? null : name } }))
          }
          disabled={busy}
        >
          <SelectTrigger className="h-9 w-full cursor-pointer" aria-label="Font family">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">{FONT_ITEMS}</SelectContent>
        </Select>
      </div>

      {/* Radius */}
      <SegmentGroup
        label="Radius"
        options={RADIUS_OPTIONS}
        value={draft.radius ?? "0.5rem"}
        onChange={(v) => setDraft((d) => ({ ...d, radius: v === "0.5rem" ? null : v }))}
        disabled={busy}
      />

      {/* Color mode — device-local preference, applies instantly by design. */}
      <SegmentGroup
        label="Color mode"
        options={[
          { label: "Light", value: "light" },
          { label: "Dark", value: "dark" },
        ]}
        value={mode}
        onChange={setTheme}
      />

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      <Separator />

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          size="sm"
          onClick={applyChanges}
          disabled={busy || !dirty}
          className="w-full cursor-pointer"
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="size-3.5" aria-hidden="true" />
          )}
          Apply changes
        </Button>
        <p className="text-center text-[11px] leading-4 text-muted-foreground">
          Changes preview live — closing without applying reverts them.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetDraft}
          disabled={busy}
          className="w-full cursor-pointer bg-transparent"
        >
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Reset to default
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full cursor-pointer"
          onClick={() => {
            onClose()
            navigate("/hub/advanced/appearance")
          }}
        >
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          View full customization
        </Button>
      </div>
    </div>
  )
}

/**
 * Quick theme popover — opens from the header palette icon. All edits are a
 * local DRAFT with live preview; only "Apply changes" persists to the server.
 */
function ThemePopover() {
  const [open, setOpen] = useState(false)
  // Subscribes to the cached key only — the hub layout already fetched it,
  // so opening the popover never triggers a network request.
  const { data: saved, isLoading } = useSWR(open ? THEME_KEY : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })
  const close = useCallback(() => setOpen(false), [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Quick theme settings"
          className={cn("cursor-pointer", open && "bg-accent text-accent-foreground")}
        >
          <Palette className="size-4" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-72 p-4">
        {isLoading || !saved ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Loading theme" />
          </div>
        ) : (
          <ThemePopoverBody saved={saved} onClose={close} />
        )}
      </PopoverContent>
    </Popover>
  )
}

/**
 * Account dropdown — avatar trigger that opens a shadcn DropdownMenu with the
 * signed-in seller's identity, quick links, and a sign-out action.
 */
function UserMenu() {
  const navigate = useNavigate()
  const { user, seller, isOwner, isStoreAdmin, permissions, logout } = useHubAuth()

  const displayName = user?.name ?? user?.email ?? "Account"
  const roleLabel = isOwner ? "Owner" : isStoreAdmin ? "Store admin" : (user?.role ? "Team member" : null)

  async function handleSignOut() {
    await logout()
    navigate("/seller/login", { replace: true })
  }

  const links = [
    { title: "Dashboard", url: "/hub", icon: LayoutDashboard, permission: "dashboard.read" },
    { title: "Business Profile", url: "/hub/profile", icon: Building2, permission: "business_profile.read" },
    { title: "Team", url: "/hub/team", icon: Users, permission: "team.read" },
    { title: "Staff Members", url: "/hub/staff", icon: UserCog, permission: "staff_member.read" },
  ].filter((link) => canAccessNavItem(link, permissions, isOwner))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open account menu"
          className="ml-0.5 size-8 cursor-pointer rounded-full p-0"
        >
          <Avatar className="size-8">
            <AvatarImage src={user?.avatarUrl || undefined} alt="" />
            <AvatarFallback className="bg-primary/10 text-xs font-semibold uppercase text-primary">
              {getInitials(user?.name ?? user?.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1.5 py-1.5">
            <Avatar className="size-9">
              <AvatarImage src={user?.avatarUrl || undefined} alt="" />
              <AvatarFallback className="bg-primary/10 text-xs font-semibold uppercase text-primary">
                {getInitials(user?.name ?? user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-medium text-foreground">{displayName}</span>
              {user?.email && (
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              )}
            </div>
          </div>
          {(seller?.name || roleLabel) && (
            <div className="flex items-center justify-between gap-2 border-t border-border px-2 py-1.5">
              {seller?.name && (
                <span className="truncate text-xs text-muted-foreground">{seller.name}</span>
              )}
              {roleLabel && (
                <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent-foreground">
                  {roleLabel}
                </span>
              )}
            </div>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {links.map((link) => (
            <DropdownMenuItem key={link.url} asChild className="cursor-pointer">
              <Link to={link.url}>
                <link.icon className="size-4" aria-hidden="true" />
                {link.title}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={handleSignOut}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Sticky top bar: sidebar trigger + URL-derived breadcrumbs + theme toggle. */
export const HubHeader = memo(function HubHeader() {
  const { pathname } = useLocation()
  const match = findNavMatch(pathname)
  const { toggleSidebar } = useSidebar()

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Hamburger opens the off-canvas sidebar on mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="-ml-1 size-8 cursor-pointer md:hidden"
        aria-label="Open menu"
        onClick={toggleSidebar}
      >
        <Menu className="size-5" aria-hidden="true" />
      </Button>
      {/* Panel toggle on desktop */}
      <SidebarTrigger className="-ml-1 hidden cursor-pointer md:inline-flex" aria-label="Toggle sidebar" />
      <Separator orientation="vertical" className="mr-1 !h-4" />

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
        <Link to="/hub" className="shrink-0 text-muted-foreground transition-colors hover:text-foreground">
          Hub
        </Link>
        {match?.parent && (
          <>
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="shrink-0 text-muted-foreground">{match.parent.title}</span>
          </>
        )}
        {match && match.item.url !== "/hub" && (
          <>
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate font-medium text-foreground" aria-current="page">
              {match.item.title}
            </span>
          </>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-1">
        <ThemePopover />
        <ThemeToggle />
        <Separator orientation="vertical" className="mx-1 !h-5" />
        <UserMenu />
      </div>
    </header>
  )
})
