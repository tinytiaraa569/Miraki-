"use client"

import { useEffect } from "react"

// ---------------------------------------------------------------------------
// SELLER THEME ENGINE — tweakcn-style runtime theming.
//
// The seller's saved token overrides (from the separate SellerTheme
// collection, fetched via GET /seller/theme) are injected as a <style> tag
// that redefines the SAME CSS variables globals.css declares. Because the
// tag is appended to <head> AFTER the stylesheet, its `:root` / `.dark`
// blocks win the cascade — every component keeps using bg-primary,
// text-foreground, etc. and simply re-colors. globals.css itself is NEVER
// modified; removing the tag restores the stock theme instantly.
// ---------------------------------------------------------------------------

const STYLE_ID = "seller-theme-overrides"

// Only allow-listed tokens are ever written into the style tag (defense in
// depth — the server validates too). MUST stay in sync with globals.css.
export const THEME_TOKENS = [
  "background",
  "foreground",
  "card",
  "card-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "muted",
  "muted-foreground",
  "accent",
  "accent-foreground",
  "destructive",
  "destructive-foreground",
  "success",
  "success-foreground",
  "border",
  "input",
  "ring",
  "sidebar",
  "sidebar-foreground",
  "sidebar-primary",
  "sidebar-primary-foreground",
  "sidebar-accent",
  "sidebar-accent-foreground",
  "sidebar-border",
  "sidebar-ring",
]

// Allow-listed fonts — names map to a Google Fonts request + a full CSS
// stack. MUST stay in sync with backend THEME_FONTS (theme.validation.js).
// "Inter" / "Geist Mono" are the app defaults, offered for explicit reset.
export const FONT_OPTIONS = {
  sans: [
    { name: "Inter", google: null, stack: `"Inter Variable", "Inter", ui-sans-serif, system-ui, sans-serif` },
    { name: "Poppins", google: "Poppins:wght@400;500;600;700", stack: `"Poppins", ui-sans-serif, system-ui, sans-serif` },
    { name: "Outfit", google: "Outfit:wght@400;500;600;700", stack: `"Outfit", ui-sans-serif, system-ui, sans-serif` },
    { name: "DM Sans", google: "DM+Sans:wght@400;500;600;700", stack: `"DM Sans", ui-sans-serif, system-ui, sans-serif` },
    { name: "Space Grotesk", google: "Space+Grotesk:wght@400;500;600;700", stack: `"Space Grotesk", ui-sans-serif, system-ui, sans-serif` },
    { name: "Montserrat", google: "Montserrat:wght@400;500;600;700", stack: `"Montserrat", ui-sans-serif, system-ui, sans-serif` },
    { name: "Nunito", google: "Nunito:wght@400;500;600;700", stack: `"Nunito", ui-sans-serif, system-ui, sans-serif` },
    { name: "Roboto", google: "Roboto:wght@400;500;700", stack: `"Roboto", ui-sans-serif, system-ui, sans-serif` },
    { name: "Plus Jakarta Sans", google: "Plus+Jakarta+Sans:wght@400;500;600;700", stack: `"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif` },
    { name: "Manrope", google: "Manrope:wght@400;500;600;700", stack: `"Manrope", ui-sans-serif, system-ui, sans-serif` },
    { name: "Sora", google: "Sora:wght@400;500;600;700", stack: `"Sora", ui-sans-serif, system-ui, sans-serif` },
    { name: "Work Sans", google: "Work+Sans:wght@400;500;600;700", stack: `"Work Sans", ui-sans-serif, system-ui, sans-serif` },
    { name: "Raleway", google: "Raleway:wght@400;500;600;700", stack: `"Raleway", ui-sans-serif, system-ui, sans-serif` },
    { name: "Lato", google: "Lato:wght@400;700", stack: `"Lato", ui-sans-serif, system-ui, sans-serif` },
    { name: "Figtree", google: "Figtree:wght@400;500;600;700", stack: `"Figtree", ui-sans-serif, system-ui, sans-serif` },
    { name: "Lexend", google: "Lexend:wght@400;500;600;700", stack: `"Lexend", ui-sans-serif, system-ui, sans-serif` },
  ],
  mono: [
    { name: "Geist Mono", google: null, stack: `"Geist Mono", ui-monospace, monospace` },
    { name: "JetBrains Mono", google: "JetBrains+Mono:wght@400;500;600", stack: `"JetBrains Mono", ui-monospace, monospace` },
    { name: "Fira Code", google: "Fira+Code:wght@400;500;600", stack: `"Fira Code", ui-monospace, monospace` },
    { name: "IBM Plex Mono", google: "IBM+Plex+Mono:wght@400;500;600", stack: `"IBM Plex Mono", ui-monospace, monospace` },
    { name: "Space Mono", google: "Space+Mono:wght@400;700", stack: `"Space Mono", ui-monospace, monospace` },
    { name: "Roboto Mono", google: "Roboto+Mono:wght@400;500;600", stack: `"Roboto Mono", ui-monospace, monospace` },
    { name: "Source Code Pro", google: "Source+Code+Pro:wght@400;500;600", stack: `"Source Code Pro", ui-monospace, monospace` },
    { name: "Ubuntu Mono", google: "Ubuntu+Mono:wght@400;700", stack: `"Ubuntu Mono", ui-monospace, monospace` },
  ],
}

