// Central navigation model for the Seller Hub dashboard.
// Every entry has a real URL so the whole panel is deep-linkable.
// Defined once at module scope — never re-created on render.

import {
  LayoutDashboard,
  Store,
  GitBranch,
  Users,
  Building2,
  Boxes,
  PackagePlus,
  Package,
  Layers,
  Tag,
  FolderOpen,
  SlidersHorizontal,
  Star,
  List,
  Link as LinkIcon,
  FileCode,
  Gem,
  Filter,
  Megaphone,
  Settings2,
  BadgePercent,
  TicketPercent,
  Mail,
  ShoppingCart,
  Receipt,
  FileUser,
  FileText,
  Heart,
  RotateCcw,
  RotateCw,
  Gauge,
  UserPlus,
  UserCog,
  ShieldHalf,
  KeyRound,
  ScrollText,
  Globe,
  Image,
  Navigation2,
  MailPlus,
  Files,
  FileInput,
  Palette,
  Newspaper,
  MessageSquare,
  Handshake,
  Wallet,
  Settings,
  Shield,
  CreditCard,
  Sliders,
  Briefcase,
  Key,
  ShieldCheck,
  UserPen,
} from "lucide-react"

export const SELLER_NAV = [
  { title: "Dashboard", url: "/hub", icon: LayoutDashboard },
  {
    title: "My Stores",
    icon: Store,
    items: [
      { title: "Main Store", url: "/hub/stores", icon: Store },
      { title: "Substores", url: "/hub/stores/substores", icon: Building2 },
      { title: "Store Variants", url: "/hub/stores/variants", icon: GitBranch },
      { title: "Store Permissions", url: "/hub/stores/permissions", icon: Key },
      { title: "Store Roles", url: "/hub/stores/roles", icon: ShieldCheck },
      { title: "Store Admins", url: "/hub/stores/admins", icon: UserPen },
    ],
  },
  { title: "Team", url: "/hub/team", icon: Users },
  { title: "Business Profile", url: "/hub/profile", icon: Building2 },
  {
    title: "Products",
    icon: Boxes,
    items: [
      { title: "Create Product", url: "/hub/products/create", icon: PackagePlus },
      { title: "Products", url: "/hub/products", icon: Package },
      { title: "Categories", url: "/hub/products/categories", icon: Layers },
      { title: "Brands", url: "/hub/products/brands", icon: Tag },
      { title: "Collections", url: "/hub/products/collections", icon: FolderOpen },
      { title: "Option Sets", url: "/hub/products/option-sets", icon: SlidersHorizontal },
      { title: "Reviews", url: "/hub/products/reviews", icon: Star },
      { title: "Product Variants", url: "/hub/products/variants", icon: List },
      { title: "Linked Products", url: "/hub/products/linked", icon: LinkIcon },
      { title: "Digital Products", url: "/hub/products/digital", icon: FileCode },
    ],
  },
  {
    title: "Diamonds",
    icon: Gem,
    items: [
      { title: "Create Diamond", url: "/hub/diamonds/create", icon: Gem },
      { title: "Diamond Products", url: "/hub/diamonds", icon: Package },
      { title: "Diamond Categories", url: "/hub/diamonds/categories", icon: Layers },
      { title: "Diamond Collections", url: "/hub/diamonds/collections", icon: FolderOpen },
      { title: "Diamond Option Sets", url: "/hub/diamonds/option-sets", icon: SlidersHorizontal },
      { title: "Diamond Filter Sets", url: "/hub/diamonds/filter-sets", icon: Filter },
      { title: "Diamond Variants", url: "/hub/diamonds/variants", icon: List },
    ],
  },
  {
    title: "Marketing",
    icon: Megaphone,
    items: [
      { title: "Marketing Tools", url: "/hub/marketing/tools", icon: Settings2 },
      { title: "Discounts", url: "/hub/marketing/discounts", icon: BadgePercent },
      { title: "Coupons", url: "/hub/marketing/coupons", icon: TicketPercent },
      { title: "Subscribers", url: "/hub/marketing/subscribers", icon: Mail },
    ],
  },
  {
    title: "Orders",
    icon: ShoppingCart,
    items: [
      { title: "Orders", url: "/hub/orders", icon: Receipt },
      { title: "B2B Enquiries", url: "/hub/orders/b2b", icon: FileUser },
      { title: "Abandoned Checkouts", url: "/hub/orders/abandoned", icon: ShoppingCart },
      { title: "Brief Orders", url: "/hub/orders/brief", icon: FileText },
      { title: "Wishlists", url: "/hub/orders/wishlists", icon: Heart },
      { title: "Returns", url: "/hub/orders/returns", icon: RotateCcw },
      { title: "Refunds", url: "/hub/orders/refunds", icon: RotateCw },
    ],
  },
  {
    title: "Customers",
    icon: Users,
    items: [
      { title: "Customers", url: "/hub/customers", icon: Users },
      { title: "Customer Groups", url: "/hub/customers/groups", icon: Users },
      { title: "Customer Wishlists", url: "/hub/customers/wishlists", icon: Heart },
      { title: "Limits", url: "/hub/customers/limits", icon: Gauge },
    ],
  },
  {
    title: "Staff",
    icon: UserPlus,
    items: [
      { title: "Staff Members", url: "/hub/staff", icon: UserCog },
      { title: "Roles", url: "/hub/staff/roles", icon: ShieldHalf },
      { title: "Permissions", url: "/hub/staff/permissions", icon: KeyRound },
      { title: "Activity Logs", url: "/hub/staff/logs", icon: ScrollText },
    ],
  },
  {
    title: "Site",
    icon: Globe,
    items: [
      { title: "Slides", url: "/hub/site/slides", icon: Image },
      { title: "Navigation", url: "/hub/site/navigation", icon: Navigation2 },
      { title: "Emails", url: "/hub/site/emails", icon: MailPlus },
      { title: "Banners", url: "/hub/site/banners", icon: Image },
      { title: "Pages", url: "/hub/site/pages", icon: FileText },
      { title: "Files", url: "/hub/site/files", icon: Files },
      { title: "Forms", url: "/hub/site/forms", icon: FileInput },
      { title: "Themes", url: "/hub/site/themes", icon: Palette },
      { title: "Blogs", url: "/hub/site/blogs", icon: Newspaper },
      { title: "Blog Posts", url: "/hub/site/blog-posts", icon: FileText },
      { title: "Blog Comments", url: "/hub/site/blog-comments", icon: MessageSquare },
    ],
  },
  {
    title: "Affiliates",
    icon: Handshake,
    items: [
      { title: "Affiliate Plans", url: "/hub/affiliates/plans", icon: Handshake },
      { title: "Affiliates", url: "/hub/affiliates", icon: Users },
      { title: "Payouts", url: "/hub/affiliates/payouts", icon: Wallet },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    items: [
      { title: "General", url: "/hub/settings", icon: Settings },
      { title: "Security", url: "/hub/settings/security", icon: Shield },
      { title: "Payments", url: "/hub/settings/payments", icon: CreditCard },
    ],
  },
  { title: "Logs", url: "/hub/logs", icon: ScrollText },
  {
    title: "Advanced",
    icon: Sliders,
    items: [
      { title: "Dashboard Appearance", url: "/hub/advanced/appearance", icon: LayoutDashboard },
      { title: "Business Mode", url: "/hub/advanced/business-mode", icon: Briefcase },
    ],
  },
]

/** True when `pathname` is inside `url` ("/hub" only matches exactly). */
export function isPathActive(pathname, url) {
  if (!url) return false
  if (url === "/hub") return pathname === "/hub"
  return pathname === url || pathname.startsWith(`${url}/`)
}

/**
 * Among sibling links, only the DEEPEST (longest) matching URL is active.
 * Prevents "/hub/stores" (Main Store) from also lighting up when the path
 * is "/hub/stores/variants" (Store Variants).
 */
export function activeChildUrl(pathname, items = []) {
  let best = null
  for (const c of items) {
    if (!isPathActive(pathname, c.url)) continue
    if (!best || c.url.length > best.length) best = c.url
  }
  return best
}

/**
 * Resolves the nav entry (and parent, when nested) for a pathname.
 * Used for breadcrumbs and module page titles.
 */
export function findNavMatch(pathname) {
  for (const item of SELLER_NAV) {
    if (item.items) {
      // Prefer the deepest (longest) child match so "/hub/products/create"
      // resolves to "Create Product", not "Products".
      const child = [...item.items]
        .sort((a, b) => b.url.length - a.url.length)
        .find((c) => isPathActive(pathname, c.url))
      if (child) return { parent: item, item: child }
    } else if (isPathActive(pathname, item.url)) {
      return { parent: null, item }
    }
  }
  return null
}
