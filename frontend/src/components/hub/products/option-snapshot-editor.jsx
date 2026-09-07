"use client"

import { useEffect, useRef, useState } from "react"
import { Eye, GripVertical, ImageIcon, Layers, ListPlus, Palette, Plus, Store, Trash2, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { imgUrl } from "@/Server"
import { EntityPicker } from "@/components/hub/collections/entity-picker"
import { OPTION_TYPES, isValueBearing, slugify, typeHint, typeLabel } from "@/components/hub/option-sets/option-set-utils"
import { cn } from "@/lib/utils"

/**
 * Editable, drag-and-drop view of an attached option set's options at the
 * PRODUCT level. It edits a local override of `optionSetSnapshot.options`
 * (matching the backend shape: `{ name, displayName, type, values: [...] }`)
 * so sellers can trim/add/reorder the values used to generate variants without
 * mutating the shared option set. Image swatches render their picture; swatch
 * types render their colour dot.
 *
 * Sellers can also add a brand-new option that lives ONLY on this product
 * (e.g. a Gemstone on a single pendant) using the same builder + full type set
 * as the Option Sets page, and remove any option row they no longer need.
 * Value-bearing types (dropdown / image / swatch / radio / checkbox) carry
 * preset chips; free-text types (text / textarea / number) are filled in by the
 * shopper, so they show a note instead of value chips.
 */
export function OptionSnapshotEditor({ options, onChange, mergeLabels }) {
  // Track in-flight drags. `optDrag` = reordering option rows;
  // `valDrag` = reordering value chips within a single option row.
  const optDrag = useRef(null)
  const valDrag = useRef(null)
  const [dragOverOpt, setDragOverOpt] = useState(null)
  const [addOptionOpen, setAddOptionOpen] = useState(false)

  function commit(next) {
    onChange(next)
  }

  function optLabel(opt) {
    return opt.displayName?.trim() || opt.name || "Option"
  }

  function valLabel(val) {
    if (typeof val === "string") return val
    return val.label?.trim() || val.value || ""
  }

  function valImage(val) {
    if (typeof val === "string") return null
    return val.image?.dataUrl || (val.image?.url ? imgUrl(val.image.url) : null)
  }

  /* --------------------------------------------------------- option rows */
  function reorderOptions(from, to) {
    if (from === to || from == null || to == null) return
    const next = [...options]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    commit(next)
  }

  function removeOption(optIndex) {
    commit(options.filter((_, i) => i !== optIndex))
  }

  // Scope an option to specific substores. Empty array = visible everywhere
  // (see `visibleInSubstore` in option-set-utils). Stored on the option object
  // itself so it persists verbatim with the rest of options[].
  function setOptionSubstores(optIndex, ids) {
    const next = options.map((o, i) => (i === optIndex ? { ...o, substoreIds: ids } : o))
    commit(next)
  }

  // Adds a fully-formed option (from the dialog): { name, displayName, type }.
  function addOption(opt) {
    const displayName = opt.displayName?.trim()
    const name = (opt.name?.trim() || slugify(displayName)).toLowerCase()
    if (!displayName || !name) {
      toast.error("Option name is required")
      return false
    }
    if (options.some((o) => (o.name || "").toLowerCase() === name)) {
      toast.error("An option with that name already exists")
      return false
    }
    const type = opt.type || "dropdown"
    commit([...options, { name, displayName, type, values: [] }])
    toast.success(
      isValueBearing(type)
        ? `Added “${displayName}” — now add its values`
        : `Added “${displayName}” — shoppers fill this in`,
    )
    return true
  }

  /* -------------------------------------------------------- value chips */
  function updateOptionValues(optIndex, values) {
    const next = options.map((o, i) => (i === optIndex ? { ...o, values } : o))
    commit(next)
  }

  function removeValue(optIndex, valIndex) {
    const values = (options[optIndex].values ?? []).filter((_, i) => i !== valIndex)
    updateOptionValues(optIndex, values)
  }

  // Scope a single value to specific substores (e.g. "18K Gold" only in UAE).
  // Empty array = visible everywhere. Values may be stored as plain strings, so
  // we normalize to an object before attaching substoreIds.
  function setValueSubstores(optIndex, valIndex, ids) {
    const values = (options[optIndex].values ?? []).map((v, i) => {
      if (i !== valIndex) return v
      const obj = typeof v === "string" ? { label: v, value: v } : { ...v }
      return { ...obj, substoreIds: ids }
    })
    updateOptionValues(optIndex, values)
  }

  function reorderValues(optIndex, from, to) {
    if (from === to || from == null || to == null) return
    const values = [...(options[optIndex].values ?? [])]
    const [moved] = values.splice(from, 1)
    values.splice(to, 0, moved)
    updateOptionValues(optIndex, values)
  }

  // Adds a fully-formed value object (from the dialog): { label, value, image }.
  function addValueObject(optIndex, val) {
    const label = val.label?.trim()
    const value = val.value?.trim()
    if (!label || !value) {
      toast.error("Label and value are required")
      return false
    }
    const existing = options[optIndex].values ?? []
    if (existing.some((v) => (typeof v === "string" ? v : v.value) === value)) {
      toast.error("That value already exists")
      return false
    }
    updateOptionValues(optIndex, [...existing, { label, value, image: val.image ?? null }])
    return true
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {options.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <Layers className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            No options yet. Attach an option set above, or add a product-specific option below.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {options.map((opt, optIndex) => (
          <OptionRow
            key={opt.name ?? optIndex}
            opt={opt}
            optIndex={optIndex}
            isDragOver={dragOverOpt === optIndex}
            label={optLabel(opt)}
            valLabel={valLabel}
            valImage={valImage}
            canRemove={options.length > 1}
            onOptDragStart={() => (optDrag.current = optIndex)}
            onOptDragOver={() => setDragOverOpt(optIndex)}
            onOptDrop={() => {
              reorderOptions(optDrag.current, optIndex)
              optDrag.current = null
              setDragOverOpt(null)
            }}
            onValDragStart={(vi) => (valDrag.current = vi)}
            onValDrop={(vi) => {
              reorderValues(optIndex, valDrag.current, vi)
              valDrag.current = null
            }}
            onRemoveValue={(vi) => removeValue(optIndex, vi)}
            onAddValue={(val) => addValueObject(optIndex, val)}
            onRemoveOption={() => removeOption(optIndex)}
            onSubstoresChange={(ids) => setOptionSubstores(optIndex, ids)}
            onValueSubstoresChange={(vi, ids) => setValueSubstores(optIndex, vi, ids)}
            mergeLabels={mergeLabels}
          />
          ))}
        </div>
      )}

      {/* add a product-specific option (e.g. a Gemstone on this product only) */}
      <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-2.5">
        <p className="text-xs text-muted-foreground">
          Need one more choice for just this product? Add an option below.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => setAddOptionOpen(true)}>
          <ListPlus className="size-3.5" aria-hidden="true" />
          Add option
        </Button>
      </div>

      <AddOptionDialog
        open={addOptionOpen}
        onOpenChange={setAddOptionOpen}
        onAdd={(opt) => {
          const ok = addOption(opt)
          if (ok) setAddOptionOpen(false)
        }}
      />
    </div>
  )
}

