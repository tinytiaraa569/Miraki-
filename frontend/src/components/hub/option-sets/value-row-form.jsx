"use client"

import { useRef, useState } from "react"
import { Check, ImageIcon, Plus, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { emptyValue, slugify } from "@/components/hub/option-sets/option-set-utils"
import { imgUrl } from "@/Server"
import { cn } from "@/lib/utils"

/**
 * Inline "Add Values / Insert Values" builder for one option (§10.6). Captures
 * Label (required), Value (required; auto-slugged from Label until the user edits
 * it), and — for image-type options — a swatch file read to a transient dataUrl.
 * Optional priceDelta + isDefault. Emits a fully-formed value row.
 */
export function ValueRowForm({ isImage, onAdd, onCancel, initialValue }) {
  const isEditing = Boolean(initialValue)
  const [draft, setDraft] = useState(initialValue ?? emptyValue)
  const [valueTouched, setValueTouched] = useState(isEditing)
  const fileRef = useRef(null)

  function onLabelChange(e) {
    const label = e.target.value
    setDraft((d) => ({ ...d, label, value: valueTouched ? d.value : slugify(label) }))
  }

  function readFile(file) {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large (max 2 MB)")
      return
    }
    const reader = new FileReader()
    reader.onload = () => setDraft((d) => ({ ...d, image: { dataUrl: reader.result } }))
    reader.readAsDataURL(file)
  }

  function submit() {
    if (!draft.label.trim() || !draft.value.trim()) {
      toast.error("Label and value are required")
      return
    }
    onAdd({
      ...draft,
      label: draft.label.trim(),
      value: draft.value.trim(),
    })
  }

  const preview = draft.image?.dataUrl || (draft.image?.url ? imgUrl(draft.image.url) : null)

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-3">
      <div className={cn("grid gap-3", isImage ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Label</Label>
          <Input value={draft.label} onChange={onLabelChange} placeholder="Yellow Gold" className="h-8" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Value</Label>
          <Input
            value={draft.value}
            onChange={(e) => {
              setValueTouched(true)
              setDraft((d) => ({ ...d, value: e.target.value }))
            }}
            placeholder="yellow-gold"
            className="h-8"
          />
        </div>
        {isImage && (
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Image</Label>
            <div className="flex items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
                {preview ? (
                  <img src={preview || "/placeholder.svg"} alt="" className="size-full object-cover" />
                ) : (
                  <ImageIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                )}
              </span>
              <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => fileRef.current?.click()}>
                <Upload className="size-3.5" aria-hidden="true" />
                Choose
              </Button>
                <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
                className="sr-only"
                onChange={(e) => {
                  readFile(e.target.files?.[0])
                  e.target.value = ""
                }}
                aria-label="Upload swatch image"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox
            checked={draft.isDefault}
            onCheckedChange={(v) => setDraft((d) => ({ ...d, isDefault: Boolean(v) }))}
          />
          Default value
        </label>

        <div className="ml-auto flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" className="h-8" onClick={onCancel}>
            <X className="size-3.5" aria-hidden="true" />
            Cancel
          </Button>
          <Button type="button" size="sm" className="h-8" onClick={submit}>
            {isEditing ? <Check className="size-3.5" aria-hidden="true" /> : <Plus className="size-3.5" aria-hidden="true" />}
            {isEditing ? "Save value" : "Add value"}
          </Button>
        </div>
      </div>
    </div>
  )
}
