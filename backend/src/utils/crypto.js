import argon2 from "argon2"
import { createHash, randomBytes } from "node:crypto"

export const hashPassword = (plain) =>
  argon2.hash(plain, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 })

// argon2.verify is constant-time.
export const verifyPassword = (hash, plain) => argon2.verify(hash, plain)

export const sha256 = (value) => createHash("sha256").update(value).digest("hex")

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("hex")
