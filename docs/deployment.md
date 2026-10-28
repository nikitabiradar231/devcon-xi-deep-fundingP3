# Complete Sepolia Deployment & Operations Guide

**Protocol:** Pay the Wells You Drank From — Retroactive & Dependency-Aware Deep Funding
**Target:** Ethereum Sepolia Testnet (Chain ID: `11155111`)
**Solidity Compiler:** `0.8.24` | **OpenZeppelin:** `v5.0.2`

---

## 1. Prerequisites and Compatible Versions

Ensure your development environment meets the exact tested toolchain specifications:
- **Node.js**: `v20.x` or `v24.x` (`v24.11.0` verified)
- **npm**: `v10.x` or `v11.x` (`11.6.2` verified)
- **Foundry / Forge**: Version `1.8.1` or nightly build (`solc 0.8.24` support)
- **Git**: `v2.40+` with submodule support

Verify local versions:
```bash
node -v
npm -v
forge --version
git --version
```

---

## 2. Repository Installation

Clone the repository with submodules to ensure `lib/forge-std` is properly linked:
```bash
git clone --recurse-submodules https://github.com/nikitabiradar231/devcon-xi-deep-fundingP3.git
cd devcon-xi-deep-fundingP3
npm ci
```

If the repository was cloned without `--recurse-submodules`, initialize forge-std manually:
```bash
git submodule update --init --recursive
```

---

## 3. Foundry and Solidity Dependencies

Dependencies are mapped via `remappings.txt` and `foundry.toml`:
- `@openzeppelin/contracts/` $\rightarrow$ `node_modules/@openzeppelin/contracts/`
- `forge-std/` $\rightarrow$ `lib/forge-std/src/`

Verify dependency linkage:
```bash
node scripts/run-forge.js build
```

---

## 4. Environment Configuration

Create a local `.env` configuration file from the template:
```bash
cp .env.example .env
```

Populate the following variables inside `.env`:
```ini
# Sepolia Network Configuration (Required for live deployment)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=your_raw_hex_private_key_without_0x_prefix
ETHERSCAN_API_KEY=your_etherscan_api_key

# Public Client Configuration (Safe for frontend exposure)
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_FUNDING_CONTRACT_ADDRESS=
NEXT_PUBLIC_JURY_REGISTRY_ADDRESS=
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia.org
```

> [!CAUTION]
> **Secret Hygiene Rules**:
> 1. Never commit `.env` or any file containing private keys.
> 2. Never paste private keys or sensitive seed phrases into chat, GitHub issues, or PR descriptions.
> 3. Verify that `git status` shows `.env` ignored before committing.
> 4. Run `npm run scan:secrets` regularly to ensure no tracked credentials exist.

---

## 5. Sepolia ETH Funding Requirements

