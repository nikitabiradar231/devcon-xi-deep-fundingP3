// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../contracts/DeepFunding.sol";
import "../contracts/JuryRegistry.sol";

contract DeepFundingTest is Test {
    DeepFunding public deepFunding;
    JuryRegistry public juryRegistry;

    address public owner = address(0xAA1);
    address public disputeResolver = address(0xAA2);
    address public proposer = address(0xBB1);

    // Sample data constants matching data/sample-result.json
    bytes32 public constant GRAPH_HASH = 0xd93a4f71337c24c18330a5947be0a904da8ab7cbfb4f378e6d0fa798f5286047;
    bytes32 public constant JUDGMENT_DATASET_HASH = 0xa4f17c8ac83692f9bf45ab2fdfc07fa6fc15c1de19ecf530eaa1f5614d19c8ae;
    bytes32 public constant ALGORITHM_VERSION_HASH = 0xd84ac5df4ab0a264ec1ba3e91f16b8a5223d2c66b15ea47a9a6f395265bc0eab;
    bytes32 public constant MERKLE_ROOT = 0xb86f90f7b8bb7898c68751abb0c7cafb049a7f4ef1acc7dbff8b154ada7914c7;

    uint256 public constant POT_WEI = 1_000_000_000_000_000_000; // 1 ETH
    uint256 public constant DISPUTE_WINDOW = 3 days;

    // Pune QR-Ticketing leaf data from sample-result.json
    bytes32 public constant PUNE_PKG_HASH = 0xca42ba278f82929df3b4f7150f95c2a3e24244add208b83aa3d88a8a86460f5d;
    address public constant PUNE_RECIPIENT = 0x2222222222222222222222222222222222222222;
    uint256 public constant PUNE_AMOUNT_WEI = 161345126599571613;

    bytes32[] public puneProof;

    function setUp() public {
        vm.deal(proposer, 100 ether);

        juryRegistry = new JuryRegistry(owner);
        deepFunding = new DeepFunding(owner, address(juryRegistry), disputeResolver, 1 days);

        // Populate Pune proof
        puneProof = new bytes32[](3);
        puneProof[0] = 0xff9d53e307fef74e74ad44cbd096025ff241a40fb644548ccbe5fbe60b2a0c18;
        puneProof[1] = 0x283da87ed4963e73df77bc0a1ccf875b7bf79972226873f79a2514df49c207c0;
        puneProof[2] = 0xf6cd40aa19ba464a42e991565149cca2dd30ced66c71ab0ed0d082ef5fc605d8;
    }

    function _proposeAndFinalize() internal returns (uint256 distId) {
        vm.prank(proposer);
        distId = deepFunding.proposeDistribution{value: POT_WEI}(
            GRAPH_HASH,
            JUDGMENT_DATASET_HASH,
            ALGORITHM_VERSION_HASH,
            MERKLE_ROOT,
            DISPUTE_WINDOW
        );

        // Fast-forward past dispute window
        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);
        deepFunding.finalizeDistribution(distId);
    }

    function test_ProposeDistribution_Success() public {
        vm.prank(proposer);
        uint256 distId = deepFunding.proposeDistribution{value: POT_WEI}(
            GRAPH_HASH,
            JUDGMENT_DATASET_HASH,
            ALGORITHM_VERSION_HASH,
            MERKLE_ROOT,
            DISPUTE_WINDOW
        );

        assertEq(distId, 1);
        IDeepFunding.Distribution memory dist = deepFunding.getDistribution(distId);
        assertEq(dist.fundingPotWei, POT_WEI);
        assertEq(dist.merkleRoot, MERKLE_ROOT);
        assertEq(dist.graphHash, GRAPH_HASH);
        assertEq(uint256(dist.state), uint256(IDeepFunding.DistributionState.Proposed));
    }

    function test_ProposeDistribution_RevertZeroPot() public {
        vm.prank(proposer);
        vm.expectRevert(DeepFunding.ZeroFundingPot.selector);
        deepFunding.proposeDistribution{value: 0}(
            GRAPH_HASH,
            JUDGMENT_DATASET_HASH,
            ALGORITHM_VERSION_HASH,
            MERKLE_ROOT,
            DISPUTE_WINDOW
        );
    }

    function test_Check1_OnchainCommitment_ValidProofPaysExactAmount() public {
        uint256 distId = _proposeAndFinalize();

        uint256 initialBal = PUNE_RECIPIENT.balance;

        // Claim Pune QR Ticketing
        deepFunding.claim(
            distId,
            PUNE_PKG_HASH,
            PUNE_RECIPIENT,
            PUNE_AMOUNT_WEI,
            puneProof
        );

        uint256 finalBal = PUNE_RECIPIENT.balance;
        assertEq(finalBal - initialBal, PUNE_AMOUNT_WEI);
        assertTrue(deepFunding.hasPackageClaimed(distId, PUNE_PKG_HASH));
    }

    function test_Check1_RevertTamperedAmount() public {
        uint256 distId = _proposeAndFinalize();

        // Try to claim with tampered amount (1 wei more)
        vm.expectRevert(DeepFunding.InvalidMerkleProof.selector);
        deepFunding.claim(
            distId,
            PUNE_PKG_HASH,
            PUNE_RECIPIENT,
            PUNE_AMOUNT_WEI + 1,
            puneProof
        );
    }

    function test_Check1_RevertWrongRecipient() public {
        uint256 distId = _proposeAndFinalize();

        address wrongRecipient = address(0x9999);
        vm.expectRevert(DeepFunding.InvalidMerkleProof.selector);
        deepFunding.claim(
            distId,
            PUNE_PKG_HASH,
            wrongRecipient,
            PUNE_AMOUNT_WEI,
            puneProof
        );
    }

    function test_Check1_RevertDuplicateClaim() public {
        uint256 distId = _proposeAndFinalize();

        // First claim succeeds
        deepFunding.claim(
            distId,
            PUNE_PKG_HASH,
            PUNE_RECIPIENT,
            PUNE_AMOUNT_WEI,
            puneProof
        );

        // Second claim must revert
        vm.expectRevert(DeepFunding.AlreadyClaimed.selector);
        deepFunding.claim(
            distId,
            PUNE_PKG_HASH,
            PUNE_RECIPIENT,
            PUNE_AMOUNT_WEI,
            puneProof
        );
    }

    function test_Check8_Immutability_FinalizedCommitmentCannotBeOverwritten() public {
        uint256 distId = _proposeAndFinalize();

        IDeepFunding.Distribution memory dist = deepFunding.getDistribution(distId);
        assertEq(uint256(dist.state), uint256(IDeepFunding.DistributionState.Finalized));
        assertEq(dist.merkleRoot, MERKLE_ROOT);

        // Even owner cannot alter finalized merkle root or finalize again
        vm.prank(owner);
        vm.expectRevert(DeepFunding.InvalidDistributionState.selector);
        deepFunding.finalizeDistribution(distId);
    }
}