function OptionRow({
  opt,
  optIndex,
  isDragOver,
  label,
  valLabel,
  valImage,
  canRemove,
  onOptDragStart,
  onOptDragOver,
  onOptDrop,
  onValDragStart,
  onValDrop,
  onRemoveValue,
  onAddValue,
  onRemoveOption,
  onSubstoresChange,
  onValueSubstoresChange,
  mergeLabels,
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  // Index of the value whose per-value substore dialog is open (null = closed).
  const [valSubstoreIndex, setValSubstoreIndex] = useState(null)
  const values = opt.values ?? []
  const substoreIds = opt.substoreIds ?? []
  // Option-level substore picker is collapsed by default; auto-expand when the
  // option is already scoped so existing restrictions stay visible.
  const [showSubstores, setShowSubstores] = useState(substoreIds.length > 0)
  const type = opt.type || "dropdown"
  const isImage = type === "image"
  const isSwatch = type === "swatch"
  const bearing = isValueBearing(type)

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        onOptDragOver()
      }}
      onDrop={(e) => {
        e.preventDefault()
        onOptDrop()
      }}
      className={cn(
        "group/row grid grid-cols-1 items-start gap-3 px-4 py-3.5 transition-colors md:grid-cols-[16px_180px_1fr_auto]",
        isDragOver && "bg-muted/60 ring-1 ring-inset ring-primary/40",
      )}
    >
      {/* option drag handle */}
      <button
        type="button"
        draggable
        onDragStart={onOptDragStart}
        className="hidden cursor-grab text-muted-foreground/60 transition-colors hover:text-foreground active:cursor-grabbing md:mt-1 md:block"
        aria-label={`Reorder ${label}`}
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </button>

      <div className="mt-0.5 flex flex-wrap items-center gap-2">
        <span className="font-medium text-foreground">{label}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {isImage && <ImageIcon className="size-3" aria-hidden="true" />}
          {isSwatch && <Palette className="size-3" aria-hidden="true" />}
          {typeLabel(type)}
        </span>
        {opt.showAlways && (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-destructive/10 px-1 py-px text-[8px] font-medium uppercase tracking-wide text-destructive"
            title="This option is shown on the storefront but is not used to generate product variants."
          >
            <Eye className="size-2.5" aria-hidden="true" />
            Show always
          </span>
        )}
        {substoreIds.length > 0 && (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-1.5 py-px text-[8px] font-medium uppercase tracking-wide text-primary"
            title={`This option is only shown in ${substoreIds.length} selected substore${substoreIds.length === 1 ? "" : "s"}. Empty = all substores.`}
          >
            <Store className="size-2.5" aria-hidden="true" />
            {substoreIds.length} substore{substoreIds.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2.5">
      {bearing ? (
        <div className="flex flex-col gap-1.5">
        {opt.showAlways && (
          <p className="text-xs font-medium text-destructive">
            Variant will not be created for this option — it will only be shown
            on the storefront.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          {values.map((val, vi) => (
            <span
              key={(typeof val === "string" ? val : val.value) + vi}
              draggable
              onDragStart={(e) => {
                e.stopPropagation()
                onValDragStart(vi)
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onValDrop(vi)
              }}
              className="group inline-flex cursor-grab items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs text-foreground active:cursor-grabbing"
            >
              <GripVertical className="size-3 text-muted-foreground/50" aria-hidden="true" />
              {isImage &&
                (valImage(val) ? (
                  <img
                    src={valImage(val) || "/placeholder.svg"}
                    alt=""
                    className="size-4 rounded object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <ImageIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                ))}
              <span>{valLabel(val)}</span>
              {(() => {
                const valSubIds = (typeof val === "object" && val?.substoreIds) || []
                const scoped = valSubIds.length > 0
                return (
                  <button
                    type="button"
                    onClick={() => setValSubstoreIndex(vi)}
                    className={cn(
                      "flex items-center gap-0.5 rounded-sm p-0.5 transition-colors hover:bg-foreground/10",
                      scoped ? "text-primary" : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-label={`Set substore visibility for value ${valLabel(val)}`}
                    title={
                      scoped
                        ? `Value "${valLabel(val)}" is only shown in ${valSubIds.length} substore${valSubIds.length === 1 ? "" : "s"}. Click to edit.`
                        : `Choose which substores show the "${valLabel(val)}" value (empty = all substores).`
                    }
                  >
                    <Store className="size-3" aria-hidden="true" />
                    {scoped && <span className="text-[9px] font-semibold leading-none">{valSubIds.length}</span>}
                  </button>
                )
              })()}
              <button
                type="button"
                onClick={() => onRemoveValue(vi)}
                className="rounded-sm p-0.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                aria-label={`Remove ${valLabel(val)}`}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </span>
          ))}

          {/* add-value control — opens a dialog matching the Option Sets form */}
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            {isImage ? "Add image value" : isSwatch ? "Add swatch" : "Add value"}
          </button>
        </div>
        </div>
      ) : (
        <div className="mt-1 flex flex-col gap-1.5">
          {opt.showAlways && (
            <p className="text-xs font-medium text-destructive">
              Variant will not be created for this option — it will only be shown
              on the storefront.
            </p>
          )}
          <p className="text-xs italic text-muted-foreground">
            Shoppers fill this in at checkout — no preset values.
          </p>
        </div>
      )}

        {/* Option-level substore visibility — collapsed until the store toggle
            (next to the delete button) is clicked. Empty picker = shown in ALL
            substores; otherwise this option and its variants only appear in the
            chosen substores. */}
        {showSubstores && (
          <div className="flex flex-col gap-1 border-t border-dashed border-border pt-2">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Store className="size-3" aria-hidden="true" />
              Show this option in substores
            </div>
            <EntityPicker
              endpoint="/seller/substores/options"
              multiple
              value={substoreIds}
              onChange={(ids) => onSubstoresChange(ids)}
              onLabels={mergeLabels}
              placeholder="Empty = All substores"
            />
          </div>
        )}
      </div>

      {/* row actions: toggle option-level substore scope + remove option */}
      <div className="hidden items-start gap-1 md:flex md:justify-end">
        <button
          type="button"
          onClick={() => setShowSubstores((v) => !v)}
          aria-pressed={showSubstores}
          className={cn(
            "rounded-md p-1.5 transition-all hover:bg-primary/10 hover:text-primary",
            "focus-visible:opacity-100 group-hover/row:opacity-100",
            showSubstores || substoreIds.length > 0
              ? "text-primary opacity-100"
              : "text-muted-foreground opacity-0",
          )}
          aria-label={`Set substore visibility for option ${label}`}
          title={
            substoreIds.length > 0
              ? `Option "${label}" is shown in ${substoreIds.length} substore${substoreIds.length === 1 ? "" : "s"}. Click to edit.`
              : `Choose which substores show the whole "${label}" option (empty = all substores).`
          }
        >
          <Store className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onRemoveOption}
          disabled={!canRemove}
          className={cn(
            "rounded-md p-1.5 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive",
            "opacity-0 focus-visible:opacity-100 group-hover/row:opacity-100",
            !canRemove && "cursor-not-allowed opacity-0",
          )}
          aria-label={`Remove option ${label}`}
          title={canRemove ? `Remove ${label}` : "At least one option is required"}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>

      {bearing && (
        <AddValueDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          isImage={isImage}
          isSwatch={isSwatch}
          optionLabel={label}
          onAdd={(val) => {
            const ok = onAddValue(val)
            if (ok) setDialogOpen(false)
          }}
        />
      )}

      {/* Per-value substore visibility (e.g. show "18K Gold" only in the UAE store). */}
      {valSubstoreIndex != null && (
        <ValueSubstoreDialog
          open
          onOpenChange={(o) => !o && setValSubstoreIndex(null)}
          valueLabel={valLabel(values[valSubstoreIndex])}
          optionLabel={label}
          substoreIds={
            (typeof values[valSubstoreIndex] === "object" && values[valSubstoreIndex]?.substoreIds) || []
          }
          onChange={(ids) => onValueSubstoresChange(valSubstoreIndex, ids)}
          mergeLabels={mergeLabels}
        />
      )}
    </div>
  )
}

/**
 * Dialog to scope a single option VALUE to specific substores. Empty selection
 * means the value is shown in every substore; picking one or more restricts it
 * (e.g. a "18K Gold" metal value that should only appear in the UAE store).
 * Reuses the shared EntityPicker against the substores option feed.
 */
function ValueSubstoreDialog({ open, onOpenChange, valueLabel, optionLabel, substoreIds, onChange, mergeLabels }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="size-4 text-primary" aria-hidden="true" />
            {`Show “${valueLabel}” in substores`}
          </DialogTitle>
          <DialogDescription>
            {`Leave empty to show this ${optionLabel} value in all substores, or pick the substores where it should appear.`}
          </DialogDescription>
        </DialogHeader>
        <div className="py-1">
          <EntityPicker
            endpoint="/seller/substores/options"
            multiple
            value={substoreIds}
            onChange={(ids) => onChange(ids)}
            onLabels={mergeLabels}
            placeholder="Empty = All substores"
          />
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Dialog to add a brand-new option to THIS product only. Mirrors the Option
 * Sets builder: a display name (required), an internal name (auto-slugged from
 * the display name until edited), and a value type from the full shared type
 * set. The new option starts with no values — the seller then adds them with
 * the per-option "Add value" control (value-bearing types only).
 */
function AddOptionDialog({ open, onOpenChange, onAdd }) {
  const [displayName, setDisplayName] = useState("")
  const [name, setName] = useState("")
  const [nameTouched, setNameTouched] = useState(false)
  const [type, setType] = useState("dropdown")

  function reset() {
    setDisplayName("")
    setName("")
    setNameTouched(false)
    setType("dropdown")
  }

  // Clear fields on every close, including programmatic closes after a
  // successful add where Radix's onOpenChange does not fire.
  useEffect(() => {
    if (!open) reset()
  }, [open])

  function handleOpenChange(next) {
    onOpenChange(next)
  }

  function onDisplayNameChange(e) {
    const next = e.target.value
    setDisplayName(next)
    if (!nameTouched) setName(slugify(next))
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add option to this product</DialogTitle>
          <DialogDescription>
            This option lives on this product only and won&apos;t change the shared option set.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-option-display">Option name</Label>
            <Input
              id="add-option-display"
              value={displayName}
              onChange={onDisplayNameChange}
              placeholder="Gemstone"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-option-name">Internal name</Label>
            <Input
              id="add-option-name"
              value={name}
              onChange={(e) => {
                setNameTouched(true)
                setName(e.target.value)
              }}
              placeholder="gemstone"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-option-type">Value type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="add-option-type">
                <SelectValue placeholder="Select a value type" />
              </SelectTrigger>
              <SelectContent>
                {OPTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {typeHint(type)}
              {isValueBearing(type)
                ? " · You'll add its values next."
                : " · Shoppers fill this in themselves."}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => onAdd({ name, displayName, type })}>
            <Plus className="size-3.5" aria-hidden="true" />
            Add option
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Dialog form to add a value to an option — Label (required), Value (required,
 * auto-slugged from the label until edited), plus a type-specific control: a
 * swatch image (image type) or a colour picker (swatch type). Mirrors the
 * Option Sets value form.
 */
function AddValueDialog({ open, onOpenChange, isImage, isSwatch, optionLabel, onAdd }) {
  const [label, setLabel] = useState("")
  const [value, setValue] = useState("")
  const [valueTouched, setValueTouched] = useState(false)
  const [image, setImage] = useState(null)
  const fileRef = useRef(null)

  function reset() {
    setLabel("")
    setValue("")
    setValueTouched(false)
    setImage(null)
  }

  // Clear the fields whenever the dialog closes — including programmatic closes
  // after a successful add, where Radix's onOpenChange does not fire.
  useEffect(() => {
    if (!open) reset()
  }, [open])

  function handleOpenChange(next) {
    onOpenChange(next)
  }

  function onLabelChange(e) {
    const nextLabel = e.target.value
    setLabel(nextLabel)
    if (!valueTouched) setValue(slugify(nextLabel))
  }

  function readFile(file) {
    if (!file) return
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file")
    if (file.size > 2 * 1024 * 1024) return toast.error("Image too large (max 2 MB)")
    const reader = new FileReader()
    reader.onload = () => setImage({ dataUrl: reader.result })
    reader.readAsDataURL(file)
  }

  const preview = image?.dataUrl || (image?.url ? imgUrl(image.url) : null)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add value to {optionLabel}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-value-label">Label</Label>
            <Input
              id="add-value-label"
              value={label}
              onChange={onLabelChange}
              placeholder={isImage || isSwatch ? "Yellow Gold" : "18K"}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="add-value-value">Value</Label>
            <Input
              id="add-value-value"
              value={value}
              onChange={(e) => {
                setValueTouched(true)
                setValue(e.target.value)
              }}
              placeholder={isImage || isSwatch ? "yellow-gold" : "18k"}
            />
          </div>

          {isImage && (
            <div className="flex flex-col gap-1.5">
              <Label>Image</Label>
              <div className="flex items-center gap-3">
                <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                  {preview ? (
                    <img src={preview || "/placeholder.svg"} alt="" className="size-full object-cover" crossOrigin="anonymous" />
                  ) : (
                    <ImageIcon className="size-5 text-muted-foreground" aria-hidden="true" />
                  )}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <Upload className="size-3.5" aria-hidden="true" />
                  Choose image
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

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onAdd({ label, value, image: isImage ? image : null })}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Add value
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
