"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Moon,
  Paintbrush,
  RotateCcw,
  Search,
  Sun,
  SwatchBook,
  X,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, fetcher } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useTheme } from "@/hooks/use-theme"
import { FONT_OPTIONS, RADIUS_OPTIONS, THEME_PRESETS } from "@/hooks/use-seller-theme"

const THEME_KEY = "/seller/theme"
const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

// tweakcn-style grouping — collapsible titled sections of token rows.
const TOKEN_GROUPS = [
  {
    title: "Primary",
    tokens: [
      { key: "primary", label: "Primary" },
      { key: "primary-foreground", label: "Primary foreground" },
    ],
  },
  {
    title: "Secondary",
    tokens: [
      { key: "secondary", label: "Secondary" },
      { key: "secondary-foreground", label: "Secondary foreground" },
    ],
  },
  {
    title: "Accent",
    tokens: [
      { key: "accent", label: "Accent" },
      { key: "accent-foreground", label: "Accent foreground" },
    ],
  },
  {
    title: "Base",
    tokens: [
      { key: "background", label: "Background" },
      { key: "foreground", label: "Foreground" },
    ],
  },
  {
    title: "Card",
    tokens: [
      { key: "card", label: "Card" },
      { key: "card-foreground", label: "Card foreground" },
    ],
  },
  {
    title: "Popover",
    tokens: [
      { key: "popover", label: "Popover" },
      { key: "popover-foreground", label: "Popover foreground" },
    ],
  },
  {
    title: "Muted",
    tokens: [
      { key: "muted", label: "Muted" },
      { key: "muted-foreground", label: "Muted foreground" },
    ],
  },
  {
    title: "Destructive & Success",
    tokens: [
      { key: "destructive", label: "Destructive" },
      { key: "destructive-foreground", label: "Destructive foreground" },
      { key: "success", label: "Success" },
      { key: "success-foreground", label: "Success foreground" },
    ],
  },
  {
    title: "Border & Input",
    tokens: [
      { key: "border", label: "Border" },
      { key: "input", label: "Input" },
      { key: "ring", label: "Ring" },
    ],
  },
  {
    title: "Sidebar",
    tokens: [
      { key: "sidebar", label: "Sidebar background" },
      { key: "sidebar-foreground", label: "Sidebar foreground" },
      { key: "sidebar-primary", label: "Sidebar primary" },
      { key: "sidebar-primary-foreground", label: "Sidebar primary fg" },
      { key: "sidebar-accent", label: "Sidebar accent" },
      { key: "sidebar-accent-foreground", label: "Sidebar accent fg" },
      { key: "sidebar-border", label: "Sidebar border" },
      { key: "sidebar-ring", label: "Sidebar ring" },
    ],
  },
]

// Preset library + radius options live in use-seller-theme.js so the header
// quick-theme popover shares the exact same data.
const PRESETS = THEME_PRESETS

