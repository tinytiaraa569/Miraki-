"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { EntityPicker } from "@/components/hub/collections/entity-picker"
import { EditorField } from "./editor-field"

/**
 * Miscellaneous tab (plan C.11). Binds to `draft.misc` + `draft.media` +
 * `draft.tags` + `draft.productTaxCode`. Related / Bought-together are
 * id-valued product pickers (ObjectId arrays).
 */

// Text fields that live directly on misc.* (key → label → placeholder).
const MISC_TEXT_FIELDS = [
  ["barcode", "Barcode", "Enter barcode"],
  ["isbn", "ISBN", "e.g. 978-3-16-148410-0"],
  ["hsn", "HSN", "Enter HSN code"],
  ["sac", "SAC", "Enter SAC code"],
  ["upc", "UPC", "Enter 12-digit UPC"],
  ["gtin", "GTIN", "Enter GTIN"],
  ["mpn", "MPN", "Enter manufacturer part number"],
  ["uom", "Unit of Measurement (UOM)", "e.g. piece, kg, litre"],
  ["countryOfOrigin", "Country Of Origin", "e.g. India"],
  ["googleProductCategory", "Google Product Category", "e.g. Apparel & Accessories"],
]

export function MiscellaneousTab({ draft, setField, mergeLabels }) {
  const misc = draft.misc ?? {}
  const gs = misc.googleShopping ?? {}

  const setMisc = (key, value) => setField(`misc.${key}`, value)

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      {/* -------------------------------------------------------------- media */}
      <EditorField label="Media" hint="External media URLs (video, 360°, etc.).">
        <RowTable
          rows={draft.media ?? []}
          columns={[
            { key: "url", placeholder: "https://…" },
            { key: "caption", placeholder: "Caption" },
            { key: "tags", placeholder: "Tag (e.g. Y/W/R)" },
            { key: "icon", placeholder: "Icon" },
          ]}
          onChange={(v) => setField("media", v)}
          empty={{ url: "", caption: "", tags: "", icon: "" }}
          addLabel="Add Media"
        />
      </EditorField>

      {MISC_TEXT_FIELDS.map(([key, label, placeholder]) => (
        <EditorField key={key} label={label} htmlFor={`misc-${key}`}>
          <Input
            id={`misc-${key}`}
            value={misc[key] ?? ""}
            onChange={(e) => setMisc(key, e.target.value)}
            className="max-w-md"
            placeholder={placeholder}
          />
        </EditorField>
      ))}

      <EditorField label="Product Tax Code" htmlFor="misc-ptc">
        <Input
          id="misc-ptc"
          value={draft.productTaxCode ?? ""}
          onChange={(e) => setField("productTaxCode", e.target.value)}
          className="max-w-md"
          placeholder="Enter product tax code"
        />
      </EditorField>

      {/* --------------------------------------------------------- attributes */}
      <EditorField label="Attributes">
        <RowTable
          rows={misc.attributes ?? []}
          columns={[
            { key: "name", placeholder: "Name" },
            { key: "value", placeholder: "Value" },
            { key: "group", placeholder: "Group" },
          ]}
          onChange={(v) => setMisc("attributes", v)}
          empty={{ name: "", value: "", group: "" }}
          addLabel="Add Attribute"
        />
      </EditorField>

      <EditorField label="Features">
        <RowTable
          rows={misc.features ?? []}
          columns={[
            { key: "name", placeholder: "Name" },
            { key: "value", placeholder: "Value" },
          ]}
          onChange={(v) => setMisc("features", v)}
          empty={{ name: "", value: "" }}
          addLabel="Add Feature"
        />
      </EditorField>

      <EditorField label="Enable RFQ">
        <Checkbox
          checked={Boolean(misc.enableRfq)}
          onCheckedChange={(v) => setMisc("enableRfq", Boolean(v))}
          aria-label="Enable request for quote"
        />
      </EditorField>

      <EditorField label="Files">
        <RowTable
          rows={misc.files ?? []}
          columns={[
            { key: "url", placeholder: "File URL" },
            { key: "description", placeholder: "Description" },
            { key: "maxDownloads", placeholder: "Max downloads", type: "number" },
          ]}
          onChange={(v) => setMisc("files", v)}
          empty={{ url: "", description: "", maxDownloads: null }}
          addLabel="Add File"
        />
      </EditorField>

      <EditorField label="Shipping Cost" htmlFor="misc-ship">
        <Input
          id="misc-ship"
          type="number"
          min={0}
          className="max-w-xs"
          value={misc.shippingCost ?? ""}
          onChange={(e) => setMisc("shippingCost", e.target.value === "" ? null : Number(e.target.value))}
          placeholder="0.00"
        />
      </EditorField>

      <EditorField label="Tags" htmlFor="misc-tags" hint="Comma-separated.">
        <Input
          id="misc-tags"
          value={(draft.tags ?? []).join(", ")}
          onChange={(e) =>
            setField(
              "tags",
              e.target.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            )
          }
          className="max-w-md"
          placeholder="e.g. summer, sale, featured"
        />
      </EditorField>

      <EditorField label="Is Catalog" hint="(Is Catalog will be deprecated)">
        <Checkbox
          checked={Boolean(misc.isCatalog)}
          onCheckedChange={(v) => setMisc("isCatalog", Boolean(v))}
          aria-label="Is catalog"
        />
      </EditorField>

      <EditorField label="Catalog Only">
        <Checkbox
          checked={Boolean(misc.catalogOnly)}
          onCheckedChange={(v) => setMisc("catalogOnly", Boolean(v))}
          aria-label="Catalog only"
        />
      </EditorField>

      <EditorField label="Related Products">
        <EntityPicker
          endpoint="/seller/products/options"
          multiple
          value={misc.relatedProductIds ?? []}
          onChange={(ids) => setMisc("relatedProductIds", ids)}
          onLabels={mergeLabels}
          placeholder="Search products"
        />
      </EditorField>

      <EditorField label="Bought Together">
        <EntityPicker
          endpoint="/seller/products/options"
          multiple
          value={misc.boughtTogetherIds ?? []}
          onChange={(ids) => setMisc("boughtTogetherIds", ids)}
          onLabels={mergeLabels}
          placeholder="Search products"
        />
      </EditorField>

      <EditorField label="Google Shopping">
        <div className="flex max-w-md flex-col gap-2">
          {[0, 1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <span className="w-28 shrink-0 text-sm text-muted-foreground">Custom Label {n}</span>
              <Input
                value={gs[`customLabel${n}`] ?? ""}
                onChange={(e) => setField(`misc.googleShopping.customLabel${n}`, e.target.value)}
                className="h-8"
                placeholder={`Custom label ${n} value`}
              />
            </div>
          ))}
        </div>
      </EditorField>
    </section>
  )
}

// --------------------------------------------------------------------------
// Generic repeatable-row table used for media / attributes / features / files.
// --------------------------------------------------------------------------
function RowTable({ rows, columns, onChange, empty, addLabel }) {
  function add() {
    onChange([...rows, { ...empty }])
  }
  function update(index, key, value) {
    onChange(rows.map((r, i) => (i === index ? { ...r, [key]: value } : r)))
  }
  function remove(index) {
    onChange(rows.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No rows.</p>
      ) : (
        rows.map((row, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            {columns.map((col) => (
              <Input
                key={col.key}
                type={col.type ?? "text"}
                value={row[col.key] ?? ""}
                placeholder={col.placeholder}
                onChange={(e) =>
                  update(i, col.key, col.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)
                }
                className="h-8 flex-1 min-w-32"
              />
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive/80 hover:text-destructive"
              onClick={() => remove(i)}
              aria-label="Remove row"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ))
      )}
      <div>
        <Button variant="ghost" size="sm" onClick={add}>
          <Plus className="size-3.5" aria-hidden="true" />
          {addLabel}
        </Button>
      </div>
    </div>
  )
}
