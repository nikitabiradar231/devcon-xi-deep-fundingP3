// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IDeepFunding.sol";
import "./interfaces/IJuryRegistry.sol";
import "./libraries/MerkleAllocation.sol";

contract DeepFunding is Ownable, ReentrancyGuard, IDeepFunding {
    IJuryRegistry public immutable juryRegistry;
    address public disputeResolver;
    uint256 public minDisputeWindow;

    uint256 public nextDistributionId = 1;
    mapping(uint256 => Distribution) public distributions;
    mapping(uint256 => mapping(uint256 => Dispute)) public disputes;
    // distributionId => packageIdHash => claimed
    mapping(uint256 => mapping(bytes32 => bool)) public hasClaimed;

    error ZeroFundingPot();
    error InvalidMerkleRoot();
    error InvalidGraphHash();
    error DisputeWindowTooShort();
    error DistributionNotFound();
    error InvalidDistributionState();
    error DisputeWindowActive();
    error DisputeWindowExpired();
    error UnresolvedDisputesActive();
    error DisputeNotFound();
    error DisputeAlreadyResolved();
    error UnauthorizedDisputeResolver();
    error InvalidRecipient();
    error ZeroClaimAmount();
    error AlreadyClaimed();
    error InvalidMerkleProof();
    error ExceedsFundingPot();
    error TransferFailed();
    error UnauthorizedCaller();

    modifier onlyDisputeResolver() {
        if (msg.sender != disputeResolver && msg.sender != owner()) {
            revert UnauthorizedDisputeResolver();
        }
        _;
    }

    constructor(
        address initialOwner,
        address _juryRegistry,
        address _disputeResolver,
        uint256 _minDisputeWindow
    ) Ownable(initialOwner) {
        juryRegistry = IJuryRegistry(_juryRegistry);
        disputeResolver = _disputeResolver;
        minDisputeWindow = _minDisputeWindow;
    }

    function setDisputeResolver(address _resolver) external onlyOwner {
        require(_resolver != address(0), "Invalid resolver");
        disputeResolver = _resolver;
    }

    function setMinDisputeWindow(uint256 _minWindow) external onlyOwner {
        minDisputeWindow = _minWindow;
    }

    function proposeDistribution(
        bytes32 graphHash,
        bytes32 judgmentDatasetHash,
        bytes32 algorithmVersionHash,
        bytes32 merkleRoot,
        uint256 disputeWindowDuration
    ) external payable override returns (uint256) {
        if (msg.value == 0) revert ZeroFundingPot();
        if (merkleRoot == bytes32(0)) revert InvalidMerkleRoot();
        if (graphHash == bytes32(0)) revert InvalidGraphHash();
        if (disputeWindowDuration < minDisputeWindow) revert DisputeWindowTooShort();

        uint256 distId = nextDistributionId++;
        uint256 deadline = block.timestamp + disputeWindowDuration;

        distributions[distId] = Distribution({
            id: distId,
            fundingPotWei: msg.value,
            graphHash: graphHash,
            judgmentDatasetHash: judgmentDatasetHash,
            algorithmVersionHash: algorithmVersionHash,
            merkleRoot: merkleRoot,
            proposedAt: block.timestamp,
            disputeDeadline: deadline,
            state: DistributionState.Proposed,
            totalClaimedWei: 0,
            proposer: msg.sender,
            activeDisputeCount: 0,
            totalDisputes: 0
        });

        emit DistributionProposed(
            distId,
            merkleRoot,
            graphHash,
            msg.value,
            deadline,
            msg.sender
        );

        return distId;
    }

    function submitDispute(
        uint256 distributionId,
        string calldata reason,
        string calldata evidenceUri
    ) external override returns (uint256 disputeId) {
        Distribution storage dist = distributions[distributionId];
        if (dist.id == 0) revert DistributionNotFound();
        if (
            dist.state != DistributionState.Proposed &&
            dist.state != DistributionState.Disputed
        ) {
            revert InvalidDistributionState();
        }
        if (block.timestamp >= dist.disputeDeadline) {
            revert DisputeWindowExpired();
        }

        dist.totalDisputes++;
        disputeId = dist.totalDisputes;
        dist.activeDisputeCount++;
        dist.state = DistributionState.Disputed;

        disputes[distributionId][disputeId] = Dispute({
            disputeId: disputeId,
            challenger: msg.sender,
            reason: reason,
            evidenceUri: evidenceUri,
            createdAt: block.timestamp,
            resolved: false,
            accepted: false,
            resolutionNote: "",
            resolvedBy: address(0)
        });

        emit DisputeSubmitted(
            distributionId,
            disputeId,
            msg.sender,
            reason,
            evidenceUri
        );

        return disputeId;
    }

    function resolveDispute(
        uint256 distributionId,
        uint256 disputeId,
        bool acceptDispute,
        string calldata resolutionNote
    ) external override onlyDisputeResolver {
        Distribution storage dist = distributions[distributionId];
        if (dist.id == 0) revert DistributionNotFound();

        Dispute storage disp = disputes[distributionId][disputeId];
        if (disp.disputeId == 0) revert DisputeNotFound();
        if (disp.resolved) revert DisputeAlreadyResolved();

        disp.resolved = true;
        disp.accepted = acceptDispute;
        disp.resolutionNote = resolutionNote;
        disp.resolvedBy = msg.sender;

        emit DisputeResolved(
            distributionId,
            disputeId,
            acceptDispute,
            resolutionNote,
            msg.sender
        );

        if (acceptDispute) {
            // Dispute upheld: proposal is invalidated and cannot be finalized or claimed
            dist.state = DistributionState.Invalidated;
            emit DistributionInvalidated(distributionId);
        } else {
            // Dispute rejected: decrement active count
            if (dist.activeDisputeCount > 0) {
                dist.activeDisputeCount--;
            }
            if (dist.activeDisputeCount == 0 && dist.state == DistributionState.Disputed) {
                dist.state = DistributionState.Proposed;
            }
        }
    }

    function finalizeDistribution(uint256 distributionId) external override {
        Distribution storage dist = distributions[distributionId];
        if (dist.id == 0) revert DistributionNotFound();
        if (dist.state != DistributionState.Proposed) revert InvalidDistributionState();
        if (dist.activeDisputeCount > 0) revert UnresolvedDisputesActive();
        if (block.timestamp < dist.disputeDeadline) revert DisputeWindowActive();

        dist.state = DistributionState.Finalized;

        emit DistributionFinalized(distributionId);
    }

    function claim(
        uint256 distributionId,
        bytes32 packageIdHash,
        address recipient,
        uint256 amountWei,
        bytes32[] calldata proof
    ) external override nonReentrant {
        Distribution storage dist = distributions[distributionId];
        if (dist.id == 0) revert DistributionNotFound();
        if (dist.state != DistributionState.Finalized) revert InvalidDistributionState();
        if (recipient == address(0)) revert InvalidRecipient();
        if (amountWei == 0) revert ZeroClaimAmount();
        if (hasClaimed[distributionId][packageIdHash]) revert AlreadyClaimed();

        // Verify cryptographic Merkle proof against committed root
        bytes32 leaf = MerkleAllocation.computeLeafHash(
            distributionId,
            dist.graphHash,
            dist.algorithmVersionHash,
            packageIdHash,
            recipient,
            amountWei
        );

        if (!MerkleAllocation.verifyAllocation(dist.merkleRoot, leaf, proof)) {
            revert InvalidMerkleProof();
        }

        // Checks-Effects-Interactions
        hasClaimed[distributionId][packageIdHash] = true;
        dist.totalClaimedWei += amountWei;

        if (dist.totalClaimedWei > dist.fundingPotWei) {
            revert ExceedsFundingPot();
        }

        emit AllocationClaimed(
            distributionId,
            packageIdHash,
            recipient,
            amountWei
        );

        (bool sent, ) = payable(recipient).call{value: amountWei}("");
        if (!sent) revert TransferFailed();
    }

    function refundInvalidatedDistribution(uint256 distributionId) external nonReentrant {
        Distribution storage dist = distributions[distributionId];
        if (dist.id == 0) revert DistributionNotFound();
        if (dist.state != DistributionState.Invalidated) revert InvalidDistributionState();
        if (msg.sender != dist.proposer && msg.sender != owner()) revert UnauthorizedCaller();
        if (dist.totalClaimedWei > 0) revert ExceedsFundingPot();

        uint256 refundAmount = dist.fundingPotWei;
        dist.fundingPotWei = 0;

        (bool sent, ) = payable(dist.proposer).call{value: refundAmount}("");
        if (!sent) revert TransferFailed();
    }

    function getDistribution(uint256 distributionId) external view override returns (Distribution memory) {
        return distributions[distributionId];
    }

    function getDispute(uint256 distributionId, uint256 disputeId) external view override returns (Dispute memory) {
        return disputes[distributionId][disputeId];
    }

    function hasPackageClaimed(uint256 distributionId, bytes32 packageIdHash) external view override returns (bool) {
        return hasClaimed[distributionId][packageIdHash];
    }
}
