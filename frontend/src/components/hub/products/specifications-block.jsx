"use client"

import { useState } from "react"
import { ChevronDown, Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { AddSpecGroupDialog } from "./add-spec-group-dialog"
import { SPEC_UNITS } from "./spec-templates"

/**
 * "Product Specifications" card (screenshots 2 & 13). Renders under the General
 * tab. Binds to draft.specifications (specGroupSchema[]). Each group is a
 * collapsible table of rows: Label · Value · Unit · Show (eye) · Actions.
 * All edits mutate the draft locally and persist with the General-tab save.
 */
export function SpecificationsBlock({ value = [], onChange }) {
  const [dialogOpen, setDialogOpen] = useState(false)

  function addGroup(group) {
    onChange([...value, { ...group, sortOrder: value.length }])
  }

  function updateGroup(index, patch) {
    onChange(value.map((g, i) => (i === index ? { ...g, ...patch } : g)))
  }

  function removeGroup(index) {
    onChange(value.filter((_, i) => i !== index))
  }

  function updateRow(gi, ri, patch) {
    const group = value[gi]
    const rows = group.rows.map((r, i) => (i === ri ? { ...r, ...patch } : r))
    updateGroup(gi, { rows })
  }

  function addRow(gi) {
    const group = value[gi]
    updateGroup(gi, {
      rows: [...(group.rows ?? []), { label: "New Field", value: "", unit: "", show: true, sortOrder: group.rows?.length ?? 0 }],
    })
  }

  function removeRow(gi, ri) {
    const group = value[gi]
    updateGroup(gi, { rows: group.rows.filter((_, i) => i !== ri) })
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lg font-semibold text-foreground">Product Specifications</h2>
          <p className="text-sm text-muted-foreground">
            Add dynamic specifications for diamonds, pearls, gemstones, metals, or custom properties
          </p>
        </div>
        <Button variant="outline" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" aria-hidden="true" />
          Add Specification Group
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm font-medium text-muted-foreground">No specifications added yet.</p>
          <p className="text-sm text-muted-foreground">
            Click &quot;Add Specification Group&quot; to add diamond, pearl, or custom specifications.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {value.map((group, gi) => (
            <SpecGroupCard
              key={gi}
              group={group}
              onRename={(displayName) => updateGroup(gi, { displayName })}
              onRemoveGroup={() => removeGroup(gi)}
              onUpdateRow={(ri, patch) => updateRow(gi, ri, patch)}
              onAddRow={() => addRow(gi)}
              onRemoveRow={(ri) => removeRow(gi, ri)}
            />
          ))}
        </div>
      )}

      <AddSpecGroupDialog open={dialogOpen} onOpenChange={setDialogOpen} onAdd={addGroup} />
    </section>
  )
}

function SpecGroupCard({ group, onRename, onRemoveGroup, onUpdateRow, onAddRow, onRemoveRow }) {
  const [open, setOpen] = useState(true)
  const rows = group.rows ?? []

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center gap-2 bg-muted/40 px-3 py-2.5">
        <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-semibold text-foreground">
            {group.displayName || "Specifications"}
          </span>
          <span className="text-xs text-muted-foreground">
            {rows.length} item(s) · Type: {group.type}
          </span>
        </div>
        <Badge variant="secondary" className="rounded-full font-normal">
          {group.type}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-destructive/80 hover:text-destructive"
          onClick={onRemoveGroup}
          aria-label={`Delete ${group.displayName} group`}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Collapse group" : "Expand group"}
          aria-expanded={open}
        >
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
        </Button>
      </div>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">Label</th>
                <th className="px-3 py-2">Value</th>
                <th className="px-3 py-2 w-40">Unit</th>
                <th className="px-3 py-2 w-20 text-center">Show</th>
                <th className="px-3 py-2 w-16 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No fields yet.
                  </td>
                </tr>
              ) : (
                rows.map((r, ri) => (
                  <tr key={ri} className={cn("border-b border-border last:border-0", !r.show && "opacity-50")}>
                    <td className="px-3 py-2">
                      <Input
                        value={r.label}
                        onChange={(e) => onUpdateRow(ri, { label: e.target.value })}
                        className="h-8 border-transparent bg-transparent px-1 font-medium hover:border-input focus:border-input"
                        aria-label="Specification label"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={r.value ?? ""}
                        onChange={(e) => onUpdateRow(ri, { value: e.target.value })}
                        placeholder="Enter value"
                        className="h-8"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Select value={r.unit ?? ""} onValueChange={(unit) => onUpdateRow(ri, { unit })}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="No Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {SPEC_UNITS.map((u) => (
                            <SelectItem key={u.value || "none"} value={u.value || "none"}>
                              {u.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => onUpdateRow(ri, { show: !r.show })}
                        className={cn(
                          "inline-flex size-8 items-center justify-center rounded-md transition-colors hover:bg-muted",
                          r.show ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
                        )}
                        aria-label={r.show ? "Hide on storefront" : "Show on storefront"}
                        aria-pressed={r.show}
                      >
                        {r.show ? <Eye className="size-4" aria-hidden="true" /> : <EyeOff className="size-4" aria-hidden="true" />}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive/80 hover:text-destructive"
                        onClick={() => onRemoveRow(ri)}
                        aria-label={`Remove ${r.label}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="border-t border-border p-2">
            <Button variant="ghost" size="sm" onClick={onAddRow}>
              <Plus className="size-3.5" aria-hidden="true" />
              Add Row
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
