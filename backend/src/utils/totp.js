import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

// Self-contained RFC 4226 (HOTP) / RFC 6238 (TOTP) implementation using
// node:crypto only. This replaces `otplib`, which ships a CommonJS build that
// require()s the ESM-only `@scure/base` and crashes under Node's loader.

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

// RFC 4648 base32 encode (no padding) — the format authenticator apps expect.
function base32Encode(buffer) {
  let bits = 0
  let value = 0
  let output = ""
  for (const byte of buffer) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }
  return output
}

// RFC 4648 base32 decode — tolerant of lowercase and padding.
function base32Decode(input) {
  const cleaned = input.toUpperCase().replace(/=+$/, "").replace(/\s/g, "")
  let bits = 0
  let value = 0
  const bytes = []
  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char)
    if (idx === -1) throw new Error("Invalid base32 character")
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

// HOTP: HMAC-SHA1 of the 8-byte counter, dynamically truncated to `digits`.
function generateHotp(secretBuffer, counter, digits) {
  const counterBuffer = Buffer.alloc(8)
  // Support counters beyond 32 bits via BigInt.
  counterBuffer.writeBigUInt64BE(BigInt(counter))

  const hmac = createHmac("sha1", secretBuffer).update(counterBuffer).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  return String(binary % 10 ** digits).padStart(digits, "0")
}

export const authenticator = {
  options: { window: 1, step: 30, digits: 6 },

  // Random 20-byte (160-bit) secret, base32-encoded per the otpauth spec.
  generateSecret() {
    return base32Encode(randomBytes(20))
  },

  // Build an otpauth:// URI for QR-code enrollment.
  keyuri(accountName, issuer, secret) {
    const label = encodeURIComponent(`${issuer}:${accountName}`)
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: "SHA1",
      digits: String(this.options.digits),
      period: String(this.options.step),
    })
    return `otpauth://totp/${label}?${params.toString()}`
  },

  // Current TOTP code for a secret.
  generate(secret) {
    const { step, digits } = this.options
    const counter = Math.floor(Date.now() / 1000 / step)
    return generateHotp(base32Decode(secret), counter, digits)
  },

  // Verify a submitted token, allowing ±`window` time-steps of clock drift.
  verify({ token, secret }) {
    if (!token || !secret) return false
    const { step, digits, window } = this.options
    const secretBuffer = base32Decode(secret)
    const counter = Math.floor(Date.now() / 1000 / step)
    const candidate = String(token).trim()

    for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
      const expected = generateHotp(secretBuffer, counter + errorWindow, digits)
      const a = Buffer.from(expected)
      const b = Buffer.from(candidate)
      if (a.length === b.length && timingSafeEqual(a, b)) return true
    }
    return false
  },

  // Like verify(), but returns the matched time-step COUNTER (or null on no
  // match) instead of a boolean. Callers persist the last accepted counter and
  // reject any later code whose counter is <= it — this stops replay of an
  // already-used code that is otherwise still inside the drift window.
  verifyGetStep({ token, secret }) {
    if (!token || !secret) return null
    const { step, digits, window } = this.options
    const secretBuffer = base32Decode(secret)
    const counter = Math.floor(Date.now() / 1000 / step)
    const candidate = String(token).trim()

    for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
      const c = counter + errorWindow
      const expected = generateHotp(secretBuffer, c, digits)
      const a = Buffer.from(expected)
      const b = Buffer.from(candidate)
      if (a.length === b.length && timingSafeEqual(a, b)) return c
    }
    return null
  },
}