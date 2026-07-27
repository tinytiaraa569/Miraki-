import { generateKeyPairSync } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

// RS256 keypair for JWT signing. In production, mount real keys at server/.keys/
// (never committed). In dev, a keypair is generated once and reused.
const keysDir = join(dirname(fileURLToPath(import.meta.url)), "../../.keys")
const privPath = join(keysDir, "jwt_rs256.key")
const pubPath = join(keysDir, "jwt_rs256.key.pub")

function loadOrCreate() {
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

export const jwtKeys = loadOrCreate()
