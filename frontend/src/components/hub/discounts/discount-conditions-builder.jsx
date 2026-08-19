"use client"

import { useEffect, useMemo, useState } from "react"
import { MoreVertical, Pencil, Trash2 } from "lucide-react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EntityPicker } from "@/components/hub/collections/entity-picker"
import { fetcher } from "@/lib/api"


const TEXT_OPERATORS = [
  { value: "eq", label: "Equal" },
  { value: "contains", label: "Contains" },
  { value: "in", label: "Is any of" },
]
const NUMBER_OPERATORS = [
  { value: "eq", label: "Equals" },
  { value: "gt", label: "Greater than" },
  { value: "gte", label: "Greater than or equal" },
  { value: "lt", label: "Less than" },
  { value: "lte", label: "Less than or equal" },
  { value: "between", label: "Between" },
]

const DEVICE_OPTIONS = [
  { value: "desktop", label: "Desktop" },
  { value: "mobile", label: "Mobile" },
  { value: "tablet", label: "Tablet" },
]


const ENTITY_ENDPOINTS = {
  categories: "/seller/discounts/options/categories",
  collections: "/seller/discounts/options/collections",
  brands: "/seller/discounts/options/brands",
  substores: "/seller/discounts/options/substores",
}


const FIELDS_BY_RULE = {
  product: [
    { value: "product_name", label: "Product name", kind: "text" },
    { value: "product_sku", label: "Product SKU", kind: "text" },
    { value: "product_quantity", label: "Product quantity", kind: "number" },
    { value: "categories_any", label: "Any product categories", kind: "entity", group: "categories", op: "in" },
    { value: "categories_every", label: "Every product categories", kind: "entity", group: "categories", op: "all" },
    { value: "collections_any", label: "Any item collections", kind: "entity", group: "collections", op: "in" },
    { value: "collections_every", label: "Every item collections", kind: "entity", group: "collections", op: "all" },
    { value: "brand_any", label: "Any product brand", kind: "entity", group: "brands", op: "in" },
    { value: "brand_every", label: "Every product brand", kind: "entity", group: "brands", op: "all" },
    { value: "device", label: "Device", kind: "device", op: "eq" },
    { value: "substore", label: "Substore", kind: "entity", group: "substores", op: "in" },
  ],
  order: [
    { value: "categories_any", label: "Any product categories", kind: "entity", group: "categories", op: "in" },
    { value: "collections_any", label: "Any item collections", kind: "entity", group: "collections", op: "in" },
    { value: "categories_every", label: "Every product categories", kind: "entity", group: "categories", op: "all" },
    { value: "collections_every", label: "Every item collections", kind: "entity", group: "collections", op: "all" },
    { value: "order_quantity", label: "Order quantity", kind: "number" },
    { value: "order_total", label: "Order total", kind: "number" },
    { value: "brand_every", label: "Every product brand", kind: "entity", group: "brands", op: "all" },
    { value: "brand_any", label: "Any product brand", kind: "entity", group: "brands", op: "in" },
    { value: "device", label: "Device", kind: "device", op: "eq" },
    { value: "substore", label: "Substore", kind: "entity", group: "substores", op: "in" },
  ],
}

// Flat lookups so rows can label any field/operator regardless of rule type.
const FIELD_LABEL = Object.fromEntries(
  Object.values(FIELDS_BY_RULE)
    .flat()
    .map((f) => [f.value, f.label]),
)
const OP_LABEL = Object.fromEntries([...TEXT_OPERATORS, ...NUMBER_OPERATORS].map((o) => [o.value, o.label]))
const DEVICE_LABEL = Object.fromEntries(DEVICE_OPTIONS.map((d) => [d.value, d.label]))

function operatorsFor(field) {
  if (field.kind === "number") return NUMBER_OPERATORS
  if (field.kind === "text") return TEXT_OPERATORS
  return [] // entity / device — operator is implicit
}

function defaultOperator(field) {
  if (field.kind === "entity" || field.kind === "device") return field.op
  return operatorsFor(field)[0].value
}

function defaultValue(field) {
  return field.kind === "entity" ? [] : ""
}

function makeDraft(field) {
  return { field: field.value, operator: defaultOperator(field), value: defaultValue(field) }
}

