"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Trash2, X } from "lucide-react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EntityPicker } from "@/components/hub/collections/entity-picker"
import { fetcher } from "@/lib/api"
import { cn } from "@/lib/utils"

// The dynamic filter builder (Field → Operator → Value → Insert Filter), matching
// the StoreHippo "Filters" dialog. Each row is a (field, operator, value) triple
// that the backend rule-compiler turns into a Mongo $match. `match` (all/any) is
// AND/OR across the rows.

const FIELD_OPTIONS = [
  { value: "price", label: "Price" },
  { value: "brand", label: "Brand" },
  { value: "categories", label: "Categories" },
  { value: "option", label: "Product Options" },
]

// Operators offered per field — mirrors the whitelist in collection.validation.js.
const OPERATORS_BY_FIELD = {
  price: [
    { value: "eq", label: "Equals" },
    { value: "ne", label: "Not equals" },
    { value: "gt", label: "Greater than" },
    { value: "gte", label: "Greater than or equal" },
    { value: "lt", label: "Less than" },
    { value: "lte", label: "Less than or equal" },
    { value: "between", label: "Between" },
  ],
  brand: [
    { value: "eq", label: "Equals" },
    { value: "ne", label: "Not equals" },
    { value: "in", label: "Is any of" },
    { value: "nin", label: "Is none of" },
  ],
  categories: [
    { value: "in", label: "In any of" },
    { value: "nin", label: "In none of" },
    { value: "contains_all", label: "Contains all of" },
  ],
  option: [
    { value: "eq", label: "Equals" },
    { value: "ne", label: "Not equals" },
    { value: "in", label: "Is any of" },
    { value: "contains", label: "Contains" },
  ],
}

const FIELD_LABEL = Object.fromEntries(FIELD_OPTIONS.map((f) => [f.value, f.label]))
const OP_LABEL = Object.fromEntries(
  Object.values(OPERATORS_BY_FIELD)
    .flat()
    .map((o) => [o.value, o.label]),
)

// Operators whose value is a LIST (comma-separated in a text input).
const ARRAY_OPERATORS = new Set(["in", "nin", "contains_all", "between"])

// Brand / Categories are resolved from real records via a searchable picker
// (the value stored is the record's ObjectId, not free text).
const ENTITY_ENDPOINTS = {
  brand: "/seller/brands/options",
  categories: "/seller/categories/options",
}
const isEntityField = (field) => field === "brand" || field === "categories"

// Whether the chosen field+operator selects MULTIPLE values.
function isMultiValue(field, operator) {
  if (field === "categories") return true // in / nin / contains_all
  if (field === "brand") return operator === "in" || operator === "nin"
  return ARRAY_OPERATORS.has(operator) // price between / in
}

// Default (empty) value for a field+operator combo.
function defaultValueFor(field, operator) {
  if (isEntityField(field)) return isMultiValue(field, operator) ? [] : ""
  return ""
}

function EMPTY_DRAFT() {
  return { field: "price", operator: "eq", optionKey: "", value: "" }
}

// Human-readable value for a stored condition, resolving ids → names when known.
function valueToText(condition, labels) {
  const v = condition.value
  if (Array.isArray(v)) return v.map((x) => labels[x] ?? x).join(", ")
  if (v === null || v === undefined || v === "") return ""
  return String(labels[v] ?? v)
}

// Human-readable summary of a stored condition, e.g. `Brand · Equals · Nike`.
function summarize(condition, labels) {
  const field = FIELD_LABEL[condition.field] ?? condition.field
  const op = OP_LABEL[condition.operator] ?? condition.operator
  const key = condition.field === "option" && condition.optionKey ? ` (${condition.optionKey})` : ""
  return `${field}${key} · ${op} · ${valueToText(condition, labels) || "—"}`
}

// Coerce the draft into the shape the API expects for this field/operator.
function draftToCondition(draft) {
  if (isEntityField(draft.field)) {
    const multi = isMultiValue(draft.field, draft.operator)
    const value = multi ? (Array.isArray(draft.value) ? draft.value : []) : draft.value
    return { field: draft.field, operator: draft.operator, value }
  }

  const isArray = ARRAY_OPERATORS.has(draft.operator)
  const raw = String(draft.value ?? "").trim()
  let value
  if (isArray) {
    value = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (draft.field === "price" && !Number.isNaN(Number(s)) ? Number(s) : s))
  } else if (draft.field === "price" && raw !== "" && !Number.isNaN(Number(raw))) {
    value = Number(raw)
  } else {
    value = raw
  }
  const condition = { field: draft.field, operator: draft.operator, value }
  if (draft.field === "option") condition.optionKey = draft.optionKey.trim() || null
  return condition
}

// Does the draft carry a usable value for its field/operator?
function draftHasValue(draft) {
  if (isEntityField(draft.field)) {
    return isMultiValue(draft.field, draft.operator)
      ? Array.isArray(draft.value) && draft.value.length > 0
      : Boolean(draft.value)
  }
  return String(draft.value ?? "").trim() !== "" || draft.operator === "ne"
}

