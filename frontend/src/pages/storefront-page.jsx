"use client"

import { useEffect } from "react"
import "@fontsource-variable/cormorant-garamond"
import { SECTION_REGISTRY } from "@/components/storefront/sections"
import { StorefrontProvider, useStorefront } from "@/components/storefront/storefront-context"
import { CartProvider } from "@/components/storefront/cart-context"
import { CartDrawer } from "@/components/storefront/cart-drawer"

/** Lightweight skeleton shown only on the very first cold load. */
function StorefrontSkeleton() {
  return (
    <div className="min-h-screen bg-sf-bg" aria-busy="true" aria-label="Loading store">
      <div className="h-8 w-full animate-pulse bg-sf-brand/20" />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <div className="h-5 w-48 animate-pulse rounded bg-sf-surface" />
        <div className="h-8 w-36 animate-pulse rounded bg-sf-surface" />
        <div className="h-5 w-48 animate-pulse rounded bg-sf-surface" />
      </div>
      <div className="h-[70vh] w-full animate-pulse bg-sf-surface lg:h-[85vh]" />
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-16 lg:grid-cols-4 lg:px-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] animate-pulse bg-sf-surface" />
        ))}
      </div>
    </div>
  )
}

function CanvasRenderer() {
  const { canvas, substore, isLoading, error ,locale} = useStorefront()

  // Per-substore document title (e.g. "Miraki Jewels — Oman").
  useEffect(() => {
    if (substore?.settings?.pageTitle) document.title = substore.settings.pageTitle
  }, [substore?.settings?.pageTitle])

  if (isLoading) return <StorefrontSkeleton />

  if (error || !canvas) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-sf-bg px-4 text-center">
        <h1 className="font-sf-display text-3xl text-sf-ink">Miraki Jewels</h1>
        <p className="text-sf-muted">{"The store is momentarily unavailable. Please refresh in a moment."}</p>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-sf-bg text-sf-ink" dir={substore?.rtl ? "rtl" : "ltr"}>
      {canvas.sections.map((section, i) => {
        const Component = SECTION_REGISTRY[section.type]
        if (!Component) return null
        return <Component key={`${section.type}-${i}`} {...section.props} locale={locale} />
      })}
    </div>
  )
}

export default function StorefrontPage() {
  return (
    <StorefrontProvider>
      <CartProvider>

      <main>
        <CanvasRenderer />
      </main>
         <CartDrawer/>
      </CartProvider>
    </StorefrontProvider>
  )
}