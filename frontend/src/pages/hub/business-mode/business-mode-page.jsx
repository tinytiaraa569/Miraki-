"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { toast } from "sonner"
import {
  BadgePercent,
  Boxes,
  Briefcase,
  Building2,
  CheckSquare,
  CircleDot,
  CreditCard,
  DollarSign,
  Eye,
  EyeOff,
  Gauge,
  Gem,
  Heart,
  Landmark,
  Lock,
  MapPin,
  MessageSquare,
  Package,
  Percent,
  RefreshCw,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tag,
  Unlock,
  UserCheck,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, fetcher } from "@/lib/api"
import { cn } from "@/lib/utils"


const MODE_CARDS = [
  {
    mode: "B2B",
    icon: Briefcase,
    title: "B2B Mode",
    subtitle: "Business to Business",
    description: "Ideal for wholesale operations, distributors, and businesses selling to other businesses.",
    chips: [
      { icon: Lock, label: "Login Required" },
      { icon: EyeOff, label: "Hide Prices" },
      { icon: Package, label: "Bulk Orders" },
      { icon: Landmark, label: "Credit Terms" },
    ],
  },
  {
    mode: "B2C",
    icon: ShoppingBag,
    title: "B2C Mode",
    subtitle: "Business to Consumer",
    description: "Perfect for retail stores selling directly to end consumers with individual purchases.",
    chips: [
      { icon: Unlock, label: "Guest Checkout" },
      { icon: Eye, label: "Show Prices" },
      { icon: Heart, label: "Wishlist" },
      { icon: Star, label: "Reviews" },
    ],
  },
]

