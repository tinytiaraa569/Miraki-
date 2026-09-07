"use client"

import { createContext, useCallback,useState,useEffect, useContext, useMemo } from "react"
import useSWR from "swr"
import { fetcher } from "@/lib/api"
import { UnderConstruction } from "./under-construction"

const StorefrontContext = createContext(null)

const COUNTRY_COOKIE = "sf_country"

/** Country priority: ?country=XX override → remembered cookie → server geo. */
function getRequestedCountry() {
  const fromQuery = new URLSearchParams(window.location.search).get("country")
  if (fromQuery && /^[A-Za-z]{2}$/.test(fromQuery)) return fromQuery.toUpperCase()
  const match = document.cookie.match(/(?:^|;\s*)sf_country=([A-Z]{2})/)
  return match ? match[1] : null
}

function rememberCountry(code) {
  document.cookie = `${COUNTRY_COOKIE}=${code}; path=/; max-age=31536000; samesite=lax`
}

export function StorefrontProvider({ children }) {
  const requested = getRequestedCountry()
  const key = `/storefront/resolve${requested ? `?country=${requested}` : ""}`

  // keepPreviousData: country switches repaint in place with no flash.
  const { data, isLoading, error } = useSWR(key, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })

  const substore = data?.substore ?? null

  // Country/region options for the navbar dropdown come from the DB, not a
  // hardcoded list. Cached hard (5min SWR dedupe) — the list rarely changes.
  const { data: listData } = useSWR("/storefront/substores", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000,
  })
  const substores = listData?.substores ?? []

  // Store-wide maintenance gate. When the merchant enables the under-construction
  // page in General Settings, the whole public storefront is replaced by the
  // maintenance screen. /hub is a separate route tree (never mounts this
  // provider), so management stays reachable and the toggle can be switched off.
  // Tiny, cached payload — busted server-side on Save, so it applies promptly.
  const { data: site } = useSWR("/storefront/site", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })
  const gate = site?.underConstruction

  const [locale, setLocale] = useState(null)

  useEffect(() => {
    if (substore?.language) setLocale(substore.language)
  }, [substore?.language])

  const availableLocales = useMemo(() => {
    if (!substore) return ["en"]
    return Array.from(new Set([substore.language, ...(substore.supportedLanguages || [])].filter(Boolean)))
  }, [substore])
// console.log("availableLocales", availableLocales)
  // One shared formatter per substore — Intl construction is not free.
  const priceFormatter = useMemo(() => {
    if (!substore?.currency) return null
    try {
      return new Intl.NumberFormat(substore.language === "hi" ? "en-IN" : "en", {
        style: "currency",
        currency: substore.currency,
        currencyDisplay: substore.currencyDisplay === "symbol" ? "symbol" : "code",
        maximumFractionDigits: substore.decimalPrecision ?? 0,
        minimumFractionDigits: 0,
      })
    } catch {
      return null
    }
  }, [substore?.currency, substore?.currencyDisplay, substore?.decimalPrecision, substore?.language])

  const formatPrice = useCallback(
    (amount) => {
      if (amount == null) return null
      if (priceFormatter) return priceFormatter.format(amount)
      return `${substore?.currency ?? ""} ${amount}`.trim()
    },
    [priceFormatter, substore?.currency],
  )

  const switchCountry = useCallback((code) => {
    rememberCountry(code)
    // Persist the choice in the cookie only, then reload a CLEAN url (no
    // ?country= param). The cookie is sent on every API request, so the server
    // resolves the picked substore for ALL endpoints (detail, variant-media,
    // feed) and the address bar stays tidy.
    const url = new URL(window.location.href)
    url.searchParams.delete("country")
    window.location.assign(url.toString())
  }, [])

  const value = useMemo(
    () => ({
      resolved: data ?? null,
      substore,
      substores,
      canvas: data?.canvas ?? null,
      countryCode: data?.countryCode ?? null,
      isLoading: isLoading && !data,
      error: error ?? null,
      formatPrice,
      switchCountry,
      locale: locale ?? substore?.language ?? "en",
      setLocale, 
      availableLocales,
    }),
    [data, substore, substores, isLoading, error, formatPrice, switchCountry, locale, availableLocales],
  )

  // All hooks run above; only now may we short-circuit. An enabled gate replaces
  // the entire storefront (children never render) with the maintenance screen.
  if (gate?.enabled) {
    return <UnderConstruction imageUrl={gate.imageUrl} title={site?.title} />
  }

  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>
}

export function useStorefront() {
  const ctx = useContext(StorefrontContext)
  if (!ctx) throw new Error("useStorefront must be used inside StorefrontProvider")
  return ctx
}
