# Dispute Process & Lifecycle Guide

## 1. Distribution Lifecycle State Machine

A distribution progresses through four explicit onchain states:

```
[Proposed] ────────────(Challenge Deadline Elapsed & 0 Disputes)───────────> [Finalized] ──> [Claims Enabled]
    │
    │ (Dispute Submitted during Window)
    v
[Disputed]
    │
    ├───(Dispute Upheld: acceptDispute = true)───> [Invalidated] ──> [Proposer Refundable]
    │
    └───(Dispute Rejected: activeDisputes = 0)───> [Proposed] ─────> (Can Finalize once deadline elapses)
```

---

## 2. Challenging a Proposal

1. Any ecosystem participant can inspect the offchain inputs (`sample-graph.json`, `sample-judgments.json`, `sample-manifest.json`).
2. Run independent offline verification:
   ```bash
   npm run verify:sample
   ```
3. If an inconsistency is detected (e.g. incorrect graph hash, invalid juror, non-conserved pot, incorrect Bradley-Terry ranking), call:
   ```solidity
   DeepFunding.submitDispute(distributionId, reasonString, evidenceIpfsUri)
   ```
4. This immediately increments `activeDisputeCount` and transitions the distribution to `Disputed`.
5. While `Disputed`, calls to `finalizeDistribution` will fail.

---

## 3. Dispute Resolution

- The designated dispute resolver evaluates the evidence against the published open-source engine:
  - If **Accepted**: Proposal is marked `Invalidated`. No claims will ever be paid out from this distribution ID. The proposer can recover the pot via `refundInvalidatedDistribution`. A corrected proposal with a new Merkle root must be submitted under a new distribution ID.
  - If **Rejected**: Active dispute count is decremented. If all disputes are resolved, state returns to `Proposed` and can be finalized after the challenge deadline.
