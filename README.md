# CertiTrust — DPI-03 Document Verification System

An end-to-end document verification MVP using **Bun** (backend), **Supabase** (storage & DB), **W3C Verifiable Credentials (JWT)** for credential format, and an **EVM** smart contract for immutable attestations.

## Features
- Compute SHA-256 of uploaded documents
- Store files in Supabase Storage and metadata in Supabase Postgres
- Issue W3C Verifiable Credentials (JWT) signed by an issuer key
- Attest the SHA-256 on-chain via a lightweight `CredentialRegistry` contract
- Verify credentials (signature + on-chain attestation)

## Local setup
1. Copy `.env.example` and fill values.
2. Install dependencies:

```bash
bun install
```

3. Run the server:

```bash
bun --watch backend/server.js
```

## API Endpoints
- POST `/api/issueCredential` — (multipart/form-data) fields: `file` (file), `subjectId` — issues VC and attests on-chain
- POST `/api/verifyCredential` — JSON: `{ jwt }` or `{ file: base64 }` — verifies signature and on-chain state
- GET `/api/getCredential?id=<document_id>` — fetch stored document metadata and attestations

Example — issue with curl

```bash
curl -X POST http://localhost:3000/api/issueCredential \
  -F "file=@./sample.pdf" \
  -F "subjectId=did:example:alice"
```

Example — verify with JWT

```bash
curl -X POST http://localhost:3000/api/verifyCredential \
  -H "Content-Type: application/json" \
  --data '{ "jwt": "<VC_JWT>" }'
```

## Environment variables
See `.env.example` in the repo for required variables (Supabase URL & keys, RPC URL, contract address, issuer keys).

## Next steps & TODO
- Add Supabase SQL migrations for `documents` and `attestations` tables
- Add contract deployment scripts (Hardhat/Foundry)
- Add robust DID handling and key management for VCs
- Add authentication and RLS policies in Supabase for secure access

---

For usage instructions and development notes, check the `backend/` folder.
