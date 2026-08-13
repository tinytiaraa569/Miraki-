// Default permission catalog for store admins.
//
// BACKEND source of truth for the "reseed default permissions" endpoint.
// MUST stay in sync with the frontend catalog at
// frontend/src/lib/permissions-hub.js (PERMISSION_HUB): that copy drives the
// manual "Add permissions" sheet, this copy drives server-side reseeding.

const DEFAULT_ACTIONS = ["read", "write", "update", "delete", "manage"]
const READ_ONLY_ACTIONS = ["read", "update"]
const LOG_ACTIONS = ["read", "export"]

export const ACTION_LABELS = {
  read: "View",
  write: "Create",
  update: "Edit",
  delete: "Delete",
  manage: "Manage",
  export: "Export",
}

export const DEFAULT_PERMISSION_CATALOG = [
  {
    category: "stores",
    label: "Stores",
    modules: [
      { module: "main_store", label: "Main Store" },
      { module: "substore", label: "Substores" },
      { module: "store_variant", label: "Store Variants", actions: [...DEFAULT_ACTIONS, "export"] },
      { module: "store_permission", label: "Store Permissions" },
      { module: "store_role", label: "Store Roles" },
    ],
  },
  {
    category: "team",
    label: "Team",
    modules: [{ module: "team", label: "Team" }],
  },
  {
    category: "profile",
    label: "Business Profile",
    modules: [{ module: "business_profile", label: "Business Profile", actions: READ_ONLY_ACTIONS }],
  },
  {
    category: "products",
    label: "Products",
    modules: [
      { module: "product", label: "Products", actions: [...DEFAULT_ACTIONS, "export"] },
      { module: "product_category", label: "Categories" },
      { module: "brand", label: "Brands" },
      { module: "collection", label: "Collections" },
      { module: "option_set", label: "Option Sets" },
      { module: "review", label: "Reviews" },
      { module: "product_variant", label: "Product Variants" },
      { module: "linked_product", label: "Linked Products" },
      { module: "digital_product", label: "Digital Products" },
    ],
  },
  {
    category: "diamonds",
    label: "Diamonds",
    modules: [
      { module: "diamond", label: "Diamond Products", actions: [...DEFAULT_ACTIONS, "export"] },
      { module: "diamond_category", label: "Diamond Categories" },
      { module: "diamond_collection", label: "Diamond Collections" },
      { module: "diamond_option_set", label: "Diamond Option Sets" },
      { module: "diamond_filter_set", label: "Diamond Filter Sets" },
      { module: "diamond_variant", label: "Diamond Variants" },
    ],
  },
  {
    category: "marketing",
    label: "Marketing",
    modules: [
      { module: "marketing_tool", label: "Marketing Tools" },
      { module: "discount", label: "Discounts" },
      { module: "coupon", label: "Coupons" },
      { module: "subscriber", label: "Subscribers", actions: [...DEFAULT_ACTIONS, "export"] },
    ],
  },
  {
    category: "orders",
    label: "Orders",
    modules: [
      { module: "order", label: "Orders", actions: [...DEFAULT_ACTIONS, "export"] },
      { module: "b2b_enquiry", label: "B2B Enquiries" },
      { module: "abandoned_checkout", label: "Abandoned Checkouts" },
      { module: "brief_order", label: "Brief Orders" },
      { module: "wishlist", label: "Wishlists" },
      { module: "return", label: "Returns" },
      { module: "refund", label: "Refunds" },
    ],
  },
  {
    category: "customers",
    label: "Customers",
    modules: [
      { module: "customer", label: "Customers", actions: [...DEFAULT_ACTIONS, "export"] },
      { module: "customer_group", label: "Customer Groups" },
      { module: "customer_wishlist", label: "Customer Wishlists" },
      { module: "customer_limit", label: "Limits" },
    ],
  },
  {
    category: "staff",
    label: "Staff",
    modules: [
      { module: "staff_member", label: "Staff Members" },
      { module: "staff_role", label: "Roles" },
      { module: "staff_permission", label: "Permissions" },
      { module: "activity_log", label: "Activity Logs", actions: LOG_ACTIONS },
    ],
  },
  {
    category: "site",
    label: "Site",
    modules: [
      { module: "slide", label: "Slides" },
      { module: "navigation", label: "Navigation" },
      { module: "email_template", label: "Emails" },
      { module: "banner", label: "Banners" },
      { module: "page", label: "Pages" },
      { module: "file", label: "Files" },
      { module: "form", label: "Forms" },
      { module: "theme", label: "Themes" },
      { module: "blog", label: "Blogs" },
      { module: "blog_post", label: "Blog Posts" },
      { module: "blog_comment", label: "Blog Comments" },
    ],
  },
  {
    category: "affiliates",
    label: "Affiliates",
    modules: [
      { module: "affiliate_plan", label: "Affiliate Plans" },
      { module: "affiliate", label: "Affiliates" },
      { module: "payout", label: "Payouts" },
    ],
  },
  {
    category: "settings",
    label: "Settings",
    modules: [
      { module: "general_setting", label: "General", actions: READ_ONLY_ACTIONS },
      { module: "security_setting", label: "Security", actions: READ_ONLY_ACTIONS },
      { module: "payment_setting", label: "Payments", actions: READ_ONLY_ACTIONS },
    ],
  },
  {
    category: "advanced",
    label: "Advanced",
    modules: [
      { module: "dashboard_appearance", label: "Dashboard Appearance", actions: READ_ONLY_ACTIONS },
      { module: "business_mode", label: "Business Mode", actions: READ_ONLY_ACTIONS },
    ],
  },
].map((cat) => ({
  ...cat,
  modules: cat.modules.map((m) => ({ ...m, actions: m.actions ?? DEFAULT_ACTIONS })),
}))

export function permissionKey(module, action) {
  return `${module}.${action}`
}

// Flatten the catalog into insert-ready permission docs.
// sortOrder follows catalog (sidebar) order so the reseeded list renders top-down.
export function buildDefaultPermissionDocs() {
  const docs = []
  let sortOrder = 0
  for (const cat of DEFAULT_PERMISSION_CATALOG) {
    for (const mod of cat.modules) {
      for (const action of mod.actions) {
        docs.push({
          key: permissionKey(mod.module, action),
          module: mod.module,
          category: cat.category,
          action,
          label: `${ACTION_LABELS[action] ?? action} ${mod.label}`,
          description: "",
          sortOrder: sortOrder++,
        })
      }
    }
  }
  return docs
}
