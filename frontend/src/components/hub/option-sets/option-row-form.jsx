"use client"

import { useState } from "react"
import { Check, X, Layers, ListChecks } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ValueTable } from "@/components/hub/option-sets/value-table"
import {
  OPTION_TYPES,
  emptyOption,
  isValueBearing,
  typeHint,
} from "@/components/hub/option-sets/option-set-utils"
import { cn } from "@/lib/utils"

function Field({ label, hint, children, className }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs font-medium text-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] leading-tight text-muted-foreground">{hint}</p>}
    </div>
  )
}

function ToggleCard({ title, description, checked, onChange }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2.5 transition-colors",
        checked ? "border-primary/60 bg-primary/5" : "border-border hover:border-foreground/20",
      )}
    >
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="truncate text-[11px] leading-tight text-muted-foreground">{description}</span>
      </span>
      <Switch checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} className="shrink-0" />
    </label>
  )
}

/**
 * Inline "Add / Insert Option" builder (§10.5). `initial` seeds edit mode; when
 * omitted it starts blank (add mode). `Type` swaps between value-bearing (shows
 * the nested Values editor) and free-text options exactly per §3. `Name` is
 * auto-lowercased ("always use small case"). Emits a complete option row.
 */
export function OptionRowForm({ initial, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => initial ?? emptyOption())
  const bearing = isValueBearing(draft.type)

  const set = (key) => (value) => setDraft((d) => ({ ...d, [key]: value }))
  const setInput = (key) => (e) => setDraft((d) => ({ ...d, [key]: e.target.value }))

  function onTypeChange(type) {
    setDraft((d) => ({ ...d, type, values: isValueBearing(type) ? d.values : [] }))
  }

  function save() {
    if (!draft.name.trim()) {
      toast.error("Option name is required")
      return
    }
    if (isValueBearing(draft.type) && draft.values.length === 0) {
      toast.error("This option type needs at least one value")
      return
    }
    // Mirror the value flagged default into the option's defaultValue (§2). Keep
    // an existing default ONLY if it still matches a current value — otherwise a
    // stale/mismatched default would make the server reject the whole save.
    const flagged = draft.values.find((v) => v.isDefault)?.value
    const kept = draft.values.some((v) => v.value === draft.defaultValue) ? draft.defaultValue : null
    const def = flagged ?? kept ?? null
    onSave({ ...draft, name: draft.name.trim().toLowerCase(), defaultValue: def })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border bg-muted/40 px-4 py-3">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Layers className="size-4" aria-hidden="true" />
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground">
            {initial ? "Edit option" : "New option"}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Configure how this choice appears to shoppers
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-5 p-4">
        {/* Basics */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Name" hint="Lowercase key, e.g. metal color">
            <Input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value.toLowerCase() }))}
              placeholder="metal color"
              className="h-9"
            />
          </Field>
          <Field label="Display name" hint="Shown to shoppers">
            <Input
              value={draft.displayName}
              onChange={setInput("displayName")}
              placeholder="Metal Color"
              className="h-9"
            />
          </Field>
          <Field label="Type" hint={typeHint(draft.type)}>
            <Select value={draft.type} onValueChange={onTypeChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {OPTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        {/* Constraints + behaviour */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-muted/20 p-3">
            <Field label="Min count">
              <Input type="number" min={0} value={draft.minCount} onChange={setInput("minCount")} className="h-9" />
            </Field>
            <Field label="Max count" hint="0 = unbounded">
              <Input type="number" min={0} value={draft.maxCount} onChange={setInput("maxCount")} className="h-9" />
            </Field>
            <Field label="Sort order">
              <Input type="number" value={draft.sortOrder} onChange={setInput("sortOrder")} className="h-9" />
            </Field>
          </div>
          <div className="flex flex-col gap-2">
            <ToggleCard
              title="Required"
              description="Shopper must choose"
              checked={draft.required}
              onChange={set("required")}
            />
            <ToggleCard
              title="Show always"
              description="Always visible on page"
              checked={draft.showAlways}
              onChange={set("showAlways")}
            />
          </div>
        </div>

        {/* Values */}
        {bearing ? (
          <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-2">
              <ListChecks className="size-4 text-muted-foreground" aria-hidden="true" />
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Values
              </Label>
            </div>
            <ValueTable isImage={draft.type === "image"} values={draft.values} onChange={set("values")} />
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
            Free-text options don&apos;t carry preset values — shoppers type their own input.
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/40 px-4 py-3">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X className="size-3.5" aria-hidden="true" />
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={save}>
          <Check className="size-3.5" aria-hidden="true" />
          {initial ? "Update option" : "Add option"}
        </Button>
      </div>
    </div>
  )
}
