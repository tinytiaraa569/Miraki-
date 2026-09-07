"use client"

import { useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import { api, fetcher } from "@/lib/api"

export const GENERAL_SETTINGS_KEY = "/seller/general-settings"


export function useGeneralSettings() {
  const { data, error, isLoading, mutate } = useSWR(GENERAL_SETTINGS_KEY, fetcher, {
    revalidateOnFocus: false,
  })

  return {
    settings: data?.settings ?? null,
    isLoading,
    error,
    refresh: mutate,
  }
}


export function useGeneralSettingsMutations() {
  const { mutate } = useSWRConfig()
  const [saving, setSaving] = useState(false)

  async function save(patch) {
    setSaving(true)
    try {
      const res = await api.patch(GENERAL_SETTINGS_KEY, patch)
      await mutate(GENERAL_SETTINGS_KEY, res, { revalidate: false })
      return res.settings
    } finally {
      setSaving(false)
    }
  }

  return { save, saving }
}