const B2B_TABS = {
  access: {
    label: "Access Control",
    icon: Lock,
    groups: [
      {
        title: "Login Requirements",
        icon: UserCheck,
        description: "Control what requires user authentication",
        fields: [
          { key: "loginMandatoryToViewProducts", label: "Login Required to View Products", description: "Users must login to see product catalog", icon: Eye },
          { key: "loginMandatoryToViewPrices", label: "Login Required to View Prices", description: "Prices hidden until user logs in", icon: DollarSign },
          { key: "loginMandatoryForCheckout", label: "Login Required for Checkout", description: "Must be logged in to access checkout", icon: ShoppingCart },
          { key: "loginMandatoryForPayment", label: "Login Required for Payment", description: "Must be logged in to complete payment", icon: CreditCard },
          { key: "loginRequiredForCartItems", label: "Login Required for Cart Items", description: "Must be logged in to add items to cart", icon: CheckSquare },
        ],
      },
      {
        title: "Guest Access",
        icon: Users,
        description: "Control guest user permissions",
        fields: [
          { key: "allowGuestCheckout", label: "Allow Guest Checkout", description: "Guests can complete purchases without account", icon: Lock },
          { key: "allowGuestToViewProducts", label: "Allow Guest to View Products", description: "Guests can browse the product catalog", icon: Eye },
          { key: "allowGuestToAddToCart", label: "Allow Guest to Add to Cart", description: "Guests can add items to shopping cart", icon: ShoppingCart },
          { key: "allowGuestToWishlist", label: "Allow Guest to Wishlist", description: "Guests can add items to wishlist", icon: Heart },
          { key: "requireCompanyRegistration", label: "Require Company Registration", description: "Customers must register their business", icon: Building2 },
          { key: "requireApprovalForOrders", label: "Require Approval for Orders", description: "Orders need admin approval", icon: ShieldCheck },
        ],
      },
    ],
  },
  pricing: {
    label: "Pricing",
    icon: DollarSign,
    groups: [
      {
        title: "Price Visibility",
        icon: Eye,
        description: "Control what pricing information is shown",
        fields: [
          { key: "showWholesalePricing", label: "Show Wholesale Pricing", description: "Display wholesale price tiers", icon: Tag },
          { key: "hideRetailPrices", label: "Hide Retail Prices", description: "Never show retail/list prices", icon: EyeOff },
          { key: "showPriceAfterLogin", label: "Show Price After Login", description: "Reveal prices only once logged in", icon: Lock },
          { key: "hidePricesForGuest", label: "Hide Prices for Guest", description: "Guests never see any pricing", icon: EyeOff },
          { key: "showDiscountPercentage", label: "Show Discount Percentage", description: "Display % off on discounted items", icon: Percent },
          { key: "showTaxDetails", label: "Show Tax Details", description: "Break out tax on product & cart pages", icon: Landmark },
          { key: "showJewelryPrice", label: "Show Jewelry Price", description: "Display jewelry making charges", icon: Tag },
          // { key: "showDiamondPrice", label: "Show Diamond Price", description: "Display diamond pricing breakdown", icon: Tag },
        ],
      },
      {
        title: "Credit Terms",
        icon: Landmark,
        description: "Configure credit-based ordering",
        fields: [
          { key: "enableCreditTerms", label: "Enable Credit Terms", description: "Allow orders against a credit limit", icon: Landmark },
          { key: "creditLimit", label: "Credit Limit", description: "Maximum outstanding credit per buyer", icon: DollarSign, type: "number" },
          { key: "paymentTermsDays", label: "Payment Terms (Days)", description: "Days allowed before payment is due", icon: Gauge, type: "number" },
        ],
      },
    ],
  },
  features: {
    label: "Features",
    icon: Star,
    groups: [
      {
        title: "Ordering",
        icon: ShoppingCart,
        description: "Bulk and repeat ordering behavior",
        fields: [
          { key: "allowBulkOrdering", label: "Allow Bulk Ordering", description: "Enable multi-line bulk order entry", icon: Package },
          { key: "minimumOrderQuantity", label: "Minimum Order Quantity", description: "Lowest quantity allowed per order", icon: Gauge, type: "number" },
          { key: "minimumOrderValue", label: "Minimum Order Value", description: "Lowest order value allowed", icon: DollarSign, type: "number" },
          { key: "enableReorderFeature", label: "Enable Reorder Feature", description: "Let buyers repeat a past order", icon: RefreshCw },
          { key: "enableQuoteRequests", label: "Enable Quote Requests", description: "Buyers can request custom quotes", icon: MessageSquare },
        ],
      },
      {
        title: "Storefront",
        icon: Boxes,
        description: "General storefront capabilities",
        fields: [
          { key: "enableWishlist", label: "Enable Wishlist", description: "Buyers can save items for later", icon: Heart },
          { key: "enableProductReviews", label: "Enable Product Reviews", description: "Allow ratings & reviews on products", icon: Star },
          { key: "showStockAvailability", label: "Show Stock Availability", description: "Display live stock levels", icon: Boxes },
          { key: "enableMultipleShippingAddresses", label: "Multiple Shipping Addresses", description: "Buyers can save several ship-to addresses", icon: MapPin },
        ],
      },
    ],
  },
  visibility: {
    label: "Visibility",
    icon: Eye,
    groups: [
      {
        title: "Checkout Flow",
        icon: ShoppingCart,
        description: "Show or hide checkout-flow pages",
        fields: [
          { key: "showCheckoutPage", label: "Show Checkout Page", description: "Enable the checkout step", icon: ShoppingCart },
          { key: "showPaymentPage", label: "Show Payment Page", description: "Enable the payment step", icon: CreditCard },
          { key: "showCartSummary", label: "Show Cart Summary", description: "Display cart summary panel", icon: CheckSquare },
          { key: "showOrderHistory", label: "Show Order History", description: "Let buyers view past orders", icon: Boxes },
        ],
      },
    ],
  },
}

