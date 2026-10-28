# Sepolia Deployment & Contract Verification Guide

## 1. Network Configuration

- **Network:** Ethereum Sepolia Testnet
- **Chain ID:** `11155111`
- **Recommended RPC:** Alchemy / Infura / Public Sepolia RPC (`https://rpc.sepolia.org`)
- **Solidity Version:** `0.8.24`
- **Foundry Profile:** `default` (Optimizer enabled, 200 runs)

---

## 2. Environment Setup

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate:
```ini
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=YOUR_DEPLOYER_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
```

> **Security Notice**: Never commit `.env` or paste real private keys into chat logs. The automated secret scanner (`npm run scan:secrets`) runs before every commit and in CI.

---

## 3. Local Dry-Run Simulation

Simulate deployment locally without broadcasting transactions:
```bash
forge script script/Deploy.s.sol --rpc-url https://rpc.sepolia.org
```

---

## 4. Live Broadcast (Requires Explicit Authorization)

When explicitly authorized:
```bash
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  -vvvv
```

Update `deployments/sepolia.json` and `.env` with the deployed addresses:
```ini
NEXT_PUBLIC_FUNDING_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_JURY_REGISTRY_ADDRESS=0x...
```
