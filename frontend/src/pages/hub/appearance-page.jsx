"use client"

import { AppearancePanel } from "@/components/hub/appearance-panel"

/**
 * /hub/advanced/appearance — tweakcn-style dashboard theme editor.
 * The theme lives in its OWN SellerTheme collection (linked by sellerId),
 * completely separate from the business profile / seller document.
 */
export function HubAppearancePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-balance text-foreground md:text-2xl">Dashboard Appearance</h1>
        <p className="text-sm text-muted-foreground">
          Pick a built-in theme or fine-tune colors, fonts, and radius in the editor — changes preview live and apply for your whole team.
        </p>
      </div>
      <AppearancePanel />
    </div>
  )
}

export default HubAppearancePage
