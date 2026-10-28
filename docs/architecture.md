# System Architecture & Technical Specifications

**Project:** Pay the Wells You Drank From — Retroactive & Dependency-Aware Deep Funding  
**Challenge:** Road to Devcon XI  

---

## 1. High-Level Overview

Open-source applications rely extensively on deep dependency trees of volunteer-maintained libraries, protocol abstractions, encoding routines, and cryptographic infrastructure. Traditional retroactive grants predominantly reward visible, end-user applications. **Pay the Wells You Drank From** introduces an equitable, dependency-aware protocol that propagates gratitude backwards down the dependency graph.

```
+-----------------------------------------------------------------------------------+
|                            Kavya Event App (Root)                                 |
|                                [1.0 ETH Pot]                                      |
+-----------------------------------------------------------------------------------+
           | (retains 20%)                               |
           v                                             v
+-----------------------+                    +------------------------+
|   pune/qr-ticketing   |                    |  wallet/connect-wrapper|
|    (retains 35%)      |                    |     (retains 30%)      |
+-----------------------+                    +------------------------+
           |                                             |
           v                                             v
+-----------------------+                    +------------------------+
|   utils/graph-core    | <=== (Mutual ===>  |crypto/ethereum-provider|
|    (retains 25%)      |      Cycle)        |     (retains 30%)      |
+-----------------------+                    +------------------------+
           |                                             |
           +--------------------+------------------------+
                                |
                                v
                    +-----------------------+
                    |    utils/encoding     |
                    | (Terminal: keeps 100%)|
                    +-----------------------+
```

---

## 2. Core Protocol Components

### 2.1 Graph & Cycle Engine (`src/graph/`)
- **Topological & Cycle Analysis**: Computes Tarjan's Strongly Connected Components (SCC) to identify elementary and mutual dependency loops (e.g. `utils/graph-core` $\leftrightarrow$ `utils/graph-core-adapter`).
- **Depth Calculation**: Breadth-First Shortest Path analysis guaranteeing the graph reaches depth $\ge 3$.
- **Bounded Traversal**: `traverseGraphBounded` prevents infinite recursion or memory exhaustion on arbitrary graphs.

### 2.2 Jury & Bradley–Terry Engine (`src/jury/`)
- **EIP-712 Typed Judgments**: Registered jurors sign pairwise preferences comparing package utility on a 1..5 scale.
- **Maximum Likelihood Derivation**: Iterative Bradley–Terry Minorize-Maximization (MM) computes normalized intrinsic scores $\sum \text{score}_i = 1.0$.

### 2.3 Exact Allocation Engine (`src/allocation/`)
- **Linear Water-Flow Propagation**: Water flows from the root package down outbound dependency edges in proportion to downstream jury scores. Each package retains a fraction $r_i$ and propagates $(1 - r_i)$.
- **Exact Pot Conservation**: Integer wei arithmetic using JavaScript `BigInt`. Dust remainders are distributed deterministically to the largest fractional residues, ensuring:
  $$\sum_{i=1}^M \text{Allocations}_i \equiv \text{FundingPotWei}$$

### 2.4 Cryptographic Commitment & Merkle Tree (`src/allocation/merkle.ts`)
- Implements standard OpenZeppelin `StandardMerkleTree` double-leaf hashing:
  $$\text{Leaf} = \text{keccak256}(\text{bytes.concat}(\text{keccak256}(\text{abi.encode}(\text{distId}, \text{graphHash}, \text{algHash}, \text{pkgHash}, \text{recipient}, \text{amountWei}))))$$
- Merkle root committed onchain in `DeepFunding.sol`.

### 2.5 Smart Contracts (`contracts/`)
- **`JuryRegistry.sol`**: Manages authorized juror addresses with registration, batch registration, and revocation.
- **`DeepFunding.sol`**: State machine managing distributions (`Proposed` $\rightarrow$ `Disputed` $\rightarrow$ `Finalized` / `Invalidated`), enforcing challenge deadlines, checks-effects-interactions, and non-reentrant payouts.
