// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../contracts/DeepFunding.sol";
import "../contracts/JuryRegistry.sol";

contract SecurityInvariantsTest is Test {
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

    function setUp() public {
        vm.deal(proposer, 50 ether);
        juryRegistry = new JuryRegistry(owner);
        deepFunding = new DeepFunding(owner, address(juryRegistry), disputeResolver, 1 days);
    }

    function test_Check9_SampleGraphFile_ExistsAndContainsCycleAndDepth() public {
        string memory root = vm.projectRoot();
        string memory path = string.concat(root, "/data/sample-graph.json");
        string memory json = vm.readFile(path);

        // Ensure file is non-empty and contains key package identifiers
        assertTrue(bytes(json).length > 0);
        assertTrue(vm.keyExistsJson(json, ".packages['kavya/event-app']"));
        assertTrue(vm.keyExistsJson(json, ".packages['pune/qr-ticketing']"));
        assertTrue(vm.keyExistsJson(json, ".packages['indic/hindi-i18n']"));
        assertTrue(vm.keyExistsJson(json, ".packages['wallet/connect-wrapper']"));
        assertTrue(vm.keyExistsJson(json, ".packages['utils/graph-core']"));
        assertTrue(vm.keyExistsJson(json, ".packages['utils/graph-core-adapter']"));
        assertTrue(vm.keyExistsJson(json, ".packages['utils/encoding']"));
        assertTrue(vm.keyExistsJson(json, ".packages['crypto/ethereum-provider']"));

        // Confirm root is kavya/event-app
        string memory rootPkg = vm.parseJsonString(json, ".rootPackageId");
        assertEq(rootPkg, "kavya/event-app");
    }

    function test_Check3_RegisteredJury_OnlyAuthorizedJurors() public {
        address juror1 = address(0x999);
        address attacker = address(0x666);

        vm.prank(owner);
        juryRegistry.registerJuror(juror1, "Verified Juror");

        assertTrue(juryRegistry.isRegisteredJuror(juror1));
        assertFalse(juryRegistry.isRegisteredJuror(attacker));

        // Revoke juror
        vm.prank(owner);
        juryRegistry.revokeJuror(juror1);
        assertFalse(juryRegistry.isRegisteredJuror(juror1));
    }

    function test_Check8_MultipleDistributions_IndependentAndImmutable() public {
        vm.startPrank(proposer);
        uint256 id1 = deepFunding.proposeDistribution{value: 1 ether}(
            GRAPH_HASH,
            JUDGMENT_DATASET_HASH,
            ALGORITHM_VERSION_HASH,
            MERKLE_ROOT,
            DISPUTE_WINDOW
        );

        bytes32 altRoot = bytes32(uint256(0x999999));
        uint256 id2 = deepFunding.proposeDistribution{value: 2 ether}(
            GRAPH_HASH,
            JUDGMENT_DATASET_HASH,
            ALGORITHM_VERSION_HASH,
            altRoot,
            DISPUTE_WINDOW
        );
        vm.stopPrank();

        assertEq(id1, 1);
        assertEq(id2, 2);

        IDeepFunding.Distribution memory d1 = deepFunding.getDistribution(id1);
        IDeepFunding.Distribution memory d2 = deepFunding.getDistribution(id2);

        assertEq(d1.merkleRoot, MERKLE_ROOT);
        assertEq(d2.merkleRoot, altRoot);
        assertEq(d1.fundingPotWei, 1 ether);
        assertEq(d2.fundingPotWei, 2 ether);

        // Finalize d1
        vm.warp(block.timestamp + DISPUTE_WINDOW + 1);
        deepFunding.finalizeDistribution(id1);

        d1 = deepFunding.getDistribution(id1);
        d2 = deepFunding.getDistribution(id2);
        assertEq(uint256(d1.state), uint256(IDeepFunding.DistributionState.Finalized));
        assertEq(uint256(d2.state), uint256(IDeepFunding.DistributionState.Proposed));
    }

    function test_Fuzz_ProposeDistributionPot(uint96 fundingAmount) public {
        vm.assume(fundingAmount > 0);
        vm.deal(proposer, fundingAmount);

        vm.prank(proposer);
        uint256 distId = deepFunding.proposeDistribution{value: fundingAmount}(
            GRAPH_HASH,
            JUDGMENT_DATASET_HASH,
            ALGORITHM_VERSION_HASH,
            MERKLE_ROOT,
            DISPUTE_WINDOW
        );

        IDeepFunding.Distribution memory dist = deepFunding.getDistribution(distId);
        assertEq(dist.fundingPotWei, fundingAmount);
        assertEq(address(deepFunding).balance, fundingAmount);
    }
}
