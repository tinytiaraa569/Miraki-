"use client"

import { mutate } from "swr"
import { api } from "@/lib/api"

async function publishBootstrap(bootstrap) {
  if (!bootstrap?.identity) throw new Error("Login response is incomplete")

  await Promise.all([
    mutate("/seller/branding", bootstrap.branding ?? {}, { revalidate: false }),
    mutate("/seller/theme", bootstrap.theme ?? {}, { revalidate: false }),
  ])

  // Authentication is published last. The route switches to /hub only after
  // branding and theme are already cached, preventing a flash or refresh need.
  await mutate("/seller/me", bootstrap.identity, { revalidate: false })
  return bootstrap.identity
}

export function useStoreAdminAuth() {
  return {
    // Step 1: password. When 2FA is disabled in Settings the session is issued
    // directly (twoFactorRequired: false); otherwise returns the 2FA mode
    // ("enroll" on first login, "verify" after).
    login: async (email, password) => {
      const res = await api.post("/seller/auth/login", { email, password })
      if (res.twoFactorRequired === false) {
        await publishBootstrap(res.bootstrap)
        return null
      }
      return res.mode
    },
    // Step 2a: fetch QR + secret for first-time authenticator enrollment.
    setup2fa: async () => {
      return api.post("/seller/store-admins/auth/2fa/setup")
    },
    // Step 2b: verify the 6-digit code — this is what actually creates the session.
    verify2fa: async (code) => {
      const res = await api.post("/seller/store-admins/auth/2fa/verify", { code })
      await publishBootstrap(res.bootstrap)
    },
    logout: async () => {
      try {
        await api.post("/auth/logout")
      } catch {
        // Local state is cleared even if the session already expired.
      }
      await mutate("/seller/me", { user: null }, { revalidate: false })
    },
    publishBootstrap,
  }
}
