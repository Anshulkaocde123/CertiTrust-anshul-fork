export async function generateId(length = 32): Promise<string> {
  // Generate 32 random bytes, hash with SHA-256, and return a hex string truncated to `length` chars
  const random = crypto.getRandomValues(new Uint8Array(32));
  const hashBuffer = await crypto.subtle.digest('SHA-256', random);
  const hex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hex.slice(0, length).toUpperCase();
}
