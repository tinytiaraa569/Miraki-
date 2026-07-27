import mongoose from "mongoose"

// ---------------------------------------------------------------------------
// SELLER THEME — a SEPARATE collection (NOT embedded in the seller document).
// One document per seller, keyed by sellerId. Holds the full tweakcn-style
// design-token overrides (light + dark maps), applied at runtime by the Hub
// shell as CSS variables. The seller document is never touched by theming.
// ---------------------------------------------------------------------------

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

// Token → hex color. Keys are allow-listed in theme.validation.js; the model
// re-validates every value so nothing but hex ever reaches the database.
const tokenMap = {
  type: Map,
  of: {
    type: String,
    validate: { validator: (v) => HEX_RE.test(v), message: "Token values must be hex colors" },
  },
  default: () => new Map(),
}

const sellerThemeSchema = new mongoose.Schema(
  {
    // One theme per seller — the ONLY link back to the seller document.
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true, immutable: true },
    // Per-mode design token overrides ("primary" → "#7c3aed", ...).
    // Only tokens the seller actually changed are stored; everything else
    // falls back to the app's default globals.css values.
    light: tokenMap,
    dark: tokenMap,
    // Corner rounding for the whole dashboard, e.g. "0.5rem".
    radius: { type: String, default: null, match: /^(0|[0-2](\.\d{1,3})?rem)$/ },
    // Typography — allow-listed font family NAMES only (never raw CSS). The
    // frontend maps names to Google Fonts URLs + fallback stacks.
    fonts: {
      sans: { type: String, default: null, maxlength: 40 },
      mono: { type: String, default: null, maxlength: 40 },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "StoreUser", default: null },
  },
  { timestamps: true },
)

sellerThemeSchema.index({ sellerId: 1 }, { unique: true })

export const SellerTheme = mongoose.model("SellerTheme", sellerThemeSchema, "sellerThemes")
