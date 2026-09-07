"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, ImageIcon, Play } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { imgUrl } from "@/Server"

/**
 * Lightbox that shows every image of a product. Opened from the products table
 * thumbnail. `images` is an array of stored relative paths ("/uploads/...")
 * which are resolved to absolute src via imgUrl() — same pattern used across the
 * hub. Left/right arrows + a thumbnail strip navigate; arrow keys work too.
 */
// The gallery holds both images and videos; detect videos by file extension.
const isVideoUrl = (src) => /\.(mp4|webm|mov|ogv|ogg)(\?|$)/i.test(src || "")

export function ProductImageGalleryDialog({ open, onOpenChange, title, images = [] }) {
  const [index, setIndex] = useState(0)
  const count = images.length

  // Reset to the first image whenever a new product's gallery is opened.
  useEffect(() => {
    if (open) setIndex(0)
  }, [open])

  const go = (delta) => setIndex((i) => (count ? (i + delta + count) % count : 0))

  // Left/right arrow keys navigate while the lightbox is open.
  useEffect(() => {
    if (!open || count < 2) return
    const onKey = (e) => {
      if (e.key === "ArrowLeft") go(-1)
      else if (e.key === "ArrowRight") go(1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, count])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-0 p-0">
        <DialogHeader className="flex-row items-center gap-2 border-b border-border px-6 py-4">
          <ImageIcon className="size-5 text-muted-foreground" aria-hidden="true" />
          <DialogTitle>
            {title ? `${title} — ` : "Product Images "}
            {count ? `(${index + 1} of ${count})` : "(no images)"}
          </DialogTitle>
        </DialogHeader>

        {count === 0 ? (
          <div className="flex h-80 flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="size-8" aria-hidden="true" />
            <p className="text-sm">This product has no images.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-6">
            {/* -------------------------------------------------- main stage */}
            <div className="relative flex h-[420px] items-center justify-center rounded-lg bg-muted/30">
              {count > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 size-10 -translate-y-1/2 rounded-full shadow-sm"
                  onClick={() => go(-1)}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </Button>
              )}

              {isVideoUrl(images[index]) ? (
                <video
                  key={images[index]}
                  src={imgUrl(images[index])}
                  className="max-h-full max-w-full object-contain p-6"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={imgUrl(images[index]) || "/placeholder.svg"}
                  alt={`${title || "Product"} image ${index + 1}`}
                  className="max-h-full max-w-full object-contain p-6"
                />
              )}

              {count > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 size-10 -translate-y-1/2 rounded-full shadow-sm"
                  onClick={() => go(1)}
                  aria-label="Next image"
                >
                  <ChevronRight className="size-5" aria-hidden="true" />
                </Button>
              )}
            </div>

            {/* ------------------------------------------------ thumbnails */}
            {count > 1 && (
              <div className="flex flex-wrap justify-center gap-3">
                {images.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={cn(
                      "relative size-16 overflow-hidden rounded-md border-2 bg-muted transition-colors",
                      i === index ? "border-primary" : "border-border hover:border-muted-foreground",
                    )}
                    aria-label={`View ${isVideoUrl(src) ? "video" : "image"} ${i + 1}`}
                    aria-current={i === index}
                  >
                    {isVideoUrl(src) ? (
                      <>
                        <video
                          src={imgUrl(src)}
                          className="size-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="flex size-6 items-center justify-center rounded-full bg-background/80 text-foreground">
                            <Play className="size-3 translate-x-px" aria-hidden="true" />
                          </span>
                        </span>
                      </>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={imgUrl(src) || "/placeholder.svg"}
                        alt=""
                        className="size-full object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
