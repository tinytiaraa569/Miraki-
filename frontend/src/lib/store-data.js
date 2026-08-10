// Shared reference data for Substores + Store Variants forms.
// Defined once at module scope — never re-created on render.

export const COUNTRIES = [
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "OM", name: "Oman" },
  { code: "KW", name: "Kuwait" },
  { code: "QA", name: "Qatar" },
  { code: "BH", name: "Bahrain" },
  { code: "IN", name: "India" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "LK", name: "Sri Lanka" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "Mexico" },
  { code: "BR", name: "Brazil" },
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "PT", name: "Portugal" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czechia" },
  { code: "GR", name: "Greece" },
  { code: "TR", name: "Turkey" },
  { code: "RU", name: "Russia" },
  { code: "UA", name: "Ukraine" },
  { code: "EG", name: "Egypt" },
  { code: "MA", name: "Morocco" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "ZA", name: "South Africa" },
  { code: "CN", name: "China" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "TW", name: "Taiwan" },
  { code: "HK", name: "Hong Kong" },
  { code: "SG", name: "Singapore" },
  { code: "MY", name: "Malaysia" },
  { code: "TH", name: "Thailand" },
  { code: "VN", name: "Vietnam" },
  { code: "PH", name: "Philippines" },
  { code: "ID", name: "Indonesia" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "IL", name: "Israel" },
  { code: "JO", name: "Jordan" },
  { code: "LB", name: "Lebanon" },
  { code: "IQ", name: "Iraq" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
]

export const COUNTRY_NAME_BY_CODE = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.name]))

export const CURRENCIES = [
  "AED", "SAR", "OMR", "KWD", "QAR", "BHD", "INR", "USD", "CAD", "EUR",
  "GBP", "CHF", "SEK", "NOK", "DKK", "PLN", "TRY", "EGP", "NGN", "KES",
  "ZAR", "CNY", "JPY", "KRW", "SGD", "MYR", "THB", "VND", "PHP", "IDR",
  "AUD", "NZD", "ILS", "PKR", "BDT", "LKR", "BRL", "MXN", "RUB",
]

// Display symbol for each currency code — used in dropdowns and price previews.
export const CURRENCY_SYMBOL_BY_CODE = {
  AED: "د.إ",
  SAR: "﷼",
  OMR: "ر.ع.",
  KWD: "د.ك",
  QAR: "ر.ق",
  BHD: ".د.ب",
  INR: "₹",
  USD: "$",
  CAD: "C$",
  EUR: "€",
  GBP: "£",
  CHF: "CHF",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  PLN: "zł",
  TRY: "₺",
  EGP: "E£",
  NGN: "₦",
  KES: "KSh",
  ZAR: "R",
  CNY: "¥",
  JPY: "¥",
  KRW: "₩",
  SGD: "S$",
  MYR: "RM",
  THB: "฿",
  VND: "₫",
  PHP: "₱",
  IDR: "Rp",
  AUD: "A$",
  NZD: "NZ$",
  ILS: "₪",
  PKR: "₨",
  BDT: "৳",
  LKR: "Rs",
  BRL: "R$",
  MXN: "MX$",
  RUB: "₽",
}

export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ar", name: "Arabic" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" },
  { code: "tr", name: "Turkish" },
  { code: "ru", name: "Russian" },
  { code: "hi", name: "Hindi" },
  { code: "ur", name: "Urdu" },
  { code: "bn", name: "Bengali" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "ms", name: "Malay" },
  { code: "id", name: "Indonesian" },
  { code: "he", name: "Hebrew" },
]

export const LANGUAGE_NAME_BY_CODE = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.name]))

// Languages written right-to-left — used to auto-suggest the RTL toggle.
export const RTL_LANGUAGES = new Set(["ar", "he", "ur", "fa"])

export const TIMEZONES = [
  "Asia/Dubai", "Asia/Riyadh", "Asia/Muscat", "Asia/Kuwait", "Asia/Qatar", "Asia/Bahrain",
  "Asia/Kolkata", "Asia/Karachi", "Asia/Dhaka", "Asia/Colombo", "Asia/Bangkok",
  "Asia/Singapore", "Asia/Kuala_Lumpur", "Asia/Jakarta", "Asia/Manila", "Asia/Tokyo",
  "Asia/Seoul", "Asia/Shanghai", "Asia/Hong_Kong", "Europe/London", "Europe/Paris",
  "Europe/Berlin", "Europe/Madrid", "Europe/Rome", "Europe/Amsterdam", "Europe/Stockholm",
  "Europe/Istanbul", "Africa/Cairo", "Africa/Lagos", "Africa/Nairobi", "Africa/Johannesburg",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Toronto", "America/Mexico_City", "America/Sao_Paulo", "Australia/Sydney",
  "Pacific/Auckland", "UTC",
]

export const SOCIAL_PROVIDERS = [
  "Facebook", "Instagram", "X (Twitter)", "YouTube", "TikTok", "Snapchat",
  "LinkedIn", "Pinterest", "WhatsApp", "Telegram", "Threads",
]

// Region-specific payment gateways — stored as string keys on the substore.
export const PAYMENT_METHODS = [
  { value: "card", label: "Credit / Debit card" },
  { value: "cod", label: "Cash on delivery (COD)" },
  { value: "apple_pay", label: "Apple Pay" },
  { value: "google_pay", label: "Google Pay" },
  { value: "paypal", label: "PayPal" },
  { value: "tabby", label: "Tabby (BNPL)" },
  { value: "tamara", label: "Tamara (BNPL)" },
  { value: "stc_pay", label: "STC Pay" },
  { value: "bank_transfer", label: "Bank transfer" },
]

export const SUBSTORE_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "coming_soon", label: "Coming Soon" },
]

// -------------------------------------------------------------- categories
export const CATEGORY_STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
]

// How products inside a category are ordered by default on the storefront.
export const CATEGORY_SORT_ORDERS = [
  { value: "manual", label: "Manual" },
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "name_desc", label: "Name (Z–A)" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "price_asc", label: "Price (low → high)" },
  { value: "price_desc", label: "Price (high → low)" },
]

// Sitemap change-frequency hints for search engines.
export const SITEMAP_FREQUENCIES = [
  { value: "always", label: "Always" },
  { value: "hourly", label: "Hourly" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "never", label: "Never" },
]