// Radius choices shared by the appearance editor and the header quick-popover.
export const RADIUS_OPTIONS = [
  { label: "None", value: "0" },
  { label: "S", value: "0.25rem" },
  { label: "M", value: "0.5rem" },
  { label: "L", value: "0.75rem" },
  { label: "XL", value: "1rem" },
]

// Expands a compact palette spec into the full token slice a theme applies:
// primary/ring/accent + the entire sidebar set, plus any extra tokens.
function slice({ primary, fg, accent, accentFg, sb, sbFg, sbBorder, extra = {} }) {
  return {
    primary,
    "primary-foreground": fg,
    ring: primary,
    accent,
    "accent-foreground": accentFg,
    sidebar: sb,
    "sidebar-foreground": sbFg,
    "sidebar-border": sbBorder,
    "sidebar-primary": primary,
    "sidebar-primary-foreground": fg,
    "sidebar-ring": primary,
    "sidebar-accent": accent,
    "sidebar-accent-foreground": accentFg,
    ...extra,
  }
}

// Built-in themes — tweakcn-style library shared by the full appearance
// editor AND the header quick-theme popover. "Default" clears every override.
export const THEME_PRESETS = [
  { name: "Default", swatches: ["#18181b", "#f4f4f5", "#ffffff", "#a1a1aa"], reset: true },
  {
    name: "Amber Minimal",
    swatches: ["#d97706", "#fef3c7", "#fffbeb", "#fbbf24"],
    light: slice({ primary: "#d97706", fg: "#fffbeb", accent: "#fef3c7", accentFg: "#92400e", sb: "#fffbf0", sbFg: "#57340c", sbBorder: "#fde68a" }),
    dark: slice({ primary: "#fbbf24", fg: "#451a03", accent: "#44280c", accentFg: "#fcd34d", sb: "#291505", sbFg: "#fde68a", sbBorder: "#44280c" }),
  },
  {
    name: "Amethyst Haze",
    swatches: ["#8a79ab", "#e6e0f4", "#f4f2f9", "#a995c9"],
    light: slice({ primary: "#8a79ab", fg: "#ffffff", accent: "#e6e0f4", accentFg: "#453c63", sb: "#f4f2f9", sbFg: "#3d3653", sbBorder: "#e0dbee" }),
    dark: slice({ primary: "#a995c9", fg: "#1d1926", accent: "#2d2740", accentFg: "#c1b6dd", sb: "#1c1826", sbFg: "#d8d2e6", sbBorder: "#2d2740" }),
  },
  {
    name: "Bold Tech",
    swatches: ["#2563eb", "#dbeafe", "#f5f8ff", "#60a5fa"],
    light: slice({ primary: "#2563eb", fg: "#eff6ff", accent: "#dbeafe", accentFg: "#1e40af", sb: "#f5f8ff", sbFg: "#1e3a8a", sbBorder: "#dbe6fe" }),
    dark: slice({ primary: "#60a5fa", fg: "#0b1220", accent: "#172a54", accentFg: "#93c5fd", sb: "#0a1122", sbFg: "#bfdbfe", sbBorder: "#172a54" }),
  },
  {
    name: "Bubblegum",
    swatches: ["#d04f99", "#fbe2f0", "#fdf3f9", "#f472b6"],
    light: slice({
      primary: "#d04f99", fg: "#ffffff", accent: "#fbe2f0", accentFg: "#9d2f6c", sb: "#fdf3f9", sbFg: "#5c1440", sbBorder: "#f8d7ea",
      extra: { background: "#fdf7fa" },
    }),
    dark: slice({ primary: "#f472b6", fg: "#3d0c26", accent: "#3f1329", accentFg: "#f9a8d4", sb: "#241019", sbFg: "#fbcfe8", sbBorder: "#3f1329" }),
  },
  {
    name: "Caffeine",
    swatches: ["#644a40", "#ede0d4", "#f7f1ea", "#c0a08c"],
    light: slice({
      primary: "#644a40", fg: "#ffffff", accent: "#ede0d4", accentFg: "#50372a", sb: "#f7f1ea", sbFg: "#41302a", sbBorder: "#e8dccd",
      extra: { background: "#faf5ef", card: "#ffffff", border: "#e8dccd", input: "#e8dccd" },
    }),
    dark: slice({
      primary: "#c0a08c", fg: "#261812", accent: "#3a2b22", accentFg: "#dbc3b2", sb: "#1c130e", sbFg: "#e4d3c6", sbBorder: "#3a2b22",
      extra: { background: "#171009", card: "#211710", border: "#3a2b22", input: "#3a2b22" },
    }),
  },
  {
    name: "Candyland",
    swatches: ["#f43f8e", "#d9f3ff", "#fff8fb", "#fb7bb8"],
    light: slice({ primary: "#f43f8e", fg: "#ffffff", accent: "#d9f3ff", accentFg: "#0e6ba8", sb: "#fff8fb", sbFg: "#611139", sbBorder: "#fde0ec" }),
    dark: slice({ primary: "#fb7bb8", fg: "#2e0a1c", accent: "#0f2f47", accentFg: "#7cd0fb", sb: "#201018", sbFg: "#fbd0e4", sbBorder: "#42152b" }),
  },
  {
    name: "Catppuccin",
    swatches: ["#8839ef", "#e6e9ef", "#eff1f5", "#cba6f7"],
    light: slice({
      primary: "#8839ef", fg: "#ffffff", accent: "#e6e9ef", accentFg: "#4c4f69", sb: "#eff1f5", sbFg: "#4c4f69", sbBorder: "#dce0e8",
      extra: { background: "#eff1f5", foreground: "#4c4f69", card: "#ffffff", "card-foreground": "#4c4f69", border: "#dce0e8", input: "#dce0e8" },
    }),
    dark: slice({
      primary: "#cba6f7", fg: "#1e1e2e", accent: "#313244", accentFg: "#cdd6f4", sb: "#181825", sbFg: "#cdd6f4", sbBorder: "#313244",
      extra: { background: "#1e1e2e", foreground: "#cdd6f4", card: "#252539", "card-foreground": "#cdd6f4", border: "#313244", input: "#313244" },
    }),
  },
  {
    name: "Claude",
    swatches: ["#d97757", "#ede6dc", "#faf7f2", "#e0906f"],
    light: slice({
      primary: "#d97757", fg: "#ffffff", accent: "#ede6dc", accentFg: "#57493a", sb: "#faf7f2", sbFg: "#3d3527", sbBorder: "#e8e0d4",
      extra: { background: "#faf9f5", card: "#ffffff", border: "#e8e0d4", input: "#e8e0d4" },
    }),
    dark: slice({
      primary: "#e0906f", fg: "#2b160c", accent: "#2e2822", accentFg: "#d6cbbc", sb: "#1a1613", sbFg: "#e6ddd1", sbBorder: "#2e2822",
      extra: { background: "#14100d", card: "#1e1915", border: "#2e2822", input: "#2e2822" },
    }),
  },
  {
    name: "Clean Slate",
    swatches: ["#4f46e5", "#e0e7ff", "#f6f7fb", "#818cf8"],
    light: slice({ primary: "#4f46e5", fg: "#eef2ff", accent: "#e0e7ff", accentFg: "#3730a3", sb: "#f6f7fb", sbFg: "#2e2a5e", sbBorder: "#e3e6f2" }),
    dark: slice({ primary: "#818cf8", fg: "#111336", accent: "#22245c", accentFg: "#c7d2fe", sb: "#121424", sbFg: "#c7d2fe", sbBorder: "#22245c" }),
  },
  {
    name: "Cosmic Night",
    swatches: ["#6366f1", "#e3e3fb", "#f3f3fb", "#a78bfa"],
    light: slice({ primary: "#6366f1", fg: "#ffffff", accent: "#e3e3fb", accentFg: "#3b3a7a", sb: "#f3f3fb", sbFg: "#31305f", sbBorder: "#e1e0f4" }),
    dark: slice({
      primary: "#a78bfa", fg: "#14102a", accent: "#221d3f", accentFg: "#b9b2e6", sb: "#100e22", sbFg: "#cbc7ec", sbBorder: "#221d3f",
      extra: { background: "#0d0b1d", card: "#141129", border: "#221d3f", input: "#221d3f" },
    }),
  },
  {
    name: "Emerald",
    swatches: ["#059669", "#d1fae5", "#f0fdf6", "#34d399"],
    light: slice({ primary: "#059669", fg: "#f0fdf4", accent: "#d1fae5", accentFg: "#065f46", sb: "#f0fdf6", sbFg: "#134e3a", sbBorder: "#d1fae5" }),
    dark: slice({ primary: "#34d399", fg: "#022c22", accent: "#0d3b2f", accentFg: "#6ee7b7", sb: "#04241c", sbFg: "#a7f3d0", sbBorder: "#0d3b2f" }),
  },
  {
    name: "Miraki",
    swatches: ["#61062d", "#4f162c", "#cdaca8", "#f0e2db"],
    light: slice({
      primary: "#61062d", fg: "#f3eeed", accent: "#f0e2db", accentFg: "#4f162c", sb: "#f3eeed", sbFg: "#4f162c", sbBorder: "#e4d5cf",
      extra: {
        background: "#faf6f4",
        foreground: "#38111f",
        card: "#ffffff",
        "card-foreground": "#38111f",
        popover: "#ffffff",
        "popover-foreground": "#38111f",
        secondary: "#f0e2db",
        "secondary-foreground": "#4f162c",
        muted: "#f0e6e1",
        "muted-foreground": "#8a6a63",
        border: "#e4d5cf",
        input: "#e4d5cf",
      },
    }),
    // Dark mode uses shadcn TRUE-NEUTRAL surfaces (zero chroma grays) so the
    // base never looks maroon/warm — only the dusty-rose primary carries the
    // brand color as the accent.
    dark: slice({
      primary: "#cdaca8", fg: "#26161b", accent: "#262626", accentFg: "#fafafa", sb: "#171717", sbFg: "#fafafa", sbBorder: "#2b2b2b",
      extra: {
        background: "#0a0a0a",
        foreground: "#fafafa",
        card: "#171717",
        "card-foreground": "#fafafa",
        popover: "#171717",
        "popover-foreground": "#fafafa",
        secondary: "#262626",
        "secondary-foreground": "#fafafa",
        muted: "#262626",
        "muted-foreground": "#a3a3a3",
        border: "#2b2b2b",
        input: "#2b2b2b",
      },
    }),
  },
  {
    name: "Ocean Breeze",
    swatches: ["#0891b2", "#cffafe", "#f0fbfd", "#22d3ee"],
    light: slice({ primary: "#0891b2", fg: "#ecfeff", accent: "#cffafe", accentFg: "#155e75", sb: "#f0fbfd", sbFg: "#164e63", sbBorder: "#cdeef5" }),
    dark: slice({ primary: "#22d3ee", fg: "#083344", accent: "#0c3948", accentFg: "#67e8f9", sb: "#071c21", sbFg: "#a5f3fc", sbBorder: "#0c3948" }),
  },
  {
    name: "Rose",
    swatches: ["#e11d48", "#ffe4e6", "#fff5f6", "#fb7185"],
    light: slice({ primary: "#e11d48", fg: "#fff1f2", accent: "#ffe4e6", accentFg: "#9f1239", sb: "#fff5f6", sbFg: "#5c1423", sbBorder: "#ffe4e6" }),
    dark: slice({ primary: "#fb7185", fg: "#4c0519", accent: "#451021", accentFg: "#fda4af", sb: "#270812", sbFg: "#fecdd3", sbBorder: "#451021" }),
  },
  {
    name: "Slate",
    swatches: ["#334155", "#e2e8f0", "#f7f9fb", "#94a3b8"],
    light: slice({ primary: "#334155", fg: "#f8fafc", accent: "#e2e8f0", accentFg: "#0f172a", sb: "#f7f9fb", sbFg: "#1e293b", sbBorder: "#e2e8f0" }),
    dark: slice({ primary: "#94a3b8", fg: "#0f172a", accent: "#1e293b", accentFg: "#e2e8f0", sb: "#101623", sbFg: "#cbd5e1", sbBorder: "#1e293b" }),
  },
]

