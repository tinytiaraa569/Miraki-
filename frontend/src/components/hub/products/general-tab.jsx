"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { ChevronRight, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { fetcher } from "@/lib/api"
import { EntityPicker } from "@/components/hub/collections/entity-picker"
import { MetafieldValuesForm } from "@/components/hub/metafields/metafield-values-form"
import { ImageGallery } from "./image-gallery"
import { CategoryPicker } from "./category-picker"

/**
 * General tab (screens 1 & 2). Field → schema map per plan C.6. Every relation
 * control is id-valued (Collections / Brand / Substore / Categories store
 * ObjectId strings) and caches labels through the shared `mergeLabels`.
 * The Product Specifications card renders below the field grid (C.7).
 */

const WEIGHT_UNITS = ["gm", "kg", "ct", "oz", "lb"]
const TAX_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "none", label: "No Tax" },
]
const VARIANT_HINT = "This field is editable at variants level."

// A label + control row that mirrors the StoreHippo two-column layout.
function Field({ label, htmlFor, required, hint, children }) {
  return (
    <div className="grid grid-cols-1 gap-2 py-3 md:grid-cols-[180px_1fr] md:gap-6">
      <Label htmlFor={htmlFor} className="pt-2 text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      <div className="flex flex-col gap-1.5">
        {children}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}

export function GeneralTab({ draft, setField, labelCache, mergeLabels, mfDefinition, mfValues, setMfValues }) {
  const [catPickerOpen, setCatPickerOpen] = useState(false)
  const [aliasFromName, setAliasFromName] = useState(false)

  const categoryIds = draft.categoryIds ?? []

  // Resolve names for any saved category ids that aren't in the label cache yet
  // (an existing product loads bare ObjectIds — the picker only caches names it
  // has already seen). Falls back to a flat name chip when there's no cached path.
  const unresolvedCatIds = categoryIds.filter((id) => !labelCache[id])
  const { data: catLabelData } = useSWR(
    unresolvedCatIds.length ? `/seller/categories/options?ids=${unresolvedCatIds.join(",")}` : null,
    fetcher,
    { revalidateOnFocus: false },
  )
  useEffect(() => {
    if (catLabelData?.rows?.length) {
      // Cache the full ancestor path (root -> self) so saved categories render
      // as a breadcrumb, matching the picker. Falls back to the flat name.
      mergeLabels(
        Object.fromEntries(
          catLabelData.rows.map((r) => [
            String(r._id),
            Array.isArray(r.path) && r.path.length ? r.path : r.name,
          ]),
        ),
      )
    }
  }, [catLabelData, mergeLabels])

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-border bg-card p-5">
        <Field label="Name" htmlFor="p-name" required>
          <Input
            id="p-name"
            value={draft.name}
            onChange={(e) => {
              setField("name", e.target.value)
              if (aliasFromName) {
                setField(
                  "alias",
                  e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
                )
              }
            }}
            placeholder="Product name"
          />
        </Field>

        <Field label="Alias" htmlFor="p-alias">
          <Input
            id="p-alias"
            value={draft.alias}
            onChange={(e) => setField("alias", e.target.value)}
            placeholder="auto-generated-from-name"
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={aliasFromName} onCheckedChange={(v) => setAliasFromName(Boolean(v))} />
            Update alias to match the new name
          </label>
        </Field>

        <Field label="Description" htmlFor="p-desc">
          <RichTextEditor
            id="p-desc"
            value={draft.description ?? ""}
            onChange={(html) => setField("description", html)}
            placeholder="Describe the product…"
          />
        </Field>

        <Field label="Images">
          <ImageGallery value={draft.images ?? []} onChange={(v) => setField("images", v)} />
        </Field>

        <Field label="Price" htmlFor="p-price" required hint={`This will be the default price. ${VARIANT_HINT}`}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <Input
              id="p-price"
              type="number"
              min={0}
              value={draft.price}
              onChange={(e) => setField("price", e.target.value)}
              className="pl-7"
              placeholder="0"
            />
          </div>
        </Field>

        <Field label="Compare Price" htmlFor="p-compare" hint={VARIANT_HINT}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <Input
              id="p-compare"
              type="number"
              min={0}
              value={draft.comparePrice ?? ""}
              onChange={(e) => setField("comparePrice", e.target.value)}
              className="pl-7"
              placeholder="0"
            />
          </div>
        </Field>

        <Field label="Collections">
          <EntityPicker
            endpoint="/seller/collections/options"
            multiple
            value={draft.collectionIds ?? []}
            onChange={(ids) => setField("collectionIds", ids)}
            onLabels={mergeLabels}
            placeholder="Enter to Search Collection"
          />
        </Field>

        <Field label="Brand">
          <EntityPicker
            endpoint="/seller/brands/options"
            value={draft.brandId ?? ""}
            onChange={(id) => setField("brandId", id || null)}
            onLabels={mergeLabels}
            placeholder="Enter to Search Brand"
          />
        </Field>

        <Field label="SKU" htmlFor="p-sku" hint={VARIANT_HINT}>
          <Input
            id="p-sku"
            value={draft.sku ?? ""}
            onChange={(e) => setField("sku", e.target.value)}
            placeholder="Stock keeping unit"
          />
        </Field>

        <Field label="Categories">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1.5">
              {categoryIds.length === 0 ? (
                <span className="pt-1.5 text-sm text-muted-foreground">No categories selected.</span>
              ) : (
                categoryIds
                  .map((id) => {
                    const label = labelCache[id]
                    return { id, segments: Array.isArray(label) ? label : [label ?? id] }
                  })
                  // Hide entries whose path is a prefix of a deeper selected path
                  // (e.g. drop "uhra" when "uhra > fdfsdf" is also selected).
                  .filter(({ segments }, _idx, all) =>
                    !all.some(
                      (other) =>
                        other.segments.length > segments.length &&
                        segments.every((seg, i) => other.segments[i] === seg),
                    ),
                  )
                  .map(({ id, segments }) => {
                  return (
                    <div key={id} className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm">
                      {segments.map((seg, i) => (
                        <span key={i} className="flex items-center gap-1.5">
                          {i > 0 && (
                            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                          )}
                          <span
                            className={
                              i === segments.length - 1
                                ? "font-medium text-foreground"
                                : "text-muted-foreground"
                            }
                          >
                            {seg}
                          </span>
                        </span>
                      ))}
                    </div>
                  )
                })
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => setCatPickerOpen(true)}
              aria-label="Edit categories"
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </Field>

        <Field label="Weight" htmlFor="p-weight" hint={VARIANT_HINT}>
          <div className="flex gap-2">
            <Input
              id="p-weight"
              type="number"
              min={0}
              value={draft.weight ?? ""}
              onChange={(e) => setField("weight", e.target.value)}
              placeholder="0"
              className="flex-1"
            />
            <Select value={draft.weightUnit} onValueChange={(v) => setField("weightUnit", v)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEIGHT_UNITS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Field>

        <Field label="Tax" hint="Default Tax is Miraki Tax Rules">
          <Select value={draft.tax} onValueChange={(v) => setField("tax", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAX_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Publish">
          <Switch
            checked={Boolean(draft.isPublished)}
            onCheckedChange={(v) => setField("isPublished", v)}
            aria-label="Publish this product"
          />
        </Field>

        <Field label="Sort Order" htmlFor="p-sort">
          <Input
            id="p-sort"
            type="number"
            value={draft.sortOrder}
            onChange={(e) => setField("sortOrder", e.target.value)}
          />
        </Field>

        <Field label="Tag" htmlFor="p-tag" hint={VARIANT_HINT}>
          <Input
            id="p-tag"
            value={draft.tag ?? ""}
            onChange={(e) => setField("tag", e.target.value)}
            placeholder="Single tag"
          />
        </Field>

        <Field label="Metafields">
          {mfDefinition?.fields?.length ? (
            <MetafieldValuesForm definition={mfDefinition} values={mfValues ?? {}} onChange={setMfValues} />
          ) : (
            <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
              No metafields are defined for products yet. Define fields for the{" "}
              <span className="font-medium text-foreground">products</span> module under Metafields, and they will
              appear here.
            </p>
          )}
        </Field>

        <Field label="Substore">
          <EntityPicker
            endpoint="/seller/substores/options"
            multiple
            value={draft.substoreIds ?? []}
            onChange={(ids) => setField("substoreIds", ids)}
            onLabels={mergeLabels}
            placeholder="Empty = All substores"
          />
        </Field>
      </section>

      <CategoryPicker
        open={catPickerOpen}
        onOpenChange={setCatPickerOpen}
        value={categoryIds}
        onChange={(ids) => setField("categoryIds", ids)}
        onLabels={mergeLabels}
      />
    </div>
  )
}

