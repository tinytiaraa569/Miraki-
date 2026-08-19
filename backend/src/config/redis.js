import Redis from "ioredis"
import { env } from "./env.js"


let redis = null
let redisHealthy = false

if (env.REDIS_URL) {
  redis = new Redis(env.REDIS_URL, {
    lazyConnect: false,
    maxRetriesPerRequest: 1, // fail fast — never block an API request on a dead Redis
    retryStrategy: (times) => Math.min(times * 500, 5000), // keep retrying connection in background
    enableOfflineQueue: false, // don't queue commands while disconnected
  })

  redis.on("ready", () => {
    redisHealthy = true
    console.log("[redis] connected and ready")
  })

  redis.on("error", (err) => {
    if (redisHealthy) console.warn("[redis] connection error (caching disabled):", err.message)
    redisHealthy = false
  })

  redis.on("close", () => {
    redisHealthy = false
  })
} else {
  console.log("[redis] REDIS_URL not set — caching disabled")
}

export function isRedisReady() {
  return Boolean(redis) && redisHealthy
}

// Raw client accessor for callers that issue their own commands (e.g. the
// rate-limit store). Returns null when REDIS_URL is unset. Callers must gate on
// isRedisReady() and fail open — Redis is best-effort here.
export function getRedisClient() {
  return redis
}

export async function cacheGet(key) {
  if (!isRedisReady()) return null
  try {
    const raw = await redis.get(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function cacheSet(key, value, ttlSeconds = env.CACHE_TTL_SECONDS) {
  if (!isRedisReady()) return
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds)
  } catch {
    // ignore — cache is best-effort
  }
}

export async function cacheInvalidate(prefix) {
  if (!isRedisReady()) return
  try {
    // SCAN (not KEYS) so we never block Redis on large keyspaces.
    let cursor = "0"
    do {
      const [next, keys] = await redis.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100)
      cursor = next
      if (keys.length) await redis.del(...keys)
    } while (cursor !== "0")
  } catch {
    // ignore — worst case a stale entry expires via TTL
  }
}

export async function closeRedis() {
  if (redis) await redis.quit().catch(() => {})
}
