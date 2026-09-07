"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X, ZoomIn } from "lucide-react"

/* ---------------------------------------------------------------------------
   ImageZoomLightbox — an advanced, storefront-styled image viewer that mirrors
   mirakijewels.com's product zoom: a vertical thumbnail rail on the left and a
   large, edge-to-edge stage on the right. The stage keeps the image at its
   FULL uploaded resolution (object-contain, never cropped) so it stays crisp,
   and layers a proper magnifier on top:

     • hover / move the pointer to pan a magnified view (origin follows cursor)
     • scroll wheel or the +/- controls to change zoom level (1x → 4x)
     • click the image (or the button) to toggle a 2.5x zoom lock
     • drag to pan while zoomed; double-click to reset

   Keyboard: ← / → navigate, + / - zoom, 0 resets, Esc closes.
--------------------------------------------------------------------------- */

const MIN_SCALE = 1
const MAX_SCALE = 4
const STEP = 0.5

export function ImageZoomLightbox({ open, images = [], index = 0, onIndexChange, onClose, productName = "" }) {
  const count = images.length
  const [i, setI] = useState(index)
  const [scale, setScale] = useState(1)
  // Transform origin (in %) — where the zoom is centered / what the pointer targets.
  const [origin, setOrigin] = useState({ x: 50, y: 50 })
  const stageRef = useRef(null)
  const draggingRef = useRef(false)

  // Sync internal index with the parent-provided one whenever the viewer opens
  // or the parent moves the gallery.
  useEffect(() => {
    if (open) setI(index)
  }, [open, index])

  const resetZoom = useCallback(() => {
    setScale(1)
    setOrigin({ x: 50, y: 50 })
  }, [])

  // Reset the zoom every time the active image changes.
  useEffect(() => {
    resetZoom()
  }, [i, resetZoom])

  const go = useCallback(
    (delta) => {
      if (!count) return
      setI((prev) => {
        const next = (prev + delta + count) % count
        onIndexChange?.(next)
        return next
      })
    },
    [count, onIndexChange],
  )

  const selectIndex = useCallback(
    (next) => {
      setI(next)
      onIndexChange?.(next)
    },
    [onIndexChange],
  )

  const clampScale = (v) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(v * 100) / 100))

  const zoomBy = useCallback((delta) => {
    setScale((s) => {
      const next = clampScale(s + delta)
      if (next <= MIN_SCALE) setOrigin({ x: 50, y: 50 })
      return next
    })
  }, [])

  // Lock body scroll + wire keyboard shortcuts while the viewer is open.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.()
      else if (e.key === "ArrowLeft") go(-1)
      else if (e.key === "ArrowRight") go(1)
      else if (e.key === "+" || e.key === "=") zoomBy(STEP)
      else if (e.key === "-" || e.key === "_") zoomBy(-STEP)
      else if (e.key === "0") resetZoom()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener("keydown", onKey)
    }
  }, [open, go, zoomBy, resetZoom, onClose])

  // Map a pointer position over the stage to a transform-origin percentage.
  const originFromEvent = (e) => {
    const el = stageRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    return { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) }
  }

  const onPointerMove = (e) => {
    // While zoomed, keep the magnified region under the pointer (pan-on-hover).
    if (scale <= MIN_SCALE) return
    const next = originFromEvent(e)
    if (next) setOrigin(next)
  }

  const onWheel = (e) => {
    e.preventDefault()
    const next = originFromEvent(e)
    if (next && scale <= MIN_SCALE) setOrigin(next)
    zoomBy(e.deltaY < 0 ? STEP : -STEP)
  }

  const onStageClick = (e) => {
    if (draggingRef.current) return
    if (scale > MIN_SCALE) {
      resetZoom()
    } else {
      const next = originFromEvent(e)
      if (next) setOrigin(next)
      setScale(2.5)
    }
  }

  if (!open) return null

  const current = images[i] || {}
  const src = current.url || "/placeholder.svg"
  const alt = current.alt || `${productName} view ${i + 1}`
  const zoomed = scale > MIN_SCALE

  return (
    <div
      className="fixed inset-0 z-[100] flex bg-sf-ink/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${productName || "Product"} image viewer`}
      onClick={onClose}
    >
      <div
        className="relative m-auto flex h-[92vh] w-[94vw] max-w-6xl overflow-hidden rounded-lg bg-sf-paper shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Thumbnail rail */}
        {count > 1 ? (
          <div className="hidden w-24 shrink-0 flex-col gap-3 overflow-y-auto border-r border-sf-brand/15 bg-sf-surface/40 p-3 sm:flex [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-sf-brand/25">
            {images.map((img, idx) => (
              <button
                key={img.url || idx}
                type="button"
                onClick={() => selectIndex(idx)}
                aria-label={`View image ${idx + 1}`}
                aria-current={idx === i}
                className={`aspect-square overflow-hidden rounded-md border-2 bg-sf-paper transition-colors ${
                  idx === i ? "border-sf-brand" : "border-transparent hover:border-sf-brand/40"
                }`}
              >
                <img
                  src={img.url || "/placeholder.svg"}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-full object-contain"
                />
              </button>
            ))}
          </div>
        ) : null}

        {/* Stage */}
        <div className="relative flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-2 border-b border-sf-brand/10 px-4 py-3">
            <span className="truncate font-sf-display text-sm italic text-sf-brand">
              {productName}
              {count > 1 ? <span className="ml-2 not-italic text-sf-muted">{`${i + 1} / ${count}`}</span> : null}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close image viewer"
              className="grid size-9 shrink-0 place-items-center rounded-full text-sf-muted transition-colors hover:bg-sf-surface hover:text-sf-ink"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          {/* Zoomable image area */}
          <div
            ref={stageRef}
            onMouseMove={onPointerMove}
            onWheel={onWheel}
            onClick={onStageClick}
            onDoubleClick={resetZoom}
            className={`relative flex-1 select-none overflow-hidden bg-sf-paper ${
              zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
            }`}
          >
            <img
              src={src}
              alt={alt}
              draggable={false}
              decoding="async"
              className="pointer-events-none absolute inset-0 m-auto max-h-full max-w-full object-contain p-4 transition-transform duration-100 ease-out will-change-transform"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: `${origin.x}% ${origin.y}%`,
              }}
            />

            {/* Prev / next arrows */}
            {count > 1 ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    go(-1)
                  }}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-sf-paper/80 text-sf-brand shadow-md backdrop-blur transition-colors hover:bg-sf-paper"
                >
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    go(1)
                  }}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-sf-paper/80 text-sf-brand shadow-md backdrop-blur transition-colors hover:bg-sf-paper"
                >
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
              </>
            ) : null}

            {/* Hover hint — only before the shopper has zoomed */}
            {!zoomed ? (
              <span className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-sf-ink/70 px-3 py-1.5 text-xs text-sf-paper">
                <ZoomIn className="size-3.5" aria-hidden="true" />
                Click or scroll to zoom
              </span>
            ) : null}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center justify-center gap-1 border-t border-sf-brand/10 px-4 py-3">
            <button
              type="button"
              onClick={() => zoomBy(-STEP)}
              disabled={scale <= MIN_SCALE}
              aria-label="Zoom out"
              className="grid size-9 place-items-center rounded-full text-sf-ink transition-colors hover:bg-sf-surface disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <span className="w-14 text-center text-sm tabular-nums text-sf-muted">{Math.round(scale * 100)}%</span>
            <button
              type="button"
              onClick={() => zoomBy(STEP)}
              disabled={scale >= MAX_SCALE}
              aria-label="Zoom in"
              className="grid size-9 place-items-center rounded-full text-sf-ink transition-colors hover:bg-sf-surface disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={resetZoom}
              disabled={!zoomed}
              aria-label="Reset zoom"
              className="ml-2 grid size-9 place-items-center rounded-full text-sf-ink transition-colors hover:bg-sf-surface disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
