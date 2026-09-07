export function pickText(value, locale, fallbackLocale = "en") {
  if (value == null) return value
  if (typeof value === "string") return value 
  return value[locale] ?? value[fallbackLocale] ?? Object.values(value)[0] ?? ""
}