The deployer address requires Sepolia testnet ETH to cover contract deployment, jury registry initialization, and gas costs:
- **Estimated Deployment Gas**: ~1,850,000 gas (~0.015 - 0.025 Sepolia ETH at standard 15 gwei gas price).
- **Recommended Minimum Balance**: `0.05 Sepolia ETH`.
- **Public Faucets**:
  - [Google Cloud Web3 Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
  - [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
  - [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
  - [Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/)

---

## 6. Local Compilation

Compile both the TypeScript codebase and the Solidity contracts:
```bash
# Compile TypeScript modules and check types
npm run typecheck

# Compile Solidity contracts with Solc 0.8.24
node scripts/run-forge.js build
```

---

## 7. Unit Tests and Security Invariant Suites

Execute the comprehensive offline test suites:
```bash
# Run all 27 Vitest unit & mathematical tests
npm test

# Run all 29 Foundry smart contract security tests
node scripts/run-forge.js test -vvv
```

All 56 tests must pass before proceeding to deployment.

---

## 8. Sample Graph and Merkle Verification

Generate the sample allocation and audit manifest to verify cryptographic determinism:
```bash
# 1. Compute deterministic Bradley-Terry weights and integer flow allocations
npm run compute:sample

# 2. Run 10-point audit manifest verification
npm run verify:sample

# 3. Cryptographically verify all 8 Merkle leaf proofs against the root
npm run verify:merkle
```

Expected output:
```text
=== All Verification Checks PASSED (100% Bit-for-Bit Reproducible) ===
All 8/8 Merkle proofs cryptographically verified against root.
=== Merkle Verification PASSED ===
```

---

## 9. Deployment Preflight

Run the automated preflight verification command to ensure the environment is 100% prepared:
```bash
npm run preflight
```

The preflight verifies:
1. Tracked repository contains zero leaked credentials (`npm run scan:secrets`).
2. Smart contracts compile cleanly without compiler errors.
3. `.env.example` exists and contains only non-sensitive template placeholders.
4. `deployments/sepolia.json` is not falsely marked complete with unverified addresses.
5. Deployer address can be derived without exposing the key.
6. Target network chain ID is verified (`11155111`).
7. Sample graph and Merkle tree commitments match bit-for-bit.

---

## 10. Sepolia Deployment

### Step A: Offline Dry-Run Simulation (Safe — Zero Transactions)
Simulate the deployment transaction on local fork without spending ETH:
```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url https://rpc.sepolia.org
```

### Step B: Live Sepolia Broadcast (Requires Explicit Authorization)
Once authorized and configured with a funded testnet key:
```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv
```

---

## 11. Deployment Receipt Verification

Inspect the broadcast log generated in `broadcast/Deploy.s.sol/11155111/run-latest.json`.

Record the real deployment details into `deployments/sepolia.json`:
```json
{
  "network": "sepolia",
  "chainId": 11155111,
  "status": "DEPLOYED",
  "contracts": {
    "JuryRegistry": {
      "address": "0xYourDeployedJuryRegistryAddress",
      "deployer": "0xYourDeployerAddress",
      "transactionHash": "0xYourTxHash...",
      "blockNumber": 1234567,
      "verified": true
    },
    "DeepFunding": {
      "address": "0xYourDeployedDeepFundingAddress",
      "deployer": "0xYourDeployerAddress",
      "transactionHash": "0xYourTxHash...",
      "blockNumber": 1234568,
      "verified": true
    }
  }
}
```

---

## 12. Contract Verification on Etherscan

If automatic verification was skipped or timed out, manually verify via Forge:
```bash
# Verify JuryRegistry
forge verify-contract \
  --chain-id 11155111 \
  --num-of-optimizations 200 \
  --watch \
  --compiler-version 0.8.24 \
  0xYourJuryRegistryAddress \
  contracts/JuryRegistry.sol:JuryRegistry \
  --constructor-args $(cast abi-encode "constructor(address)" 0xYourDeployerAddress) \
  --etherscan-api-key $ETHERSCAN_API_KEY

# Verify DeepFunding
forge verify-contract \
  --chain-id 11155111 \
  --num-of-optimizations 200 \
  --watch \
  --compiler-version 0.8.24 \
  0xYourDeepFundingAddress \
  contracts/DeepFunding.sol:DeepFunding \
  --constructor-args $(cast abi-encode "constructor(address,address,address,uint256)" 0xYourDeployerAddress 0xYourJuryRegistryAddress 0xYourDisputeResolverAddress 259200) \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

---

## 13. Frontend Configuration

Update `.env` with the verified deployed contract addresses:
```ini
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_FUNDING_CONTRACT_ADDRESS=0xYourDeployedDeepFundingAddress
NEXT_PUBLIC_JURY_REGISTRY_ADDRESS=0xYourDeployedJuryRegistryAddress
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia.org
```

Build the production bundle:
```bash
npm run build
```

Launch the frontend:
```bash
npm run start
```
The application will automatically detect the live Sepolia deployment while preserving interactive demo simulation capabilities.

---

## 14. Post-Deployment Smoke Tests

Perform end-to-end onchain sanity checks using `cast`:

1. **Verify Jury Registry Owner**:
   ```bash
   cast call 0xYourJuryRegistryAddress "owner()(address)" --rpc-url $SEPOLIA_RPC_URL
   ```
2. **Propose Sample Distribution**:
   ```bash
   cast send 0xYourDeepFundingAddress \
     "proposeDistribution(bytes32,bytes32,bytes32,bytes32,uint256)" \
     $SAMPLE_GRAPH_HASH \
     $SAMPLE_JUDGMENT_DATASET_HASH \
     $SAMPLE_ALGORITHM_VERSION_HASH \
     $SAMPLE_MERKLE_ROOT \
     259200 \
     --value 0.1ether \
     --private-key $PRIVATE_KEY \
     --rpc-url $SEPOLIA_RPC_URL
   ```
3. **Query Distribution State**:
   ```bash
   cast call 0xYourDeepFundingAddress "getDistribution(uint256)" 1 --rpc-url $SEPOLIA_RPC_URL
   ```

---

## 15. Troubleshooting

| Symptom | Probable Cause | Corrective Action |
|---|---|---|
| `Unsupported network: must be Ethereum Sepolia` | Wrong RPC endpoint provided | Verify RPC URL points to Sepolia (Chain ID `11155111`). |
| `insufficient funds for gas * price + value` | Deployer balance too low | Fund deployer address with $\ge 0.05$ Sepolia ETH via faucets. |
| `DisputeWindowTooShort` | Duration $< \text{minDisputeWindow}$ | Ensure dispute window is at least 3 days (`259200` seconds). |
| `InvalidMerkleProof` | Leaf encoding or parameter mismatch | Verify leaf double hashing matches `MerkleAllocation.computeLeafHash`. |
| `DisputeWindowActive` | Finalize called before deadline | Wait until `block.timestamp >= disputeDeadline`. |
| `EISDIR` in secret scanner | Submodule directory traversed as file | Ensure `scripts/scanSecrets.ts` checks `stats.isDirectory()`. |

---

## 16. Secret Management & Recovery Procedures

1. **Compromised Deployer Key**:
   - Immediately transfer ownership of `JuryRegistry` and `DeepFunding` to a secure cold wallet using `transferOwnership(address newOwner)`.
   - Update `disputeResolver` to an uncompromised address via `setDisputeResolver(address _resolver)`.
2. **Compromised Juror Key**:
   - Call `JuryRegistry.revokeJuror(address juror)` from the owner account to immediately invalidate future signatures from that juror.
3. **Emergency Fund Recovery on Invalidated Proposals**:
   - If a proposed distribution was tainted by fraudulent judgments, uphold a dispute via `resolveDispute(distId, disputeId, true, reason)`.
   - The proposer can recover the entire pot balance via `refundInvalidatedDistribution(distributionId)`.
