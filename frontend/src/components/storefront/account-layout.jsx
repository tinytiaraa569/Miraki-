"use client"

import { useEffect } from "react"
import { SECTION_REGISTRY } from "@/components/storefront/sections"
import { StorefrontProvider, useStorefront } from "@/components/storefront/storefront-context"
import { CartDrawer } from "@/components/storefront/cart-drawer"
import { AccountSidebar } from "@/components/storefront/account-sidebar"



function AccountShell({ title, onSignOut, children }) {
  const { canvas, substore } = useStorefront()

  useEffect(() => {
    document.title = substore?.settings?.storeName
      ? `${title} — ${substore.settings.storeName}`
      : `${title} — Miraki Jewels`
  }, [substore?.settings?.storeName, title])

  const Header = SECTION_REGISTRY.header
  const Footer = SECTION_REGISTRY.footer
  const headerProps = canvas?.sections?.find((s) => s.type === "header")?.props ?? {}
  const footerProps = canvas?.sections?.find((s) => s.type === "footer")?.props ?? {}

  return (
    <div className="min-h-screen bg-white text-sf-ink" dir={substore?.rtl ? "rtl" : "ltr"}>
      <Header {...headerProps} />

      <div className="mx-auto flex max-w-7xl py-12 xl:py-18 flex-col md:flex-row">
        <AccountSidebar onSignOut={onSignOut} />
        <div className="min-w-0 flex-1 px-6 py-8 lg:px-10">{children}</div>
      </div>

      <Footer {...footerProps} />
    </div>
  )
}

export function AccountLayout({ title, onSignOut, children }) {
  return (
    <StorefrontProvider>
      <main>
        <AccountShell title={title} onSignOut={onSignOut}>
          {children}
        </AccountShell>
      </main>
      <CartDrawer />
    </StorefrontProvider>
  )
}