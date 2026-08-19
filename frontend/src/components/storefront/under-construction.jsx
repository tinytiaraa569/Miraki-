"use client"

import "@fontsource-variable/cormorant-garamond"
import { imgUrl } from "@/Server"

// ---------------------------------------------------------------------------
// UNDER-CONSTRUCTION SCREEN — shown in place of the public storefront when
// General Settings → "Enable under-construction page" is on. Gated inside
// StorefrontProvider, which wraps ONLY the public storefront routes, so the
// dashboard (/hub) is never affected and the merchant can always switch this
// back off. When a banner image is set we show it full-screen (StoreHippo-style);
// otherwise a clean branded message.
// ---------------------------------------------------------------------------
export function UnderConstruction({ imageUrl, title = "Miraki Jewels" }) {
  const src = imageUrl ? imgUrl(imageUrl) : null

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-sf-bg px-6 py-16 text-center text-sf-ink">
      {src ? (
        <img
          src={src}
          alt={`${title} — under construction`}
          className="max-h-[80vh] w-auto max-w-full object-contain"
        />
      ) : (
        <>
          <h1 className="font-sf-display text-4xl font-medium tracking-tight sm:text-5xl">{title}</h1>
          <p className="max-w-md text-base text-sf-muted sm:text-lg">
            {"We're putting the finishing touches on our store. Please check back soon."}
          </p>
        </>
      )}
    </main>
  )
}
