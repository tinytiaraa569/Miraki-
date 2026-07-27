import { cacheGet, cacheSet } from "../config/redis.js"

/**
 * Response-caching middleware for GET endpoints.
 * Key = prefix + sorted query string, so ?page=1&limit=20 and ?limit=20&page=1 share one entry.
 *
 * Usage: router.get("/sellers", cache("platform:sellers"), getSellers)
 */
export function cache(prefix, ttlSeconds) {
  return async (req, res, next) => {
    if (req.method !== "GET") return next()

    const sortedQuery = Object.keys(req.query)
      .sort()
      .map((k) => `${k}=${req.query[k]}`)
      .join("&")
    const key = `cache:${prefix}:${sortedQuery || "default"}`

    const hit = await cacheGet(key)
    if (hit) {
      res.set("X-Cache", "HIT")
      return res.json(hit)
    }

    // Wrap res.json so the response body is stored in Redis on the way out.
    const originalJson = res.json.bind(res)
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cacheSet(key, body, ttlSeconds) // fire-and-forget, never blocks the response
      }
      res.set("X-Cache", "MISS")
      return originalJson(body)
    }

    next()
  }
}