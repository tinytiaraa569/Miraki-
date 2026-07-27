import { z } from "zod"

// Allow-listed design tokens — MUST stay in sync with globals.css and the
// frontend appearance editor. Anything outside this list is rejected, so a
// client can never inject arbitrary CSS variable names.
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

// Allow-listed font choices — MUST stay in sync with the frontend engine's
// FONT_OPTIONS (use-seller-theme.js). Names only; the frontend maps them to
// Google Fonts URLs + CSS stacks, so nothing here ever becomes raw CSS.
export const THEME_FONTS = {
  sans: [
    "Inter",
    "Poppins",
    "Outfit",
    "DM Sans",
    "Space Grotesk",
    "Montserrat",
    "Nunito",
    "Roboto",
    "Plus Jakarta Sans",
    "Manrope",
    "Sora",
    "Work Sans",
    "Raleway",
    "Lato",
    "Figtree",
    "Lexend",
  ],
  mono: [
    "Geist Mono",
    "JetBrains Mono",
    "Fira Code",
    "IBM Plex Mono",
    "Space Mono",
    "Roboto Mono",
    "Source Code Pro",
    "Ubuntu Mono",
  ],
}

const hex = z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i, "Must be a hex color like #7c3aed")

// { "primary": "#7c3aed", ... } — only allow-listed keys, only hex values.
const tokenRecord = z
  .record(z.enum(THEME_TOKENS), hex)
  .refine((rec) => Object.keys(rec).length <= THEME_TOKENS.length, { message: "Too many tokens" })

export const saveThemeSchema = z
  .object({
    light: tokenRecord.optional(),
    dark: tokenRecord.optional(),
    radius: z
      .union([z.string().regex(/^(0|[0-2](\.\d{1,3})?rem)$/, "Radius must be like 0.5rem"), z.null()])
      .optional(),
    fonts: z
      .object({
        sans: z.union([z.enum(THEME_FONTS.sans), z.null()]).optional(),
        mono: z.union([z.enum(THEME_FONTS.mono), z.null()]).optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: "No fields to update" })
