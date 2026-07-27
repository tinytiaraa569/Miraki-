"use client"

import useSWR, { mutate as globalMutate } from "swr"
import { api, fetcher } from "@/lib/api"

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR("/auth/me", fetcher, {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  return {
    user: data?.user ?? null,
    isLoading,
    isAuthenticated: !!data?.user && !error,
    // Step 1: password. When 2FA is disabled in Settings the session is issued
    // directly (twoFactorRequired: false); otherwise returns the 2FA mode
    // ("enroll" on first login, "verify" after).
    login: async (email, password) => {
      const res = await api.post("/auth/login", { email, password })
      if (res.twoFactorRequired === false) {
        await mutate()
        return null
      }
      return res.mode
    },
    // Step 2a: fetch QR + secret for first-time authenticator enrollment.
    setup2fa: async () => {
      return api.post("/auth/2fa/setup")
    },
    // Step 2b: verify the 6-digit code — this is what actually creates the session.
    verify2fa: async (code) => {
      await api.post("/auth/2fa/verify", { code })
      await mutate()
    },
    logout: async () => {
      // Always tear down the local session, even if the network request fails
      // (e.g. the session already expired server-side). The UI must not stay
      // "logged in" just because the logout call errored.
      try {
        await api.post("/auth/logout")
      } catch {
        // ignore — cookies are cleared below regardless
      }
      // Purge EVERY cached SWR key (stats, sellers, audit logs, ...) so no
      // stale dashboard data can survive the sign-out, then pin auth to null.
      await globalMutate(() => true, undefined, { revalidate: false })
      await mutate({ user: null }, { revalidate: false })
    },
  }
}
