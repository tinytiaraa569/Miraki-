import rateLimit from "express-rate-limit"
import { env } from "../config/env.js"
import { getRedisClient, isRedisReady } from "../config/redis.js"


function createRedisStore(prefix) {
  let windowMs = 60_000
  const allow = () => ({ totalHits: 1, resetTime: new Date(Date.now() + windowMs) })

  return {
 
    prefix,
    init(opts) {
      windowMs = opts.windowMs
    },
    async increment(key) {
      const client = getRedisClient()
      if (!isRedisReady() || !client) return allow()
      const rlKey = `${prefix}:${key}`
      try {
        const res = await client.multi().incr(rlKey).pttl(rlKey).exec()
        const hits = res?.[0]?.[1]
        let ttl = res?.[1]?.[1]
        if (typeof hits !== "number") return allow()
        if (ttl == null || ttl < 0) {
          await client.pexpire(rlKey, windowMs)
          ttl = windowMs
        }
        return { totalHits: hits, resetTime: new Date(Date.now() + ttl) }
      } catch (err) {
        console.warn("[ratelimit] redis error (failing open):", err.message)
        return allow()
      }
    },
    async decrement(key) {
      const client = getRedisClient()
      if (!isRedisReady() || !client) return
      try {
        await client.decr(`${prefix}:${key}`)
      } catch {
        // best-effort
      }
    },
    async resetKey(key) {
      const client = getRedisClient()
      if (!isRedisReady() || !client) return
      try {
        await client.del(`${prefix}:${key}`)
      } catch {
        // best-effort
      }
    },
  }
}


const useRedis = Boolean(env.REDIS_URL)

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
  ...(useRedis ? { store: createRedisStore("rl:login") } : {}),
})

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests" },
  ...(useRedis ? { store: createRedisStore("rl:api") } : {}),
})
