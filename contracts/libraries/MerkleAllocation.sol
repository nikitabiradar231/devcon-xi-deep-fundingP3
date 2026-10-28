// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

library MerkleAllocation {
    /**
     * @notice Computes double-hashed leaf matching OpenZeppelin StandardMerkleTree.
     * Leaf format: [distributionId, graphHash, algorithmVersionHash, packageIdHash, recipient, amountWei]
     * In StandardMerkleTree, inner hash = keccak256(abi.encode(...))
     * and leaf = keccak256(bytes.concat(innerHash))
     */
    function computeLeafHash(
        uint256 distributionId,
        bytes32 graphHash,
        bytes32 algorithmVersionHash,
        bytes32 packageIdHash,
        address recipient,
        uint256 amountWei
    ) internal pure returns (bytes32) {
        bytes32 innerHash = keccak256(
            abi.encode(
                distributionId,
                graphHash,
                algorithmVersionHash,
                packageIdHash,
                recipient,
                amountWei
            )
        );
        return keccak256(bytes.concat(innerHash));
    }

    /**
     * @notice Verifies a cryptographic Merkle proof against the committed root
     */
    function verifyAllocation(
        bytes32 root,
        bytes32 leaf,
        bytes32[] calldata proof
    ) internal pure returns (bool) {
        return MerkleProof.verify(proof, root, leaf);
    }
}
