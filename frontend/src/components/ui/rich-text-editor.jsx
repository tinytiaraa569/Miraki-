"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Quote,
  Undo2,
  Redo2,
  RemoveFormatting,
} from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Reusable rich-text editor built on `contentEditable`, with no external editor
 * dependency. It is a *controlled* component: pass an HTML string as `value`
 * and receive HTML back through `onChange`.
 *
 * Because it emits/consumes plain HTML strings it can be dropped into any form
 * in the app (category / product / brand descriptions, etc.) that stores a
 * description string.
 *
 *   <RichTextEditor value={html} onChange={setHtml} />
 */

const ICON = "size-4"

// Each toolbar button maps to a document.execCommand invocation.
function ToolbarButton({ onAction, title, active, children }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active || undefined}
      // Keep the selection in the editor: prevent the button from stealing focus.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onAction}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-border" />
}

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start typing…",
  className,
  editorClassName,
  minHeight = 200,
  maxLength,
  id,
  ariaLabel,
  // When true the toolbar is hidden and the surface is non-editable — a
  // view-only rendition for users without write permission. Defaults to false,
  // so every existing usage keeps its current editable behaviour.
  readOnly = false,
}) {
  const ref = useRef(null)
  const [focused, setFocused] = useState(false)
  const [isEmpty, setIsEmpty] = useState(!value)
  // Bump this to force a re-read of active formatting states after commands.
  const [, force] = useState(0)

  // Sync incoming value into the DOM only when it diverges from what the user
  // already sees, so typing never resets the caret position.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const incoming = value ?? ""
    if (el.innerHTML !== incoming) {
      el.innerHTML = incoming
    }
    setIsEmpty(!el.textContent?.trim() && !el.querySelector("img,li,hr"))
  }, [value])

  function emit() {
    const el = ref.current
    if (!el) return
    let html = el.innerHTML
    if (html === "<br>" || html === "<div><br></div>") html = ""
    if (maxLength && el.textContent && el.textContent.length > maxLength) {
      // Soft cap: ignore edits past the limit by reverting to the last value.
      el.innerHTML = value ?? ""
      return
    }
    setIsEmpty(!el.textContent?.trim() && !el.querySelector("img,li,hr"))
    onChange?.(html)
  }

  function exec(command, arg) {
    ref.current?.focus()
    document.execCommand(command, false, arg)
    emit()
    force((n) => n + 1)
  }

  function formatBlock(tag) {
    exec("formatBlock", tag)
  }

  function addLink() {
    const url = window.prompt("Enter URL")
    if (!url) return
    const safe = /^(https?:|mailto:|tel:|\/)/i.test(url) ? url : `https://${url}`
    exec("createLink", safe)
  }

  const isActive = useMemo(
    () => (cmd) => {
      if (typeof document === "undefined") return false
      try {
        return document.queryCommandState(cmd)
      } catch {
        return false
      }
    },
    // re-evaluate on every forced render / focus change
    [focused],
  )

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-input bg-background transition-colors focus-within:ring-2 focus-within:ring-ring",
        className,
      )}
    >
      {/* Toolbar */}
      {!readOnly && (
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 p-1.5">
        <ToolbarButton title="Undo" onAction={() => exec("undo")}>
          <Undo2 className={ICON} />
        </ToolbarButton>
        <ToolbarButton title="Redo" onAction={() => exec("redo")}>
          <Redo2 className={ICON} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton title="Heading 1" onAction={() => formatBlock("<h1>")}>
          <Heading1 className={ICON} />
        </ToolbarButton>
        <ToolbarButton title="Heading 2" onAction={() => formatBlock("<h2>")}>
          <Heading2 className={ICON} />
        </ToolbarButton>
        <ToolbarButton title="Quote" onAction={() => formatBlock("<blockquote>")}>
          <Quote className={ICON} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton title="Bold" active={isActive("bold")} onAction={() => exec("bold")}>
          <Bold className={ICON} />
        </ToolbarButton>
        <ToolbarButton title="Italic" active={isActive("italic")} onAction={() => exec("italic")}>
          <Italic className={ICON} />
        </ToolbarButton>
        <ToolbarButton title="Underline" active={isActive("underline")} onAction={() => exec("underline")}>
          <Underline className={ICON} />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={isActive("strikeThrough")} onAction={() => exec("strikeThrough")}>
          <Strikethrough className={ICON} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton title="Bullet list" onAction={() => exec("insertUnorderedList")}>
          <List className={ICON} />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" onAction={() => exec("insertOrderedList")}>
          <ListOrdered className={ICON} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton title="Align left" onAction={() => exec("justifyLeft")}>
          <AlignLeft className={ICON} />
        </ToolbarButton>
        <ToolbarButton title="Align center" onAction={() => exec("justifyCenter")}>
          <AlignCenter className={ICON} />
        </ToolbarButton>
        <ToolbarButton title="Align right" onAction={() => exec("justifyRight")}>
          <AlignRight className={ICON} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton title="Insert link" onAction={addLink}>
          <Link2 className={ICON} />
        </ToolbarButton>
        <ToolbarButton title="Clear formatting" onAction={() => exec("removeFormat")}>
          <RemoveFormatting className={ICON} />
        </ToolbarButton>
      </div>
      )}

      {/* Editable surface */}
      <div className="relative">
        {isEmpty && !focused && (
          <p className="pointer-events-none absolute left-3 top-3 text-sm text-muted-foreground">{placeholder}</p>
        )}
        <div
          id={id}
          ref={ref}
          role="textbox"
          aria-multiline="true"
          aria-label={ariaLabel || placeholder}
          aria-readonly={readOnly || undefined}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onInput={readOnly ? undefined : emit}
          onBlur={() => setFocused(false)}
          onFocus={() => setFocused(true)}
          onKeyUp={() => force((n) => n + 1)}
          onMouseUp={() => force((n) => n + 1)}
          style={{ minHeight }}
          className={cn(
            "rte-content max-w-none px-3 py-2.5 text-sm leading-relaxed text-foreground focus:outline-none",
            readOnly && "opacity-70",
            editorClassName,
          )}
        />
      </div>
    </div>
  )
}
