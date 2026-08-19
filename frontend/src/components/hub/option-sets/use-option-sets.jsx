import useSWR, { useSWRConfig } from "swr"
import { api, fetcher } from "@/lib/api"

// ---------------------------------------------------------------------------
// SWR data layer over the /seller/option-sets API (§5). This mirrors the Brand
// and Collection modules EXACTLY — the rest of the app uses SWR, so Option Sets
// does too. The plain-React list table (option-set-table.jsx) binds to
// useOptionSetsList in fully server-driven mode (§10.2); every mutation
// revalidates all `/seller/option-sets` keys so the list + the "Option sets N"
// badge refetch. Callers toast the errors, matching the other hub modules.
// ---------------------------------------------------------------------------

const BASE = "/seller/option-sets"

// Build the query string from the §6.5 table state. Undefined/empty params are
// omitted so the SWR key stays stable and the server applies its defaults.
export function optionSetsQueryString({ page, limit, sort, q, deleted, substore } = {}) {
  const params = new URLSearchParams()
  if (page) params.set("page", String(page))
  if (limit) params.set("limit", String(limit))
  if (sort) params.set("sort", sort)
  if (q?.trim()) params.set("q", q.trim())
  if (deleted) params.set("deleted", "true")
  if (substore) params.set("substore", substore)
  return params.toString()
}

// LIST — the server does pagination/sorting/filtering; `keepPreviousData` avoids
// a blank flash while the next page loads. Returns the §6.4 envelope
// ({ rows, total, page, limit, pageCount }) on `data`.
export function useOptionSetsList(params) {
  const qs = optionSetsQueryString(params)
  const { data, error, isLoading, isValidating } = useSWR(`${BASE}?${qs}`, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })
  return { data, error, isLoading, isValidating }
}

// DETAIL — for the editor; the key is null (SWR no-ops) in create mode. The
// controller returns `{ optionSet }`, so we unwrap it here.
export function useOptionSet(id) {
  const { data, error, isLoading } = useSWR(id ? `${BASE}/${id}` : null, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })
  return { optionSet: data?.optionSet, error, isLoading: Boolean(id) && isLoading }
}

// MUTATIONS — thin wrappers over `lib/api.js` that revalidate every list key on
// success (so the table + badge refresh). Errors bubble so callers can toast.
export function useOptionSetMutations() {
  const { mutate } = useSWRConfig()
  const refreshList = () => mutate((key) => typeof key === "string" && key.startsWith(BASE))

  // CREATE + UPDATE share one call — the editor sends the whole nested payload in
  // one round trip (§10.4). Pass { id } to update, omit it to create.
  async function save({ id, body }) {
    const res = id ? await api.patch(`${BASE}/${id}`, body) : await api.post(BASE, body)
    await refreshList()
    return res
  }

  async function duplicate(id) {
    const res = await api.post(`${BASE}/${id}/duplicate`)
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

  return { save, duplicate, restore, remove, refreshList }
}
