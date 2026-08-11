import { mutate as globalMutate } from "swr"

const BASE = "/api"

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// Auth endpoints where a 401 is an expected outcome (bad password, invalid
// 2FA code, the /auth/me probe itself) — these must NOT nuke the session state.
const AUTH_PATHS = [
  "/auth/me",
  "/auth/login",
  "/auth/2fa/setup",
  "/auth/2fa/verify",
  "/auth/logout",
  "/seller/me",
  "/seller/auth/login",
  "/seller/store-admin/auth/login",
  "/seller/store-admin/auth/me",
  "/seller/store-admin/auth/2fa/setup",
  "/seller/store-admin/auth/2fa/verify",
  "/seller/store-admin/auth/logout"
]

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    // A 401 on any DATA endpoint means the session is dead (expired, revoked,
    // or restored from bfcache after logout). Immediately drop the cached auth
    // state so ProtectedRoute redirects to the login page instead of leaving
    // a broken dashboard on screen.
    if (res.status === 401 && !AUTH_PATHS.includes(path)) {
      // Drop whichever auth probe matches the dead session's surface.
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
