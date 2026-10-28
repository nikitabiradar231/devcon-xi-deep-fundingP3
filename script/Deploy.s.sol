// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Script.sol";
import "../contracts/JuryRegistry.sol";
import "../contracts/DeepFunding.sol";

contract DeployScript is Script {
    uint256 public constant SEPOLIA_CHAIN_ID = 11155111;
    uint256 public constant DEFAULT_MIN_DISPUTE_WINDOW = 3 days;

    function run() external returns (address juryRegistryAddr, address deepFundingAddr) {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0));
        address deployer;

        if (deployerPrivateKey != 0) {
            deployer = vm.addr(deployerPrivateKey);
            vm.startBroadcast(deployerPrivateKey);
        } else {
            deployer = msg.sender;
            vm.startBroadcast();
        }

        // Validate chain if running on live network
        if (block.chainid != 31337 && block.chainid != SEPOLIA_CHAIN_ID) {
            revert("Unsupported network: must be Ethereum Sepolia (11155111) or local Anvil (31337)");
        }

        console.log("=== Deploying Pay the Wells Deep Funding Protocol ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        // 1. Deploy JuryRegistry
        JuryRegistry registry = new JuryRegistry(deployer);
        juryRegistryAddr = address(registry);
        console.log("JuryRegistry deployed at:", juryRegistryAddr);

        // 2. Deploy DeepFunding
        address disputeResolver = deployer;
        DeepFunding funding = new DeepFunding(
            deployer,
            juryRegistryAddr,
            disputeResolver,
            DEFAULT_MIN_DISPUTE_WINDOW
        );
        deepFundingAddr = address(funding);
        console.log("DeepFunding deployed at:", deepFundingAddr);

        vm.stopBroadcast();
        console.log("=== Deployment Finished Successfully ===");
    }
}
