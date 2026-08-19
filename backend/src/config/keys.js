import { generateKeyPairSync, createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { env } from "./env.js"


const keysDir = join(dirname(fileURLToPath(import.meta.url)), "../../.keys")
const privPath = join(keysDir, "jwt_rs256.key")
const pubPath = join(keysDir, "jwt_rs256.key.pub")


function kidOf(publicKeyPem) {
  return createHash("sha256").update(publicKeyPem).digest("hex").slice(0, 16)
}

function normalizePem(value) {
  return value ? value.replace(/\\n/g, "\n").trim() : null
}

function fromDisk() {
  if (existsSync(privPath) && existsSync(pubPath)) {
    return {
      privateKey: readFileSync(privPath, "utf8"),
      publicKey: readFileSync(pubPath, "utf8"),
    }
  }
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  })
  mkdirSync(keysDir, { recursive: true })
  writeFileSync(privPath, privateKey, { mode: 0o600 })
  writeFileSync(pubPath, publicKey)
  return { privateKey, publicKey }
}


function loadActive() {
  const privateKey = normalizePem(env.JWT_PRIVATE_KEY)
  const publicKey = normalizePem(env.JWT_PUBLIC_KEY)
  if (privateKey && publicKey) return { privateKey, publicKey, source: "env" }

  if (env.NODE_ENV === "production") {
    console.warn(
      "[server] SECURITY: JWT_PRIVATE_KEY/JWT_PUBLIC_KEY are not set — falling back " +
        "to on-disk auto-generated keys. Provide them from your secret store for " +
        "multi-instance deploys and to avoid disk-based key exposure.",
    )
  }
  return { ...fromDisk(), source: "disk" }
}

const active = loadActive()
const activeKid = kidOf(active.publicKey)


const keyStore = new Map([[activeKid, active.publicKey]])
const prevPublicKey = normalizePem(env.JWT_PUBLIC_KEY_PREV)
if (prevPublicKey) keyStore.set(kidOf(prevPublicKey), prevPublicKey)

export const jwtKeys = {
  privateKey: active.privateKey,
  publicKey: active.publicKey,
  kid: activeKid,
  source: active.source,
}

export function getVerifyKey(kid) {
  if (kid && keyStore.has(kid)) return keyStore.get(kid)
  return active.publicKey
}
