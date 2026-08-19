import { PlatformUser } from "../models/platformUser.model.js"
import { UserDirectory } from "../models/userDirectory.model.js"
import { Seller } from "../modules/sellers/seller.model.js"
import { hashPassword } from "../utils/crypto.js"
import { getTenantModels } from "./tenantDb.js"
import { env } from "./env.js"


async function dropLegacyRoleIndex() {
  try {
    const indexes = await PlatformUser.collection.indexes()
    if (indexes.some((idx) => idx.name === "role_1")) {
      await PlatformUser.collection.dropIndex("role_1")
      console.log("[server] Dropped legacy unique role_1 index on platformUsers")
    }
  } catch (err) {
    if (err.codeName !== "NamespaceNotFound") {
      console.warn("[server] Could not check/drop legacy role index:", err.message)
    }
  }
}


export async function seedPlatformSuperadmin() {
  await dropLegacyRoleIndex()

  const existing = await PlatformUser.findOne({ email: env.PLATFORM_SUPERADMIN_EMAIL.toLowerCase() })
  if (existing) {
    if (!existing.isOriginal) {
      existing.isOriginal = true
      await existing.save()
      console.log("[server] Marked seeded platform superadmin as original:", existing.email)
    } else {
      console.log("[server] Platform superadmin already seeded:", existing.email)
    }
    return
  }
  const passwordHash = await hashPassword(env.PLATFORM_SUPERADMIN_PASSWORD)
  await PlatformUser.create({
    role: "PLATFORM_SUPERADMIN",
    email: env.PLATFORM_SUPERADMIN_EMAIL,
    passwordHash,
    isOriginal: true,
  })
  console.log("[server] Platform superadmin seeded:", env.PLATFORM_SUPERADMIN_EMAIL)
}


export async function syncSellerLoginDirectory() {
  const sellers = await Seller.find({ deletedAt: null }).select("_id dbName").lean()
  const identitiesByEmail = new Map()

  for (const seller of sellers) {
    const { StoreUser, StoreAdmin } = getTenantModels(seller.dbName)
    const [storeUsers, storeAdmins] = await Promise.all([
      StoreUser.find({}).select("_id email").lean(),
      StoreAdmin.find({ isDeleted: false, deletedAt: null }).select("_id email").lean(),
    ])

    for (const identity of [...storeUsers, ...storeAdmins]) {
      const email = String(identity.email ?? "").trim().toLowerCase()
      if (!email) continue
      const candidates = identitiesByEmail.get(email) ?? []
      candidates.push({ email, sellerId: seller._id, userId: identity._id })
      identitiesByEmail.set(email, candidates)
    }
  }

  const operations = []
  const collisions = []
  for (const [email, candidates] of identitiesByEmail) {
    if (candidates.length !== 1) {
      collisions.push(email)
      continue
    }

    const identity = candidates[0]
    operations.push({
      updateOne: {
        filter: { email },
        update: { $set: identity },
        upsert: true,
      },
    })
  }

  if (operations.length) {
    await UserDirectory.bulkWrite(operations, { ordered: false })
  }

  if (collisions.length) {
    console.warn(`[server] Skipped ${collisions.length} ambiguous seller login email(s): ${collisions.join(", ")}`)
  }
  console.log(`[server] Seller login directory synchronized: ${operations.length} account(s)`)
}
