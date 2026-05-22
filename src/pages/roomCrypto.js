// ─────────────────────────────────────────────────────────────────────────────
// roomCrypto.js — AES-GCM 256 end-to-end encryption for BorgMeeting
//
// Key lives in the URL fragment (#key=<base64>) and never touches the server.
// Each message gets a fresh random 12-byte IV, prepended to the ciphertext
// before base64 encoding. Format stored in D1: base64(IV || ciphertext)
// ─────────────────────────────────────────────────────────────────────────────

const ALGO = { name: 'AES-GCM', length: 256 };
const IV_BYTES = 12;

/**
 * Generate a new room encryption key.
 * Call once at room creation; embed the export in the URL fragment.
 */
export async function generateRoomKey() {
  return crypto.subtle.generateKey(ALGO, true, ['encrypt', 'decrypt']);
}

/**
 * Export a CryptoKey to a URL-safe base64 string for the #key= fragment.
 */
export async function exportKeyToBase64(cryptoKey) {
  const raw = await crypto.subtle.exportKey('raw', cryptoKey);
  return btoa(String.fromCharCode(...new Uint8Array(raw)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Import a CryptoKey from the URL-safe base64 string in the #key= fragment.
 * Throws if the string is malformed — callers should catch and show an error.
 */
export async function importKeyFromBase64(b64) {
  const std = b64.replace(/-/g, '+').replace(/_/g, '/');
  const raw = Uint8Array.from(atob(std), c => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', raw, ALGO, false, ['encrypt', 'decrypt']);
}

/**
 * Encrypt a plaintext string. Returns base64(IV || ciphertext).
 */
export async function encryptMessage(cryptoKey, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, encoded);
  const combined = new Uint8Array(IV_BYTES + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), IV_BYTES);
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a base64(IV || ciphertext) string back to plaintext.
 * Throws on failure — callers should catch and substitute '[encrypted]'.
 */
export async function decryptMessage(cryptoKey, b64) {
  const combined = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const iv = combined.slice(0, IV_BYTES);
  const ciphertext = combined.slice(IV_BYTES);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, ciphertext);
  return new TextDecoder().decode(plaintext);
}

/**
 * Parse the room key from window.location.hash.
 * Returns the base64 key string, or null if not present.
 */
export function extractKeyFromHash(hash) {
  const match = hash.match(/[#&]key=([^&]+)/);
  return match ? match[1] : null;
}
