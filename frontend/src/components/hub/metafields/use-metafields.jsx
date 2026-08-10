import useSWR, { useSWRConfig } from "swr"
import useSWRInfinite from "swr/infinite"
import { api, fetcher } from "@/lib/api"
import { normalizeModule } from "./metafield-utils"

// ---------------------------------------------------------------------------
// SWR data layer over the /seller/metafields API. Mirrors use-option-sets.js
// EXACTLY — the whole app is SWR-driven, so Metafields is too.
//
// OPTIMISED LOADING:
//   • The LIST hits the lean `$facet` endpoint (rows + total in one trip); rows
//     never carry the full fields[] tree, only the projected columns.
//   • DETAIL is keyed `null` in create mode, so SWR performs NO fetch; it only
//     loads the full nested definition when an existing metafield is edited.
// Every mutation revalidates all `/seller/metafields` keys so the list + the
// "Metafields N" badge refetch.
// ---------------------------------------------------------------------------

const BASE = "/seller/metafields"

// Build the query string from the list table state. Empty params are omitted so
// the SWR key stays stable and the server applies its defaults.
export function metafieldsQueryString({ page, limit, sort, q, status, deleted } = {}) {
  const params = new URLSearchParams()
  if (page) params.set("page", String(page))
  if (limit) params.set("limit", String(limit))
  if (sort) params.set("sort", sort)
  if (q?.trim()) params.set("q", q.trim())
  if (status) params.set("status", status)
  if (deleted) params.set("deleted", "true")
  return params.toString()
}

// LIST — server does pagination/sorting/filtering; keepPreviousData avoids a
// blank flash while the next page loads. Returns { rows, total, page, limit,
// pageCount } on `data`.
export function useMetafieldsList(params) {
  // Pass `null` to skip the fetch entirely (SWR no-ops on a null key) — e.g. the
  // editor only needs the list in create mode to disable already-bound modules.
  const qs = metafieldsQueryString(params)
  const key = params === null ? null : `${BASE}?${qs}`
  const { data, error, isLoading, isValidating } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })
  return { data, error, isLoading, isValidating }
}

// INFINITE LIST — fetches pages of `limit` (default 10) one at a time and
// accumulates the rows, so callers scroll to load the next 10-10 batch instead
// of pulling everything at once. Pass `enabled=false` to no-op (SWR key null),
// e.g. in edit mode where the list is never needed.
export function useMetafieldsInfinite({ limit = 10, enabled = true } = {}) {
  const getKey = (pageIndex, previousPageData) => {
    if (!enabled) return null
    // Stop paging once a page comes back short — there's nothing left to load.
    if (previousPageData && (previousPageData.rows?.length ?? 0) < limit) return null
    return `${BASE}?${metafieldsQueryString({ page: pageIndex + 1, limit })}`
  }
  const { data, error, size, setSize, isLoading, isValidating } = useSWRInfinite(getKey, fetcher, {
    revalidateOnFocus: false,
    revalidateFirstPage: false,
  })
  const pages = data ?? []
  const rows = pages.flatMap((p) => p?.rows ?? [])
  const total = pages[0]?.total ?? 0
  const isLoadingMore = isValidating && size > 0 && Boolean(data && typeof data[size - 1] === "undefined")
  const hasMore = enabled && rows.length < total
  const loadMore = () => setSize((s) => s + 1)
  return { rows, total, error, size, setSize, loadMore, hasMore, isLoading, isLoadingMore }
}

// DETAIL — for the editor. Key is null (SWR no-ops) in create mode. The
// controller returns `{ metafield }`, unwrapped here.
export function useMetafield(id) {
  const { data, error, isLoading } = useSWR(id ? `${BASE}/${id}` : null, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })
  return { metafield: data?.metafield, error, isLoading: Boolean(id) && isLoading }
}

// ---------------------------------------------------------------------------
// VALUES layer — used by a RECORD editor (e.g. the Category editor) to render
// its module's metafield DEFINITION as a form and read/write per-record VALUES.
// The module is normalized (`categories` -> `ms.categories`) so callers can use
// the short name while the API always receives the stored binding.
// ---------------------------------------------------------------------------

// DEFINITION for a module — the fields[] schema the value form renders from.
// Returns null (no error) when the module has no definition yet.
export function useMetafieldDefinition(module) {
  const m = module ? normalizeModule(module) : null
  const { data, error, isLoading } = useSWR(m ? `${BASE}/${m}/definition` : null, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })
  return { definition: data?.metafield ?? null, error, isLoading: Boolean(m) && isLoading }
}

// SAVED VALUES for one record. Key is null (SWR no-ops) until BOTH module and
// recordId are known — so create mode (no id yet) performs no fetch.
export function useMetafieldValues(module, recordId) {
  const m = module ? normalizeModule(module) : null
  const key = m && recordId ? `${BASE}/${m}/values/${recordId}` : null
  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })
  return {
    values: data?.data ?? null,
    exists: Boolean(data?.exists),
    error,
    isLoading: Boolean(key) && isLoading,
    mutate,
  }
}

// Upsert a record's values against the live definition (validated server-side).
export function useMetafieldValueMutations() {
  async function saveValues({ module, recordId, data }) {
    const m = normalizeModule(module)
    return api.put(`${BASE}/${m}/values/${recordId}`, { data })
  }
  return { saveValues }
}

// MUTATIONS — thin wrappers over lib/api.js that revalidate every list key on
// success. Errors bubble so callers can toast.
export function useMetafieldMutations() {
  const { mutate } = useSWRConfig()
  const refreshList = () => mutate((key) => typeof key === "string" && key.startsWith(BASE))

  // CREATE + UPDATE share one call — the editor sends the whole nested payload
  // in one round trip. Pass { id } to update, omit it to create.
  async function save({ id, body }) {
    const res = id ? await api.patch(`${BASE}/${id}`, body) : await api.post(BASE, body)
    await refreshList()
    return res?.metafield ?? res
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
