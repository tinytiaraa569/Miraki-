"use client"

import { createContext, useCallback, useContext, useMemo } from "react"
import useSWR from "swr"
import { fetcher } from "@/lib/api"

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
    // Full URL swap (not router state): resets the ?country override cleanly
    // and lets the SW/HTTP cache serve the already-warm payload instantly.
    const url = new URL(window.location.href)
    url.searchParams.set("country", code)
    window.location.assign(url.toString())
  }, [])

  const value = useMemo(
    () => ({
      resolved: data ?? null,
      substore,
      canvas: data?.canvas ?? null,
      countryCode: data?.countryCode ?? null,
      isLoading: isLoading && !data,
      error: error ?? null,
      formatPrice,
      switchCountry,
    }),
    [data, substore, isLoading, error, formatPrice, switchCountry],
  )

  return <StorefrontContext.Provider value={value}>{children}</StorefrontContext.Provider>
}

export function useStorefront() {
  const ctx = useContext(StorefrontContext)
  if (!ctx) throw new Error("useStorefront must be used inside StorefrontProvider")
  return ctx
}