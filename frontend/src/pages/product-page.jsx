"use client"

import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useLocation, useParams } from "react-router-dom"
import "@fontsource-variable/cormorant-garamond"
import { ProductDetail, ProductDetailHeader } from "@/components/storefront/product-detail"
import { StorefrontProvider, useStorefront } from "@/components/storefront/storefront-context"
import { useStorefrontProduct } from "@/hooks/use-storefront-products"

/* ---------------------------------------------------------------------------
   Product page (/product/:alias). Reuses the resolved storefront header from
   the canvas and fetches the full product from the public catalog feed. Mirrors
   mirakijewels.com/en/product/<alias>.
--------------------------------------------------------------------------- */

function ProductContent() {
  const { alias } = useParams()
  // Resolve the product _id from router state (passed by the card that
  // navigated here) so the detail fetch is addressed by id. On a refresh/direct
  // visit router state is gone and there's no id yet — the hook then falls back
  // to the server's alias lookup. We intentionally do NOT read the catalog list
  // here: doing so triggered an extra get-allproducts request and a second
  // detail fetch (alias → id) once the list resolved. The URL stays /product/:alias.
  const { state } = useLocation()
  const resolvedId = state?.productId || null

  const { canvas, substore } = useStorefront()
  const { product, isLoading, error } = useStorefrontProduct(alias, resolvedId)

  useEffect(() => {
    const store = substore?.settings?.storeName || "Miraki Jewels"
    document.title = product?.name ? `${product.name} — ${store}` : `Product — ${store}`
  }, [product?.name, substore?.settings?.storeName])

  const headerProps = canvas?.sections?.find((s) => s.type === "header")?.props ?? {}

  return (
    <div className="min-h-screen bg-sf-paper text-sf-ink" dir={substore?.rtl ? "rtl" : "ltr"}>
      <ProductDetailHeader headerProps={headerProps} />

      {isLoading ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-sf-brand" aria-label="Loading product" />
        </div>
      ) : error || !product ? (
        <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="font-sf-display text-2xl text-sf-ink">We couldn&apos;t find that piece</h1>
          <p className="text-sf-muted">It may no longer be available. Browse the full collection instead.</p>
          <a
            href="/jewelry"
            className="border border-sf-brand px-6 py-2.5 text-sm tracking-widest text-sf-brand uppercase transition-colors hover:bg-sf-brand hover:text-sf-brand-foreground"
          >
            Back to Jewelry
          </a>
        </div>
      ) : (
        <ProductDetail product={product} />
      )}
    </div>
  )
}

export default function ProductPage() {
  return (
    <StorefrontProvider>
      <main>
        <ProductContent />
      </main>
    </StorefrontProvider>
  )
}
