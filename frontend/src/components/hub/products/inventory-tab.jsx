"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { EditorField } from "./editor-field"
import { SpecificationsBlock } from "./specifications-block"

/**
 * Inventory tab (plan C.8). Binds to `draft.inventory` + the publish mirror.
 */
const MANAGEMENT = [
  { value: "none", label: "Don't track inventory" },
  { value: "system", label: "Track by this system" },
  { value: "external", label: "External system" },
]

export function InventoryTab({ draft, setField }) {
  const inv = draft.inventory ?? {}
  const dim = inv.dimension ?? {}

  return (
    <div className="flex flex-col gap-6">
    <section className="rounded-xl border border-border bg-card p-5">
      <EditorField label="Inventory Management">
        <Select value={inv.management ?? "none"} onValueChange={(v) => setField("inventory.management", v)}>
          <SelectTrigger className="max-w-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MANAGEMENT.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </EditorField>

      {inv.management !== "none" && (
        <EditorField label="Available Quantity" htmlFor="inv-available">
          <Input
            id="inv-available"
            type="number"
            className="max-w-xs"
            value={inv.available ?? 0}
            onChange={(e) => setField("inventory.available", Number(e.target.value))}
          />
        </EditorField>
      )}

      <EditorField label="Min Limit To Buy" htmlFor="inv-min">
        <Input
          id="inv-min"
          type="number"
          min={1}
          className="max-w-xs"
          value={inv.minLimit ?? 1}
          onChange={(e) => setField("inventory.minLimit", Number(e.target.value))}
        />
      </EditorField>

      <EditorField label="Max Limit To Buy" htmlFor="inv-max">
        <Input
          id="inv-max"
          type="number"
          className="max-w-xs"
          value={inv.maxLimit ?? ""}
          onChange={(e) => setField("inventory.maxLimit", e.target.value === "" ? null : Number(e.target.value))}
          placeholder="No limit"
        />
      </EditorField>

      <EditorField label="Dimension (cm)" hint="Length × Width × Height">
        <div className="flex max-w-md gap-2">
          {["length", "width", "height"].map((k) => (
            <Input
              key={k}
              type="number"
              min={0}
              placeholder={k}
              value={dim[k] ?? ""}
              onChange={(e) =>
                setField(`inventory.dimension.${k}`, e.target.value === "" ? null : Number(e.target.value))
              }
            />
          ))}
        </div>
      </EditorField>

      <EditorField label="Publish">
        <Switch
          checked={Boolean(draft.isPublished)}
          onCheckedChange={(v) => setField("isPublished", v)}
          aria-label="Publish this product"
        />
      </EditorField>
    </section>

      <SpecificationsBlock value={draft.specifications ?? []} onChange={(v) => setField("specifications", v)} />
    </div>
  )
}
