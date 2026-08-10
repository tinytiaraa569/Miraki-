"use client"

import { useMemo, useState } from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getSpecTemplate, SPEC_TEMPLATES } from "./spec-templates"

/**
 * "Add Specification Group" modal (screenshot 1). Pick an optional template,
 * remove any preview fields you don't need, name the group, then Add Group.
 * Emits a specGroupSchema object: { type, displayName, rows:[{label,value,unit,show}] }.
 */
export function AddSpecGroupDialog({ open, onOpenChange, onAdd }) {
  const [templateId, setTemplateId] = useState("diamond")
  const [displayName, setDisplayName] = useState("Diamond Specifications")
  // Preview rows the user keeps: [{ label, unit }]
  const [fields, setFields] = useState(() => getSpecTemplate("diamond").fields.map((f) => ({ ...f })))

  const template = useMemo(() => getSpecTemplate(templateId), [templateId])

  function applyTemplate(id) {
    const t = getSpecTemplate(id)
    setTemplateId(id)
    setDisplayName(t?.displayName ?? "")
    setFields((t?.fields ?? []).map((f) => ({ ...f })))
  }

  function removeField(index) {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }

  function handleAdd() {
    onAdd({
      type: template?.type ?? "custom",
      displayName: displayName.trim() || template?.displayName || "Specifications",
      rows: fields.map((f, i) => ({
        label: f.label,
        value: "",
        unit: f.unit ?? "",
        show: true,
        sortOrder: i,
      })),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Specification Group</DialogTitle>
          <DialogDescription>Choose a template or create a custom specification group</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="spec-template">Use Template (Optional)</Label>
            <Select value={templateId} onValueChange={applyTemplate}>
              <SelectTrigger id="spec-template">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {SPEC_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label>Template Fields Preview</Label>
              {fields.length > 0 && (
                <span className="text-xs text-muted-foreground">Click X to remove fields you don&apos;t need</span>
              )}
            </div>
            <div className="max-h-56 overflow-y-auto rounded-md border border-border">
              {fields.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No fields. You can add rows after creating the group.
                </p>
              ) : (
                <ul className="flex flex-col">
                  {fields.map((f, i) => (
                    <li
                      key={`${f.label}-${i}`}
                      className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground">{f.label}</span>
                        {f.unit && (
                          <Badge variant="secondary" className="rounded-full font-normal">
                            {f.unit}
                          </Badge>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeField(i)}
                        className="rounded-sm p-1 text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remove ${f.label}`}
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="spec-display-name">Display Name</Label>
            <Input
              id="spec-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Diamond Specifications"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>Add Group</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
