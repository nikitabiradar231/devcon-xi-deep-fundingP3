// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IDeepFunding {
    enum DistributionState {
        None,
        Proposed,
        Disputed,
        Finalized,
        Invalidated
    }

    struct Dispute {
        uint256 disputeId;
        address challenger;
        string reason;
        string evidenceUri;
        uint256 createdAt;
        bool resolved;
        bool accepted;
        string resolutionNote;
        address resolvedBy;
    }

    struct Distribution {
        uint256 id;
        uint256 fundingPotWei;
        bytes32 graphHash;
        bytes32 judgmentDatasetHash;
        bytes32 algorithmVersionHash;
        bytes32 merkleRoot;
        uint256 proposedAt;
        uint256 disputeDeadline;
        DistributionState state;
        uint256 totalClaimedWei;
        address proposer;
        uint256 activeDisputeCount;
        uint256 totalDisputes;
    }

    event DistributionProposed(
        uint256 indexed distributionId,
        bytes32 indexed merkleRoot,
        bytes32 graphHash,
        uint256 fundingPotWei,
        uint256 disputeDeadline,
        address proposer
    );

    event DisputeSubmitted(
        uint256 indexed distributionId,
        uint256 indexed disputeId,
        address indexed challenger,
        string reason,
        string evidenceUri
    );

    event DisputeResolved(
        uint256 indexed distributionId,
        uint256 indexed disputeId,
        bool accepted,
        string resolutionNote,
        address resolver
    );

    event DistributionFinalized(uint256 indexed distributionId);
    event DistributionInvalidated(uint256 indexed distributionId);

    event AllocationClaimed(
        uint256 indexed distributionId,
        bytes32 indexed packageIdHash,
        address indexed recipient,
        uint256 amountWei
    );

    function proposeDistribution(
        bytes32 graphHash,
        bytes32 judgmentDatasetHash,
        bytes32 algorithmVersionHash,
        bytes32 merkleRoot,
        uint256 disputeWindowDuration
    ) external payable returns (uint256 distributionId);

    function submitDispute(
        uint256 distributionId,
        string calldata reason,
        string calldata evidenceUri
    ) external returns (uint256 disputeId);

    function resolveDispute(
        uint256 distributionId,
        uint256 disputeId,
        bool acceptDispute,
        string calldata resolutionNote
    ) external;

    function finalizeDistribution(uint256 distributionId) external;

    function claim(
        uint256 distributionId,
        bytes32 packageIdHash,
        address recipient,
        uint256 amountWei,
        bytes32[] calldata proof
    ) external;

    function getDistribution(uint256 distributionId) external view returns (Distribution memory);
    function getDispute(uint256 distributionId, uint256 disputeId) external view returns (Dispute memory);
    function hasPackageClaimed(uint256 distributionId, bytes32 packageIdHash) external view returns (bool);
}
