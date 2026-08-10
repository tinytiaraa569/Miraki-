"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, GripVertical, Settings2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { FieldSettingsPanel } from "@/components/hub/metafields/field-settings-panel"
import { FieldTree } from "@/components/hub/metafields/field-tree"
import {
  DATA_TYPES,
  EDIT_TYPES_BY_DATA_TYPE,
  ITEM_TYPES,
  defaultEditTypeForDataType,
  editTypesForField,
  hasChildren,
  slugKey,
} from "@/components/hub/metafields/metafield-utils"

/**
 * One field in the builder. Renders the row controls (name / data type / item
 * type / gear / delete), and — only when expanded — the gear settings panel and
 * the nested children tree for `object` / `array-of-object` types. Recursion
 * happens through <FieldTree> for `children`.
 */
export function FieldRow({
  field,
  depth,
  siblingKeys = [],
  canUp,
  canDown,
  isDragging = false,
  isDropTarget = false,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDragStartRow,
  onDragEnterRow,
  onDropRow,
  onDragEndRow,
}) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [childrenOpen, setChildrenOpen] = useState(true)
  // The row is only made draggable while the user is actively holding the grip
  // handle — otherwise native drag would hijack text selection in the inputs.
  const [grabbed, setGrabbed] = useState(false)
  const idBase = `mf-${field._key}`
  const nested = hasChildren(field)
  const isArray = field.dataType === "array"

  // Arrow keys on the grip reorder without a mouse (keyboard accessibility).
  function onHandleKeyDown(e) {
    if (e.key === "ArrowUp" && canUp) {
      e.preventDefault()
      onMoveUp?.()
    } else if (e.key === "ArrowDown" && canDown) {
      e.preventDefault()
      onMoveDown?.()
    }
  }

  // Changing the data type keeps sensible sub-state: arrays get a default item
  // type; leaving array clears it; a fresh container starts with no children.
  // The Edit Type widget list is data-type specific, so snap the current widget
  // to the new type's default whenever it's no longer valid for that type.
  function onDataType(dataType) {
    const patch = { dataType }
    const itemType = dataType === "array" ? (field.itemType ?? "string") : null
    patch.itemType = itemType

    const allowed = EDIT_TYPES_BY_DATA_TYPE[dataType] ?? []
    if (!allowed.includes(field.editType)) patch.editType = defaultEditTypeForDataType(dataType, itemType)

    onChange({ ...field, ...patch })
  }

  // Switching an array's item type re-defaults the widget: object arrays become
  // a `collection` repeater; leaving object snaps back to the type's default so
  // the stale `collection` widget doesn't linger on a non-object array.
  function onItemType(itemType) {
    const patch = { itemType }
    const becameObject = itemType === "object" && field.itemType !== "object"
    const leftObject = itemType !== "object" && field.itemType === "object"
    if (becameObject || leftObject || field.editType === "collection") {
      patch.editType = defaultEditTypeForDataType("array", itemType)
    }
    onChange({ ...field, ...patch })
  }

  return (
    <div
      draggable={grabbed}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move"
        // Firefox requires data to be set for a drag to actually start.
        try {
          e.dataTransfer.setData("text/plain", field._key)
        } catch {}
        onDragStartRow?.()
      }}
      onDragEnter={(e) => {
        e.preventDefault()
        onDragEnterRow?.()
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDropRow?.()
      }}
      onDragEnd={() => {
        setGrabbed(false)
        onDragEndRow?.()
      }}
      className={cn(
        "rounded-lg border border-border bg-card transition-shadow",
        depth > 0 && "bg-muted/20",
        isDragging && "opacity-50",
        isDropTarget && "border-primary ring-2 ring-primary/40",
      )}
    >
      {/* ---------------------------------------------------------- row */}
      <div className="flex flex-wrap items-center gap-2 p-2 sm:flex-nowrap">
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            onMouseDown={() => setGrabbed(true)}
            onMouseUp={() => setGrabbed(false)}
            onTouchStart={() => setGrabbed(true)}
            onTouchEnd={() => setGrabbed(false)}
            onKeyDown={onHandleKeyDown}
            className="cursor-grab text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
            aria-label="Drag to reorder field, or use arrow keys"
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </button>
        </div>

        <Input
          value={field.key}
          onChange={(e) => onChange({ ...field, key: e.target.value })}
          onBlur={(e) => onChange({ ...field, key: slugKey(e.target.value) })}
          placeholder="field_name"
          className="h-9 min-w-0 flex-1 font-medium"
          aria-label="Field name"
        />

        <Select value={field.dataType} onValueChange={onDataType}>
          <SelectTrigger className="h-9 w-32 shrink-0" aria-label="Data type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {DATA_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isArray && (
          <Select
            value={field.itemType ?? "string"}
            onValueChange={onItemType}
          >
            <SelectTrigger className="h-9 w-32 shrink-0" aria-label="Array item type">
              <SelectValue placeholder="of…" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {ITEM_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex shrink-0 items-center">
          <Button
            type="button"
            variant={settingsOpen ? "secondary" : "ghost"}
            size="icon"
            className="size-8"
            onClick={() => setSettingsOpen((v) => !v)}
            aria-label="Field settings"
            aria-expanded={settingsOpen}
          >
            <Settings2 className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            aria-label="Delete field"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------ settings panel */}
      {settingsOpen && (
        <FieldSettingsPanel
          idBase={idBase}
          editType={field.editType}
          editTypeOptions={editTypesForField(field)}
          fieldKeys={siblingKeys}
          settings={field.settings}
          onEditType={(editType) => onChange({ ...field, editType })}
          onSettings={(settings) => onChange({ ...field, settings })}
        />
      )}

      {/* -------------------------------------------------- nested tree */}
      {nested && (
        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={() => setChildrenOpen((v) => !v)}
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            aria-expanded={childrenOpen}
          >
            {childrenOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            {isArray ? "Item fields (Add more records)" : "Nested fields"}
            <span className="text-muted-foreground/60">({field.children?.length ?? 0})</span>
          </button>
          {childrenOpen && (
            <FieldTree
              fields={field.children ?? []}
              depth={depth + 1}
              onChange={(children) => onChange({ ...field, children })}
              addLabel={isArray ? "Add more records" : "Add nested field"}
            />
          )}
        </div>
      )}
    </div>
  )
}
