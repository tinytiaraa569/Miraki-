import { PlatformUser } from "../models/platformUser.model.js"
import { hashPassword } from "../utils/crypto.js"
import { env } from "./env.js"

// Drops the legacy unique index on `role` (from the single-superadmin era).
// Without this, MongoDB would keep rejecting any second superadmin document.
async function dropLegacyRoleIndex() {
  try {
    const indexes = await PlatformUser.collection.indexes()
    if (indexes.some((idx) => idx.name === "role_1")) {
      await PlatformUser.collection.dropIndex("role_1")
      console.log("[server] Dropped legacy unique role_1 index on platformUsers")
    }
  } catch (err) {
    // Collection may not exist yet on first boot — that's fine.
    if (err.codeName !== "NamespaceNotFound") {
      console.warn("[server] Could not check/drop legacy role index:", err.message)
    }
  }
}

// The FIRST platform superadmin exists ONLY via this seed and is marked
// isOriginal so it can never be suspended. More can be created via the API.
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
