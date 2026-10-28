# Threat Model & Security Invariants

**Protocol:** Pay the Wells You Drank From  
**Target:** Road to Devcon XI  

---

## 1. System Invariants

1. **Exact Pot Conservation**: The contract cannot payout more than the committed funding pot balance. $\sum \text{Allocations} \equiv \text{FundingPotWei}$.
2. **Commitment Immutability**: Once a distribution reaches `Finalized`, its Merkle root, funding pot, and package allocations cannot be overwritten, modified, or canceled by any role.
3. **Dispute Deadline Enforcement**: Finalization cannot occur before `block.timestamp >= disputeDeadline`.
4. **Open Dispute Blocking**: Any unresolved dispute strictly blocks finalization, preventing claims.
5. **No Double Claiming**: Each package allocation in a distribution can be claimed at most once.
6. **Checks-Effects-Interactions**: The `hasClaimed` mapping and `totalClaimedWei` accounting are mutated before initiating the external ETH transfer.
7. **Reentrancy Protection**: Protected by OpenZeppelin's `ReentrancyGuard`.
8. **EIP-712 Integrity**: Pairwise judgments must originate from addresses registered in `JuryRegistry`.
9. **Cycle-Termination**: Offchain graph traversal and flow propagation strictly terminate on cyclic graphs.

---

## 2. Threat Analysis & Mitigations

| Threat | Attack Vector | Mitigation |
|---|---|---|
| **Root Maintainer Monopoly** | Root maintainer (e.g. Kavya) attempts to divert 100% of the pot to themselves. | Root retention fraction is capped (e.g. 20%). The remaining 80% is algorithmically forced to flow downstream to dependencies based on independent jury votes. |
| **Sybil Jury Manipulation** | Adversary fabricates votes using throwaway addresses to boost their own package. | `JuryRegistry.sol` restricts eligible judgments strictly to registered jurors authenticated via EIP-712. Unregistered voters are rejected by the validator. |
| **Merkle Proof Tampering** | Attacker inflates payout amount or alters recipient in proof. | OpenZeppelin `StandardMerkleTree` double-hashes leaves with `[distributionId, graphHash, algHash, packageIdHash, recipient, amountWei]`. Any tampered parameter causes `MerkleProof.verify` to revert. |
| **Reentrancy on Claim** | Malicious recipient contract attempts to re-enter `claim` during external transfer. | State is written prior to `.call{value: amountWei}("")` and protected by `ReentrancyGuard.nonReentrant`. |
| **Rushed Finalization** | Proposer finalizes distribution before community can audit. | Solidity contract strictly enforces `block.timestamp >= dist.disputeDeadline`. |
| **Malicious Infinite Cycle** | Circular dependency causes out-of-gas or infinite recursion. | Graph engine isolates cycles via Tarjan's SCC and models water dissipation ($r_i > 0$) as a converging geometric series bounded by max steps. |
| **Replay of Proof Across Distributions** | Proof from distribution #1 replayed on distribution #2. | The `distributionId` is bound inside the leaf hash. |
