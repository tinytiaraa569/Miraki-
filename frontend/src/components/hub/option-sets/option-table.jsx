"use client"

import { useMemo, useState } from "react"
import { Copy, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OptionRowForm } from "@/components/hub/option-sets/option-row-form"
import { emptyValue, isValueBearing, typeLabel } from "@/components/hub/option-sets/option-set-utils"

/**
 * Nested Options table inside the editor (§10.5). This is a CLIENT-side TanStack
 * Table — the options live in the editor's form state, sorted by `sortOrder`, so
 * there is no server round trip until the whole set is saved. Add / Edit reuse
 * the inline OptionRowForm; the "Values" cell shows a count badge.
 */
export function OptionTable({ options, onChange }) {
  // Inline add/edit rows reuse OptionRowForm; options are sorted client-side.
  // null | "new" | <_key of the option being edited>
  const [editing, setEditing] = useState(null)

  function upsertOption(row) {
    const withKey = row._key ? row : { ...row, _key: crypto.randomUUID() }
    const exists = options.some((o) => o._key === withKey._key)
    onChange(exists ? options.map((o) => (o._key === withKey._key ? withKey : o)) : [...options, withKey])
    setEditing(null)
  }

  function removeOption(key) {
    onChange(options.filter((o) => o._key !== key))
    if (editing === key) setEditing(null)
  }

  function duplicateOption(opt) {
    const clone = {
      ...opt,
      _key: crypto.randomUUID(),
      name: `${opt.name}-copy`,
      values: (opt.values ?? []).map((v) => ({ ...emptyValue(), ...v, _key: crypto.randomUUID() })),
    }
    onChange([...options, clone])
  }

  const sorted = useMemo(
    () => [...options].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [options],
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Name</TableHead>
              <TableHead>Display name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Values</TableHead>
              <TableHead className="text-center">Required</TableHead>
              <TableHead className="text-center">Show always</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 && editing !== "new" ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                  No options yet. Add one to define the choices shoppers can pick.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((opt) =>
                editing === opt._key ? (
                  <TableRow key={opt._key} className="hover:bg-transparent">
                    <TableCell colSpan={7} className="p-3">
                      <OptionRowForm initial={opt} onSave={upsertOption} onCancel={() => setEditing(null)} />
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={opt._key} className="hover:bg-transparent">
                    <TableCell className="font-medium text-foreground">{opt.name}</TableCell>
                    <TableCell className="text-muted-foreground">{opt.displayName || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{typeLabel(opt.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      {isValueBearing(opt.type) ? (
                        <Badge variant="secondary">{opt.values?.length ?? 0}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">free text</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={opt.required} disabled aria-label="Required" className="mx-auto" />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={opt.showAlways} disabled aria-label="Show always" className="mx-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => setEditing(opt._key)} aria-label={`Edit ${opt.name}`}>
                          <Pencil className="size-4" aria-hidden="true" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => duplicateOption(opt)} aria-label={`Duplicate ${opt.name}`}>
                          <Copy className="size-4" aria-hidden="true" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="size-7 text-destructive" onClick={() => removeOption(opt._key)} aria-label={`Delete ${opt.name}`}>
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ),
              )
            )}

            {editing === "new" && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="p-3">
                  <OptionRowForm onSave={upsertOption} onCancel={() => setEditing(null)} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={editing === "new"}
        onClick={() => setEditing("new")}
      >
        <Plus className="size-3.5" aria-hidden="true" />
        Add option
      </Button>
    </div>
  )
}
