// Client-only field presets for the "Add Specification Group" modal. These are
// NOT option sets and are NEVER fetched — they simply seed the `rows[]` of a
// spec group (schema §4.5 specGroupSchema: { type, displayName, rows }). The
// user can remove any previewed field before adding, and Custom starts empty.
//
// `type` maps 1:1 to the product schema's specGroup enum
// ("diamond" | "pearl" | "gemstone" | "metal" | "custom").

/** Units offered per spec row (matches the per-row Unit dropdown in the UI). */
export const SPEC_UNITS = [
  { value: "", label: "No Unit" },
  { value: "carat (ct)", label: "carat (ct)" },
  { value: "mm", label: "mm" },
  { value: "cm", label: "cm" },
  { value: "%", label: "%" },
  { value: "g", label: "g" },
]

const row = (label, unit = "") => ({ label, unit })

export const SPEC_TEMPLATES = [
  {
    id: "diamond",
    type: "diamond",
    displayName: "Diamond Specifications",
    fields: [
      row("Diamond Weight", "carat (ct)"),
      row("Diamond Length", "mm"),
      row("Diamond Width", "mm"),
      row("Diamond Depth", "mm"),
      row("Diamond Cut"),
      row("Diamond Color"),
      row("Diamond Clarity"),
      row("Diamond Depth %", "%"),
      row("Diamond Table %", "%"),
      row("Diamond Shape"),
      row("Diamond Type"),
      row("Diamond Count"),
      row("Diamond Certificate"),
    ],
  },
  {
    id: "pearl",
    type: "pearl",
    displayName: "Pearl Specifications",
    fields: [
      row("Pearl Type"),
      row("Pearl Size", "mm"),
      row("Pearl Shape"),
      row("Pearl Color"),
      row("Pearl Luster"),
      row("Pearl Count"),
    ],
  },
  {
    id: "gemstone",
    type: "gemstone",
    displayName: "Gemstone Specifications",
    fields: [
      row("Gemstone Type"),
      row("Gemstone Weight", "carat (ct)"),
      row("Gemstone Cut"),
      row("Gemstone Color"),
      row("Gemstone Clarity"),
      row("Gemstone Count"),
    ],
  },
  {
    id: "metal",
    type: "metal",
    displayName: "Metal Specifications",
    fields: [
      row("Metal Type"),
      row("Metal Purity"),
      row("Metal Color"),
      row("Metal Weight", "g"),
      row("Metal Finish"),
    ],
  },
  {
    id: "custom",
    type: "custom",
    displayName: "Custom Specifications",
    fields: [],
  },
]

export const getSpecTemplate = (id) => SPEC_TEMPLATES.find((t) => t.id === id) ?? null
