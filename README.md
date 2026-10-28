# Pay the Wells You Drank From — Retroactive & Dependency-Aware Deep Funding
### Road to Devcon XI Submission

[![CI Pipeline](https://github.com/road-to-devcon/pay-the-wells/actions/workflows/ci.yml/badge.svg)](https://github.com/road-to-devcon/pay-the-wells)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Foundry](https://img.shields.io/badge/Foundry-1.8.1-orange.svg)](https://getfoundry.sh/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-green.svg)](https://soliditylang.org/)

---

## 1. Executive Summary

Open source software powers the modern global financial system and Web3 infrastructure. However, retroactive funding grants typically reward visible consumer applications while invisible foundational primitives (cryptographic encoders, low-level routing libraries, bridge adapters) go underfunded.

**Pay the Wells You Drank From** is a complete, production-grade protocol that takes an upstream application's retroactive funding pot (e.g. Kavya's Devcon Event App, `kavya/event-app`) and deterministically propagates funding down its multi-tier open-source dependency tree.

### Core Innovations
1. **Multi-Tier Dependency Propagation (Depth $\ge 3$)**: Propagates water-flow from direct dependencies down to deep transitive primitives.
2. **Cycle-Tolerant Resolution (Tarjan's SCC)**: Safely handles mutual dependencies (e.g., `utils/graph-core` $\leftrightarrow$ `utils/graph-core-adapter`) through converging geometric dissipation without infinite recursion or duplicate payments.
3. **EIP-712 Bradley–Terry Weighting**: Converts authenticated pairwise evaluations from registered jurors into optimal maximum likelihood scores.
4. **100% Exact Integer Pot Conservation**: Eliminates rounding loss using BigInt wei arithmetic and residue dust sorting ($\sum \text{Allocations} \equiv \text{FundingPotWei}$).
5. **Onchain Dispute Window & Immutability**: Proposes distributions onchain with OpenZeppelin Merkle trees, enforces challenge deadlines, blocks unfinalized claims during active disputes, and permanently locks finalized commitments.

---

## 2. 10 Scored Evaluation Checks

| Check | Specification | Implementation / Test Verification | Status |
|---|---|---|---|
| **Check 1** | **Onchain Commitment** | Valid Merkle proof pays exact committed amount; wrong amounts/recipients revert. (`test/DeepFunding.t.sol`) | **PASS** |
| **Check 2** | **Dispute Window** | Finalization & claims are strictly blocked before dispute deadline elapses. (`test/DisputeFlow.t.sol`) | **PASS** |
| **Check 3** | **Registered Jury** | Unregistered or revoked jurors cannot participate in accepted judgment datasets. (`contracts/JuryRegistry.sol`) | **PASS** |
| **Check 4** | **Open Dispute** | Unresolved dispute blocks finalization; successful dispute invalidates proposal. (`test/DisputeFlow.t.sol`) | **PASS** |
| **Check 5** | **Cyclic Traversal** | Offchain traversal & water flow strictly terminate on mutual dependency loops. (`src/graph/cycleAnalysis.ts`) | **PASS** |
| **Check 6** | **Exact Conservation** | Engine asserts $\sum \text{Allocations} \equiv \text{Pot}$; contract cannot payout $> \text{Pot}$. (`src/allocation/allocate.ts`) | **PASS** |
| **Check 7** | **Claim Security** | Checks-effects-interactions; claimed state written before transfer; reentrancy fails. (`test/ClaimSafety.t.sol`) | **PASS** |
| **Check 8** | **Immutability** | Finalized roots cannot be replaced, altered, or overwritten by owner or proposer. (`contracts/DeepFunding.sol`) | **PASS** |
| **Check 9** | **Sample Graph Cycle & Depth** | Automated test verifies `data/sample-graph.json` has directed cycle and depth $\ge 3$. (`test/SecurityInvariants.t.sol`) | **PASS** |
| **Check 10** | **Secret Scanning** | Automated scanner verifies tracked files contain zero private keys or credentials. (`scripts/scanSecrets.ts`) | **PASS** |

---

## 3. Sample Case Study: Pune QR Ticketing ("Why did I receive this much?")

A core requirement is ensuring maintainers understand their exact reward. For **Pune QR Ticketing** (`pune/qr-ticketing`):

- **Maintainer:** `0x2222222222222222222222222222222222222222`
- **Initial Pot:** $1.000000\text{ ETH}$ ($10^{18}\text{ wei}$)
- **Root Retention:** Kavya Event App retains $20\%$ ($0.20\text{ ETH}$) and flows $80\%$ ($0.80\text{ ETH}$) downwards.
- **Jury Peer Score:** $30.94\%$ (highest rated dependency in the dataset).
- **Water Flow Received:** $0.4610\text{ ETH}$ flow-through.
- **Node Retention:** Pune retains $35\%$ ($0.1613\text{ ETH}$) and passes the remaining $65\%$ to its dependencies (`utils/graph-core`).
- **Exact Payout:** **`161345126599571613 wei`** ($0.161345\text{ ETH}$ / $16.13\%$ of total pot).
- **Merkle Proof:** 3 sibling nodes cryptographically verified against onchain root `0xb86f90f7...`.

---

## 4. Quickstart & Verification Pipeline

### Prerequisites
- Node.js $\ge 20$ (v24.11.0 recommended)
- Foundry / Forge $\ge 1.8.1$

### Installation
```bash
npm ci
```

### Run All Tests
```bash
# 1. TypeScript Test Suite (27 tests)
npm test

# 2. Typecheck (0 errors)
npm run typecheck

# 3. Secret Scanner
npm run scan:secrets

# 4. End-to-End Sample Computation & Audit Verification
npm run compute:sample
npm run verify:sample
npm run verify:merkle

# 5. Foundry Smart Contract Security Suite (29 tests)
npm run test:contracts
```

### Launch Web Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to explore the interactive dependency graph, jury preference matrix, and Pune claim simulator.

---

## 5. Repository Structure

```
d3/
├── app/                      # Next.js 14 Frontend Application
│   ├── page.tsx              # Overview Dashboard
│   ├── graph/page.tsx        # Interactive Graph Visualizer
│   ├── jury/page.tsx         # Jury Preferences & Bradley-Terry Model
│   ├── packages/[packageId]/ # "Why did I receive this much?" Deep-Dive
│   ├── disputes/page.tsx     # Dispute Lifecycle & Challenge Portal
│   └── claims/page.tsx       # Onchain Claims & Merkle Proof Verifier
├── contracts/                # Solidity Smart Contracts (0.8.24)
│   ├── DeepFunding.sol       # Core Funding State Machine & Claims
│   ├── JuryRegistry.sol      # Juror Registration & Access Control
│   ├── interfaces/           # Contract Interfaces (IDeepFunding, IJuryRegistry)
│   └── libraries/            # MerkleAllocation.sol (StandardMerkleTree double hash)
├── test/                     # Foundry Test Suite (29 tests, 5 suites)
│   ├── DeepFunding.t.sol     # Onchain commitments, roots, proofs
│   ├── JuryRegistry.t.sol    # Registration, revocation, authorization
│   ├── DisputeFlow.t.sol     # Dispute deadlines & state machine
│   ├── ClaimSafety.t.sol     # CEI pattern & reentrancy protection
│   └── SecurityInvariants.t.sol # Cycle & depth verification, pot fuzzing
├── test-ts/                  # Vitest Test Suite (27 tests, 5 suites)
│   ├── graph.test.ts         # Graph schema, Tarjan SCC, depth BFS
│   ├── judgments.test.ts     # EIP-712 parsing, Bradley-Terry convergence
│   ├── allocation.test.ts    # Exact pot conservation & dust distribution
│   ├── merkle.test.ts        # OpenZeppelin tree proofs & leaf hashing
│   └── reproducibility.test.ts # 100% Bit-for-bit audit manifest checks
├── src/                      # TypeScript Core Engine
│   ├── graph/                # Validation, cycle detection, traversal
│   ├── jury/                 # EIP-712 typing, Bradley-Terry algorithm
│   ├── allocation/           # BigInt allocation, Merkle generation
│   ├── audit/                # Manifest generation & verification
│   └── cli/                  # computeSample, verifySample, verifyMerkle
├── data/                     # Verified Sample Data & Audit Artifacts
│   ├── sample-graph.json     # Graph with depth >= 3 and directed cycle
│   ├── sample-judgments.json # EIP-712 pairwise judgments
│   ├── sample-result.json    # Exact allocations & leaf proofs
│   └── sample-manifest.json  # Bit-for-bit audit manifest
├── docs/                     # Technical Documentation & Guides
│   ├── architecture.md       # High-level architecture & diagram
│   ├── weighting-method.md   # Bradley-Terry & water-flow mathematics
│   ├── threat-model.md       # Security invariants & threat matrix
│   ├── dispute-process.md    # Dispute lifecycle & state machine
│   └── deployment.md         # Sepolia deployment guide
└── scripts/                  # Utilities (scanSecrets, run-forge)
```
