"use client"

import { Info, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  EDIT_TYPES,
  ENTITY_SOURCES,
  fieldsForEntity,
  isEntityEditType,
  normalizeEntity,
  SHOW_ON_JOINERS,
  SHOW_ON_OPERATORS,
} from "@/components/hub/metafields/metafield-utils"

// Plain-language description + a real ecommerce example for every field in the
// panel. Surfaced through the little (i) icon so store admins understand what
// each setting does and how it is typically used on a storefront.
const HELP = {
  editType: {
    text: "The input widget an admin sees when filling this field — independent of how the value is stored.",
    example: "Use 'select' for a Ring Size field so staff pick 6 / 7 / 8 from a dropdown instead of typing.",
  },
  label: {
    text: "The human-readable caption shown above the input. Falls back to the raw field key when left blank.",
    example: "Key 'mfg_warranty' → Label 'Manufacturer Warranty'.",
  },
  level: {
    text: "Grouping / hierarchy hint used to organise fields into sections or tabs on the form.",
    example: "Set 'Shipping' so weight and dimension fields cluster under a Shipping section.",
  },
  settingType: {
    text: "A tag that classifies the field so the settings engine routes it to the right screen.",
    example: "'seo' groups meta-title and meta-description together on the SEO settings page.",
  },
  tooltip: {
    text: "Short hover hint shown next to the input for the person entering the data.",
    example: "'Enter weight in grams' on a shipping weight field.",
  },
  description: {
    text: "Longer helper text documenting what the field is for and where it appears.",
    example: "'Shown as the care guide on the product page under Description.'",
  },
  example: {
    text: "A sample value that guides staff on the expected format / content.",
    example: "'18K, IGI-certified, VS clarity' for a Diamond Specs field.",
  },
  defaultValue: {
    text: "Pre-filled value used when nothing is entered (desktop / general context).",
    example: "Default 'In Stock' on an Availability field so new products publish as sellable.",
  },
  defaultMobile: {
    text: "Alternate default applied in the mobile app / mobile storefront context.",
    example: "A shorter default banner text on mobile than on desktop.",
  },
  required: {
    text: "The field must have a value — saving fails when it is left empty.",
    example: "Make 'SKU' required so no product is ever created without one.",
  },
  encrypt: {
    text: "Stores the value encrypted at rest — meant for sensitive data.",
    example: "Encrypt a supplier API key that is kept on the product.",
  },
  hidden: {
    text: "Never shown in the form; the value is used internally only.",
    example: "Hide an internal 'cost_price' from every edit screen.",
  },
  addHidden: {
    text: "Hidden only on the create / add screen, but visible when editing.",
    example: "Hide 'reorder_count' at creation and reveal it later on edit.",
  },
  editHidden: {
    text: "Hidden only on the edit screen, but visible when adding.",
    example: "Capture 'launch_date' once at add time, then lock it on edit.",
  },
  readOnly: {
    text: "Visible but not editable by the user.",
    example: "Show an auto-generated 'barcode' as read-only.",
  },
  disabled: {
    text: "Rendered greyed-out and non-interactive.",
    example: "Disable 'gift_wrap' until the gifting feature launches.",
  },
  deprecated: {
    text: "Marks a legacy field kept for old data but discouraged for new use.",
    example: "Deprecate the old 'color_v1' after migrating to 'color'.",
  },
  hideForSeller: {
    text: "Hidden from seller (vendor) users in a marketplace.",
    example: "Hide the internal 'margin' field from third-party sellers.",
  },
  hideForSellerManager: {
    text: "Hidden from the seller-manager role.",
    example: "Hide 'platform_fee_override' from seller managers.",
  },
  configurable: {
    text: "Value can be overridden per context / variant (device, storefront, etc.).",
    example: "Let a 'badge_text' differ between two storefronts.",
  },
  hideDeviceToggle: {
    text: "Hides the desktop / mobile switch so a single value applies to all devices.",
    example: "Use one 'promo_code' across both web and app.",
  },
  validation: {
    text: "Rules checked against the entered value. Rule = the check, Param = its argument, Message = the error shown on failure.",
    example: "rule 'maxlength', param '160', message 'Meta description must be 160 characters or fewer'.",
  },
  showOn: {
    text: "Show this field only when another field meets a condition — great for category-specific attributes.",
    example: "Show 'ring_size' only when the product's category equals 'rings'.",
  },
  events: {
    text: "Hooks that fire on form interaction. Event is the trigger, Handler is the function to run.",
    example: "On 'change' of Country, run a handler that recalculates tax.",
  },
  formatter: {
    text: "Optional JS expression / template that transforms the stored value for display or output.",
    example: "`₹${value}` renders a price field as ₹1,299 on the storefront.",
  },
  options: {
    text: "The choices offered by select / radio widgets — Label is shown to shoppers, Value is stored.",
    example: "Label 'Gold' → Value 'gold' for a Metal field.",
  },
  entity: {
    text: "Which module this relation field links records to.",
    example: "Pick 'products' to link related or accessory products.",
  },
  valueField: {
    text: "The linked entity's column stored as the saved value.",
    example: "Store the '_id' of the chosen product.",
  },
  labelField: {
    text: "The linked entity's column shown as the human-readable label.",
    example: "Show the product 'name' in the picker.",
  },
  source: {
    text: "Where the options come from — 'entity' feeds from the module, 'function' runs custom JS.",
    example: "Use 'function' to list only in-stock products.",
  },
  sourceFunction: {
    text: "Custom JS returning the option rows when Source is 'function'.",
    example: "async (q) => api.get('/products', { q, in_stock: true })",
  },
}

