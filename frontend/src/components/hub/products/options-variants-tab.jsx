"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Boxes, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { EntityPicker } from "@/components/hub/collections/entity-picker"
import { api } from "@/lib/api"
import { EditorField } from "./editor-field"
import { OptionSnapshotEditor } from "./option-snapshot-editor"
import { isValueBearing } from "@/components/hub/option-sets/option-set-utils"

/**
 * Build the generation matrix { optionName: [values] } from the product's
 * options. Only VALUE-BEARING options (dropdown / image / swatch / radio /
 * checkbox) with at least one value multiply the variant count; free-text
 * options (text / textarea / number) are filled in by the shopper at checkout
 * and never produce variant rows — so they are excluded here, matching the
 * backend cartesian generator. "Show always" options are storefront-only
 * add-ons (StoreHippo semantics): they are shown on the product page but must
 * NOT be baked into product-level variants, so they are excluded too.
 */
function buildVariantMatrix(options = []) {
  const matrix = {}
  for (const opt of options) {
    if (opt.showAlways) continue
    if (!isValueBearing(opt.type || "dropdown")) continue
    const values = (opt.values ?? [])
      .map((v) => (typeof v === "string" ? v : v.value))
      .filter(Boolean)
    if (values.length) matrix[opt.name] = values
  }
  return matrix
}

/**
 * Options & Variants tab (plan C.9, screen 7). The Option Set is REFERENCED
 * from the existing optionsets module — never re-modelled here. Attaching a set
 * copies its options directly into the product's `options[]`; the option rows
 * are then editable per-product (add / remove / reorder values, with image
 * swatches) without mutating the shared set. Variants are generated server-side
 * and edited on the separate Product Variants page.
 */
export function OptionsVariantsTab({ id, isCreate, draft, setField, mergeLabels }) {
  const [attaching, setAttaching] = useState(false)
  const [generating, setGenerating] = useState(false)

  const options = draft.options ?? []

  // Preview how many variants "Generate variants" will create: the Cartesian
  // product of every value-bearing option's value count. 0 means nothing to
  // generate (no value-bearing options, or one has no values yet).
  const matrix = buildVariantMatrix(options)
  const matrixNames = Object.keys(matrix)
  const projectedCount = matrixNames.length
    ? matrixNames.reduce((acc, n) => acc * matrix[n].length, 1)
    : 0
  // Free-text options excluded from variants (and not already excluded for
  // being show-always). Show-always options are counted separately below.
  const excludedTextOptions = options.filter(
    (o) => !o.showAlways && !isValueBearing(o.type || "dropdown"),
  ).length
  const showAlwaysOptions = options.filter((o) => o.showAlways).length

  async function attach(optionSetId) {
    setField("optionSetId", optionSetId || null)
    if (!optionSetId) {
      setField("options", [])
      return
    }
    setAttaching(true)
    try {
      // Always load the option set so its options render immediately — even in
      // create mode where there is no product yet to attach to server-side.
      // Copy the FULL option objects (type + value objects with images) straight
      // into the product's options[] so the editor shows swatches and the exact
      // data that will be persisted.
      const { optionSet } = await api.get(`/seller/option-sets/${optionSetId}`)
      setField("options", optionSet?.options ?? [])

      // Persist the attachment on the server once the product exists.
      if (!isCreate && id) {
        const { product } = await api.post(`/seller/products/${id}/attach-option-set`, { optionSetId })
        setField("options", product.options ?? [])
      }
      toast.success("Option set attached")
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAttaching(false)
    }
  }

  async function generate() {
    if (matrixNames.length === 0) {
      toast.error("Add at least one option with preset values to generate variants")
      return
    }
    setGenerating(true)
    try {
      // The backend requires the { name: [values] } matrix — build it from the
      // current (possibly per-product-edited) options so free-text options are
      // excluded and edited values are respected.
      const data = await api.post(`/seller/products/${id}/variants/generate`, { matrix })
      const count = data?.variantCount ?? data?.count ?? 0
      setField("variantCount", count)
      toast.success(`Generated ${count} variants`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
      {isCreate && (
        <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          Save the product first to attach an option set and generate variants.
        </p>
      )}

      <EditorField label="Option Set" hint="Managed in the Option Sets page — referenced here, never re-entered.">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex-1">
            <EntityPicker
              endpoint="/seller/option-sets/options"
              value={draft.optionSetId ?? ""}
              onChange={(v) => attach(v)}
              onLabels={mergeLabels}
              placeholder="Select an option set"
            />
          </div>
          {attaching && <Loader2 className="mt-2 size-4 animate-spin text-muted-foreground" aria-label="Working" />}
        </div>
      </EditorField>

      {/* ------------------------------------------------ editable option rows */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Options</h3>
        </div>

        <OptionSnapshotEditor
          options={options}
          onChange={(nextOptions) => setField("options", nextOptions)}
          mergeLabels={mergeLabels}
        />
        <p className="text-xs text-muted-foreground">
          {options.length === 0
            ? "Attach an option set above to load its options (Metal Type, Diamond Quality, Carat…), or add a product-specific option."
            : "Drag the handles to reorder, remove values with ×, add new values per option, or add a product-specific option (e.g. a Gemstone). Changes here only affect this product's variants."}
        </p>
      </div>

      {/* --------------------------------------------------------- variants */}
      <EditorField label="Variants" hint="The full editable grid lives in Product Variants.">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={generate}
              disabled={generating || isCreate || projectedCount === 0}
            >
              {generating ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Boxes className="size-4" aria-hidden="true" />
              )}
              Generate variants
            </Button>
            <span className="text-sm text-muted-foreground">
              {draft.variantCount ?? 0} variant{(draft.variantCount ?? 0) === 1 ? "" : "s"} —{" "}
              <Link to="/hub/products/variants" className="underline hover:text-foreground">
                manage in Product Variants
              </Link>
            </span>
          </div>

          {/* Live preview of how many combinations Generate will create. */}
          {projectedCount > 0 ? (
            <p className="text-xs text-muted-foreground">
              This will create{" "}
              <span className="font-semibold text-foreground">{projectedCount}</span>{" "}
              variant{projectedCount === 1 ? "" : "s"} from{" "}
              {matrixNames.map((n, i) => (
                <span key={n}>
                  {i > 0 && " × "}
                  <span className="font-medium text-foreground">
                    {matrix[n].length}
                  </span>{" "}
                  {n}
                </span>
              ))}
              {excludedTextOptions > 0 && (
                <>
                  {" "}
                  ({excludedTextOptions} free-text option
                  {excludedTextOptions === 1 ? "" : "s"} filled in at checkout,
                  not counted)
                </>
              )}
              {showAlwaysOptions > 0 && (
                <>
                  {" "}
                  ({showAlwaysOptions} show-always option
                  {showAlwaysOptions === 1 ? "" : "s"} shown on storefront, not
                  counted)
                </>
              )}
              .
            </p>
          ) : (
            options.length > 0 && (
              <p className="text-xs text-muted-foreground">
                No variants to generate yet — add at least one option with preset
                values (dropdown, swatch, or image).
              </p>
            )
          )}
        </div>
      </EditorField>
    </section>
  )
}