const FONT_LINK_ID = "seller-theme-fonts"

function findFont(kind, name) {
  return FONT_OPTIONS[kind].find((f) => f.name === name) ?? null
}

// Loads (or removes) the Google Fonts stylesheet for the selected fonts.
function syncFontLink(fonts) {
  const families = []
  for (const kind of ["sans", "mono"]) {
    const opt = findFont(kind, fonts?.[kind])
    if (opt?.google) families.push(`family=${opt.google}`)
  }
  let link = document.getElementById(FONT_LINK_ID)
  if (families.length === 0) {
    link?.remove()
    return
  }
  const href = `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`
  if (!link) {
    link = document.createElement("link")
    link.id = FONT_LINK_ID
    link.rel = "stylesheet"
    document.head.appendChild(link)
  }
  if (link.href !== href) link.href = href
}

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const RADIUS_RE = /^(0|[0-2](\.\d{1,3})?rem)$/

function cssBlock(selector, tokens, radius, fonts) {
  const lines = []
  for (const key of THEME_TOKENS) {
    const value = tokens?.[key]
    if (value && HEX_RE.test(value)) lines.push(`  --${key}: ${value};`)
  }
  if (radius && RADIUS_RE.test(radius)) lines.push(`  --radius: ${radius};`)
  if (fonts) {
    const sans = findFont("sans", fonts.sans)
    const mono = findFont("mono", fonts.mono)
    if (sans?.google) lines.push(`  --font-sans: ${sans.stack};`)
    if (mono?.google) lines.push(`  --font-mono: ${mono.stack};`)
  }
  if (lines.length === 0) return ""
  return `${selector} {\n${lines.join("\n")}\n}`
}