// The little (i) icon that reveals a field's description + ecommerce example on
// hover / focus. `asChild` keeps the trigger a real, keyboard-focusable button.
function InfoHint({ text, example }) {
  if (!text) return null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="More information"
          className="inline-flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info className="size-3.5" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="max-w-xs border border-border bg-popover text-popover-foreground shadow-md [&_svg]:!bg-popover [&_svg]:!fill-popover"
      >
        <p className="text-xs leading-relaxed">{text}</p>
        {example && (
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">e.g. </span>
            {example}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

// A form label paired with its info icon, kept on one aligned baseline.
function FieldLabel({ htmlFor, children, hint }) {
  return (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={htmlFor}>{children}</Label>
      <InfoHint {...(hint ?? {})} />
    </div>
  )
}

// A labeled checkbox row (used for the visibility / permission flags).
function CheckRow({ id, label, checked, onChange, hint }) {
  return (
    <div className="flex items-center gap-1.5">
      <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
        <Checkbox id={id} checked={!!checked} onCheckedChange={(v) => onChange(Boolean(v))} />
        {label}
      </label>
      <InfoHint {...(hint ?? {})} />
    </div>
  )
}

// A small titled section wrapper inside the panel.
function Group({ title, children, hint }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
        <InfoHint {...(hint ?? {})} />
      </div>
      {children}
    </div>
  )
}

/**
 * The per-field gear panel. Receives the field's `settings` object plus the
 * field's `editType`, and emits partial updates through `onSettings` /
 * `onEditType`. Rendered ONLY when a row is expanded, so large trees stay cheap.
 */
export function FieldSettingsPanel({ idBase, editType, editTypeOptions, fieldKeys = [], settings, onEditType, onSettings }) {
  const s = settings
  // Widget list is scoped to the field's data type; fall back to the full set.
  const editTypes = editTypeOptions?.length ? editTypeOptions : EDIT_TYPES
  const set = (patch) => onSettings({ ...s, ...patch })

  // --- generic mini-table helpers (validation / showOn / events / options) ---
  const addRow = (field, row) => set({ [field]: [...(s[field] ?? []), row] })
  const updateRow = (field, i, patch) =>
    set({ [field]: (s[field] ?? []).map((r, idx) => (idx === i ? { ...r, ...patch } : r)) })
  const removeRow = (field, i) => set({ [field]: (s[field] ?? []).filter((_, idx) => idx !== i) })

  const showChoices =
    editType === "select" ||
    editType === "radio" ||
    editType === "multiselect" ||
    editType === "multicheckbox"

  return (
    <TooltipProvider delayDuration={150}>
    <div className="flex flex-col gap-6 border-t border-border bg-muted/30 p-4">
      <div className="grid gap-x-6 gap-y-6 lg:grid-cols-2">
        {/* -------------------------------------------------- presentation */}
        <Group title="Presentation">
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor={`${idBase}-edittype`} hint={HELP.editType}>Edit Type</FieldLabel>
            <Select value={editType} onValueChange={onEditType}>
              <SelectTrigger id={`${idBase}-edittype`} className="h-9">
                <SelectValue placeholder="Select widget" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {editTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Relation config — only for autocomplete / category / collection
              edit types. `Entity` picks which entity to link to; `Value Field`
              / `Label Field` come from that entity's MODEL; `Source` toggles
              between the picker feed and a custom source function. */}
          {isEntityEditType(editType) && (
            <RelationSettings idBase={idBase} s={s} set={set} />
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor={`${idBase}-label`} hint={HELP.label}>Label</FieldLabel>
              <Input id={`${idBase}-label`} value={s.label} onChange={(e) => set({ label: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor={`${idBase}-level`} hint={HELP.level}>Level</FieldLabel>
              <Input id={`${idBase}-level`} value={s.level} onChange={(e) => set({ level: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor={`${idBase}-settingtype`} hint={HELP.settingType}>Setting Type</FieldLabel>
              <Input
                id={`${idBase}-settingtype`}
                value={s.settingType}
                onChange={(e) => set({ settingType: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor={`${idBase}-tooltip`} hint={HELP.tooltip}>Tool Tip</FieldLabel>
              <Input id={`${idBase}-tooltip`} value={s.tooltip} onChange={(e) => set({ tooltip: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor={`${idBase}-desc`} hint={HELP.description}>Description</FieldLabel>
            <Textarea id={`${idBase}-desc`} value={s.description} onChange={(e) => set({ description: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor={`${idBase}-example`} hint={HELP.example}>Example</FieldLabel>
            <Textarea id={`${idBase}-example`} value={s.example} onChange={(e) => set({ example: e.target.value })} />
          </div>
        </Group>

        {/* -------------------------------------------------- defaults ------ */}
        <Group title="Defaults & flags">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor={`${idBase}-default`} hint={HELP.defaultValue}>Default</FieldLabel>
              <Input
                id={`${idBase}-default`}
                value={s.defaultValue}
                onChange={(e) => set({ defaultValue: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor={`${idBase}-defaultmobile`} hint={HELP.defaultMobile}>Default Mobile</FieldLabel>
              <Input
                id={`${idBase}-defaultmobile`}
                value={s.defaultMobile}
                onChange={(e) => set({ defaultMobile: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            <CheckRow id={`${idBase}-required`} label="Required" checked={s.required} onChange={(v) => set({ required: v })} hint={HELP.required} />
            <CheckRow id={`${idBase}-encrypt`} label="Encrypt Value" checked={s.encrypt} onChange={(v) => set({ encrypt: v })} hint={HELP.encrypt} />
            <CheckRow id={`${idBase}-hidden`} label="Hidden" checked={s.hidden} onChange={(v) => set({ hidden: v })} hint={HELP.hidden} />
            <CheckRow id={`${idBase}-addhidden`} label="Add Hidden" checked={s.addHidden} onChange={(v) => set({ addHidden: v })} hint={HELP.addHidden} />
            <CheckRow id={`${idBase}-edithidden`} label="Edit Hidden" checked={s.editHidden} onChange={(v) => set({ editHidden: v })} hint={HELP.editHidden} />
            <CheckRow id={`${idBase}-readonly`} label="Read-only" checked={s.readOnly} onChange={(v) => set({ readOnly: v })} hint={HELP.readOnly} />
            <CheckRow id={`${idBase}-disabled`} label="Disabled" checked={s.disabled} onChange={(v) => set({ disabled: v })} hint={HELP.disabled} />
            <CheckRow id={`${idBase}-deprecated`} label="Deprecated" checked={s.deprecated} onChange={(v) => set({ deprecated: v })} hint={HELP.deprecated} />
            <CheckRow id={`${idBase}-hideseller`} label="Hide For Seller" checked={s.hideForSeller} onChange={(v) => set({ hideForSeller: v })} hint={HELP.hideForSeller} />
            <CheckRow
              id={`${idBase}-hidesellermgr`}
              label="Hide For Seller Manager"
              checked={s.hideForSellerManager}
              onChange={(v) => set({ hideForSellerManager: v })}
              hint={HELP.hideForSellerManager}
            />
            <CheckRow id={`${idBase}-configurable`} label="Configurable" checked={s.configurable} onChange={(v) => set({ configurable: v })} hint={HELP.configurable} />
            <CheckRow
              id={`${idBase}-hidedevice`}
              label="Hide Device Toggle"
              checked={s.hideDeviceToggle}
              onChange={(v) => set({ hideDeviceToggle: v })}
              hint={HELP.hideDeviceToggle}
            />
          </div>
        </Group>
      </div>

      {/* ------------------------------------------------- choices (select) */}
      {showChoices && (
        <Group title="Options (choices)" hint={HELP.options}>
          <MiniTable
            columns={["Label", "Value"]}
            rows={s.options ?? []}
            renderRow={(row, i) => (
              <>
                <td className="p-1.5">
                  <Input
                    className="h-8"
                    value={row.label}
                    onChange={(e) => updateRow("options", i, { label: e.target.value })}
                    placeholder="Gold"
                  />
                </td>
                <td className="p-1.5">
                  <Input
                    className="h-8"
                    value={row.value}
                    onChange={(e) => updateRow("options", i, { value: e.target.value })}
                    placeholder="gold"
                  />
                </td>
              </>
            )}
            onRemove={(i) => removeRow("options", i)}
            onAdd={() => addRow("options", { label: "", value: "" })}
            addLabel="Add Option"
          />
        </Group>
      )}

      {/* ------------------------------------------------------ validation */}
      <Group title="Validation" hint={HELP.validation}>
        <MiniTable
          columns={["Rule", "Param", "Message"]}
          rows={s.validations ?? []}
          renderRow={(row, i) => (
            <>
              <td className="p-1.5">
                <Input className="h-8" value={row.rule} onChange={(e) => updateRow("validations", i, { rule: e.target.value })} placeholder="required" />
              </td>
              <td className="p-1.5">
                <Input className="h-8" value={row.param} onChange={(e) => updateRow("validations", i, { param: e.target.value })} placeholder="10" />
              </td>
              <td className="p-1.5">
                <Input className="h-8" value={row.message} onChange={(e) => updateRow("validations", i, { message: e.target.value })} placeholder="This field is required" />
              </td>
            </>
          )}
          onRemove={(i) => removeRow("validations", i)}
          onAdd={() => addRow("validations", { rule: "", param: "", message: "" })}
          addLabel="Add Validation"
        />
      </Group>

      {/* --------------------------------------------------------- show on */}
      <Group title="Conditional display (Show On)" hint={HELP.showOn}>
        <datalist id={`${idBase}-showon-fields`}>
          {fieldKeys.map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>
        <MiniTable
          columns={["Field", "Operator", "Value"]}
          rows={s.showOn ?? []}
          renderRow={(row, i) => (
            <>
              <td className="p-1.5">
                <Input
                  className="h-8"
                  list={`${idBase}-showon-fields`}
                  value={row.field}
                  onChange={(e) => updateRow("showOn", i, { field: e.target.value })}
                  placeholder="show_engagement_rings"
                />
              </td>
              <td className="p-1.5">
                <Select value={row.operator || "eq"} onValueChange={(v) => updateRow("showOn", i, { operator: v })}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHOW_ON_OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              <td className="p-1.5">
                <Input className="h-8" value={row.value} onChange={(e) => updateRow("showOn", i, { value: e.target.value })} placeholder="1" />
              </td>
            </>
          )}
          onRemove={(i) => removeRow("showOn", i)}
          onAdd={() => addRow("showOn", { field: "", operator: "eq", value: "" })}
          addLabel="Add Show On"
        />
        {(s.showOn?.length ?? 0) > 1 && (
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Show On Operator</Label>
            <Select value={s.showOnOperator || "AND"} onValueChange={(v) => set({ showOnOperator: v })}>
              <SelectTrigger className="h-8 w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SHOW_ON_JOINERS.map((j) => (
                  <SelectItem key={j.value} value={j.value}>
                    {j.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </Group>

      {/* ---------------------------------------------------------- events */}
      <Group title="Events" hint={HELP.events}>
        <MiniTable
          columns={["Event", "Handler"]}
          rows={s.events ?? []}
          renderRow={(row, i) => (
            <>
              <td className="p-1.5">
                <Input className="h-8" value={row.event} onChange={(e) => updateRow("events", i, { event: e.target.value })} placeholder="change" />
              </td>
              <td className="p-1.5">
                <Input className="h-8" value={row.handler} onChange={(e) => updateRow("events", i, { handler: e.target.value })} placeholder="onChangeHandler" />
              </td>
            </>
          )}
          onRemove={(i) => removeRow("events", i)}
          onAdd={() => addRow("events", { event: "", handler: "" })}
          addLabel="Add Event"
        />
      </Group>

      {/* -------------------------------------------------------- formatter */}
      <Group title="Formatter" hint={HELP.formatter}>
        <Textarea
          value={s.formatter}
          onChange={(e) => set({ formatter: e.target.value })}
          placeholder="// Optional JS expression / template used to format the stored value"
          className="min-h-24 font-mono text-xs"
          spellCheck={false}
        />
      </Group>
    </div>
    </TooltipProvider>
  )
}

/**
 * Relation config for the entity edit types (autocomplete / autocomplete2 /
 * multiautocomplete / category / collection).
 *
 *   Entity        WHICH module to link to — a plain name (products, categories,
 *                 collections, brands, option_sets). No `ms.` prefix is used.
 *   Value Field   the model column stored as the value.
 *   Label Field   the model column shown as the label.
 * Both field dropdowns are populated from the linked entity's MODEL columns
 * (metafield-utils → fieldsForEntity), NOT from this metafield's own fields.
 *   Source        "entity" feeds the picker from the entity's /options route;
 *                 "function" runs a custom JS source instead.
 */
function RelationSettings({ idBase, s, set }) {
  const entity = normalizeEntity(s.entity)
  const modelFields = fieldsForEntity(entity)
  const source = s.source === "function" ? "function" : "entity"

  // Keep a pre-existing/legacy field selection in the dropdown even if it isn't
  // one of the entity's advertised columns, so it never silently disappears.
  const withCurrent = (current) =>
    current && !modelFields.includes(current) ? [current, ...modelFields] : modelFields
  const valueFieldOptions = withCurrent(s.valueField)
  const labelFieldOptions = withCurrent(s.labelField)

  // Switching entity re-defaults the value/label fields to that model's columns
  // when the current choice isn't valid for the new entity.
  const onEntityChange = (next) => {
    const fields = fieldsForEntity(next)
    set({
      entity: next,
      valueField: fields.includes(s.valueField) ? s.valueField : fields.includes("_id") ? "_id" : fields[0],
      labelField: fields.includes(s.labelField) ? s.labelField : fields.includes("name") ? "name" : fields[0],
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border bg-background/60 p-3">
      <div className="flex flex-col gap-1.5">
        <FieldLabel htmlFor={`${idBase}-entity`} hint={HELP.entity}>Entity</FieldLabel>
        <Select value={entity || undefined} onValueChange={onEntityChange}>
          <SelectTrigger id={`${idBase}-entity`} className="h-9">
            <SelectValue placeholder="Select entity" />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_SOURCES.map((e) => (
              <SelectItem key={e.value} value={e.value}>
                {e.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={`${idBase}-valuefield`} hint={HELP.valueField}>Value Field</FieldLabel>
          <Select
            value={s.valueField || undefined}
            onValueChange={(v) => set({ valueField: v })}
            disabled={!entity}
          >
            <SelectTrigger id={`${idBase}-valuefield`} className="h-9">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {valueFieldOptions.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={`${idBase}-labelfield`} hint={HELP.labelField}>Label Field</FieldLabel>
          <Select
            value={s.labelField || undefined}
            onValueChange={(v) => set({ labelField: v })}
            disabled={!entity}
          >
            <SelectTrigger id={`${idBase}-labelfield`} className="h-9">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {labelFieldOptions.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">Source</span>
          <InfoHint {...HELP.source} />
        </div>
        <div className="flex items-center gap-6">
          {[
            { value: "entity", label: "entity" },
            { value: "function", label: "function" },
          ].map((opt) => (
            <label
              key={opt.value}
              htmlFor={`${idBase}-source-${opt.value}`}
              className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
            >
              <input
                id={`${idBase}-source-${opt.value}`}
                type="radio"
                name={`${idBase}-source`}
                value={opt.value}
                checked={source === opt.value}
                onChange={() => set({ source: opt.value })}
                className="size-4 accent-primary"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {source === "function" && (
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor={`${idBase}-sourcefn`} hint={HELP.sourceFunction}>Source Function</FieldLabel>
          <Textarea
            id={`${idBase}-sourcefn`}
            value={s.sourceFunction}
            onChange={(e) => set({ sourceFunction: e.target.value })}
            placeholder="// Return the option rows, e.g. async (q) => api.get('/custom', { q })"
            className="min-h-32 font-mono text-xs"
            spellCheck={false}
          />
        </div>
      )}
    </div>
  )
}

// A compact, dependency-free inline table used by the validation / showOn /
// events / options sub-editors above.
function MiniTable({ columns, rows, renderRow, onRemove, onAdd, addLabel }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/60">
            <tr>
              {columns.map((c) => (
                <th key={c} className="p-2 text-left text-xs font-medium text-muted-foreground">
                  {c}
                </th>
              ))}
              <th className="w-10 p-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-3 text-center text-xs text-muted-foreground">
                  No rows yet.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="border-t border-border">
                  {renderRow(row, i)}
                  <td className="p-1.5 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(i)}
                      aria-label="Remove row"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onAdd}>
        <Plus className="size-3.5" aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  )
}
