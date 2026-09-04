"use client"

import { useEffect } from "react"
import "@fontsource-variable/cormorant-garamond"
import { SECTION_REGISTRY , TermsAndConditions} from "@/components/storefront/sections"
import { StorefrontProvider, useStorefront } from "@/components/storefront/storefront-context"
import { CartDrawer } from "@/components/storefront/cart-drawer"



function TermsContent() {
  const { canvas, substore } = useStorefront()

  useEffect(() => {
    document.title = substore?.settings?.storeName
      ? `Terms & Conditions — ${substore.settings.storeName}`
      : "Terms & Conditions — Miraki Jewels"
  }, [substore?.settings?.storeName])

  const Header = SECTION_REGISTRY.header
  const Footer = SECTION_REGISTRY.footer
  // const TermsAndConditions = SECTION_REGISTRY.termsAndConditions

  const headerProps = canvas?.sections?.find((s) => s.type === "header")?.props ?? {}
  const footerProps = canvas?.sections?.find((s) => s.type === "footer")?.props ?? {}
  const termsProps = canvas?.sections?.find((s) => s.type === "termsAndConditions")?.props ?? {}

  return (
    <div className="min-h-screen bg-sf-bg text-sf-ink" dir={substore?.rtl ? "rtl" : "ltr"}>
      <Header {...headerProps} />
      <TermsAndConditions {...termsProps} />
      <Footer {...footerProps} />
    </div>
  )
}

export default function TermsPage() {
  return (
    <StorefrontProvider>
      <main>
        <TermsContent />
      </main>
      <CartDrawer />
    </StorefrontProvider>
  )
}