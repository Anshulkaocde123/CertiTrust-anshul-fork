import { SignJWT, jwtVerify, importJWK } from 'jose';

// Create a simple W3C Verifiable Credential as a JWT and sign with a secp256k1 private key (JWK)
// Expect PRIVATE_KEY_HEX as 32-byte hex string (no 0x)

function privateKeyHexToJwkSecp256k1(hexPrivate) {
  // jose requires a JWK with `crv: 'secp256k1'`, `kty: 'EC'` & private 'd'
  // NOTE: This is minimal and not handling public derivation. In production, use a proper DID method and key management.
  return {
    kty: 'EC',
    crv: 'secp256k1',
    d: Buffer.from(hexPrivate, 'hex').toString('base64url')
  };
}

export async function signVcJwt({ issuer, privateKeyHex, subjectId, credentialSubject, expirySeconds = 60 * 60 * 24 * 365 }) {
  const jwk = privateKeyHexToJwkSecp256k1(privateKeyHex);
  const key = await importJWK(jwk, 'ES256K');

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: issuer,
    sub: subjectId,
    nbf: now,
    iat: now,
    exp: now + expirySeconds,
    vc: {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'DocumentCredential'],
      credentialSubject
    }
  };

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'ES256K' })
    .sign(key);

  return jwt;
}

export async function verifyVcJwt({ jwt, publicJwk }) {
  const key = await importJWK(publicJwk, 'ES256K');
  const { payload } = await jwtVerify(jwt, key, {
    // we don't enforce `iss` here; caller can decide
  });
  return payload;
}
