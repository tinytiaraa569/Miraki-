"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FieldRow } from "@/components/hub/metafields/field-row"
import { emptyField } from "@/components/hub/metafields/metafield-utils"

/**
 * Renders an ordered list of fields with add / remove / reorder. RECURSIVE:
 * each <FieldRow> renders another <FieldTree> for its children (object /
 * array-of-object), so the whole nested schema is edited in place.
 *
 * Reordering supports both real pointer drag-and-drop (via each row's grip
 * handle) and keyboard arrow keys. Drag state is local to THIS tree, so a drag
 * started in one level never lands in a nested one.
 */
export function FieldTree({ fields, depth = 0, onChange, addLabel = "Add Field" }) {
  // Index of the row currently being dragged, and the row it is hovering over
  // (the live drop target). Both null when no drag is in progress.
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)

  function updateAt(i, next) {
    onChange(fields.map((f, idx) => (idx === i ? next : f)))
  }
  function removeAt(i) {
    onChange(fields.filter((_, idx) => idx !== i))
  }
  // Swap neighbours — used by the keyboard ArrowUp / ArrowDown shortcuts.
  function move(i, dir) {
    const j = i + dir
    if (j < 0 || j >= fields.length) return
    const next = [...fields]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  // Pull `from` out and splice it back in at `to` — the drag-and-drop reorder.
  function reorder(from, to) {
    if (from == null || to == null || from === to) return
    const next = [...fields]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }
  function add() {
    onChange([...fields, emptyField()])
  }

  function onDrop(i) {
    reorder(dragIndex, i)
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <div className="flex flex-col gap-2">
      {fields.map((field, i) => (
        <FieldRow
          key={field._key}
          field={field}
          depth={depth}
          siblingKeys={fields.filter((_, idx) => idx !== i).map((f) => f.key).filter(Boolean)}
          canUp={i > 0}
          canDown={i < fields.length - 1}
          isDragging={dragIndex === i}
          isDropTarget={overIndex === i && dragIndex !== null && dragIndex !== i}
          onChange={(next) => updateAt(i, next)}
          onRemove={() => removeAt(i)}
          onMoveUp={() => move(i, -1)}
          onMoveDown={() => move(i, 1)}
          onDragStartRow={() => setDragIndex(i)}
          onDragEnterRow={() => dragIndex !== null && setOverIndex(i)}
          onDropRow={() => onDrop(i)}
          onDragEndRow={() => {
            setDragIndex(null)
            setOverIndex(null)
          }}
        />
      ))}
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={add}>
        <Plus className="size-3.5" aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  )
}
