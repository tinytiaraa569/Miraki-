import argon2 from "argon2"
import { createHash, randomBytes } from "node:crypto"

export const hashPassword = (plain) =>
  argon2.hash(plain, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 })

// argon2.verify is constant-time.
export const verifyPassword = (hash, plain) => argon2.verify(hash, plain)

export const sha256 = (value) => createHash("sha256").update(value).digest("hex")

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("hex")

// --- Anti-enumeration decoy -------------------------------------------------
// A login attempt for an email that does NOT exist must cost the same time as
// one for a real account with a wrong password — otherwise response timing
// reveals which emails are registered (account enumeration). We warm a single
// argon2id hash of an unguessable value at startup and verify the supplied
// password against it on the no-such-user path. The comparison always fails;
// only its timing matters, so the result is discarded.
const decoyHashPromise = hashPassword(randomToken(16)).catch(() => null)

export const verifyPasswordDecoy = async (plain) => {
  const decoy = await decoyHashPromise
  if (!decoy) return
  try {
    await verifyPassword(decoy, String(plain ?? ""))
  } catch {
    // Never throws — exists purely to equalize response timing.
  }
}
