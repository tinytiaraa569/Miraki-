import mongoose from "mongoose"
import { storeSchema } from "../modules/stores/store.model.js"
import { storeVariantSchema } from "../modules/storevariants/storevariant.model.js"
import { substoreSchema } from "../modules/substores/substore.model.js"
import { storeUserSchema } from "../modules/users/storeUser.model.js"
import { permissionSchema } from "../modules/permissions/permission.model.js"
import { roleSchema } from "../modules/roles/role.model.js"
import { storeAdminSchema } from "../modules/storeadmins/storeadmin.model.js"

// -----------------------------------------------------------------------------
// DATABASE-PER-TENANT MULTI-TENANCY
//
// `miraki_platform` is the MASTER database (sellers registry, platform users,
// invite tokens, user directory, audit logs, platform settings).
//
// Each seller gets EXACTLY ONE dedicated database, created when the seller is
// set up, holding ALL of that seller's collections:
//
//   tenant_miraki_jewels
//     ├─ stores
//     ├─ storeUsers
//     ├─ substores
//     └─ storevariants
//
// The database name is DETERMINISTIC — derived purely from the seller's slug
// with NO random suffix — so re-creating or re-seeding the same seller can
// never spawn a duplicate database.
// -----------------------------------------------------------------------------

const TENANT_PREFIX = "tenant_"

// "Unity Jewels" / "unity-jewels" -> "tenant_unity_jewels" (deterministic!)
export function makeTenantDbName(slug) {
  const safe = String(slug)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "")
  if (!safe) throw new Error(`Cannot derive tenant db name from slug "${slug}"`)
  // MongoDB db-name limit is 38 bytes on Atlas — stay well under it.
  return `${TENANT_PREFIX}${safe.slice(0, 30)}`
}

export function isTenantDbName(name) {
  return typeof name === "string" && name.startsWith(TENANT_PREFIX)
}

// Per-tenant model cache. useDb({ useCache: true }) reuses the SAME underlying
// connection pool — no extra sockets per tenant.
const modelCache = new Map()

export function getTenantModels(dbName) {
  if (!isTenantDbName(dbName)) {
    throw new Error(`Refusing to open non-tenant database "${dbName}"`)
  }

  const cached = modelCache.get(dbName)
  if (cached) return cached

  const conn = mongoose.connection.useDb(dbName, { useCache: true })
  const models = {
    Store: conn.models.Store || conn.model("Store", storeSchema, "stores"),
    StoreUser: conn.models.StoreUser || conn.model("StoreUser", storeUserSchema, "storeUsers"),
    Substore: conn.models.Substore || conn.model("Substore", substoreSchema, "substores"),
    StoreVariant: conn.models.StoreVariant || conn.model("StoreVariant", storeVariantSchema, "storevariants"),
    Permission : conn.models.Permission || conn.model("Permission", permissionSchema, "permissions"),
    Role : conn.models.Role || conn.model("Role", roleSchema, "roles"),
    StoreAdmin : conn.models.StoreAdmin || conn.model("StoreAmin", storeAdminSchema, "storeadmins"),
  }

  modelCache.set(dbName, models)
  return models
}

// Hard delete: drops the seller's ENTIRE dedicated database in one operation.
export async function dropTenantDb(dbName) {
  if (!isTenantDbName(dbName)) {
    throw new Error(`Refusing to drop non-tenant database "${dbName}"`)
  }
  const conn = mongoose.connection.useDb(dbName, { useCache: true })
  await conn.dropDatabase()
  modelCache.delete(dbName)
}
