"use client"

import useSWR, { mutate as globalMutate } from "swr"
import { api, fetcher } from "@/lib/api"

export function useHubAuth() {
  const { data, error, isLoading, mutate } = useSWR("/seller/me", fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  const isAuthenticated = !!data?.user && !error
  const isStoreAdmin = data?.accountType === "storeAdmin"
  const isOwner = isAuthenticated && !isStoreAdmin

  async function logout() {
    try { await api.post("/auth/logout") } catch {}

    await globalMutate(() => true, undefined, { revalidate: false })
    await mutate({ user: null }, { revalidate: false })
  }

  return {
    user: data?.user ?? null,
    seller: data?.seller ?? null,
    scope: data?.scope ?? null,
    menu: data?.menu ?? [],
    permissions: data?.permissions ?? [],
    isOwner,
    isStoreAdmin,
    isLoading,
    isAuthenticated,
    logout,
    refresh: mutate,
  }
}

/**
 * Helper: check if user has a specific permission key.
 * Works for both StoreUser (owner has all) and StoreAdmin (explicit permissions).
 */
export function hasPermission(permissions, module, action) {
  const key = `${module}.${action}`.toLowerCase()
  const perms = new Set((permissions ?? []).map((p) => p.toLowerCase()))
  return perms.has(key) || perms.has(`${module}.manage`) || perms.has("*")
}
