import { ethers } from 'ethers';

// Minimal ABI for attest & isAttested
const CONTRACT_ABI = [
  'function attest(bytes32 docHash) returns (bool)',
  'function revoke(bytes32 docHash) returns (bool)',
  'function isAttested(bytes32 docHash) view returns (bool attested, address attestor, uint256 blockNumber)',
  'event Attested(bytes32 indexed docHash, address indexed attestor, uint256 blockNumber)'
];

export function createProvider(rpcUrl) {
  return new ethers.providers.JsonRpcProvider(rpcUrl);
}

export function createSigner(privateKey, provider) {
  return new ethers.Wallet(privateKey, provider);
}

export function getContract(address, signerOrProvider) {
  return new ethers.Contract(address, CONTRACT_ABI, signerOrProvider);
}

export async function attestHash({ rpcUrl, contractAddress, privateKey, docHash }) {
  const provider = createProvider(rpcUrl);
  const signer = createSigner(privateKey, provider);
  const contract = getContract(contractAddress, signer);
  const tx = await contract.attest(docHash);
  const rec = await tx.wait();
  return { txHash: tx.hash, blockNumber: rec.blockNumber, receipt: rec };
}

export async function checkAttested({ rpcUrl, contractAddress, docHash }) {
  const provider = createProvider(rpcUrl);
  const contract = getContract(contractAddress, provider);
  const result = await contract.isAttested(docHash);
  // result is a struct-like array: [attested, attestor, blockNumber]
  return {
    attested: result[0],
    attestor: result[1],
    blockNumber: result[2] && result[2].toNumber ? result[2].toNumber() : result[2]
  };
}