// FONT FIX — Tailwind v4 declares --font-sans/--font-mono inside
// `@theme inline`, which INLINES the literal font stack into the compiled
// `.font-sans` / `.font-mono` utilities at build time. Overriding the CSS
// variable at runtime therefore has NO visible effect. To make font changes
// actually apply we must override `font-family` directly on the elements.
function fontCss(fonts) {
  const rules = []
  const sans = findFont("sans", fonts?.sans)
  const mono = findFont("mono", fonts?.mono)
  if (sans?.google) rules.push(`body, .font-sans { font-family: ${sans.stack} !important; }`)
  if (mono?.google) rules.push(`.font-mono, code, kbd, samp, pre { font-family: ${mono.stack} !important; }`)
  return rules.join("\n")
}

/** Builds the full override stylesheet text for a theme payload. */
export function buildThemeCss(theme) {
  if (!theme) return ""
  // `:root:not(.dark)` / `:root.dark` (0,2,0) instead of plain `:root` /
  // `.dark` — guarantees the light block can NEVER leak into dark mode (and
  // vice versa) regardless of stylesheet order, since each block only matches
  // its own mode and outranks globals.css.
  const light = cssBlock(":root:not(.dark)", theme.light, theme.radius, theme.fonts)
  const dark = cssBlock(":root.dark", theme.dark, theme.radius, theme.fonts)
  return [light, dark, fontCss(theme.fonts)].filter(Boolean).join("\n")
}

/**
 * Applies the seller's saved theme while mounted. Pass the payload from
 * GET /seller/theme. Cleans up on unmount so leaving the Hub restores the
 * default look completely.
 */
export function useSellerTheme(theme) {
  useEffect(() => {
    const css = buildThemeCss(theme)
    let tag = document.getElementById(STYLE_ID)

    // Load/unload the Google Fonts stylesheet for the selected fonts.
    syncFontLink(theme?.fonts)

    if (!css) {
      tag?.remove()
      return
    }

    if (!tag) {
      tag = document.createElement("style")
      tag.id = STYLE_ID
      document.head.appendChild(tag)
    }
    tag.textContent = css

    return () => {
      document.getElementById(STYLE_ID)?.remove()
      document.getElementById(FONT_LINK_ID)?.remove()
    }
  }, [theme])
}
