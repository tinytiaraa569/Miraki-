"use client"

import { useRef, useState } from "react"
import { ImageIcon, MoreVertical, Pencil, Plus, Trash2, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MultiSelect } from "@/components/hub/multi-select"
import { EntityPicker } from "@/components/hub/collections/entity-picker"
import { endpointForEntity, isEntityEditType } from "@/components/hub/metafields/metafield-utils"
import { hasChildren } from "@/components/hub/metafields/metafield-utils"
import { isFieldVisible } from "@/components/hub/metafields/metafield-visibility"
import { imgUrl } from "@/Server"

// ---------------------------------------------------------------------------
// Renders a metafield DEFINITION's fields[] tree as an actual VALUE form. The
// widget for each field is driven by its editType, required/label/tooltip come
// from settings, and Show On rules are evaluated live so dependent fields
// appear/disappear as their controlling field changes. `values` is a plain
// object keyed by field.key; `onChange` receives the next object.
// ---------------------------------------------------------------------------
export function MetafieldValuesForm({ definition, values, onChange }) {
  const fields = definition?.fields ?? []
  if (!fields.length) return null
  return <FieldList fields={fields} values={values ?? {}} onChange={onChange} idBase="mf" />
}

// A level of the tree (top-level, an object's children, or one array item).
function FieldList({ fields, values, onChange, idBase }) {
  const setValue = (key, v) => onChange({ ...values, [key]: v })
  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => {
        if (!isFieldVisible(field, values)) return null
        return (
          <FieldControl
            key={field.key}
            field={field}
            value={values[field.key]}
            onChange={(v) => setValue(field.key, v)}
            idBase={`${idBase}-${field.key}`}
          />
        )
      })}
    </div>
  )
}

