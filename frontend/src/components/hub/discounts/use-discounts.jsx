import useSWR, { useSWRConfig } from "swr"
import { api, fetcher } from "@/lib/api"


const BASE = "/seller/discounts"


export function discountsQueryString({ page, limit, sort, q, enabled, deleted } = {}) {
  const params = new URLSearchParams()
  if (page) params.set("page", String(page))
  if (limit) params.set("limit", String(limit))
  if (sort) params.set("sort", sort)
  if (q?.trim()) params.set("q", q.trim())
  if (enabled !== undefined && enabled !== null) params.set("enabled", enabled ? "true" : "false")
  if (deleted) params.set("deleted", "true")
  return params.toString()
}


export function useDiscountsList({ page, limit, q, enabled, deleted, sort } = {}) {
  const qs = discountsQueryString({ page, limit, q, enabled, deleted, sort })
  const { data, error, isLoading } = useSWR(`${BASE}?${qs}`, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })
  return { data, error, isLoading }
}


export function useDiscount(id) {
  const { data, error, isLoading } = useSWR(id ? `${BASE}/${id}` : null, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })
  return { discount: data?.discount, error, isLoading: Boolean(id) && isLoading }
}


export function useDiscountMutations() {
  const { mutate } = useSWRConfig()
  const refreshList = () => mutate((key) => typeof key === "string" && key.startsWith(BASE))

  async function save({ id, body }) {
    const res = id ? await api.patch(`${BASE}/${id}`, body) : await api.post(BASE, body)
    await refreshList()
    return res
  }

  async function restore(id) {
    const res = await api.post(`${BASE}/${id}/restore`)
    await refreshList()
    return res
  }

  // Soft delete by default, or permanent when { permanent: true }.
  async function remove({ id, permanent }) {
    const res = await api.delete(`${BASE}/${id}${permanent ? "?permanent=true" : ""}`)
    await refreshList()
    return res
  }

  return { save, restore, remove, refreshList }
}
