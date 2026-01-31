// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract CredentialRegistry {
    struct Attestation {
        address attestor;
        bool attested;
        uint256 blockNumber;
    }

    mapping(bytes32 => Attestation) public attestations;

    event Attested(bytes32 indexed docHash, address indexed attestor, uint256 blockNumber);
    event Revoked(bytes32 indexed docHash, address indexed attestor, uint256 blockNumber);

    function attest(bytes32 docHash) external returns (bool) {
        require(!attestations[docHash].attested, "Already attested");
        attestations[docHash] = Attestation({ attestor: msg.sender, attested: true, blockNumber: block.number });
        emit Attested(docHash, msg.sender, block.number);
        return true;
    }

    function revoke(bytes32 docHash) external returns (bool) {
        require(attestations[docHash].attested, "Not attested");
        // Only allow the original attestor to revoke (simple policy)
        require(attestations[docHash].attestor == msg.sender, "Only attestor can revoke");
        attestations[docHash].attested = false;
        emit Revoked(docHash, msg.sender, block.number);
        return true;
    }

    function isAttested(bytes32 docHash) external view returns (bool, address, uint256) {
        Attestation memory a = attestations[docHash];
        return (a.attested, a.attestor, a.blockNumber);
    }
}
