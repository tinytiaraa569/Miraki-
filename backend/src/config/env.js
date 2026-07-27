import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(8000),
  MONGODB_URI: z.string().optional(),
  // Alias: some deployments provide the Atlas URI under this name instead.
  MONGODB_CONNECTION_STRING: z.string().optional(),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  PLATFORM_SUPERADMIN_EMAIL: z.string().email().default("root@platform.local"),
  PLATFORM_SUPERADMIN_PASSWORD: z.string().min(8).default("ChangeMe_Dev_Only!42"),
  ACCESS_TOKEN_TTL_MIN: z.coerce.number().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(7),
  REDIS_URL: z.string().optional(),
  STOREFRONT_TENANT_DB: z.string().optional(),
  CACHE_TTL_SECONDS: z.coerce.number().default(60),
})

export const env = envSchema.parse(process.env)

// Normalize: MONGODB_URI wins, MONGODB_CONNECTION_STRING is the fallback alias.
env.MONGODB_URI = env.MONGODB_URI || env.MONGODB_CONNECTION_STRING

if (env.NODE_ENV === "production") {
  if (!env.MONGODB_URI) throw new Error("MONGODB_URI (or MONGODB_CONNECTION_STRING) is required in production")
  if (!process.env.PLATFORM_SUPERADMIN_PASSWORD) throw new Error("PLATFORM_SUPERADMIN_PASSWORD is required in production")
}