const B2C_TABS = {
  access: {
    label: "Access Control",
    icon: Lock,
    groups: [
      {
        title: "Login Requirements",
        icon: UserCheck,
        description: "Control what requires user authentication",
        fields: [
          { key: "loginMandatoryToViewProducts", label: "Login Required to View Products", description: "Users must login to see product catalog", icon: Eye },
          { key: "loginMandatoryToViewPrices", label: "Login Required to View Prices", description: "Prices hidden until user logs in", icon: DollarSign },
          { key: "loginMandatoryForCheckout", label: "Login Required for Checkout", description: "Must be logged in to access checkout", icon: ShoppingCart },
          { key: "loginMandatoryForPayment", label: "Login Required for Payment", description: "Must be logged in to complete payment", icon: CreditCard },
          { key: "loginMandatoryForWishlist", label: "Login Required for Wishlist", description: "Must be logged in to access wishlist", icon: Heart },
        ],
      },
      {
        title: "Guest Access",
        icon: Users,
        description: "Control guest user permissions",
        fields: [
          { key: "allowGuestCheckout", label: "Allow Guest Checkout", description: "Guests can complete purchases without account", icon: Lock },
          { key: "allowGuestToViewProducts", label: "Allow Guest to View Products", description: "Guests can browse the product catalog", icon: Eye },
          { key: "allowGuestToAddToCart", label: "Allow Guest to Add to Cart", description: "Guests can add items to shopping cart", icon: ShoppingCart },
          { key: "allowGuestToWishlist", label: "Allow Guest to Wishlist", description: "Guests can add items to wishlist", icon: Heart },
        ],
      },
    ],
  },
  pricing: {
    label: "Pricing",
    icon: DollarSign,
    groups: [
      {
        title: "Price Visibility",
        icon: Eye,
        description: "Control what pricing information is shown",
        fields: [
          { key: "showRetailPricing", label: "Show Retail Pricing", description: "Display standard retail prices", icon: Tag },
          { key: "showPriceAfterLogin", label: "Show Price After Login", description: "Reveal prices only once logged in", icon: Lock },
          { key: "hidePricesForGuest", label: "Hide Prices for Guest", description: "Guests never see any pricing", icon: EyeOff },
          { key: "showDiscountPercentage", label: "Show Discount Percentage", description: "Display % off on discounted items", icon: Percent },
          { key: "showTaxDetails", label: "Show Tax Details", description: "Break out tax on product & cart pages", icon: Landmark },
          { key: "showComparePrice", label: "Show Compare-at Price", description: "Show strikethrough original price", icon: Tag },
          { key: "showJewelryPrice", label: "Show Jewelry Price", description: "Display jewelry making charges", icon: Tag },
        ],
      },
    ],
  },
  features: {
    label: "Features",
    icon: Star,
    groups: [
      {
        title: "Ordering",
        icon: ShoppingCart,
        description: "Order limits for retail checkout",
        fields: [
          { key: "minimumOrderValue", label: "Minimum Order Value", description: "Lowest order value allowed", icon: DollarSign, type: "number" },
          { key: "maximumOrderQuantity", label: "Maximum Order Quantity", description: "Highest quantity allowed per order", icon: Gauge, type: "number" },
          { key: "showCoupons", label: "Show Coupons", description: "Show available coupons in checkout", icon: BadgePercent },
        ],
      },
      {
        title: "Storefront",
        icon: Boxes,
        description: "General storefront capabilities",
        fields: [
          { key: "enableWishlist", label: "Enable Wishlist", description: "Shoppers can save items for later", icon: Heart },
          { key: "enableProductReviews", label: "Enable Product Reviews", description: "Allow ratings & reviews on products", icon: Star },
          { key: "showStockAvailability", label: "Show Stock Availability", description: "Display live stock levels", icon: Boxes },
          { key: "enableLoyaltyProgram", label: "Enable Loyalty Program", description: "Reward points on purchases", icon: Star },
          { key: "enableProductComparison", label: "Enable Product Comparison", description: "Let shoppers compare products side by side", icon: CheckSquare },
          { key: "enableRecentlyViewed", label: "Enable Recently Viewed", description: "Show a recently-viewed products rail", icon: RefreshCw },
        ],
      },
    ],
  },
  visibility: {
    label: "Visibility",
    icon: Eye,
    groups: [
      {
        title: "Checkout Flow",
        icon: ShoppingCart,
        description: "Show or hide checkout-flow pages",
        fields: [
          { key: "showCheckoutPage", label: "Show Checkout Page", description: "Enable the checkout step", icon: ShoppingCart },
          { key: "showPaymentPage", label: "Show Payment Page", description: "Enable the payment step", icon: CreditCard },
          { key: "showCartSummary", label: "Show Cart Summary", description: "Display cart summary panel", icon: CheckSquare },
          { key: "showOrderHistory", label: "Show Order History", description: "Let shoppers view past orders", icon: Boxes },
        ],
      },
    ],
  },
}

