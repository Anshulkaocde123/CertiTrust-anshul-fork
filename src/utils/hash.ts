import crypto from 'crypto';

/**
 * Compute SHA-256 and return a lowercase hex string (no 0x prefix).
 * Accepts string | Buffer | Uint8Array.
 */
export function sha256Hex(data: string | Buffer | Uint8Array): string {
  const buf = typeof data === 'string' ? Buffer.from(data) : Buffer.from(data);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/**
 * Compute SHA-256 and return a 0x-prefixed bytes32 hex string.
 */
export function sha256Bytes32(data: string | Buffer | Uint8Array): string {
  return '0x' + sha256Hex(data);
}

/**
 * Async SHA-256 using the Web Crypto API when available, falling back to sync implementation.
 * Returns lowercase hex string (no 0x).
 */
export async function sha256HexAsync(data: string | ArrayBuffer | Uint8Array): Promise<string> {
  if (typeof data === 'string') data = new TextEncoder().encode(data);
  const u8 = data instanceof Uint8Array ? data : new Uint8Array(data);

  // Use Web Crypto if available (works in Bun & browsers)
  const subtle = (globalThis as any).crypto?.subtle;
  if (subtle && typeof subtle.digest === 'function') {
    const hash = await subtle.digest('SHA-256', u8);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback to Node crypto
  return sha256Hex(u8);
}

/**
 * Convenience: return Buffer of raw 32-byte hash.
 */
export function sha256Buffer(data: string | Buffer | Uint8Array): Buffer {
  return Buffer.from(sha256Hex(data), 'hex');
}
