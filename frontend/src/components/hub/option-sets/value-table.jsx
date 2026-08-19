"use client"

import { useState } from "react"
import { Pencil, Plus, Star, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ValueRowForm } from "@/components/hub/option-sets/value-row-form"
import { imgUrl } from "@/Server"

/**
 * Per-option Values grid (§10.6): Label | Value | Image | Actions. The Image
 * column only appears for `type === "image"`. Values live in the editor's form
 * state (no server round trip until Save), so this is a plain controlled list —
 * the "Add value" builder appends to `values`, and the per-row Edit button
 * re-opens the same builder to update an existing value in place (matched by its
 * stable `_key`).
 */
export function ValueTable({ isImage, values, onChange }) {
  // null | "new" | <_key of the value being edited>
  const [editing, setEditing] = useState(null)

  // Add (new row) OR update (existing row, matched by _key). Setting a default
  // clears the flag on the others so there is only ever one default.
  function upsertValue(row) {
    const withKey = row._key ? row : { ...row, _key: crypto.randomUUID() }
    const exists = values.some((v) => v._key === withKey._key)
    let next = exists ? values.map((v) => (v._key === withKey._key ? withKey : v)) : [...values, withKey]
    if (withKey.isDefault) next = next.map((v) => (v._key === withKey._key ? v : { ...v, isDefault: false }))
    onChange(next)
    setEditing(null)
  }

  function removeValue(key) {
    onChange(values.filter((v) => v._key !== key))
    if (editing === key) setEditing(null)
  }

  function toggleDefault(key) {
    onChange(values.map((v) => ({ ...v, isDefault: v._key === key ? !v.isDefault : false })))
  }

  const colSpan = isImage ? 4 : 3

  return (
    <div className="flex flex-col gap-3">
      {values.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-muted/40 hover:bg-muted/40">
                <TableHead className="h-9 text-xs font-medium uppercase tracking-wide">Label</TableHead>
                <TableHead className="h-9 text-xs font-medium uppercase tracking-wide">Value</TableHead>
                {isImage && <TableHead className="h-9 w-16 text-xs font-medium uppercase tracking-wide">Image</TableHead>}
                <TableHead className="h-9 w-28 text-right text-xs font-medium uppercase tracking-wide">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {values.map((val) =>
                editing === val._key ? (
                  <TableRow key={val._key} className="hover:bg-transparent">
                    <TableCell colSpan={colSpan} className="p-2">
                      <ValueRowForm
                        isImage={isImage}
                        initialValue={val}
                        onAdd={upsertValue}
                        onCancel={() => setEditing(null)}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  <ValueDisplayRow
                    key={val._key}
                    val={val}
                    isImage={isImage}
                    onEdit={() => setEditing(val._key)}
                    onToggleDefault={() => toggleDefault(val._key)}
                    onRemove={() => removeValue(val._key)}
                  />
                ),
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {editing === "new" ? (
        <ValueRowForm isImage={isImage} onAdd={upsertValue} onCancel={() => setEditing(null)} />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          disabled={editing !== null}
          onClick={() => setEditing("new")}
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Add value
        </Button>
      )}
    </div>
  )
}

function ValueDisplayRow({ val, isImage, onEdit, onToggleDefault, onRemove }) {
  const preview = val.image?.dataUrl || (val.image?.url ? imgUrl(val.image.url) : null)
  return (
    <TableRow className="border-b last:border-0">
      <TableCell className="py-2 text-sm font-medium text-foreground">
        <span className="flex items-center gap-2">
          {val.label}
          {val.isDefault && (
            <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[10px]">
              <Star className="size-2.5" aria-hidden="true" /> Default
            </Badge>
          )}
        </span>
      </TableCell>
      <TableCell className="py-2 text-sm text-muted-foreground">{val.value}</TableCell>
      {isImage && (
        <TableCell className="py-2">
          {preview ? (
            <img src={preview || "/placeholder.svg"} alt="" className="size-8 rounded-md border border-border object-cover" />
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </TableCell>
      )}
      <TableCell className="py-2 text-right">
        <div className="flex justify-end gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onToggleDefault}
            aria-label={val.isDefault ? "Unset default" : "Set as default"}
          >
            <Star className={val.isDefault ? "size-3.5 fill-primary text-primary" : "size-3.5"} aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onEdit}
            aria-label={`Edit ${val.label}`}
          >
            <Pencil className="size-3.5" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            aria-label={`Remove ${val.label}`}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
