import { describe, it, expect } from 'bun:test';
import { sha256Hex, sha256Bytes32, sha256HexAsync } from '../utils/hash';

const EMPTY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

describe('sha256 utility', () => {
  it('hashes empty string (sync)', () => {
    expect(sha256Hex('')).toBe(EMPTY_SHA256);
    expect(sha256Bytes32('')).toBe('0x' + EMPTY_SHA256);
  });

  it('hashes empty string (async)', async () => {
    const h = await sha256HexAsync('');
    expect(h).toBe(EMPTY_SHA256);
  });

  it('sync and async agree for binary data', async () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    expect(await sha256HexAsync(data)).toBe(sha256Hex(data));
  });
});
