import crypto from 'crypto';

/**
 * Compute SHA-256 and return a lowercase hex string (no 0x prefix).
 * Accepts string | Buffer | Uint8Array.
 */
export function sha256Hex(data) {
  const buf = typeof data === 'string' ? Buffer.from(data) : Buffer.from(data);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/**
 * Compute SHA-256 and return a 0x-prefixed bytes32 hex string.
 */
export function sha256Bytes32(data) {
  return '0x' + sha256Hex(data);
}

/**
 * Convenience: return Buffer of raw 32-byte hash.
 */
export function sha256Buffer(data) {
  return Buffer.from(sha256Hex(data), 'hex');
}
