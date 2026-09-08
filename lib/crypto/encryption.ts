/**
 * Zero-Knowledge Client & Server AES-256-GCM Encryption Engine
 * Uses the standard Web Crypto API (crypto.subtle) with PBKDF2 key derivation.
 */

// Helper to convert Uint8Array to Base64
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  if (typeof window === "undefined" && typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64")
  }
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Helper to convert Base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof window === "undefined" && typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"))
  }
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// Get standard subtle crypto instance
function getSubtleCrypto(): SubtleCrypto {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    return window.crypto.subtle
  }
  if (typeof globalThis !== "undefined" && globalThis.crypto?.subtle) {
    return globalThis.crypto.subtle
  }
  // Node.js fallback
  try {
    const nodeCrypto = require("crypto")
    if (nodeCrypto.webcrypto?.subtle) {
      return nodeCrypto.webcrypto.subtle
    }
  } catch {
    // fallback
  }
  throw new Error("Web Crypto API (subtle) is not available in this environment.")
}

/**
 * Derive an AES-GCM 256-bit key from a user passphrase and salt using PBKDF2 (100,000 iterations).
 */
export async function deriveKeyFromPassphrase(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const subtle = getSubtleCrypto()
  const enc = new TextEncoder()
  const keyMaterial = await subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  )

  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

export interface EncryptedPayload {
  version: 1
  iv: string // Base64
  salt: string // Base64
  ciphertext: string // Base64
}

/**
 * Encrypt arbitrary plain text or JSON object into a zero-knowledge AES-256-GCM encrypted envelope.
 */
export async function encryptPayload(data: unknown, passphrase: string): Promise<string> {
  const subtle = getSubtleCrypto()
  const enc = new TextEncoder()
  const jsonString = typeof data === "string" ? data : JSON.stringify(data)
  const plaintextBytes = enc.encode(jsonString)

  // Generate 16-byte random salt and 12-byte random IV
  const salt = new Uint8Array(16)
  const iv = new Uint8Array(12)
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(salt)
    window.crypto.getRandomValues(iv)
  } else if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(salt)
    globalThis.crypto.getRandomValues(iv)
  } else {
    const nodeCrypto = require("crypto")
    nodeCrypto.randomFillSync(salt)
    nodeCrypto.randomFillSync(iv)
  }

  const key = await deriveKeyFromPassphrase(passphrase, salt)
  const encryptedBuffer = await subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as any,
    },
    key,
    plaintextBytes
  )

  const payload: EncryptedPayload = {
    version: 1,
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt),
    ciphertext: arrayBufferToBase64(encryptedBuffer),
  }

  return JSON.stringify(payload)
}

/**
 * Decrypt an AES-256-GCM encrypted envelope back into plain text string.
 */
export async function decryptPayload(encryptedEnvelope: string, passphrase: string): Promise<string> {
  let payload: EncryptedPayload
  try {
    payload = typeof encryptedEnvelope === "string" ? JSON.parse(encryptedEnvelope) : encryptedEnvelope
  } catch {
    throw new Error("Invalid encrypted payload format.")
  }

  if (!payload || payload.version !== 1 || !payload.iv || !payload.salt || !payload.ciphertext) {
    throw new Error("Invalid or unsupported encrypted payload structure.")
  }

  const subtle = getSubtleCrypto()
  const salt = base64ToUint8Array(payload.salt)
  const iv = base64ToUint8Array(payload.iv)
  const ciphertext = base64ToUint8Array(payload.ciphertext)

  const key = await deriveKeyFromPassphrase(passphrase, salt)
  const decryptedBuffer = await subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as any,
    },
    key,
    ciphertext as any
  )

  const dec = new TextDecoder()
  return dec.decode(decryptedBuffer)
}