function splitList(raw) {
  return String(raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

// Does the draft carry a usable value for its field/operator?
function draftHasValue(draft, field) {
  if (field.kind === "entity") return Array.isArray(draft.value) && draft.value.length > 0
  return String(draft.value ?? "").trim() !== ""
}

// Coerce the draft into the { field, operator, value } shape the API expects.
function draftToItem(draft, field) {
  if (field.kind === "entity") {
    return { field: field.value, operator: field.op, value: Array.isArray(draft.value) ? draft.value : [] }
  }
  if (field.kind === "device") {
    return { field: field.value, operator: "eq", value: draft.value }
  }
  if (field.kind === "number") {
    if (draft.operator === "between") {
      return { field: field.value, operator: "between", value: splitList(draft.value).map(Number) }
    }
    return { field: field.value, operator: draft.operator, value: Number(draft.value) }
  }
  // text
  if (draft.operator === "in") {
    return { field: field.value, operator: "in", value: splitList(draft.value) }
  }
  return { field: field.value, operator: draft.operator, value: String(draft.value).trim() }
}

// Reverse of draftToItem: hydrate a saved { field, operator, value } back into an
// editable draft (arrays → comma-joined text for number/text inputs; entity/device
// values pass through). Used when a row's "Edit" action reopens the form.
function itemToDraft(item, field) {
  if (!field) return { field: item.field, operator: item.operator, value: item.value ?? "" }
  if (field.kind === "entity") {
    return {
      field: item.field,
      operator: field.op,
      value: Array.isArray(item.value) ? item.value : item.value ? [item.value] : [],
    }
  }
  if (field.kind === "device") {
    return { field: item.field, operator: "eq", value: item.value ?? "" }
  }
  if (field.kind === "number" && item.operator === "between") {
    return {
      field: item.field,
      operator: "between",
      value: Array.isArray(item.value) ? item.value.join(", ") : String(item.value ?? ""),
    }
  }
  if (field.kind === "text" && item.operator === "in") {
    return {
      field: item.field,
      operator: "in",
      value: Array.isArray(item.value) ? item.value.join(", ") : String(item.value ?? ""),
    }
  }
  return { field: item.field, operator: item.operator, value: String(item.value ?? "") }
}

function valueText(item, labels) {
  const v = item.value
  if (Array.isArray(v)) return v.map((x) => labels[x] ?? DEVICE_LABEL[x] ?? x).join(", ")
  return String(labels[v] ?? DEVICE_LABEL[v] ?? v ?? "")
}

export function DiscountConditionsBuilder({ ruleType, value, onChange }) {
  const fields = FIELDS_BY_RULE[ruleType] ?? FIELDS_BY_RULE.product
  const match = value?.match ?? "all"
  const items = value?.items ?? []

  const [draft, setDraft] = useState(() => makeDraft(fields[0]))
  const [showForm, setShowForm] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null) // row being edited, or null
  const [labels, setLabels] = useState({}) // id → name, shared by picker + rows
  const [selected, setSelected] = useState(() => new Set()) // row checkboxes (visual)

  const fieldDesc = fields.find((f) => f.value === draft.field) ?? fields[0]
  const operators = operatorsFor(fieldDesc)
  const showOperator = operators.length > 0

  const mergeLabels = (map) => setLabels((prev) => ({ ...prev, ...map }))

  
  const idsByGroup = useMemo(() => {
    const out = { categories: [], collections: [], brands: [], substores: [] }
    for (const it of items) {
      const f = (FIELDS_BY_RULE[ruleType] ?? []).find((x) => x.value === it.field) ?? null
      if (!f || f.kind !== "entity") continue
      const vals = Array.isArray(it.value) ? it.value : it.value ? [it.value] : []
      out[f.group].push(...vals)
    }
    return {
      categories: [...new Set(out.categories)],
      collections: [...new Set(out.collections)],
      brands: [...new Set(out.brands)],
      substores: [...new Set(out.substores)],
    }
  }, [items, ruleType])

  const catRes = useSWR(
    idsByGroup.categories.length ? `${ENTITY_ENDPOINTS.categories}?ids=${idsByGroup.categories.join(",")}` : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const colRes = useSWR(
    idsByGroup.collections.length ? `${ENTITY_ENDPOINTS.collections}?ids=${idsByGroup.collections.join(",")}` : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const brandRes = useSWR(
    idsByGroup.brands.length ? `${ENTITY_ENDPOINTS.brands}?ids=${idsByGroup.brands.join(",")}` : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const subRes = useSWR(
    idsByGroup.substores.length ? `${ENTITY_ENDPOINTS.substores}?ids=${idsByGroup.substores.join(",")}` : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )

  useEffect(() => {
    const rows = [
      ...(catRes.data?.rows ?? []),
      ...(colRes.data?.rows ?? []),
      ...(brandRes.data?.rows ?? []),
      ...(subRes.data?.rows ?? []),
    ]
    if (!rows.length) return
    setLabels((prev) => {
      const next = { ...prev }
      for (const r of rows) next[String(r._id)] = r.name
      return next
    })
  }, [catRes.data, colRes.data, brandRes.data, subRes.data])

  function insertItem() {
    if (!draftHasValue(draft, fieldDesc)) return
    const nextItem = draftToItem(draft, fieldDesc)
    // Editing an existing row replaces it in place; otherwise append a new one.
    const nextItems =
      editingIndex !== null
        ? items.map((it, i) => (i === editingIndex ? nextItem : it))
        : [...items, nextItem]
    onChange({ match, items: nextItems })
    setDraft(makeDraft(fields[0]))
    setShowForm(false)
    setEditingIndex(null)
    setSelected(new Set())
  }
  function startEdit(index) {
    const it = items[index]
    const f = fields.find((x) => x.value === it.field) ?? fields[0]
    setDraft(itemToDraft(it, f))
    setEditingIndex(index)
    setShowForm(true)
  }
  function cancelForm() {
    setDraft(makeDraft(fields[0]))
    setShowForm(false)
    setEditingIndex(null)
  }
  function removeAt(index) {
    onChange({ match, items: items.filter((_, i) => i !== index) })
    setSelected(new Set())
    // Row indexes shift after a delete — cancel any in-progress edit to stay safe.
    if (editingIndex !== null) cancelForm()
  }
  function onFieldChange(nextValue) {
    const next = fields.find((f) => f.value === nextValue) ?? fields[0]
    setDraft(makeDraft(next))
  }
  function onOperatorChange(operator) {
    setDraft((d) => ({ ...d, operator, value: fieldDesc.kind === "entity" ? d.value : "" }))
  }
  function toggleRow(index) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }
  function toggleAll() {
    setSelected((prev) => (prev.size === items.length ? new Set() : new Set(items.map((_, i) => i))))
  }

  const allChecked = items.length > 0 && selected.size === items.length

  return (
    <div className="flex flex-col gap-3">
      {/* conditions table */}
      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground">
              <th className="w-10 px-3 py-2">
                <Checkbox checked={allChecked} onCheckedChange={toggleAll} aria-label="Select all conditions" />
              </th>
              <th className="px-3 py-2">Summary</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No conditions added.
                </td>
              </tr>
            ) : (
              items.map((it, index) => (
                <tr key={index} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 align-middle">
                    <Checkbox
                      checked={selected.has(index)}
                      onCheckedChange={() => toggleRow(index)}
                      aria-label={`Select condition ${index + 1}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                      <span className="font-medium text-foreground">{FIELD_LABEL[it.field] ?? it.field}</span>
                      <span className="text-muted-foreground">{OP_LABEL[it.operator] ?? it.operator}</span>
                      <span className="text-foreground">{valueText(it, labels) || "—"}</span>
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
                          <Pencil className="size-4" aria-hidden="true" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => removeAt(index)}>
                          <Trash2 className="size-4" aria-hidden="true" />
                          Delete
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

      {/* add-condition form / trigger */}
      {showForm ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <div className="grid grid-cols-[110px_1fr] items-center gap-3">
            <Label className="text-sm font-medium">
              Field <span className="text-destructive">*</span>
            </Label>
            <Select value={draft.field} onValueChange={onFieldChange}>
              <SelectTrigger aria-label="Condition field">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fields.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showOperator && (
            <div className="grid grid-cols-[110px_1fr] items-center gap-3">
              <Label className="text-sm font-medium">
                Operator <span className="text-destructive">*</span>
              </Label>
              <Select value={draft.operator} onValueChange={onOperatorChange}>
                <SelectTrigger aria-label="Condition operator">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-[110px_1fr] items-start gap-3">
            <Label className="pt-2 text-sm font-medium">
              Value <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-col gap-1.5">
              {fieldDesc.kind === "entity" ? (
                <EntityPicker
                  key={fieldDesc.value}
                  endpoint={ENTITY_ENDPOINTS[fieldDesc.group]}
                  multiple
                  value={draft.value}
                  onChange={(v) => setDraft((d) => ({ ...d, value: v }))}
                  onLabels={mergeLabels}
                  placeholder="Enter to Search Value"
                />
              ) : fieldDesc.kind === "device" ? (
                <Select value={draft.value || undefined} onValueChange={(v) => setDraft((d) => ({ ...d, value: v }))}>
                  <SelectTrigger aria-label="Device">
                    <SelectValue placeholder="Select device" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_OPTIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <>
                  <Input
                    type={fieldDesc.kind === "number" && draft.operator !== "between" ? "number" : "text"}
                    value={draft.value}
                    onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
                    placeholder={
                      draft.operator === "between"
                        ? "min, max (e.g. 1000, 5000)"
                        : draft.operator === "in"
                          ? "comma-separated values"
                          : fieldDesc.kind === "number"
                            ? "e.g. 2"
                            : "Enter value"
                    }
                  />
                  {(draft.operator === "between" || draft.operator === "in") && (
                    <p className="text-xs text-muted-foreground">
                      {draft.operator === "between"
                        ? "Enter two numbers: minimum, maximum."
                        : "Separate multiple values with commas."}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={insertItem} disabled={!draftHasValue(draft, fieldDesc)}>
              {editingIndex !== null ? "Update Condition" : "Insert Condition"}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={cancelForm}>
              Cancel
            </Button>
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
