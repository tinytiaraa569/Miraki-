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
  Braces,
  Key,
  ShieldCheck,
  UserPen,
} from "lucide-react"

export const SELLER_NAV = [
  { title: "Dashboard", url: "/hub", icon: LayoutDashboard, permission: "dashboard.read" },
  {
    title: "My Stores",
    icon: Store,
    items: [
      { title: "Main Store", url: "/hub/stores", icon: Store, permission: "main_store.read" },
      { title: "Substores", url: "/hub/stores/substores", icon: Building2, permission: "substore.read" },
      { title: "Store Variants", url: "/hub/stores/variants", icon: GitBranch, permission: "store_variant.read" },
      { title: "Store Permissions", url: "/hub/stores/permissions", icon: Key, permission: "store_permission.read" },
      { title: "Store Roles", url: "/hub/stores/roles", icon: ShieldCheck, permission: "store_role.read" },
      { title: "Store Admins", url: "/hub/stores/admins", icon: UserPen, permission: "store_admin.read" },
    ],
  },
  { title: "Team", url: "/hub/team", icon: Users, permission: "team.read" },
  { title: "Business Profile", url: "/hub/profile", icon: Building2, permission: "business_profile.read" },
  {
    title: "Products",
    icon: Boxes,
    items: [
      { title: "Create Product", url: "/hub/products/create", icon: PackagePlus, permission: "product.write" },
      { title: "Products", url: "/hub/products", icon: Package, permission: "product.read" },
      { title: "Categories", url: "/hub/products/categories", icon: Layers, permission: "product_category.read" },
      { title: "Brands", url: "/hub/products/brands", icon: Tag, permission: "brand.read" },
      { title: "Collections", url: "/hub/products/collections", icon: FolderOpen, permission: "collection.read" },
      { title: "Option Sets", url: "/hub/products/option-sets", icon: SlidersHorizontal, permission: "option_set.read" },
      { title: "Reviews", url: "/hub/products/reviews", icon: Star, permission: "review.read" },
      { title: "Product Variants", url: "/hub/products/variants", icon: List, permission: "product_variant.read" },
      { title: "Linked Products", url: "/hub/products/linked", icon: LinkIcon, permission: "linked_product.read" },
      { title: "Digital Products", url: "/hub/products/digital", icon: FileCode, permission: "digital_product.read" },
    ],
  },
  {
    title: "Diamonds",
    icon: Gem,
    items: [
      { title: "Create Diamond", url: "/hub/diamonds/create", icon: Gem, permission: "diamond.write" },
      { title: "Diamond Products", url: "/hub/diamonds", icon: Package, permission: "diamond.read" },
      { title: "Diamond Categories", url: "/hub/diamonds/categories", icon: Layers, permission: "diamond_category.read" },
      { title: "Diamond Collections", url: "/hub/diamonds/collections", icon: FolderOpen, permission: "diamond_collection.read" },
      { title: "Diamond Option Sets", url: "/hub/diamonds/option-sets", icon: SlidersHorizontal, permission: "diamond_option_set.read" },
      { title: "Diamond Filter Sets", url: "/hub/diamonds/filter-sets", icon: Filter, permission: "diamond_filter_set.read" },
      { title: "Diamond Variants", url: "/hub/diamonds/variants", icon: List, permission: "diamond_variant.read" },
    ],
  },
  {
    title: "Marketing",
    icon: Megaphone,
    items: [
      { title: "Marketing Tools", url: "/hub/marketing/tools", icon: Settings2, permission: "marketing_tool.read" },
      { title: "Discounts", url: "/hub/marketing/discounts", icon: BadgePercent, permission: "discount.read" },
      { title: "Coupons", url: "/hub/marketing/coupons", icon: TicketPercent, permission: "coupon.read" },
      { title: "Subscribers", url: "/hub/marketing/subscribers", icon: Mail, permission: "subscriber.read" },
    ],
  },
  {
    title: "Orders",
    icon: ShoppingCart,
    items: [
      { title: "Orders", url: "/hub/orders", icon: Receipt, permission: "order.read" },
      { title: "B2B Enquiries", url: "/hub/orders/b2b", icon: FileUser, permission: "b2b_enquiry.read" },
      { title: "Abandoned Checkouts", url: "/hub/orders/abandoned", icon: ShoppingCart, permission: "abandoned_checkout.read" },
      { title: "Brief Orders", url: "/hub/orders/brief", icon: FileText, permission: "brief_order.read" },
      { title: "Wishlists", url: "/hub/orders/wishlists", icon: Heart, permission: "wishlist.read" },
      { title: "Returns", url: "/hub/orders/returns", icon: RotateCcw, permission: "return.read" },
      { title: "Refunds", url: "/hub/orders/refunds", icon: RotateCw, permission: "refund.read" },
    ],
  },
  {
    title: "Customers",
    icon: Users,
    items: [
      { title: "Customers", url: "/hub/customers", icon: Users, permission: "customer.read" },
      { title: "Customer Groups", url: "/hub/customers/groups", icon: Users, permission: "customer_group.read" },
      { title: "Customer Wishlists", url: "/hub/customers/wishlists", icon: Heart, permission: "customer_wishlist.read" },
      { title: "Limits", url: "/hub/customers/limits", icon: Gauge, permission: "customer_limit.read" },
    ],
  },
  {
    title: "Staff",
    icon: UserPlus,
    items: [
      { title: "Staff Members", url: "/hub/staff", icon: UserCog, permission: "staff_member.read" },
      { title: "Roles", url: "/hub/staff/roles", icon: ShieldHalf, permission: "staff_role.read" },
      { title: "Permissions", url: "/hub/staff/permissions", icon: KeyRound, permission: "staff_permission.read" },
      { title: "Activity Logs", url: "/hub/staff/logs", icon: ScrollText, permission: "activity_log.read" },
    ],
  },
  {
    title: "Site",
    icon: Globe,
    items: [
      { title: "Slides", url: "/hub/site/slides", icon: Image, permission: "slide.read" },
      { title: "Navigation", url: "/hub/site/navigation", icon: Navigation2, permission: "navigation.read" },
      { title: "Emails", url: "/hub/site/emails", icon: MailPlus, permission: "email_template.read" },
      { title: "Banners", url: "/hub/site/banners", icon: Image, permission: "banner.read" },
      { title: "Pages", url: "/hub/site/pages", icon: FileText, permission: "page.read" },
      { title: "Files", url: "/hub/site/files", icon: Files, permission: "file.read" },
      { title: "Forms", url: "/hub/site/forms", icon: FileInput, permission: "form.read" },
      { title: "Themes", url: "/hub/site/themes", icon: Palette, permission: "theme.read" },
      { title: "Blogs", url: "/hub/site/blogs", icon: Newspaper, permission: "blog.read" },
      { title: "Blog Posts", url: "/hub/site/blog-posts", icon: FileText, permission: "blog_post.read" },
      { title: "Blog Comments", url: "/hub/site/blog-comments", icon: MessageSquare, permission: "blog_comment.read" },
    ],
  },
  {
    title: "Affiliates",
    icon: Handshake,
    items: [
      { title: "Affiliate Plans", url: "/hub/affiliates/plans", icon: Handshake, permission: "affiliate_plan.read" },
      { title: "Affiliates", url: "/hub/affiliates", icon: Users, permission: "affiliate.read" },
      { title: "Payouts", url: "/hub/affiliates/payouts", icon: Wallet, permission: "payout.read" },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    items: [
      { title: "General Settings", url: "/hub/settings", icon: Settings, permission: "general_setting.read" },
      { title: "Security", url: "/hub/settings/security", icon: Shield, permission: "security_setting.read" },
      { title: "Payments", url: "/hub/settings/payments", icon: CreditCard, permission: "payment_setting.read" },
    ],
  },
  { title: "Logs", url: "/hub/logs", icon: ScrollText, permission: "activity_log.read" },
  {
    title: "Advanced",
    icon: Sliders,
    items: [
      { title: "Dashboard Appearance", url: "/hub/advanced/appearance", icon: LayoutDashboard, permission: "dashboard_appearance.read" },
      { title: "Business Mode", url: "/hub/advanced/business-mode", icon: Briefcase, permission: "business_mode.read" },
      { title: "Metafields", url: "/hub/advanced/metafields", icon: Braces, permission: "metafield.read" },
    ],
  },
]

export function canAccessNavItem(item, permissions = [], isOwner = false) {
  if (isOwner || !item?.permission) return true
  const granted = new Set(permissions.map((permission) => permission.toLowerCase()))
  const [module] = item.permission.toLowerCase().split(".")
  return granted.has(item.permission.toLowerCase()) || granted.has(`${module}.manage`) || granted.has("*")
}

export function filterSellerNav(permissions = [], isOwner = false) {
  return SELLER_NAV.map((item) => {
    if (!canAccessNavItem(item, permissions, isOwner)) return null
    if (!item.items) return item
    const items = item.items.filter((child) => canAccessNavItem(child, permissions, isOwner))
    return items.length ? { ...item, items } : null
  }).filter(Boolean)
}

export function findAccessibleNavMatch(pathname, permissions = [], isOwner = false) {
  const match = findNavMatch(pathname)
  if (!match) return null
  return canAccessNavItem(match.item, permissions, isOwner) ? match : null
}

export function firstAccessibleUrl(permissions = [], isOwner = false) {
  const nav = filterSellerNav(permissions, isOwner)
  return nav[0]?.url ?? nav[0]?.items?.[0]?.url ?? null
}

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
