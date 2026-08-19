import { connectDB } from "./config/db.js"
import { env } from "./config/env.js"
import { closeRedis } from "./config/redis.js"
import { seedPlatformSuperadmin, syncSellerLoginDirectory } from "./config/seed.js"
import { ensureStorefrontTenant } from "./modules/storefront/storefront.service.js"
import { app } from "./app.js"

// Boot: connect DB → seed → listen
async function main() {
  await connectDB()
  await seedPlatformSuperadmin()
  // Storefront demo tenant (substores + variants + canvas mapping). No-op
  // when STOREFRONT_TENANT_DB points at an already-seeded tenant.
  await ensureStorefrontTenant()
  await syncSellerLoginDirectory()
  app.listen(env.PORT, () => {
    console.log(`[server] API listening on http://localhost:${env.PORT}`)
  })
}

process.on("SIGTERM", async () => {
  await closeRedis()
  process.exit(0)
})

main().catch((err) => {
  console.error("[server] fatal boot error:", err)
  process.exit(1)
})
