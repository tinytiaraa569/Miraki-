"use client"

import { useEffect } from "react"
import "@fontsource-variable/cormorant-garamond"
import { SECTION_REGISTRY } from "@/components/storefront/sections"
import { StorefrontProvider, useStorefront } from "@/components/storefront/storefront-context"
import { useStorefrontProducts } from "@/hooks/use-storefront-products"
import { CartDrawer } from "@/components/storefront/cart-drawer"
/* ---------------------------------------------------------------------------
   Jewelry page (/jewelry). Mirrors the first section of
   mirakijewels.com/en/browse/jewelry: the store header followed by the
   full-bleed "LUXURY WITH LEGACY" banner. The header props are read from the
   already-resolved storefront canvas (SWR-cached, deduped) so this page reuses
   the same warm payload as the home page and paints instantly.
--------------------------------------------------------------------------- */

function JewelryContent() {
  const { canvas, substore , locale } = useStorefront()
  const { products: liveProducts, isLoading: productsLoading } = useStorefrontProducts()


  useEffect(() => {
    document.title = substore?.settings?.storeName
      ? `Jewelry — ${substore.settings.storeName}`
      : "Jewelry — Miraki Jewels"
  }, [substore?.settings?.storeName])

  const Header = SECTION_REGISTRY.header
  const Banner = SECTION_REGISTRY.banner
  const CollectionShowcase = SECTION_REGISTRY.collectionShowcase
  const JewelryCollection = SECTION_REGISTRY.productGrid
  const headerProps = canvas?.sections?.find((s) => s.type === "header")?.props ?? {}
  // The browsable collection grid reuses the country-aware product + tab data
  // already present in the canvas's productCarousel section.
  const carouselProps = canvas?.sections?.find((s) => s.type === "productCarousel")?.props
  const gridProducts = liveProducts.length ? liveProducts : carouselProps?.products ?? []

  return (
    <div className="min-h-screen bg-sf-bg text-sf-ink" dir={substore?.rtl ? "rtl" : "ltr"}>
      <Header {...headerProps} locale={locale} />
      <Banner
        headline="Luxury With Legacy"
        image="https://www.mirakijewels.com/s/64e6f45eeac997e94ec94eb1/6811df962cd3422636e78512/miraki6350-banner.jpg"
        imageAlt="Model in a burgundy silk blouse wearing gold and diamond bracelets against a soft grey backdrop"
      />
      <CollectionShowcase />
       <JewelryCollection tabs={carouselProps?.tabs ?? []} products={gridProducts} loading={productsLoading} locale={locale} />

    </div>
  )
}

export default function JewelryPage() {
  return (
    <StorefrontProvider>

      <main>
        <JewelryContent />
      </main>
      <CartDrawer/>
    </StorefrontProvider>
  )
}
