"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, Heart, Check, Loader2, Minus, Plus, ZoomIn } from "lucide-react"
import { SECTION_REGISTRY } from "@/components/storefront/sections"
import { ImageZoomLightbox } from "@/components/storefront/image-zoom-lightbox"
import { useStorefront } from "@/components/storefront/storefront-context"
import { useCart } from "@/hooks/cart/use-cart"
import { useWishlist } from "@/hooks/wishlist/use-wishlist"
import { useStorefrontVariantMedia } from "@/hooks/use-storefront-products"
import { isValueBearing } from "@/components/hub/option-sets/option-set-utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

/* ---------------------------------------------------------------------------
   ProductDetail — mirrors mirakijewels.com/en/product/<alias>: a breadcrumb, a
   script-styled product name, a gallery of the product's images on the left,
   and a "Customization / Description" panel on the right. The customization
   options are rendered LIVE from the product's own `options[]`, and the total
   price is recomputed from the selected options' price deltas.
--------------------------------------------------------------------------- */

// Charity choices shown beneath the purchase button. Each uses the brand's
// hand-drawn line-art SVG (icon + label baked in), matching mirakijewels.
const CHARITIES = [
  { id: "tree", label: "Plant a Tree", src: "/images/charity/plant-tree.svg" },
  { id: "education", label: "Kids Education", src: "/images/charity/kids-education.svg" },
  { id: "nursing", label: "Nursing Home", src: "/images/charity/nursing-home.svg" },
  { id: "shelter", label: "Children's Shelter", src: "/images/charity/children-shelter.svg" },
]

// A hover/focus tooltip bubble shown above swatch and image chips.
function SwatchTip({ label }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 scale-95 whitespace-nowrap rounded bg-sf-ink px-2 py-1 text-xs text-sf-paper opacity-0 shadow-lg transition-all duration-150 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
    >
      {label}
      <span className="absolute left-1/2 top-full size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-sf-ink" aria-hidden="true" />
    </span>
  )
}

// Decide how to render an option's values from the DATA, not just the declared
// type: picture chips when values carry an image, color circles when they carry
// a hex color, otherwise text chips (covers swatch/dropdown/radio labels like
// 10K / 14K / 18K or E / F / G / H).
function swatchKind(option) {
  const values = option.values || []
  if (option.type === "image" || values.some((v) => v.image)) return "image"
  if (values.some((v) => v.color)) return "color"
  return "pill"
}

