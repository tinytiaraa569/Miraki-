import useSWR, { useSWRConfig } from "swr"
import { api, fetcher } from "@/lib/api"

const BASE = "/seller/coupons"

export function couponsQueryString({ page, limit, sort, q, enabled, isPrivate, deleted } = {}) {
  const params = new URLSearchParams()
  if (page) params.set("page", String(page))
  if (limit) params.set("limit", String(limit))
  if (sort) params.set("sort", sort)
  if (q?.trim()) params.set("q", q.trim())
  if (enabled !== undefined && enabled !== null) params.set("enabled", enabled ? "true" : "false")
  if (isPrivate !== undefined && isPrivate !== null) params.set("isPrivate", isPrivate ? "true" : "false")
  if (deleted) params.set("deleted", "true")
  return params.toString()
}

export function useCouponsList({ page, limit, q, enabled, isPrivate, deleted, sort } = {}) {
  const qs = couponsQueryString({ page, limit, q, enabled, isPrivate, deleted, sort })
  const { data, error, isLoading } = useSWR(`${BASE}?${qs}`, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })
  return { data, error, isLoading }
}

export function useCoupon(id) {
  const { data, error, isLoading } = useSWR(id ? `${BASE}/${id}` : null, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })
  return { coupon: data?.coupon ?? data, error, isLoading: Boolean(id) && isLoading }
}

export function useCouponMutations() {
  const { mutate } = useSWRConfig()
  const refreshList = () => mutate((key) => typeof key === "string" && key.startsWith(BASE))

  async function save({ id, body }) {
    const res = id ? await api.patch(`${BASE}/${id}`, body) : await api.post(BASE, body)
    await refreshList()
    return res
  }

  async function toggle(id) {
    const res = await api.patch(`${BASE}/${id}/toggle`)
    await refreshList()
    return res
  }

  async function duplicate(id) {
    const res = await api.post(`${BASE}/duplicate/${id}`)
    await refreshList()
    return res
  }


  async function remove(id) {
    const res = await api.delete(`${BASE}/${id}`)
    await refreshList()
    return res
  }

  async function restore(id) {
    const res = await api.post(`${BASE}/${id}/restore`)
    await refreshList()
    return res
  }

  async function destroy(id) {
    const res = await api.delete(`${BASE}/${id}?permanent=true`)
    await refreshList()
    return res
  }
  

  async function bulkRemove(ids) {
    const res = await api.post(`${BASE}/bulk-delete`, { ids })
    await refreshList()
    return res
  }

  return { save, toggle, duplicate, remove, restore, destroy, bulkRemove, refreshList }
}