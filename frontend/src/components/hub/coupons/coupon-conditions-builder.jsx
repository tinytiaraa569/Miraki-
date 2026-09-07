"use client"

import { useState } from "react"
import { MoreVertical, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CouponEntityPicker } from "./coupon-entity-picker"
import { CategoryTreeField } from "./category-tree-picker"


const NUMERIC_OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "greaterThan", label: "Greater than" },
  { value: "lessThan", label: "Less than" },
]
const ENTITY_OPERATORS = [
  { value: "contains", label: "Contains" },
  { value: "notContains", label: "Does not contain" },
  { value: "equals", label: "Equals" },
  { value: "notEquals", label: "Not equals" },
]
const FIELDS = [
  { value: "cart_total", label: "Cart total", kind: "number" },
  { value: "cart_item_count", label: "Cart item count", kind: "number" },
  { value: "product_quantity", label: "Product quantity", kind: "number" },
  { value: "product", label: "Product", kind: "entity" },
  { value: "category", label: "Category", kind: "entity" },
  { value: "collection", label: "Collection", kind: "entity" },
  { value: "brand", label: "Brand", kind: "entity" },
]
const FIELD_LABEL = Object.fromEntries(FIELDS.map((f) => [f.value, f.label]))
const OP_LABEL = Object.fromEntries([...NUMERIC_OPERATORS, ...ENTITY_OPERATORS].map((o) => [o.value, o.label]))

const operatorsFor = (field) => (field.kind === "number" ? NUMERIC_OPERATORS : ENTITY_OPERATORS)
const makeDraft = (field) => ({ field: field.value, operator: operatorsFor(field)[0].value, value: field.kind === "number" ? "" : [] })
const draftHasValue = (draft, field) => (field.kind === "number" ? String(draft.value).trim() !== "" : draft.value.length > 0)

function draftToCondition(draft, field) {
  if (field.kind === "number") return { field: field.value, operator: draft.operator, values: [{ name: String(Number(draft.value)) }] }
  return { field: field.value, operator: draft.operator, values: draft.value.map((v) => ({ id: v.id, name: v.name })) }
}
function conditionToDraft(cond, field) {
  if (field.kind === "number") return { field: cond.field, operator: cond.operator, value: cond.values?.[0]?.name ?? "" }
  return { field: cond.field, operator: cond.operator, value: (cond.values ?? []).map((v) => ({ id: v.id, name: v.name })) }
}
const valueText = (cond) => (Array.isArray(cond.values) ? cond.values.map((v) => v.name).join(", ") : "") || "—"


export function CouponConditionsBuilder({ value, onChange }) {
  const conditions = value ?? []
  const [draft, setDraft] = useState(() => makeDraft(FIELDS[0]))
  const [showForm, setShowForm] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [categoryLabels, setCategoryLabels] = useState({})

  const fieldDesc = FIELDS.find((f) => f.value === draft.field) ?? FIELDS[0]
  const operators = operatorsFor(fieldDesc)

  function insert() {
    if (!draftHasValue(draft, fieldDesc)) return
    const next = draftToCondition(draft, fieldDesc)
    onChange(editingIndex !== null ? conditions.map((c, i) => (i === editingIndex ? next : c)) : [...conditions, next])
    cancelForm()
  }
  function startEdit(index) {
    const cond = conditions[index]
    const field = FIELDS.find((f) => f.value === cond.field) ?? FIELDS[0]
    const nextDraft = conditionToDraft(cond, field)
    setDraft(nextDraft)
    if (field.value === "category") {
      setCategoryLabels(Object.fromEntries(nextDraft.value.map((v) => [String(v.id), v.name])))
    }
    setEditingIndex(index)
    setShowForm(true)
  }
  function cancelForm() {
    setDraft(makeDraft(FIELDS[0]))
    setCategoryLabels({})
    setShowForm(false)
    setEditingIndex(null)
  }
  function removeAt(index) {
    onChange(conditions.filter((_, i) => i !== index))
    if (editingIndex !== null) cancelForm()
  }
  function onFieldChange(nextValue) {
    setDraft(makeDraft(FIELDS.find((f) => f.value === nextValue) ?? FIELDS[0]))
    setCategoryLabels({})
  }


  function handleCategoryIdsChange(nextIds) {
    setDraft((d) => ({
      ...d,
      value: nextIds.map((id) => ({ id, name: categoryLabels[id] ?? id })),
    }))
  }
  function handleCategoryLabels(partial) {
    setCategoryLabels((prev) => {
      const merged = { ...prev }
      for (const [id, path] of Object.entries(partial)) {
        merged[id] = Array.isArray(path) ? path[path.length - 1] : path
      }
      setDraft((d) => ({
        ...d,
        value: d.value.map((v) => ({ id: v.id, name: merged[v.id] ?? v.name })),
      }))
      return merged
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground">
              <th className="px-3 py-2">Summary</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {conditions.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No conditions added. This coupon applies to every eligible cart.
                </td>
              </tr>
            ) : (
              conditions.map((cond, index) => (
                <tr key={index} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                      <span className="font-medium text-foreground">{FIELD_LABEL[cond.field] ?? cond.field}</span>
                      <span className="text-muted-foreground">{OP_LABEL[cond.operator] ?? cond.operator}</span>
                      <span className="text-foreground">{valueText(cond)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7" aria-label={`Actions for condition ${index + 1}`}>
                          <MoreVertical className="size-4" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(index)}>
                          <Pencil className="size-4" aria-hidden="true" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => removeAt(index)}>
                          <Trash2 className="size-4" aria-hidden="true" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <div className="grid grid-cols-[110px_1fr] items-center gap-3">
            <Label className="text-sm font-medium">Field <span className="text-destructive">*</span></Label>
            <Select value={draft.field} onValueChange={onFieldChange}>
              <SelectTrigger aria-label="Condition field"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIELDS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[110px_1fr] items-center gap-3">
            <Label className="text-sm font-medium">Operator <span className="text-destructive">*</span></Label>
            <Select value={draft.operator} onValueChange={(v) => setDraft((d) => ({ ...d, operator: v }))}>
              <SelectTrigger aria-label="Condition operator"><SelectValue /></SelectTrigger>
              <SelectContent>
                {operators.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[110px_1fr] items-start gap-3">
            <Label className="pt-2 text-sm font-medium">Value <span className="text-destructive">*</span></Label>
            {fieldDesc.kind === "entity" ? (
              fieldDesc.value === "category" ? (
                <CategoryTreeField
                  key={fieldDesc.value}
                  selectedIds={draft.value.map((v) => String(v.id))}
                  onChange={handleCategoryIdsChange}
                  onLabels={handleCategoryLabels}
                  placeholder="Select categories"
                />
              ) : (
                <CouponEntityPicker
                  key={fieldDesc.value}
                  entity={fieldDesc.value}
                  value={draft.value}
                  onChange={(v) => setDraft((d) => ({ ...d, value: v }))}
                  placeholder={`Select ${fieldDesc.label.toLowerCase()}`}
                />
              )
            ) : (
              <Input
                type="number"
                value={draft.value}
                onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
                placeholder="e.g. 500"
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={insert} disabled={!draftHasValue(draft, fieldDesc)}>
              {editingIndex !== null ? "Update Condition" : "Insert Condition"}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={cancelForm}>Cancel</Button>
          </div>
        </div>
      ) : (
        <Button type="button" size="sm" variant="secondary" className="w-fit" onClick={() => setShowForm(true)}>
          Add Condition
        </Button>
      )}
    </div>
  )
}