# Official Challenge Submission Description

**Project Title:** Pay the Wells You Drank From — Retroactive & Dependency-Aware Deep Funding  
**Challenge:** Road to Devcon XI — Loops House (Problem P3)  
**Repository:** [https://github.com/nikitabiradar231/devcon-xi-deep-fundingP3](https://github.com/nikitabiradar231/devcon-xi-deep-fundingP3)  
**Verified Commit Hash:** `f4c3172285d28c7e65d32fccaceba45dc3244f83`  
**Deployment Status:** Local Deterministic Demonstration & Validation (Sepolia onchain deployment is pending user authorization and testnet gas funding)  

---

## 1. Problem Statement

Open-source software forms the critical infrastructure of Web3 and the modern digital economy. However, retroactive public goods funding mechanisms (such as RetroPGF and Gitcoin rounds) suffer from an inherent visibility bias: grants predominantly flow to user-facing applications (e.g., event apps, wallets, frontends). 

Foundational open-source utilities deeper in the dependency tree—such as cryptographic encoders, graph routers, and low-level protocol adapters—remain chronically underfunded despite being essential to the applications that rely on them. Furthermore, open-source dependency trees frequently contain mutual dependencies and directed cycles, causing naive hierarchical allocation algorithms to either fail through infinite recursion or duplicate funding flows.

---

## 2. Solution Overview

**Pay the Wells You Drank From** introduces an equitable, dependency-aware protocol that takes an upstream application's retroactive funding grant (e.g., Kavya's Devcon Event App, `kavya/event-app`) and deterministically propagates retroactive funding backwards through its multi-tier open-source dependency graph.

### Key Architectural Pillars:
1. **Multi-Tier Dependency Propagation (Depth $\ge 3$):** Flow propagates from direct dependencies down to deep transitive primitives.
2. **Cycle-Tolerant Resolution (Tarjan's SCC):** Mutual dependencies (such as `utils/graph-core` $\leftrightarrow$ `utils/graph-core-adapter`) are resolved through converging geometric dissipation where each node retains a positive fraction $r_i > 0$, guaranteeing strict algorithmic termination without infinite recursion or duplicate allocations.
3. **EIP-712 Bradley–Terry Preference Modeling:** Peer reviews and utility comparisons from registered domain jurors are aggregated using Bradley–Terry Minorize-Maximization (MM) to extract normalized maximum likelihood weights ($\sum \text{score}_i = 1.0$).
4. **100% Exact Integer Pot Conservation:** Eliminates floating-point rounding errors using BigInt wei arithmetic. Rounding remainders are deterministically redistributed by largest fractional residue, ensuring $\sum \text{Allocations} \equiv \text{FundingPotWei}$ (`0 wei` loss).
5. **Onchain Dispute Window & Immutability:** Proposes distributions onchain with OpenZeppelin `StandardMerkleTree` double-hashed leaf commitments, enforces a 3-day challenge deadline, blocks unfinalized claims during active disputes, and locks finalized allocations permanently.
6. **Maintainer Transparency ("Why did I receive this much?"):** Dedicated breakdown interface providing every maintainer (e.g., Pune QR-Ticketing) an auditable, step-by-step mathematical explanation of their exact wei payout.

---

## 3. Demonstration & Reproduction Instructions

### 3.1 Start Local Demo
Clone the repository and launch the web interface:
```bash
git clone --recurse-submodules https://github.com/nikitabiradar231/devcon-xi-deep-fundingP3.git
cd devcon-xi-deep-fundingP3
npm ci
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3.2 Evaluation Walkthrough
Follow our step-by-step timed presentation script:
👉 **[Timed 3–5 Minute Demonstration Script (`docs/demo-script.md`)](docs/demo-script.md)**

---

## 4. Verification Evidence & Test Results

All quality gates have been executed and verified on the actual codebase:
- **TypeScript Typecheck:** 0 errors (`npm run typecheck`).
- **Vitest Unit & Math Tests:** 27/27 passed across 5 test suites (`npm test`).
- **Secret Scanning:** 0 leaked credentials detected across 71 tracked files (`npm run scan:secrets`).
- **Sample Allocation & Determinism:** 10/10 audit checks passed bit-for-bit against manifest (`npm run verify:sample`).
- **Merkle Tree Cryptographic Proofs:** 8/8 OpenZeppelin leaf proofs verified against committed root (`npm run verify:merkle`).
- **Foundry Smart Contract Suite:** 29/29 tests passed across 5 test suites with 256 fuzz runs (`node scripts/run-forge.js test -vvv`).
- **Deployment Preflight:** 7/7 checks passed in offline simulation mode (`npm run preflight`).
- **Next.js Production Build:** Clean build with 8 static pages compiled (`npm run build`).

---

## 5. Deployment Status & Limitations

- **Current Status:** The project currently runs in **Local Demonstration & Simulation Mode**.
- **Sample Dataset:** All displayed graphs, peer judgments, and Merkle proofs reflect the verified deterministic sample dataset (1.0 ETH pot, 8 packages, 5 jurors).
- **Sepolia Deployment:** Smart contracts (`DeepFunding.sol`, `JuryRegistry.sol`) are fully compiled and tested against Solc `0.8.24`. Live onchain deployment to Ethereum Sepolia (`11155111`) is pending user authorization and testnet gas funding; `deployments/sepolia.json` records `PENDING_AUTHORIZATION` without fabricated contract addresses.
- **Simulated Flows:** Claim and dispute interactions in the local demo simulate onchain state transitions for seamless evaluation without requiring testnet ETH. In live deployment, these execute directly against the EVM contracts.
