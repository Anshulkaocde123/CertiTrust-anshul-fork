import { createClient } from '@supabase/supabase-js';
import { sha256Hex, sha256Bytes32 } from '../utils/hash.js';
import { verifyVcJwt } from '../utils/vc.js';
import { checkAttested } from '../utils/blockchain.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function verifyCredential(req) {
  try {
    const body = await req.json();

    if (body.jwt) {
      // verify VC signature
      const issuerPublicJwk = JSON.parse(process.env.VC_ISSUER_PUBLIC_JWK || '{}');
      const payload = await verifyVcJwt({ jwt: body.jwt, publicJwk: issuerPublicJwk });
      const docHashHex = payload.vc?.credentialSubject?.docHash;
      if (!docHashHex) return new Response(JSON.stringify({ verified: false, reason: 'no docHash in VC' }), { status: 400 });

      // check on-chain
      const rpcUrl = process.env.RPC_URL;
      const contractAddress = process.env.CONTRACT_ADDRESS;
      const onChain = await checkAttested({ rpcUrl, contractAddress, docHash: docHashHex });

      return new Response(JSON.stringify({ verified: onChain.attested, onChain, payload }), { status: 200 });
    }

    if (body.file) {
      // Expect base64 file content or storage reference
      const b64 = body.file; // base64
      const buffer = Buffer.from(b64, 'base64');
      const sha = sha256Hex(buffer);
      const sha32 = sha256Bytes32(buffer);

      const rpcUrl = process.env.RPC_URL;
      const contractAddress = process.env.CONTRACT_ADDRESS;
      const onChain = await checkAttested({ rpcUrl, contractAddress, docHash: sha32 });

      return new Response(JSON.stringify({ verified: onChain.attested, onChain, sha }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'jwt or file required' }), { status: 400 });
  } catch (err) {
    console.error('verifyCredential error', err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 });
  }
}