/** One token row — swatch + label + hex input + clear, tweakcn style. */
function TokenRow({ token, label, value, onChange }) {
  const valid = !value || HEX_RE.test(value)
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={HEX_RE.test(value) ? value : "#888888"}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} picker`}
        className="size-7 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
      />
      <Label htmlFor={`token-${token}`} className="min-w-0 flex-1 truncate text-xs font-medium" title={`--${token}`}>
        {label}
      </Label>
      <Input
        id={`token-${token}`}
        value={value}
        onChange={(e) => onChange(e.target.value.trim().toLowerCase())}
        placeholder="default"
        maxLength={7}
        aria-invalid={!valid}
        className="h-7 w-24 shrink-0 font-mono text-xs"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={() => onChange("")}
          aria-label={`Clear ${label}`}
        >
          <X className="size-3.5" aria-hidden="true" />
        </Button>
      ) : (
        <span className="w-7 shrink-0" aria-hidden="true" />
      )}
    </div>
  )
}

/** Collapsible token group — chip-style header like tweakcn's panel. */
function TokenGroup({ group, tokens, open, onToggle, onToken }) {
  const customized = group.tokens.filter(({ key }) => tokens[key]).length
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-fit items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-accent"
      >
        <ChevronDown className={cn("size-3 transition-transform", !open && "-rotate-90")} aria-hidden="true" />
        {group.title}
        {customized > 0 && (
          <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-4 text-primary-foreground">
            {customized}
          </span>
        )}
      </button>
      {open && (
        <div className="flex flex-col gap-1.5 pl-1">
          {group.tokens.map(({ key, label }) => (
            <TokenRow key={key} token={key} label={label} value={tokens[key] ?? ""} onChange={(v) => onToken(key, v)} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * tweakcn-style dashboard theme editor. Left: searchable built-in theme
 * library. Right: the editor panel (Colors / Typography / Other tabs).
 * Every edit LIVE-previews across the whole Hub by locally mutating the same
 * "/seller/theme" SWR key the shell reads — Save persists, Discard refetches.
 */
export function AppearancePanel() {
  const { data: saved, isLoading } = useSWR(THEME_KEY, fetcher, { revalidateOnFocus: false })
  const { mutate } = useSWRConfig()
  const { theme: activeMode, setTheme } = useTheme()

  // The mode whose tokens are being edited (defaults to the visible one).
  const [mode, setMode] = useState(activeMode ?? "light")

  // Editing a mode should also SWITCH the dashboard to that mode, so the live
  // preview actually reflects the tokens being edited. Without this the "Dark"
  // tab only listed dark tokens while the app stayed in light mode.
  function editMode(next) {
    setMode(next)
    setTheme(next)
  }

  // Keep the edited mode in sync if the app theme is flipped elsewhere
  // (e.g. the header sun/moon toggle) while this panel is open.
  useEffect(() => {
    if (activeMode === "light" || activeMode === "dark") setMode(activeMode)
  }, [activeMode])
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [savedFlash, setSavedFlash] = useState(false)

  // Editor UI state.
  const [themeQuery, setThemeQuery] = useState("")
  const [tokenQuery, setTokenQuery] = useState("")
  const [activePreset, setActivePreset] = useState(null)
  const [openGroups, setOpenGroups] = useState(() => new Set([TOKEN_GROUPS[0].title, TOKEN_GROUPS[1].title]))

  // The persisted baseline — kept SEPARATE from the SWR cache because live
  // preview mutates that same cache, which would otherwise make draft always
  // equal "saved" and permanently disable the Save button.
  const [persisted, setPersisted] = useState(null)

  // Initialize the draft + baseline once the saved theme arrives.
  useEffect(() => {
    if (saved && draft === null) {
      const snapshot = {
        light: { ...saved.light },
        dark: { ...saved.dark },
        radius: saved.radius ?? null,
        fonts: { sans: saved.fonts?.sans ?? null, mono: saved.fonts?.mono ?? null },
      }
      setPersisted(snapshot)
      setDraft({ light: { ...snapshot.light }, dark: { ...snapshot.dark }, radius: snapshot.radius, fonts: { ...snapshot.fonts } })
    }
  }, [saved, draft])

  const dirty = useMemo(() => {
    if (!draft || !persisted) return false
    return JSON.stringify(draft) !== JSON.stringify(persisted)
  }, [draft, persisted])

  // LIVE PREVIEW — push the draft into the shared SWR cache (no revalidate),
  // so hub-layout's useSellerTheme re-themes the dashboard instantly.
  useEffect(() => {
    if (draft) mutate(THEME_KEY, draft, { revalidate: false })
  }, [draft, mutate])

  // Leaving the page with unsaved edits reverts to the saved theme.
  const dirtyRef = useRef(false)
  dirtyRef.current = dirty
  useEffect(() => {
    return () => {
      if (dirtyRef.current) mutate(THEME_KEY)
    }
  }, [mutate])

  function setToken(token, value) {
    setError("")
    setActivePreset(null)
    setDraft((d) => {
      const next = { ...d, [mode]: { ...d[mode] } }
      if (value) next[mode][token] = value
      else delete next[mode][token]
      return next
    })
  }

  function applyPreset(preset) {
    setError("")
    setActivePreset(preset.name)
    setDraft((d) =>
      preset.reset
        ? { ...d, light: {}, dark: {} }
        : { ...d, light: { ...preset.light }, dark: { ...preset.dark } },
    )
  }

  async function save() {
    // Only fully valid hex values are persisted.
    for (const m of ["light", "dark"]) {
      for (const [token, value] of Object.entries(draft[m])) {
        if (!HEX_RE.test(value)) {
          setError(`"${token}" (${m}) must be a hex color like #7c3aed.`)
          return
        }
      }
    }
    setSaving(true)
    setError("")
    try {
      const result = await api.put("/seller/theme", draft)
      await mutate(THEME_KEY, result, { revalidate: false })
      const snapshot = {
        light: { ...result.light },
        dark: { ...result.dark },
        radius: result.radius ?? null,
        fonts: { sans: result.fonts?.sans ?? null, mono: result.fonts?.mono ?? null },
      }
      setPersisted(snapshot)
      setDraft({ light: { ...snapshot.light }, dark: { ...snapshot.dark }, radius: snapshot.radius, fonts: { ...snapshot.fonts } })
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 2500)
    } catch (err) {
      setError(err.message || "Failed to save theme")
    } finally {
      setSaving(false)
    }
  }

  async function resetAll() {
    setSaving(true)
    setError("")
    try {
      const result = await api.delete("/seller/theme")
      await mutate(THEME_KEY, result, { revalidate: false })
      setPersisted({ light: {}, dark: {}, radius: null, fonts: { sans: null, mono: null } })
      setDraft({ light: {}, dark: {}, radius: null, fonts: { sans: null, mono: null } })
      setActivePreset(null)
    } catch (err) {
      setError(err.message || "Failed to reset theme")
    } finally {
      setSaving(false)
    }
  }

  function discard() {
    setError("")
    setActivePreset(null)
    setDraft({ light: { ...persisted.light }, dark: { ...persisted.dark }, radius: persisted.radius, fonts: { ...persisted.fonts } })
    mutate(THEME_KEY)
  }

  if (isLoading || !draft) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  const tokens = draft[mode]
  const overrideCount = Object.keys(draft.light).length + Object.keys(draft.dark).length

  const filteredPresets = PRESETS.filter((p) => p.name.toLowerCase().includes(themeQuery.trim().toLowerCase()))

  // Token search: when searching, only matching rows show and their groups
  // are forced open.
  const tq = tokenQuery.trim().toLowerCase()
  const visibleGroups = TOKEN_GROUPS.map((group) => {
    if (!tq) return { group, tokens: group.tokens, forcedOpen: false }
    const matches = group.tokens.filter(
      ({ key, label }) => label.toLowerCase().includes(tq) || key.includes(tq) || group.title.toLowerCase().includes(tq),
    )
    return { group: { ...group, tokens: matches }, tokens: matches, forcedOpen: true }
  }).filter(({ tokens: t }) => t.length > 0)

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" aria-hidden="true" />
          <AlertTitle>Could not save</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* ------------------------------ ACTIONS ------------------------------ */}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={save} disabled={saving || !dirty}>
          {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Save theme
        </Button>
        {dirty && (
          <Button type="button" variant="ghost" onClick={discard} disabled={saving}>
            Discard changes
          </Button>
        )}
        {savedFlash && (
          <span className="flex items-center gap-1.5 text-sm text-success" role="status">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Theme saved
          </span>
        )}
        <Button type="button" variant="outline" onClick={resetAll} disabled={saving} className="ml-auto bg-transparent">
          <RotateCcw className="size-3.5" aria-hidden="true" />
          Reset to default
        </Button>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* --------------------------- THEME LIBRARY --------------------------- */}
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-1.5">
              <CardTitle className="flex items-center gap-2 text-base">
                <SwatchBook className="size-4" aria-hidden="true" />
                Themes
              </CardTitle>
              <CardDescription>
                One-click starting points — pick a theme, then fine-tune every token in the editor.
              </CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={themeQuery}
                onChange={(e) => setThemeQuery(e.target.value)}
                placeholder="Search themes..."
                className="pl-8"
                aria-label="Search themes"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {filteredPresets.length} theme{filteredPresets.length === 1 ? "" : "s"}
              </span>
              {overrideCount > 0 && (
                <Badge variant="secondary">{overrideCount} token{overrideCount === 1 ? "" : "s"} customized</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[420px]">
              <div className="flex flex-col px-3 pb-3">
                <span className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Built-in Themes
                </span>
                {filteredPresets.length === 0 && (
                  <p className="px-2 py-6 text-center text-sm text-muted-foreground">No themes match your search.</p>
                )}
                {filteredPresets.map((preset) => {
                  const active = activePreset === preset.name
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      aria-pressed={active}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        active && "bg-accent text-accent-foreground",
                      )}
                    >
                      <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
                        {preset.swatches.map((c, i) => (
                          <span key={i} className="size-3 rounded-full border border-border/60" style={{ backgroundColor: c }} />
                        ))}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">{preset.name}</span>
                      {active && <Check className="size-4 shrink-0" aria-hidden="true" />}
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* ---------------------------- EDITOR PANEL ---------------------------- */}
        <Card className="lg:sticky lg:top-4">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Paintbrush className="size-4" aria-hidden="true" />
                Editor
              </CardTitle>
              <Tabs value={mode} onValueChange={editMode}>
                <TabsList className="h-8">
                  <TabsTrigger value="light" className="gap-1.5 text-xs">
                    <Sun className="size-3.5" aria-hidden="true" />
                    Light
                  </TabsTrigger>
                  <TabsTrigger value="dark" className="gap-1.5 text-xs">
                    <Moon className="size-3.5" aria-hidden="true" />
                    Dark
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <CardDescription>
              Changes preview live across the dashboard. Cleared tokens fall back to the default theme.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="colors">
              <TabsList className="mb-4 w-full">
                <TabsTrigger value="colors" className="flex-1">Colors</TabsTrigger>
                <TabsTrigger value="typography" className="flex-1">Typography</TabsTrigger>
                <TabsTrigger value="other" className="flex-1">Other</TabsTrigger>
              </TabsList>

              {/* ------------------------------ COLORS ------------------------------ */}
              <TabsContent value="colors">
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      value={tokenQuery}
                      onChange={(e) => setTokenQuery(e.target.value)}
                      placeholder="Search colors..."
                      className="pl-8"
                      aria-label="Search color tokens"
                    />
                  </div>
                  <ScrollArea className="h-[400px] pr-3">
                    <div className="flex flex-col gap-4">
                      {visibleGroups.length === 0 && (
                        <p className="py-6 text-center text-sm text-muted-foreground">No tokens match your search.</p>
                      )}
                      {visibleGroups.map(({ group, forcedOpen }) => (
                        <TokenGroup
                          key={group.title}
                          group={group}
                          tokens={tokens}
                          open={forcedOpen || openGroups.has(group.title)}
                          onToggle={() =>
                            setOpenGroups((s) => {
                              const next = new Set(s)
                              if (next.has(group.title)) next.delete(group.title)
                              else next.add(group.title)
                              return next
                            })
                          }
                          onToken={setToken}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* ---------------------------- TYPOGRAPHY ---------------------------- */}
              <TabsContent value="typography">
                <div className="flex flex-col gap-6">
                  {[
                    { kind: "sans", label: "Sans-serif font", hint: "Headings, body text, and UI", sample: "The quick brown fox jumps over the lazy dog" },
                    { kind: "mono", label: "Monospace font", hint: "Codes, SKUs, and numbers", sample: "ORD-2024-000138 · #7c3aed" },
                  ].map(({ kind, label, hint, sample }) => {
                    const current = draft.fonts?.[kind] ?? FONT_OPTIONS[kind][0].name
                    const opt = FONT_OPTIONS[kind].find((f) => f.name === current) ?? FONT_OPTIONS[kind][0]
                    return (
                      <div key={kind} className="flex min-w-0 flex-col gap-2">
                        <Label htmlFor={`font-${kind}`}>{label}</Label>
                        <Select
                          value={current}
                          onValueChange={(name) => {
                            setError("")
                            setDraft((d) => ({
                              ...d,
                              fonts: { ...d.fonts, [kind]: name === FONT_OPTIONS[kind][0].name ? null : name },
                            }))
                          }}
                        >
                          <SelectTrigger id={`font-${kind}`} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FONT_OPTIONS[kind].map((f, i) => (
                              <SelectItem key={f.name} value={f.name}>
                                {f.name}
                                {i === 0 ? " (default)" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">{hint}</p>
                        <div
                          className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm"
                          style={{ fontFamily: opt.stack }}
                        >
                          {sample}
                        </div>
                      </div>
                    )
                  })}
                  <p className="text-xs text-muted-foreground">
                    Fonts apply live across the whole dashboard. Pick the defaults to go back to the stock look.
                  </p>
                </div>
              </TabsContent>

              {/* ------------------------------ OTHER ------------------------------ */}
              <TabsContent value="other">
                <div className="flex flex-col gap-3">
                  <Label>Corner radius</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    {RADIUS_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        type="button"
                        size="sm"
                        variant={draft.radius === opt.value ? "default" : "outline"}
                        onClick={() => setDraft((d) => ({ ...d, radius: d.radius === opt.value ? null : opt.value }))}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {draft.radius ? `Using ${draft.radius}` : "Using the default radius"}
                  </span>
                  <Separator className="my-2" />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    The radius applies to buttons, cards, inputs, and every other rounded element across the Hub.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