// One field: a titled wrapper around the right widget (or a nested group /
// repeater for container types).
function FieldControl({ field, value, onChange, idBase }) {
  const s = field.settings ?? {}
  if (s.hidden || s.addHidden) return null

  const label = s.label?.trim() || field.label?.trim() || field.key
  const hint = s.tooltip?.trim() || s.description?.trim() || ""

  // ---- object → a bordered nested group of children ----
  if (field.dataType === "object") {
    return (
      <Group label={label} hint={hint} required={s.required}>
        <FieldList
          fields={field.children ?? []}
          values={value && typeof value === "object" ? value : {}}
          onChange={onChange}
          idBase={idBase}
        />
      </Group>
    )
  }

  // ---- array of objects → the "Add more records" repeater ----
  if (hasChildren(field) && field.dataType === "array") {
    return <ArrayObjectField field={field} value={value} onChange={onChange} idBase={idBase} label={label} hint={hint} />
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={idBase} className="text-sm">
        {label}
        {s.required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      <ScalarWidget field={field} value={value} onChange={onChange} idBase={idBase} />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

// The leaf input for a scalar field, chosen by editType (falling back to a
// sensible default per data type).
function ScalarWidget({ field, value, onChange, idBase }) {
  const et = field.editType
  const options = (field.settings?.options ?? []).map((o) => ({
    value: o.value || o.label,
    label: o.label || o.value,
  }))
  const disabled = Boolean(field.settings?.disabled || field.settings?.readOnly)

  // relation → searchable picker of another module's records. Only when the
  // field defines a valid Entity source; otherwise these edit types fall back
  // to their plain widget below (text / MultiSelect of options).
  if (isEntityEditType(et) && endpointForEntity(field.settings?.entity)) {
    return <EntityValueWidget field={field} value={value} onChange={onChange} disabled={disabled} />
  }

  // boolean toggle
  if (et === "checkbox" || field.dataType === "boolean") {
    return (
      <div className="flex h-9 items-center">
        <Switch id={idBase} checked={Boolean(value)} onCheckedChange={onChange} disabled={disabled} />
      </div>
    )
  }

  // multi-value
  if (et === "multiselect" || et === "multicheckbox" || et === "multiautocomplete") {
    // New saves are arrays; tolerate a legacy comma-string ("male,female")
    // from records written before the array fix so they still render selected.
    const selected = Array.isArray(value)
      ? value
      : typeof value === "string" && value.trim()
        ? value.split(",").map((v) => v.trim()).filter(Boolean)
        : []
    return (
      <MultiSelect
        options={options}
        selected={selected}
        onChange={onChange}
        placeholder="Select…"
        emptyText="No options"
      />
    )
  }

  // fixed choices
  if (et === "select" || et === "radio") {
    return (
      <Select value={value ?? ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={idBase} className="h-9">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  // long text / rich
  if (et === "textarea" || et === "html" || et === "code") {
    return (
      <Textarea
        id={idBase}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={et === "code" ? "font-mono text-xs" : undefined}
      />
    )
  }

  // numbers
  if (["number", "price", "weight", "length"].includes(et) || field.dataType === "integer" || field.dataType === "number") {
    return (
      <Input
        id={idBase}
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        disabled={disabled}
      />
    )
  }

  // dates
  if (et === "date") {
    return <Input id={idBase} type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
  }
  if (et === "datetime" || field.dataType === "datetime") {
    return <Input id={idBase} type="datetime-local" value={value ?? ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
  }

  // files / media — real upload (base64 data URL) plus a URL fallback
  if (["file", "createfile", "customfile", "video"].includes(et) || field.dataType === "file") {
    return <FileWidget field={field} value={value} onChange={onChange} idBase={idBase} disabled={disabled} />
  }

  // typed single-line text
  const type = et === "email" ? "email" : et === "phone" ? "tel" : et === "color" ? "color" : "text"
  return <Input id={idBase} type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
}

// Relation widget: wraps EntityPicker for autocomplete/category/collection
// fields. The stored VALUE is an id+name snapshot so it renders without a
// refetch — `{ id, name }` for single, `[{ id, name }]` for multiautocomplete.
// EntityPicker works in ids, so we translate on the way in and out.
function EntityValueWidget({ field, value, onChange, disabled }) {
  const multiple = field.editType === "multiautocomplete"
  const endpoint = endpointForEntity(field.settings?.entity)

  const idValue = multiple
    ? (Array.isArray(value) ? value.map((v) => (v && typeof v === "object" ? String(v.id) : String(v))) : [])
    : value && typeof value === "object"
      ? String(value.id ?? "")
      : (value ?? "")

  if (disabled) {
    const label = multiple
      ? (Array.isArray(value) ? value.map((v) => v?.name ?? v?.id ?? v).filter(Boolean).join(", ") : "")
      : value && typeof value === "object"
        ? (value.name ?? value.id ?? "")
        : (value ?? "")
    return (
      <div className="flex min-h-9 items-center rounded-md border border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        {label || "—"}
      </div>
    )
  }

  return (
    <EntityPicker
      endpoint={endpoint}
      multiple={multiple}
      value={idValue}
      onChange={(next, selectedOptions) => {
        if (multiple) {
          onChange((selectedOptions ?? []).map((o) => ({ id: o.value, name: o.label })))
        } else {
          const opt = selectedOptions?.[0]
          onChange(opt ? { id: opt.value, name: opt.label } : "")
        }
      }}
    />
  )
}

// File / image / video widget. Reuses the app's base64 pipeline: the chosen
// file is read into a data URL and stored as the field value (the backend's
// `file` coercion accepts a bare string and wraps it to { url }). A saved value
// comes back as { url } — we unwrap it for the preview. A URL can still be
// pasted directly for externally hosted assets.
function FileWidget({ field, value, onChange, idBase, disabled }) {
  const inputRef = useRef(null)
  const isVideo = field.editType === "video"
  const accept = isVideo
    ? "video/mp4,video/webm,video/quicktime,video/ogg"
    : "image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
  const maxBytes = isVideo ? 8 * 1024 * 1024 : 2 * 1024 * 1024

  // Value may be a plain URL / data-URL string or a saved { url, name } object.
  const url = value && typeof value === "object" ? value.url ?? "" : value ?? ""
  const name = value && typeof value === "object" ? value.name : undefined
  const isData = typeof url === "string" && url.startsWith("data:")
  const preview = url ? (isData ? url : imgUrl(url)) : null

  function readFile(file) {
    if (!file) return
    const okType = isVideo ? file.type.startsWith("video/") : file.type.startsWith("image/")
    if (!okType) {
      toast.error(isVideo ? "Please choose a video file" : "Please choose an image file")
      return
    }
    if (file.size > maxBytes) {
      toast.error(isVideo ? "Video too large (max 8 MB)" : "Image too large (max 2 MB)")
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result)
    reader.readAsDataURL(file)
  }

  const fileLabel = name || (isData ? `Uploaded ${isVideo ? "video" : "image"}` : url)

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept={accept}
      className="sr-only"
      disabled={disabled}
      onChange={(e) => {
        readFile(e.target.files?.[0])
        e.target.value = ""
      }}
      aria-label={`Upload ${field.label || field.key}`}
    />
  )

  // A file/URL is present — show the preview card with a remove control only.
  // The URL input is intentionally hidden here so there's no redundant field.
  if (url) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
        <div className="flex items-center justify-center bg-[repeating-conic-gradient(theme(colors.muted)_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] p-4">
          {isVideo ? (
            <video src={preview} controls className="max-h-40 max-w-full rounded-md" />
          ) : (
            <img
              src={preview || "/placeholder.svg"}
              alt=""
              className="max-h-40 max-w-full rounded-md object-contain"
            />
          )}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border bg-background px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{fileLabel}</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="size-3.5" aria-hidden="true" />
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive"
              onClick={() => onChange("")}
              disabled={disabled}
              aria-label="Remove file"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        {hiddenInput}
      </div>
    )
  }

  // Empty — a dropzone-style picker with a URL fallback for hosted assets.
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-background text-muted-foreground">
          <Upload className="size-4" aria-hidden="true" />
        </span>
        <span className="text-sm font-medium text-foreground">Choose File</span>
        <span className="text-xs text-muted-foreground">
          {isVideo ? "MP4, WebM up to 8 MB" : "PNG, JPG, WebP up to 2 MB"}
        </span>
      </button>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or paste a URL
        <span className="h-px flex-1 bg-border" />
      </div>
      <Input
        id={idBase}
        type="url"
        value=""
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://…"
        disabled={disabled}
      />
      {hiddenInput}
    </div>
  )
}

// Pull a displayable URL out of a child value that may be a plain string, a
// base64 data URL, or a saved { url } object.
function resolveImageSrc(v) {
  const raw = v && typeof v === "object" ? v.url : v
  if (!raw || typeof raw !== "string") return null
  return raw.startsWith("data:") ? raw : imgUrl(raw)
}

// Derive a table-row summary (thumbnail + text) for one array item, based on
// the field's children: first file/image child → thumbnail, first text-like
// child with a value → label.
function summarizeItem(children, item) {
  if (!item || typeof item !== "object") return { thumb: null, text: "" }
  let thumb = null
  let text = ""
  for (const c of children ?? []) {
    const val = item[c.key]
    const isFileType =
      ["file", "createfile", "customfile", "video"].includes(c.editType) || c.dataType === "file"
    if (!thumb && isFileType) thumb = resolveImageSrc(val)
    if (!text && !isFileType && typeof val === "string" && val.trim()) text = val.trim()
    if (!text && typeof val === "number") text = String(val)
  }
  return { thumb, text }
}

// The repeater for `array` of `object`. Added records show in a table (image
// summary + actions), and an "Add" button opens an inline form with Insert /
// Cancel — mirroring the legacy admin flow. `draft` holds the record being
// created/edited; committing writes back into the array via onChange.
function ArrayObjectField({ field, value, onChange, idBase, label, hint }) {
  const items = Array.isArray(value) ? value : []
  const children = field.children ?? []
  // editing === null: no form open. editing === -1: adding new. >=0: editing row.
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState({})

  const openAdd = () => {
    setDraft({})
    setEditing(-1)
  }
  const openEdit = (i) => {
    setDraft(items[i] && typeof items[i] === "object" ? items[i] : {})
    setEditing(i)
  }
  const cancel = () => {
    setEditing(null)
    setDraft({})
  }
  const commit = () => {
    if (editing === -1) onChange([...items, draft])
    else onChange(items.map((it, idx) => (idx === editing ? draft : it)))
    cancel()
  }
  const removeItem = (i) => {
    onChange(items.filter((_, idx) => idx !== i))
    if (editing === i) cancel()
  }

  return (
    <Group label={label} hint={hint} required={field.settings?.required}>
      <div className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            No records yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead className="w-16 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, i) => {
                  const { thumb, text } = summarizeItem(children, item)
                  return (
                    <TableRow key={i}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40">
                            {thumb ? (
                              <img src={thumb || "/placeholder.svg"} alt="" className="size-full object-cover" />
                            ) : (
                              <ImageIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                            )}
                          </span>
                          <span className="truncate text-sm text-foreground">
                            {text || <span className="text-muted-foreground">Record {i + 1}</span>}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground"
                              aria-label={`Actions for record ${i + 1}`}
                            >
                              <MoreVertical className="size-4" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(i)}>
                              <Pencil className="size-4" aria-hidden="true" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => removeItem(i)}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {editing !== null ? (
          <div className="flex flex-col gap-4 rounded-md border border-border bg-muted/20 p-4">
            <FieldList
              fields={children}
              values={draft && typeof draft === "object" ? draft : {}}
              onChange={setDraft}
              idBase={`${idBase}-draft`}
            />
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" onClick={commit}>
                {editing === -1 ? `Insert ${label}` : "Save changes"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={cancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" className="w-fit bg-transparent" onClick={openAdd}>
            <Plus className="size-3.5" aria-hidden="true" />
            Add {label}
          </Button>
        )}
      </div>
    </Group>
  )
}

// A bordered, titled container used for object groups and array repeaters.
function Group({ label, hint, required, children }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </span>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
    </div>
  )
}
