// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../contracts/DeepFunding.sol";
import "../contracts/JuryRegistry.sol";

contract DisputeFlowTest is Test {
    DeepFunding public deepFunding;
    JuryRegistry public juryRegistry;

    address public owner = address(0xAA1);
    address public disputeResolver = address(0xAA2);
    address public proposer = address(0xBB1);
    address public challenger = address(0xCC1);

    bytes32 public constant GRAPH_HASH = 0xd93a4f71337c24c18330a5947be0a904da8ab7cbfb4f378e6d0fa798f5286047;
    bytes32 public constant JUDGMENT_DATASET_HASH = 0xa4f17c8ac83692f9bf45ab2fdfc07fa6fc15c1de19ecf530eaa1f5614d19c8ae;
    bytes32 public constant ALGORITHM_VERSION_HASH = 0xd84ac5df4ab0a264ec1ba3e91f16b8a5223d2c66b15ea47a9a6f395265bc0eab;
    bytes32 public constant MERKLE_ROOT = 0xb86f90f7b8bb7898c68751abb0c7cafb049a7f4ef1acc7dbff8b154ada7914c7;

    uint256 public constant POT_WEI = 1 ether;
    uint256 public constant DISPUTE_WINDOW = 3 days;

    function setUp() public {
        vm.deal(proposer, 10 ether);
        juryRegistry = new JuryRegistry(owner);
        deepFunding = new DeepFunding(owner, address(juryRegistry), disputeResolver, 1 days);
    }

    function _createProposal() internal returns (uint256) {
        vm.prank(proposer);
        return deepFunding.proposeDistribution{value: POT_WEI}(
            GRAPH_HASH,
            JUDGMENT_DATASET_HASH,
            ALGORITHM_VERSION_HASH,
            MERKLE_ROOT,
            DISPUTE_WINDOW
        );
    }

    function test_Check2_DisputeWindow_CannotFinalizeBeforeDeadline() public {
        uint256 distId = _createProposal();

        // 1 second before deadline
        vm.warp(block.timestamp + DISPUTE_WINDOW - 1);
        vm.expectRevert(DeepFunding.DisputeWindowActive.selector);
        deepFunding.finalizeDistribution(distId);

        // At exact deadline
        vm.warp(block.timestamp + 1);
        deepFunding.finalizeDistribution(distId);

        IDeepFunding.Distribution memory dist = deepFunding.getDistribution(distId);
        assertEq(uint256(dist.state), uint256(IDeepFunding.DistributionState.Finalized));
    }

    function test_Check2_CannotClaimBeforeFinalization() public {
        uint256 distId = _createProposal();

        bytes32[] memory emptyProof = new bytes32[](0);
        vm.expectRevert(DeepFunding.InvalidDistributionState.selector);
        deepFunding.claim(
            distId,
            bytes32(uint256(1)),
            address(0x123),
            100,
            emptyProof
        );
    }

    function test_Check4_OpenDispute_BlocksFinalizationEvenAfterDeadline() public {
        uint256 distId = _createProposal();

        // Submit dispute during window
        vm.prank(challenger);
        uint256 disputeId = deepFunding.submitDispute(
            distId,
            "Graph cycle incorrectly inflated transitive weight",
            "ipfs://QmEvidenceProof"
        );
        assertEq(disputeId, 1);

        IDeepFunding.Distribution memory distBefore = deepFunding.getDistribution(distId);
        assertEq(uint256(distBefore.state), uint256(IDeepFunding.DistributionState.Disputed));
        assertEq(distBefore.activeDisputeCount, 1);

        // Fast-forward past dispute window
        vm.warp(block.timestamp + DISPUTE_WINDOW + 10);

        // Finalization MUST REVERT because dispute is open
        vm.expectRevert(DeepFunding.InvalidDistributionState.selector);
        deepFunding.finalizeDistribution(distId);
    }

    function test_Check4_SuccessfulDispute_InvalidatesProposalAndAllowsRefund() public {
        uint256 distId = _createProposal();

        // Submit dispute
        vm.prank(challenger);
        uint256 disputeId = deepFunding.submitDispute(
            distId,
            "Missing registered juror signature",
            "ipfs://QmEvidenceProof"
        );

        // Dispute resolver upholds dispute
        vm.prank(disputeResolver);
        deepFunding.resolveDispute(
            distId,
            disputeId,
            true, // accept dispute
            "Upheld: Missing EIP-712 signature from registered juror"
        );

        IDeepFunding.Distribution memory dist = deepFunding.getDistribution(distId);
        assertEq(uint256(dist.state), uint256(IDeepFunding.DistributionState.Invalidated));

        // Finalization must revert
        vm.warp(block.timestamp + DISPUTE_WINDOW + 100);
        vm.expectRevert(DeepFunding.InvalidDistributionState.selector);
        deepFunding.finalizeDistribution(distId);

        // Proposer can reclaim their funding pot safely
        uint256 initialBal = proposer.balance;
        vm.prank(proposer);
        deepFunding.refundInvalidatedDistribution(distId);
        assertEq(proposer.balance - initialBal, POT_WEI);
    }

    function test_RejectedDispute_AllowsFinalizationOnceResolved() public {
        uint256 distId = _createProposal();

        vm.prank(challenger);
        uint256 disputeId = deepFunding.submitDispute(
            distId,
            "Spam challenge with no evidence",
            "ipfs://QmSpam"
        );

        // Dispute resolver rejects dispute
        vm.prank(disputeResolver);
        deepFunding.resolveDispute(
            distId,
            disputeId,
            false, // reject dispute
            "Rejected: Inconsequential claim refuted by onchain audit manifest"
        );

        IDeepFunding.Distribution memory dist = deepFunding.getDistribution(distId);
        assertEq(uint256(dist.state), uint256(IDeepFunding.DistributionState.Proposed));
        assertEq(dist.activeDisputeCount, 0);

        // Past deadline, finalization now succeeds
        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);
        deepFunding.finalizeDistribution(distId);

        dist = deepFunding.getDistribution(distId);
        assertEq(uint256(dist.state), uint256(IDeepFunding.DistributionState.Finalized));
    }

    function test_CannotSubmitDisputeAfterDeadline() public {
        uint256 distId = _createProposal();

        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);

        vm.prank(challenger);
        vm.expectRevert(DeepFunding.DisputeWindowExpired.selector);
        deepFunding.submitDispute(distId, "Late challenge", "ipfs://Late");
    }
}
