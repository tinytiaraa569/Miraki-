"use client"

import useSWR, { mutate as globalMutate } from "swr"
import { api, fetcher } from "@/lib/api"

// Seller-side session state, mirrored on /seller/me. Completely independent
// from the platform superadmin session hook (use-auth.js) — the two panels
// never share auth state.
export function useSellerAuth() {
  const { data, error, isLoading, mutate } = useSWR("/seller/me", fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  return {
    user: data?.user ?? null,
    seller: data?.seller ?? null,
    scope: data?.scope ?? null,
    menu: data?.menu ?? [],
    isOwner: data?.user?.role === "SELLER_SUPERADMIN",
    isLoading,
    isAuthenticated: !!data?.user && !error,
    login: async (email, password) => {
      await api.post("/seller/auth/login", { email, password })
      await mutate()
    },
    logout: async () => {
      try {
        await api.post("/auth/logout")
      } catch {
        // ignore — local state is cleared regardless
      }
      await globalMutate(() => true, undefined, { revalidate: false })
      await mutate({ user: null }, { revalidate: false })
    },
    refresh: mutate,
  }
}
