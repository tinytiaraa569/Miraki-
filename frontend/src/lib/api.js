import { mutate as globalMutate } from "swr"

const BASE = "/api"

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// Endpoints where a 401 is a NORMAL outcome (wrong password, invalid 2FA code,
// logout, or the refresh call itself). We must NOT attempt a silent refresh for
// these — doing so would loop or mask a real "bad credentials" response.
const NO_REFRESH_PATHS = [
  "/auth/login",
  "/auth/2fa/setup",
  "/auth/2fa/verify",
  "/auth/logout",
  "/auth/refresh",
  "/seller/auth/login",
  "/seller/store-admin/auth/login",
  "/seller/store-admin/auth/me",
  "/seller/store-admin/auth/2fa/setup",
  "/seller/store-admin/auth/2fa/verify",
  "/seller/store-admin/auth/logout"
]

// Single-flight silent refresh. The 15-min access token expires constantly;
// when it does, the browser still holds the long-lived (multi-day) refresh
// token cookie. This swaps it for a fresh access token WITHOUT logging the user
// out. If many requests 401 at once, they all await the SAME refresh call.
let refreshPromise = null
function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

async function request(path, options = {}, _retried = false) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && !NO_REFRESH_PATHS.includes(path)) {
      // The access token likely just expired. Try to silently refresh it ONCE
      // using the long-lived refresh token, then replay the original request.
      if (!_retried) {
        const refreshed = await refreshSession()
        if (refreshed) return request(path, options, true)
      }
      // Refresh failed → the session is genuinely dead (refresh token expired,
      // revoked, or absent). Only NOW do we drop the cached auth state so
      // ProtectedRoute redirects to login instead of showing a broken screen.
      if (path.startsWith("/seller/")) {
        globalMutate("/seller/me", { user: null }, { revalidate: false })
      } else {
        globalMutate("/auth/me", { user: null }, { revalidate: false })
      }
    }
    const message =
      (typeof body?.error === "string" ? body.error : body?.error?.message) || body?.message || "Request failed"
    throw new ApiError(res.status, message)
  }
  return body
}

export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: (path, data) => request(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  put: (path, data) => request(path, { method: "PUT", body: data ? JSON.stringify(data) : undefined }),
  delete: (path) => request(path, { method: "DELETE" }),
}

export const fetcher = (path) => api.get(path)
