"use client"

import { useRef, useState } from "react"
import { GripVertical, Play, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { imgUrl } from "@/Server"

/**
 * Product image gallery — click / OS drag-and-drop to upload, plus drag-to-
 * reorder of existing tiles. New files are read to base64 `dataUrl` (the write
 * API accepts { dataUrl } and stores them server-side); already-saved images
 * keep their `url`. Value shape is the product `images[]`:
 *   [{ url?, dataUrl?, alt, caption, tags }]
 */

const MAX_IMAGE_BYTES = 3 * 1024 * 1024 // matches the server's per-image cap
const MAX_VIDEO_BYTES = 8 * 1024 * 1024 // matches the server's per-video cap

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// A gallery item can be an image or a video. New files carry a base64 `dataUrl`
// (with the mime baked in); saved items carry a `url` path — we detect video by
// the file extension in either case.
function isVideoItem(item) {
  if (item?.dataUrl) return item.dataUrl.startsWith("data:video")
  if (item?.url) return /\.(mp4|webm|mov|ogv|ogg)(\?|$)/i.test(item.url)
  return false
}

export function ImageGallery({ value = [], onChange }) {
  const inputRef = useRef(null)
  // Index of the tile currently being dragged for reorder (null = not reordering).
  const dragIndexRef = useRef(null)
  const [fileDragging, setFileDragging] = useState(false)
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)

  async function addFiles(fileList) {
    const files = Array.from(fileList).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
    )
    if (files.length === 0) return
    const next = [...value]
    for (const file of files) {
      const isVideo = file.type.startsWith("video/")
      const cap = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
      if (file.size > cap) {
        toast.error(`${file.name} is larger than ${isVideo ? "8 MB" : "3 MB"}`)
        continue
      }
      try {
        const dataUrl = await readAsDataUrl(file)
        next.push({ dataUrl, alt: "", caption: "", tags: [] })
      } catch {
        toast.error(`Could not read ${file.name}`)
      }
    }
    onChange(next)
  }

  function removeAt(index) {
    onChange(value.filter((_, i) => i !== index))
  }

  function reorder(from, to) {
    if (from === to || from == null || to == null) return
    const next = [...value]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }

  // Only treat a container drop as an upload when the OS is dragging files.
  function isFileDrag(e) {
    return Array.from(e.dataTransfer?.types ?? []).includes("Files")
  }

  function onContainerDragOver(e) {
    if (dragIndexRef.current != null) return // internal reorder, tiles handle it
    if (!isFileDrag(e)) return
    e.preventDefault()
    setFileDragging(true)
  }

  function onContainerDrop(e) {
    if (dragIndexRef.current != null) return // reorder handled on the tile
    if (!isFileDrag(e)) return
    e.preventDefault()
    setFileDragging(false)
    addFiles(e.dataTransfer.files)
  }

  function resetDrag() {
    dragIndexRef.current = null
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        You can also drag and drop images or videos here to upload.
      </p>
      <div
        onDragOver={onContainerDragOver}
        onDragLeave={() => setFileDragging(false)}
        onDrop={onContainerDrop}
        className={cn(
          "flex flex-wrap gap-3 rounded-lg border border-dashed border-border p-3 transition-colors",
          fileDragging && "border-primary bg-primary/5",
        )}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex size-20 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          aria-label="Add images or videos"
        >
          <Plus className="size-6" aria-hidden="true" />
        </button>

        {value.map((img, i) => {
          // Newly-added files carry a base64 `dataUrl`; already-saved images store
          // a relative path in `url` ("/uploads/product/...") that must be
          // prefixed with the backend/CDN host via imgUrl() — same pattern used
          // by collections, categories, and brands.
          const src = img.dataUrl || (img.url ? imgUrl(img.url) : "/placeholder.svg")
          const isVideo = isVideoItem(img)
          const isDragged = dragIndex === i
          const isOver = overIndex === i && dragIndex !== i
          return (
            <div
              key={i}
              draggable
              onDragStart={(e) => {
                dragIndexRef.current = i
                setDragIndex(i)
                e.dataTransfer.effectAllowed = "move"
                // Some browsers require data to be set for dragging to start.
                e.dataTransfer.setData("text/plain", String(i))
              }}
              onDragOver={(e) => {
                if (dragIndexRef.current == null) return
                e.preventDefault()
                e.dataTransfer.dropEffect = "move"
                if (overIndex !== i) setOverIndex(i)
              }}
              onDrop={(e) => {
                if (dragIndexRef.current == null) return
                e.preventDefault()
                e.stopPropagation()
                reorder(dragIndexRef.current, i)
                resetDrag()
              }}
              onDragEnd={resetDrag}
              className={cn(
                "group relative size-20 shrink-0 cursor-grab overflow-hidden rounded-md border border-border bg-muted transition-all active:cursor-grabbing",
                isDragged && "opacity-40",
                isOver && "ring-2 ring-primary ring-offset-1 ring-offset-background",
              )}
            >
              {isVideo ? (
                <>
                  <video
                    src={src}
                    className="pointer-events-none size-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  {/* Play badge so a video tile is distinguishable at a glance */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="flex size-7 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm">
                      <Play className="size-3.5 translate-x-px" aria-hidden="true" />
                    </span>
                  </div>
                </>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={src || "/placeholder.svg"}
                  alt={img.alt || `Product image ${i + 1}`}
                  className="pointer-events-none size-full object-cover"
                  draggable={false}
                />
              )}

              {/* Hover drag indicator */}
              <div className="pointer-events-none absolute inset-x-0 top-0 flex h-6 items-center justify-center bg-gradient-to-b from-background/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
                <GripVertical className="size-4 text-foreground/70" aria-hidden="true" />
              </div>

              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-background/90 text-muted-foreground shadow-sm transition-colors hover:text-destructive"
                aria-label={`Remove ${isVideo ? "video" : "image"} ${i + 1}`}
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          )
        })}

        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ""
          }}
        />
      </div>
    </div>
  )
}