function OptionAccordion({ option, selectedValue, onSelect }) {
  const [open, setOpen] = useState(false)
  const isText = option.type === "text" || option.type === "textarea"
  const chosen = (option.values || []).find((v) => v.value === selectedValue)
  const kind = swatchKind(option)
  const summary = isText ? (selectedValue || "").trim() : chosen?.label

  return (
    <div className="border-b border-[#740031] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center cursor-pointer justify-between py-4 text-left"
      >
        <span className="flex items-baselicne gap-2">
            <span className="font-sans text-base  capitalize text-sf-ink">{option.displayName || option.name}</span>
          {option.required ? <span className="text-sf-brand">*</span> : null}
        </span>
        <span className="flex items-center gap-3">
          {summary ? (
            <span className="max-w-[12rem] truncate text-sm font-semibold" style={{ color: "#740031" }}>
              {summary}
            </span>
          ) : null}
          <ChevronDown
            className={`size-4 shrink-0 text-sf-brand transition-transform duration-300 ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </span>
      </button>
      <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] pb-4 opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          {isText ? (
            option.type === "textarea" ? (
              <textarea
                rows={3}
                value={selectedValue || ""}
                onChange={(e) => onSelect(option.name, e.target.value)}
                placeholder={`Enter ${(option.displayName || option.name).toLowerCase()}`}
                className="w-full resize-y rounded-md border border-sf-brand/25 bg-transparent px-3 py-2 text-sm text-sf-ink outline-none transition-colors placeholder:text-sf-muted focus:border-sf-brand"
              />
            ) : (
              <input
                type="text"
                value={selectedValue || ""}
                onChange={(e) => onSelect(option.name, e.target.value)}
                placeholder={`Enter ${(option.displayName || option.name).toLowerCase()}`}
                className="w-full rounded-md border border-sf-brand/25 bg-transparent px-3 py-2 text-sm text-sf-ink outline-none transition-colors placeholder:text-sf-muted focus:border-sf-brand"
              />
            )
          ) : (
          <div className="flex flex-wrap gap-2">
            {(option.values || []).map((v) => {
              const on = v.value === selectedValue
              const src = typeof v.image === "object" ? v.image?.url : v.image

              // Color swatch — a 40px rounded-square tile filled with value.color.
              // Selected state lays a semi-transparent brand overlay with a
              // centered white check over the whole tile (matches mirakijewels).
              if (kind === "color") {
                return (
                  <span key={v.value} className="group relative inline-flex">
                    <SwatchTip label={v.label} />
                    <button
                      type="button"
                      onClick={() => onSelect(option.name, v.value)}
                      aria-pressed={on}
                      aria-label={v.label}
                      className="relative grid size-10 cursor-pointer place-items-center overflow-hidden rounded-md transition-transform hover:scale-105"
                    >
                      <span
                        className="absolute inset-0"
                        style={{ backgroundColor: v.color || "var(--color-sf-surface)" }}
                        aria-hidden="true"
                      />
                      {on ? (
                        <span className="absolute inset-0 grid place-items-center bg-sf-brand/50">
                          <Check className="size-5 text-sf-paper" aria-hidden="true" />
                        </span>
                      ) : null}
                    </button>
                  </span>
                )
              }

              // Image swatch — a 40px rounded-square tile with the picture as a
              // full-bleed background. Selected state overlays a semi-transparent
              // brand wash with a centered white check across the whole tile
              // (matches mirakijewels metal/diamond swatches exactly).
              if (kind === "image") {
                return (
                   <TooltipProvider key={v.value} delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => onSelect(option.name, v.value)}
                          aria-pressed={on}
                          aria-label={v.label}
                          className="relative grid size-10 cursor-pointer place-items-center overflow-hidden rounded-md transition-transform hover:scale-105"
                        >
                          <img
                            src={src || "/placeholder.svg"}
                            alt={v.label}
                            width="40"
                            height="40"
                            loading="lazy"
                            className="absolute inset-0 size-full object-cover"
                          />
                          {on ? (
                            <span className="absolute inset-0 grid place-items-center bg-sf-brand/50">
                              <Check className="size-5 text-sf-paper" aria-hidden="true" />
                            </span>
                          ) : null}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{v.label}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              }

              // Default — text option rendered as a 6px-radius rectangular button.
              // Active = filled brand, inactive = light outline with ink text.
              return (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => onSelect(option.name, v.value)}
                  aria-pressed={on}
                  className={`cursor-pointer rounded-md border px-3 py-1.5 text-base transition-colors ${
                    on
                      ? "border-sf-brand bg-sf-brand text-sf-brand-foreground"
                      : "border-sf-brand/20 text-sf-ink hover:border-sf-brand/50"
                  }`}
                >
                  {v.label}
                </button>
              )
            })}
          </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProductDetail({ product }) {
  const { formatPrice } = useStorefront()
  const { addItem } = useCart()
  const { toggle, isInWishlist } = useWishlist()
  const wished = isInWishlist(product._id || product.id)
  const [tab, setTab] = useState("customization")
  const [activeImg, setActiveImg] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [zoomIndex, setZoomIndex] = useState(0)
  const [budget, setBudget] = useState("")
  const [charity, setCharity] = useState("tree")
  const [quantity, setQuantity] = useState(1)
  const [addError, setAddError] = useState("")
  const [justAdded, setJustAdded] = useState(false)
  const scrollerRef = useRef(null)

  // Mobile carousel: keep the active dot in sync with the scroll position, and
  // let the arrows/dots scroll the strip to a given slide.
  const onScrollGallery = (e) => {
    const el = e.currentTarget
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    if (idx !== activeImg) setActiveImg(idx)
  }
  const scrollToImg = (i) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" })
    setActiveImg(i)
  }
  const openZoom = (i) => {
    setZoomIndex(i)
    setZoomOpen(true)
  }

  // Render options that carry selectable values, plus free-text options
  // (type "text"/"textarea") which use an input instead of value chips.
  const options = useMemo(
    () =>
      (product.options || []).filter(
        (o) => (o.values || []).length > 0 || o.type === "text" || o.type === "textarea",
      ),
    [product.options],
  ) 

  // Seed selections with each option's default (or first) value.
  const [selected, setSelected] = useState(() => {
    const init = {}
    for (const opt of product.options || []) {
      const def = (opt.values || []).find((v) => v.isDefault) || (opt.values || [])[0]
      if (def) init[opt.name] = def.value
    }
    return init
  })

  // Track whether the shopper has actually changed a selection. On first load
  // we show the PRODUCT's own gallery; only once they navigate/pick a variant
  // option do we resolve + show that variant's images.
  const [userInteracted, setUserInteracted] = useState(false)

  const onSelect = (name, value) => {
    setUserInteracted(true)
    setSelected((prev) => ({ ...prev, [name]: value }))
    if (addError) setAddError("")
  }

  // Variant-DEFINING options only: not "show always" (those are pure add-ons)
  // and value-bearing (a text/number field never defines a variant).
  const variantOptions = useMemo(
    () => (product.options || []).filter((o) => !o.showAlways && isValueBearing(o.type || "dropdown")),
    [product.options],
  )

  // Resolve the selected combo against the lightweight variant index shipped
  // with the product — INSTANT, no network request. We match by the variant's
  // labeled option PAIRS (name → value), not the joined `key`: the key is
  // order-dependent and can mismatch, whereas comparing each option by NAME is
  // robust to ordering. On first load (no interaction yet) we intentionally
  // return null so the product's own gallery is shown; a match (and its images)
  // only kicks in once the shopper changes a selection.
  const matchedVariant = useMemo(() => {
    if (!userInteracted || !variantOptions.length) return null

    // Every variant-defining option must have a selection (never a partial combo).
    const names = variantOptions.map((o) => o.name)
    for (const n of names) {
      if (selected[n] == null || selected[n] === "") return null
    }

    return (
      (product.variants || []).find((v) => {
        const opts = v.options || []
        // Match by name → value pairs. Fall back to the legacy key only when a
        // row carries no labeled options (older cached rows).
        if (opts.length) {
          return names.every((n) => {
            const pair = opts.find((o) => o.name === n)
            return pair && String(pair.value) === String(selected[n])
          })
        }
        const ordered = [...variantOptions].sort((a, b) => String(a.name).localeCompare(String(b.name)))
        return v.key === ordered.map((o) => String(selected[o.name])).join("|")
      }) || null
    )
  }, [product.variants, variantOptions, selected, userInteracted])

  // Q2 = "variant price only": show the matched variant's price exactly (no
  // add-on deltas). Falls back to the product base price when nothing matched.
  // Display-only — the charged price is recomputed server-side at checkout.
  const total =
    matchedVariant && matchedVariant.price != null ? matchedVariant.price : Number(product.price) || 0
  const installment = Math.round((total / 4) * 100) / 100

  // Lazy-load the matched variant's OWN gallery by id, but ONLY when the index
  // says it has one — otherwise we keep the product gallery and skip the request.
  const { images: variantImages, isLoading: variantLoading } = useStorefrontVariantMedia(
    product.alias,
    matchedVariant?.hasImage ? matchedVariant.id : null,
  )

  // Q1 = "replace whole gallery": swap in the variant's images when present,
  // otherwise keep the product's own gallery.
  const images = useMemo(() => {
    if (matchedVariant?.hasImage && variantImages.length) return variantImages
    return product.images?.length ? product.images : [{ url: product.mainImg || product.image, alt: product.name }]
  }, [matchedVariant, variantImages, product.images, product.mainImg, product.image, product.name])

  // Reset the active gallery slide whenever the image set swaps (variant change)
  // so the mobile carousel never points at an out-of-range index.
  const firstImageUrl = images[0]?.url
  useEffect(() => {
    setActiveImg(0)
  }, [firstImageUrl])
  const crumbs = ["Home", "Jewelry", product.tag || "Collection"].filter(Boolean)

  async function handleAddToCart() {
  setAddError("")
  setJustAdded(false)

  const selectedOptions = options.map((opt) => {
    const val = (opt.values || []).find((v) => v.value === selected[opt.name])
    console.log(opt,"options")
    return {
      name: opt.name,
      label: opt.displayName || opt.name,
      type:opt.type,
      value: selected[opt.name] ?? "",
      valueLabel: val?.label ?? selected[opt.name] ?? "",
    }
  })

  addItem(product, matchedVariant, quantity, selectedOptions, product.tag)
  setJustAdded(true)
}
  return (
    <div className="mx-auto max-w-[100rem] px-4 pb-20 pt-8 lg:px-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-sf-brand">
        <a href="/" className="hover:underline">Home</a>
        <span className="text-sf-brand/50">|</span>
        <a href="/jewelry" className="hover:underline">Jewelry</a>
        {product.tag ? (
          <>
            <span className="text-sf-brand/50">|</span>
            <span className="text-sf-muted">{product.tag}</span>
          </>
        ) : null}
      </nav>

      {/* Title row — hidden on mobile (the name renders below the gallery dots
          there); on sm+ a single hairline sits to the left of the name. */}
      <div className="mt-6 hidden items-center gap-6 sm:flex pb-4">
        <span className="h-px flex-1 bg-[#740031]" aria-hidden="true" />
        <h1 className="font-sf-display text-xl italic font-semibold tracking-wide text-[#740031] text-pretty text-right md:text-2xl">
          {product.name}
        </h1>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
        {/* Gallery */}
        <div className={`transition-opacity duration-200 ${variantLoading ? "opacity-60" : "opacity-100"}`}>
          {/* Mobile: a swipeable, snap-scrolling carousel with arrows + dots */}
          <div className="relative sm:hidden">
            <div
              ref={scrollerRef}
              onScroll={onScrollGallery}
              className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {images.map((img, i) => (
                <div key={img.url || i} className="w-full shrink-0 snap-center">
                   <button
                    type="button"
                    onClick={() => openZoom(i)}
                    aria-label={`Zoom ${img.alt || `${product.name} view ${i + 1}`}`}
                    className="block aspect-square w-full overflow-hidden bg-sf-surface"
                  >
                    <img
                      src={img.url || "/placeholder.svg"}
                      alt={img.alt || `${product.name} view ${i + 1}`}
                      width="700"
                      height="700"
                      loading={i === 0 ? "eager" : "lazy"}
                      decoding="async"
                      className="size-full object-cover"
                    />
                   </button>
                </div>
              ))}
            </div>

            {images.length > 1 ? (
              <>
                {activeImg > 0 ? (
                  <button
                    type="button"
                    onClick={() => scrollToImg(activeImg - 1)}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-sf-bg/80 text-sf-brand shadow backdrop-blur"
                  >
                    <ChevronLeft className="size-5" aria-hidden="true" />
                  </button>
                ) : null}
                {activeImg < images.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => scrollToImg(activeImg + 1)}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-sf-bg/80 text-sf-brand shadow backdrop-blur"
                  >
                    <ChevronRight className="size-5" aria-hidden="true" />
                  </button>
                ) : null}

                <div className="mt-4 flex items-center justify-center gap-2">
                  {images.map((img, i) => (
                    <button
                      key={img.url || i}
                      type="button"
                      onClick={() => scrollToImg(i)}
                      aria-label={`Go to image ${i + 1}`}
                      aria-current={i === activeImg}
                      className={`size-2 rounded-full transition-all ${
                        i === activeImg ? "w-5 bg-sf-brand" : "bg-sf-brand/30"
                      }`}
                    />
                  ))}
                </div>
              </>
            ) : null}

            {/* Mobile: product name sits below the image and dots */}
            <h1 className="mt-5 px-1 font-sf-display text-2xl italic tracking-wide text-[#740031] text-pretty">
              {product.name}
            </h1>
          </div>

          {/* Tablet/desktop: a two-column grid of every image */}
          <div className="hidden grid-cols-2 gap-4 sm:grid">
            {images.map((img, i) => (
                <button
                key={img.url || i}
                type="button"
                onClick={() => openZoom(i)}
                aria-label={`Zoom ${img.alt || `${product.name} view ${i + 1}`}`}
                className="group relative aspect-square cursor-zoom-in overflow-hidden bg-sf-surface"
              >
                <img
                  src={img.url || "/placeholder.svg"}
                  alt={img.alt || `${product.name} view ${i + 1}`}
                  width="700"
                  height="700"
                  loading={i < 2 ? "eager" : "lazy"}
                  decoding="async"
                   className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="pointer-events-none absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-sf-paper/85 text-sf-brand opacity-0 shadow-md backdrop-blur transition-opacity duration-200 group-hover:opacity-100">
                  <ZoomIn className="size-4" aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Customization / Description panel */}
        <div>
          <div role="tablist" aria-label="Product information" className="flex gap-10 border-b border-sf-brand/20">
            {[
              { id: "customization", label: "Customization" },
              { id: "description", label: "Description" },
            ].map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`-mb-px border-b-2 pb-3 font-sans text-lg font-medium transition-colors cursor-pointer ${
                  tab === t.id ? "border-[#740031] text-[#740031] font-semibold" : "border-transparent text-sf-muted hover:text-[#740031]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "customization" ? (
            <div className="mt-2">
              <label className="block border-b border-[#740031] py-4">
                <span className="sr-only">Budget amount</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="Budget Amount"
                  className="w-full bg-transparent font-sans text-md text-sf-ink outline-none placeholder:text-sf-muted"
                />
              </label>

              {options.map((opt) => (
                <OptionAccordion
                  key={opt.name}
                  option={opt}
                  selectedValue={selected[opt.name]}
                  onSelect={onSelect}
                />
              ))}

              {/* Quantity stepper */}
              <div className="flex items-center justify-between border-b border-sf-brand/15 py-4">
                <span className="font-sans text-base text-sf-ink">Quantity</span>
                <div className="flex items-center gap-2 rounded-md border border-sf-brand/25">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    className="grid size-8 cursor-pointer place-items-center text-sf-brand disabled:opacity-30"
                  >
                    <Minus className="size-3.5" aria-hidden="true" />
                  </button>
                  <span className="w-6 text-center text-sm text-sf-ink">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                    className="grid size-8 cursor-pointer place-items-center text-sf-brand"
                  >
                    <Plus className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <p className="mt-6 font-sans text-xl text-sf-ink font-medium">
                Total Price:{" "}
                <span className={`pl-1 text-[#740031] transition-opacity duration-200 ${variantLoading ? "opacity-40" : "opacity-100"}`}>
                  {formatPrice(total * quantity)}
                </span>
              </p>

              {addError ? <p className="mt-2 text-sm text-red-600">{addError}</p> : null}
              {justAdded && !addError ? <p className="mt-2 text-sm text-sf-brand">Added to cart</p> : null}

              <div className="mt-5 flex items-stretch gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="cursor-pointer flex-1 bg-sf-blush px-8 py-4 text-center text-md font-semibold tracking-widest text-black transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                  
                    "Purchase with Purpose"
                  
                </button>
               <button
                type="button"
                onClick={() => toggle(product)}
                aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={wished}
                className={`cursor-pointer grid w-16 place-items-center bg-sf-blush transition-opacity hover:opacity-90 ${
                  wished ? "text-red-900" : "text-black"
                }`}
              >
                <Heart className={`size-5 ${wished ? "fill-current" : ""}`} aria-hidden="true" />
              </button>
              </div>

              <p className="mt-4 pb-6 text-sm text-sf-muted">
                4 interest-free payments of <span className="font-medium text-sf-ink">{formatPrice(installment)}</span>{" "}
                with <span className="font-semibold text-sf-ink">Klarna</span> or{" "}
                <span className="font-semibold text-sf-ink">Affirm</span>
              </p>

              {/* Charity blurb — sits directly below the purchase button in the right column */}
              <section
                className="border-t pt-8 text-center"
                style={{ borderColor: "#740031" }}
              >
                <h2 className="font-sf-display text-2xl font-bold italic text-balance" style={{ color: "#cf9e97" }}>
                  A Purchase with a Purpose: Choose Your Charity
                </h2>
                <p className="mx-auto mt-4 max-w-lg font-sf-display text-lg italic leading-relaxed text-sf-ink text-pretty">
                  Our mission is to bring you beautiful, well-crafted jewelry that fully expresses who you are, from your
                  style to your soul, all while protecting our planet and uplifting our global neighbors.
                </p>

                <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
                  {CHARITIES.map(({ id, label, src }) => {
                    const on = charity === id
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => setCharity(id)}
                          aria-pressed={on}
                          aria-label={label}
                          className={`group flex w-full flex-col items-center rounded-xl p-3 outline-none transition-all duration-200 hover:-translate-y-0.5 ${
                            on ? "bg-sf-surface ring-1 ring-sf-brand/30" : "hover:bg-sf-surface/60"
                          }`}
                        >
                          <img
                            src={src || "/placeholder.svg"}
                            alt={label}
                            width="96"
                            height="96"
                            loading="lazy"
                            className={`h-20 w-auto transition-opacity ${on ? "opacity-100" : "opacity-80 group-hover:opacity-100"}`}
                          />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            </div>
          ) : (
            <div className="mt-6">
              {product.description ? (
                <div
                  className="prose-sf max-w-none leading-relaxed text-sf-muted [&_p]:mb-3"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="leading-relaxed text-sf-muted">No description available for this piece.</p>
              )}

              {product.specifications?.length ? (
                <dl className="mt-6 divide-y divide-sf-brand/15 border-t border-sf-brand/15">
                  {product.specifications.flatMap((g) =>
                    (g.rows || []).map((r) => (
                      <div key={`${g.type}-${r.label}`} className="flex items-center justify-between py-3">
                        <dt className="text-sm text-sf-muted">{r.label}</dt>
                        <dd className="text-sm text-sf-ink">
                          {r.value} {r.unit}
                        </dd>
                      </div>
                    )),
                  )}
                </dl>
              ) : null}
            </div>
          )}
        </div>
      </div>
      <ImageZoomLightbox
        open={zoomOpen}
        images={images}
        index={zoomIndex}
        onIndexChange={setZoomIndex}
        onClose={() => setZoomOpen(false)}
        productName={product.name}
      />
    </div>
  )
}

export function ProductDetailHeader({ headerProps }) {
  const Header = SECTION_REGISTRY.header
  return <Header {...headerProps} />
}