const TAB_ORDER = ["access", "pricing", "features", "visibility"]
const SAVE_DEBOUNCE_MS = 600

function SettingRow({ field, value, onToggle, onNumberChange }) {
  const Icon = field.icon

  if (field.type === "number") {
    return (
      <div className="flex items-center justify-between gap-4 py-2.5">
        <div className="flex items-start gap-2.5">
          <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-foreground">{field.label}</p>
            <p className="text-xs text-muted-foreground">{field.description}</p>
          </div>
        </div>
        <Input
          type="number"
          min={0}
          value={value ?? ""}
          onChange={(e) => onNumberChange(field.key, e.target.value)}
          className="h-8 w-24 text-right"
          aria-label={field.label}
        />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-base text-foreground">{field.label}</p>
          <p className="text-xs text-muted-foreground">{field.description}</p>
        </div>
      </div>
      <Switch checked={Boolean(value)} onCheckedChange={(v) => onToggle(field.key, v)} aria-label={field.label} />
    </div>
  )
}

function SettingsGroupCard({ group, settings, onToggle, onNumberChange }) {
  const GroupIcon = group.icon
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <GroupIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-foreground">{group.title}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{group.description}</p>
      </CardHeader>
      <CardContent className="divide-y divide-border pt-0">
        {group.fields.map((field) => (
          <SettingRow
            key={field.key}
            field={field}
            value={settings?.[field.key]}
            onToggle={onToggle}
            onNumberChange={onNumberChange}
          />
        ))}
      </CardContent>
    </Card>
  )
}

