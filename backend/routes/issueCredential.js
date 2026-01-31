import { createClient } from '@supabase/supabase-js';
import { sha256Hex, sha256Bytes32 } from '../utils/hash.js';
import { signVcJwt } from '../utils/vc.js';
import { attestHash } from '../utils/blockchain.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'documents';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function issueCredential(req) {
  try {
    // Expect multipart form with 'file' and JSON body fields: subjectId, subjectName
    const form = await req.formData();
    const file = form.get('file');
    const subjectId = form.get('subjectId') || form.get('subject') || 'did:example:unknown';

    if (!file) return new Response(JSON.stringify({ error: 'file required' }), { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    const sha = sha256Hex(buf);
    const sha32 = sha256Bytes32(buf);

    // store file in Supabase storage
    const fileName = `${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadErr } = await supabase.storage.from(SUPABASE_BUCKET).upload(fileName, buf);
    if (uploadErr) throw uploadErr;

    // store document metadata
    const { data: docData, error: docErr } = await supabase.from('documents').insert([{ file_name: fileName, file_hash: sha, owner: subjectId }]).select().single();
    if (docErr) throw docErr;

    // issue a W3C VC as JWT
    const issuer = process.env.VC_ISSUER || 'did:example:issuer';
    const issuerPrivateKey = process.env.VC_ISSUER_PRIVATE_KEY; // hex

    // credentialSubject: include docHash and storage pointer
    const credentialSubject = {
      id: subjectId,
      docHash: '0x' + sha,
      storage: { bucket: SUPABASE_BUCKET, path: fileName }
    };

    const jwt = await signVcJwt({ issuer, privateKeyHex: issuerPrivateKey, subjectId, credentialSubject });

    // Attest on-chain (idempotent behavior should be implemented by checking existing attestations first)
    const rpcUrl = process.env.RPC_URL;
    const contractAddress = process.env.CONTRACT_ADDRESS;
    const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;

    const attestation = await attestHash({ rpcUrl, contractAddress, privateKey: deployerPrivateKey, docHash: sha32 });

    // store attestation
    const { error: attErr } = await supabase.from('attestations').insert([{ document_id: docData.id, tx_hash: attestation.txHash, block_number: attestation.blockNumber, contract_address: contractAddress }]);
    if (attErr) throw attErr;

    return new Response(JSON.stringify({ ok: true, credentialJwt: jwt, document: docData, attestation }), { status: 200 });
  } catch (err) {
    console.error('issueCredential error', err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 });
  }
}
