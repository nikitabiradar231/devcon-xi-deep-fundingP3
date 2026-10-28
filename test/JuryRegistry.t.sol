// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../contracts/JuryRegistry.sol";

contract JuryRegistryTest is Test {
    JuryRegistry public registry;
    address public owner = address(0xAA1);
    address public juror1 = address(0x999);
    address public juror2 = address(0x888);
    address public nonOwner = address(0x444);

    event JurorRegistered(address indexed juror, string name);
    event JurorRevoked(address indexed juror);

    function setUp() public {
        registry = new JuryRegistry(owner);
    }

    function test_InitialState() public view {
        assertEq(registry.owner(), owner);
        assertEq(registry.jurorCount(), 0);
        assertFalse(registry.isRegisteredJuror(juror1));
    }

    function test_RegisterJuror_Success() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit JurorRegistered(juror1, "Aarav Sharma");
        registry.registerJuror(juror1, "Aarav Sharma");

        assertTrue(registry.isRegisteredJuror(juror1));
        assertEq(registry.jurorCount(), 1);
        assertEq(registry.totalRegisteredHistorical(), 1);

        address[] memory jurors = registry.getJurors();
        assertEq(jurors.length, 1);
        assertEq(jurors[0], juror1);
    }

    function test_RegisterJuror_RevertNonOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert();
        registry.registerJuror(juror1, "Aarav Sharma");
    }

    function test_RegisterJuror_RevertZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(JuryRegistry.InvalidJurorAddress.selector);
        registry.registerJuror(address(0), "Empty Address");
    }

    function test_RegisterJuror_RevertEmptyName() public {
        vm.prank(owner);
        vm.expectRevert(JuryRegistry.EmptyJurorName.selector);
        registry.registerJuror(juror1, "");
    }

    function test_RegisterJuror_RevertAlreadyRegistered() public {
        vm.startPrank(owner);
        registry.registerJuror(juror1, "Aarav");
        vm.expectRevert(JuryRegistry.JurorAlreadyRegistered.selector);
        registry.registerJuror(juror1, "Aarav Again");
        vm.stopPrank();
    }

    function test_RevokeJuror_Success() public {
        vm.startPrank(owner);
        registry.registerJuror(juror1, "Aarav");
        assertTrue(registry.isRegisteredJuror(juror1));
        assertEq(registry.jurorCount(), 1);

        vm.expectEmit(true, false, false, true);
        emit JurorRevoked(juror1);
        registry.revokeJuror(juror1);

        assertFalse(registry.isRegisteredJuror(juror1));
        assertEq(registry.jurorCount(), 0);
        vm.stopPrank();
    }

    function test_RevokeJuror_RevertNotRegistered() public {
        vm.prank(owner);
        vm.expectRevert(JuryRegistry.JurorNotRegistered.selector);
        registry.revokeJuror(juror1);
    }

    function test_RegisterJurorsBatch() public {
        address[] memory addrs = new address[](2);
        addrs[0] = juror1;
        addrs[1] = juror2;

        string[] memory names = new string[](2);
        names[0] = "Aarav";
        names[1] = "Elena";

        vm.prank(owner);
        registry.registerJurorsBatch(addrs, names);

        assertEq(registry.jurorCount(), 2);
        assertTrue(registry.isRegisteredJuror(juror1));
        assertTrue(registry.isRegisteredJuror(juror2));
    }
}
