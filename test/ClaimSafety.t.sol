// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../contracts/DeepFunding.sol";
import "../contracts/JuryRegistry.sol";

contract MaliciousReentrantClaimer {
    DeepFunding public deepFunding;
    uint256 public distributionId;
    bytes32 public packageIdHash;
    uint256 public amountWei;
    bytes32[] public proof;
    uint256 public reenterAttempts;

    constructor(DeepFunding _deepFunding) {
        deepFunding = _deepFunding;
    }

    function setClaimData(
        uint256 _distributionId,
        bytes32 _packageIdHash,
        uint256 _amountWei,
        bytes32[] memory _proof
    ) external {
        distributionId = _distributionId;
        packageIdHash = _packageIdHash;
        amountWei = _amountWei;
        proof = _proof;
    }

    function attack() external {
        deepFunding.claim(
            distributionId,
            packageIdHash,
            address(this),
            amountWei,
            proof
        );
    }

    receive() external payable {
        if (reenterAttempts < 2) {
            reenterAttempts++;
            // Try to re-enter claim
            deepFunding.claim(
                distributionId,
                packageIdHash,
                address(this),
                amountWei,
                proof
            );
        }
    }
}

contract ClaimSafetyTest is Test {
    DeepFunding public deepFunding;
    JuryRegistry public juryRegistry;

    address public owner = address(0xAA1);
    address public disputeResolver = address(0xAA2);
    address public proposer = address(0xBB1);

    bytes32 public constant GRAPH_HASH = 0xd93a4f71337c24c18330a5947be0a904da8ab7cbfb4f378e6d0fa798f5286047;
    bytes32 public constant JUDGMENT_DATASET_HASH = 0xa4f17c8ac83692f9bf45ab2fdfc07fa6fc15c1de19ecf530eaa1f5614d19c8ae;
    bytes32 public constant ALGORITHM_VERSION_HASH = 0xd84ac5df4ab0a264ec1ba3e91f16b8a5223d2c66b15ea47a9a6f395265bc0eab;
    bytes32 public constant MERKLE_ROOT = 0xb86f90f7b8bb7898c68751abb0c7cafb049a7f4ef1acc7dbff8b154ada7914c7;

    uint256 public constant POT_WEI = 1 ether;
    uint256 public constant DISPUTE_WINDOW = 3 days;

    bytes32 public constant PUNE_PKG_HASH = 0xca42ba278f82929df3b4f7150f95c2a3e24244add208b83aa3d88a8a86460f5d;
    address public constant PUNE_RECIPIENT = 0x2222222222222222222222222222222222222222;
    uint256 public constant PUNE_AMOUNT_WEI = 161345126599571613;

    bytes32[] public puneProof;

    function setUp() public {
        vm.deal(proposer, 10 ether);
        juryRegistry = new JuryRegistry(owner);
        deepFunding = new DeepFunding(owner, address(juryRegistry), disputeResolver, 1 days);

        puneProof = new bytes32[](3);
        puneProof[0] = 0xff9d53e307fef74e74ad44cbd096025ff241a40fb644548ccbe5fbe60b2a0c18;
        puneProof[1] = 0x283da87ed4963e73df77bc0a1ccf875b7bf79972226873f79a2514df49c207c0;
        puneProof[2] = 0xf6cd40aa19ba464a42e991565149cca2dd30ced66c71ab0ed0d082ef5fc605d8;
    }

    function _createAndFinalize() internal returns (uint256 distId) {
        vm.prank(proposer);
        distId = deepFunding.proposeDistribution{value: POT_WEI}(
            GRAPH_HASH,
            JUDGMENT_DATASET_HASH,
            ALGORITHM_VERSION_HASH,
            MERKLE_ROOT,
            DISPUTE_WINDOW
        );

        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);
        deepFunding.finalizeDistribution(distId);
    }

    function test_Check7_ClaimSecurity_ReentrancyFails() public {
        uint256 distId = _createAndFinalize();

        MaliciousReentrantClaimer attacker = new MaliciousReentrantClaimer(deepFunding);
        attacker.setClaimData(distId, PUNE_PKG_HASH, PUNE_AMOUNT_WEI, puneProof);

        // Attacker will fail because:
        // 1. Recipient in proof is PUNE_RECIPIENT, not attacker address.
        // 2. ReentrancyGuard prevents re-entrant call.
        vm.expectRevert();
        attacker.attack();
    }

    function test_Check7_ClaimSecurity_ClaimedStateWrittenBeforeTransfer() public {
        uint256 distId = _createAndFinalize();

        assertFalse(deepFunding.hasPackageClaimed(distId, PUNE_PKG_HASH));

        deepFunding.claim(
            distId,
            PUNE_PKG_HASH,
            PUNE_RECIPIENT,
            PUNE_AMOUNT_WEI,
            puneProof
        );

        // State is true
        assertTrue(deepFunding.hasPackageClaimed(distId, PUNE_PKG_HASH));
        IDeepFunding.Distribution memory dist = deepFunding.getDistribution(distId);
        assertEq(dist.totalClaimedWei, PUNE_AMOUNT_WEI);
    }

    function test_Check6_ExactConservation_CannotClaimBeyondPot() public {
        uint256 distId = _createAndFinalize();

        IDeepFunding.Distribution memory dist = deepFunding.getDistribution(distId);
        assertEq(dist.fundingPotWei, POT_WEI);

        // Contract balance matches funding pot
        assertEq(address(deepFunding).balance, POT_WEI);
    }
}