export function RuleBuilder({ rules, onChange, preview }) {
  const match = rules?.match ?? "all"
  const conditions = rules?.conditions ?? []
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [showForm, setShowForm] = useState(conditions.length === 0)
  // id → human label cache, shared by the picker and the condition summaries.
  const [labels, setLabels] = useState({})

  const operators = OPERATORS_BY_FIELD[draft.field] ?? []
  const valueIsList = ARRAY_OPERATORS.has(draft.operator)
  const draftMulti = isMultiValue(draft.field, draft.operator)

  const mergeLabels = (map) => setLabels((prev) => ({ ...prev, ...map }))

  // Resolve labels for ids already referenced by saved conditions so their
  // summaries read as names, not raw ObjectIds.
  const idsByField = useMemo(() => {
    const out = { brand: [], categories: [] }
    for (const c of conditions) {
      if (!isEntityField(c.field)) continue
      const vals = Array.isArray(c.value) ? c.value : c.value ? [c.value] : []
      out[c.field].push(...vals)
    }
    return { brand: [...new Set(out.brand)], categories: [...new Set(out.categories)] }
  }, [conditions])

  const { data: brandLabelData } = useSWR(
    idsByField.brand.length ? `${ENTITY_ENDPOINTS.brand}?ids=${idsByField.brand.join(",")}` : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )
  const { data: categoryLabelData } = useSWR(
    idsByField.categories.length ? `${ENTITY_ENDPOINTS.categories}?ids=${idsByField.categories.join(",")}` : null,
    fetcher,
    { revalidateOnFocus: false, shouldRetryOnError: false },
  )

  useEffect(() => {
    const rows = [...(brandLabelData?.rows ?? []), ...(categoryLabelData?.rows ?? [])]
    if (!rows.length) return
    setLabels((prev) => {
      const next = { ...prev }
      for (const r of rows) next[String(r._id)] = r.name
      return next
    })
  }, [brandLabelData, categoryLabelData])

  function setMatch(next) {
    onChange({ match: next, conditions })
  }

  function insertFilter() {
    if (!draftHasValue(draft)) return
    onChange({ match, conditions: [...conditions, draftToCondition(draft)] })
    setDraft(EMPTY_DRAFT())
    setShowForm(false)
  }

  function removeAt(index) {
    onChange({ match, conditions: conditions.filter((_, i) => i !== index) })
  }

  function onFieldChange(field) {
    // Reset the operator to the first valid one for the newly chosen field.
    const nextOp = OPERATORS_BY_FIELD[field]?.[0]?.value ?? "eq"
    setDraft((d) => ({ ...d, field, operator: nextOp, optionKey: "", value: defaultValueFor(field, nextOp) }))
  }

  function onOperatorChange(operator) {
    // Switching between single/multi (e.g. Brand Equals ⇄ Is any of) resets the value.
    setDraft((d) => ({ ...d, operator, value: defaultValueFor(d.field, operator) }))
  }

  return (
    <div className="flex flex-col gap-4">
      {/* match all / any */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Products must match</span>
        <Select value={match} onValueChange={setMatch}>
          <SelectTrigger className="h-8 w-28" aria-label="Match mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">all</SelectItem>
            <SelectItem value="any">any</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">of these filters</span>
      </div>

      {/* existing conditions */}
      {conditions.length > 0 && (
        <ul className="flex flex-col gap-2">
          {conditions.map((c, index) => (
            <li
              key={index}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2"
            >
              <span className="truncate text-sm text-foreground">{summarize(c, labels)}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeAt(index)}
                aria-label={`Remove filter ${index + 1}`}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* live "N products match" indicator */}
      {preview && (
        <p className={cn("text-sm", preview.pending ? "text-muted-foreground" : "text-foreground")}>
          {preview.pending
            ? "Product matching activates once the Products module is added."
            : `${preview.count} product${preview.count === 1 ? "" : "s"} match these filters.`}
        </p>
      )}

      {/* add-filter form */}
      {showForm ? (
        <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium">
                Field <span className="text-destructive">*</span>
              </Label>
              <Select value={draft.field} onValueChange={onFieldChange}>
                <SelectTrigger aria-label="Filter field">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium">Operator</Label>
              <Select value={draft.operator} onValueChange={onOperatorChange}>
                <SelectTrigger aria-label="Filter operator">
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
          </div>

          {draft.field === "option" && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-medium">Option key</Label>
              <Input
                value={draft.optionKey}
                onChange={(e) => setDraft((d) => ({ ...d, optionKey: e.target.value }))}
                placeholder="e.g. metal"
                maxLength={80}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">Value</Label>
            {isEntityField(draft.field) ? (
              <EntityPicker
                key={`${draft.field}-${draftMulti ? "multi" : "single"}`}
                endpoint={ENTITY_ENDPOINTS[draft.field]}
                multiple={draftMulti}
                value={draft.value}
                onChange={(value) => setDraft((d) => ({ ...d, value }))}
                onLabels={mergeLabels}
                placeholder={draft.field === "brand" ? "Enter to Search Value" : "Search categories"}
              />
            ) : (
              <>
                <Input
                  value={draft.value}
                  onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
                  placeholder={
                    valueIsList
                      ? draft.operator === "between"
                        ? "min, max (e.g. 1000, 5000)"
                        : "comma-separated values"
                      : draft.field === "price"
                        ? "e.g. 5000"
                        : "Enter value"
                  }
                />
                {valueIsList && (
                  <p className="text-xs text-muted-foreground">
                    {draft.operator === "between"
                      ? "Enter two numbers: minimum, maximum."
                      : "Separate multiple values with commas."}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={insertFilter} disabled={!draftHasValue(draft)}>
              <Plus className="size-3.5" aria-hidden="true" />
              Insert Filter
            </Button>
            {conditions.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(EMPTY_DRAFT())
                  setShowForm(false)
                }}
              >
                <X className="size-3.5" aria-hidden="true" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" className="w-fit bg-transparent" onClick={() => setShowForm(true)}>
          <Plus className="size-3.5" aria-hidden="true" />
          Add filter
        </Button>
      )}
    </div>
  )
}