export function HubBusinessModePage() {
  const { data, isLoading, error, mutate } = useSWR("/seller/business-mode", fetcher, {
    revalidateOnFocus: false,
  })


  const [local, setLocal] = useState(null)
  const initializedRef = useRef(false)
  const pendingRef = useRef({})
  const timeoutRef = useRef(null)
  const [tab, setTab] = useState("access")

  useEffect(() => {
    if (data?.businessMode && !initializedRef.current) {
      setLocal(data.businessMode)
      initializedRef.current = true
    }
  }, [data])


  const flush = useCallback(async () => {
    const patch = pendingRef.current
    pendingRef.current = {}
    if (Object.keys(patch).length === 0) return
    try {
      await api.patch("/seller/business-mode", patch)
    } catch (err) {
      toast.error(err.message)
      initializedRef.current = false
      mutate()
    }
  }, [mutate])

  const queueSave = useCallback(
    (patch) => {
      pendingRef.current = { ...pendingRef.current, ...patch }
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(flush, SAVE_DEBOUNCE_MS)
    },
    [flush],
  )

  const saveNow = useCallback(
    (patch) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      pendingRef.current = { ...pendingRef.current, ...patch }
      return flush()
    },
    [flush],
  )

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    flush()
  }, [])

  const section = local?.mode === "B2C" ? "b2cSettings" : "b2bSettings"

  const handleModeChange = useCallback(
    async (nextMode) => {
      if (!local || local.mode === nextMode) return
      const prevMode = local.mode
      setLocal((prev) => ({ ...prev, mode: nextMode }))
      setTab("access")
      try {
        await saveNow({ mode: nextMode })
        toast.success(`Switched to ${nextMode} mode`)
      } catch {
        setLocal((prev) => ({ ...prev, mode: prevMode }))
      }
    },
    [local, saveNow],
  )

  const handleToggle = useCallback(
    (key, value) => {
      setLocal((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }))
      queueSave({ [section]: { [key]: value } })
    },
    [section, queueSave],
  )

  const handleNumberChange = useCallback(
    (key, raw) => {
      const value = raw === "" ? null : Number(raw)
      setLocal((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }))
      queueSave({ [section]: { [key]: value } })
    },
    [section, queueSave],
  )

  if (isLoading || !local) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
        <p className="text-sm font-medium text-foreground">Couldn&apos;t load business mode settings</p>
        <p className="max-w-sm text-sm text-muted-foreground">{error.message}</p>
      </div>
    )
  }

  const activeTabs = local.mode === "B2C" ? B2C_TABS : B2B_TABS
  const activeSettings = local[section]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-balance text-foreground md:text-2xl">Business Mode</h1>
        <p className="text-sm text-muted-foreground">
          Configure your store to operate in B2B (Business to Business) or B2C (Business to Consumer) mode.
        </p>
      </div>

      {/*  mode selector */}
      <div className="grid gap-4 md:grid-cols-2">
        {MODE_CARDS.map((card) => {
          const CardIcon = card.icon
          const active = local.mode === card.mode
          return (
            <button
              key={card.mode}
              type="button"
              onClick={() => handleModeChange(card.mode)}
              className={cn(
                "relative flex flex-col gap-6 rounded-xl border-2 bg-card p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "border-primary shadow-sm ring-1 ring-primary/20" : "border-border hover:border-primary/40",
              )}
            >
              {active && (
                <Badge className="absolute -top-2.5 right-4 gap-1 bg-primary text-primary-foreground hover:bg-primary">
                  <CircleDot className="size-3" aria-hidden="true" />
                  Active
                </Badge>
              )}
              <div className="flex items-center mb-4 gap-3">
                <span
                  className={cn(
                    "flex size-16 shrink-0 items-center justify-center rounded-lg",
                    active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  <CardIcon className="size-8" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xl font-semibold text-foreground">{card.title}</p>
                  <p className="text-md text-muted-foreground">{card.subtitle}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{card.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {card.chips.map((chip) => {
                  const ChipIcon = chip.icon
                  return (
                    <span
                      key={chip.label}
                      className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-1 text-[11px] text-muted-foreground"
                    >
                      <ChipIcon className="size-3" aria-hidden="true" />
                      {chip.label}
                    </span>
                  )
                })}
              </div>
            </button>
          )
        })}
      </div>

      {/*  mode settings */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Settings2 className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-foreground">{local.mode} Settings</h2>
          <Badge variant="outline" className="text-sm">
            {local.mode} Mode Active
          </Badge>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-4">
            {TAB_ORDER.map((key) => {
              const TabIcon = activeTabs[key].icon
              return (
                <TabsTrigger key={key} value={key} className="gap-1.5">
                  <TabIcon className="size-3.5" aria-hidden="true" />
                  {activeTabs[key].label}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {TAB_ORDER.map((key) => {
            const groups = activeTabs[key].groups
            return (
              <TabsContent key={key} value={key} className="mt-4">
                <div className={`grid gap-4 md:grid-cols-2`}>
                  {groups.map((group) => (
                    <SettingsGroupCard
                      key={group.title}
                      group={group}
                      settings={activeSettings}
                      onToggle={handleToggle}
                      onNumberChange={handleNumberChange}
                    />
                  ))}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </div>
  )
}

export default HubBusinessModePage