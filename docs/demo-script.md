# Timed 3–5 Minute Demonstration Script

**Project:** Pay the Wells You Drank From — Retroactive & Dependency-Aware Deep Funding  
**Target:** Road to Devcon XI — Loops House (Problem P3)  
**Repository:** [https://github.com/nikitabiradar231/devcon-xi-deep-fundingP3](https://github.com/nikitabiradar231/devcon-xi-deep-fundingP3)  
**Estimated Run Time:** 4 minutes 30 seconds  

---

## Prerequisites: Launching the Demo

Open your terminal in the cloned repository directory:

```bash
# 1. Start the Next.js local application
npm run dev
```

Open your browser to: **[http://localhost:3000](http://localhost:3000)**

---

## Segment 1: The Problem & Executive Overview (0:00 – 1:00)

### What to say:
> "Open-source software forms the foundational bedrock of Web3, but retroactive public goods funding faces a critical market failure: grants almost exclusively reward user-facing consumer dApps (like event applications or DEX frontends). Foundational low-level dependencies—cryptographic encoders, graph utilities, and bridge adapters—remain starved of resources.
>
> *Pay the Wells You Drank From* solves this by taking retroactive grants awarded to an upstream application and deterministically flowing funding backwards through its multi-tier open-source dependency tree."

### What to show on screen:
1. Navigate to `http://localhost:3000` (Overview Dashboard).
2. Point out:
   - **Total Funding Pot:** `1.000000 ETH` (`1000000000000000000 wei`), marked **100% Conserved**.
   - **Reachable Packages:** `8 Packages` reaching depth $\ge 3$.
   - **Active Jurors:** `5 Jurors` with 18 pairwise comparisons.
   - **Local Demo Mode Banner:** Clarifying that the UI visualizes the verified sample dataset against target chain Sepolia (`11155111`).

---

## Segment 2: Dependency Graph & Cyclic Traversal (1:00 – 1:50)

### What to say:
> "Real-world dependency trees are neither simple trees nor strict DAGs; open-source libraries frequently contain mutual dependencies and cycles. Traditional naive tree algorithms either enter infinite recursion or double-count allocations.
>
> Let's look at our graph visualizer to see how we handle this."

### What to show on screen:
1. Click **"Dependency Graph"** in the top navigation (`http://localhost:3000/graph`).
2. Point out the multi-tier hierarchy:
   - **Root Application (Depth 0):** `kavya/event-app` (receives the initial 1.0 ETH grant).
   - **Tier 1 (Depth 1):** `pune/qr-ticketing` and `wallet/connect-wrapper`.
   - **Tier 2 (Depth 2):** `utils/graph-core` and `crypto/ethereum-provider`.
   - **Tier 3 (Depth 3):** `utils/encoding` (terminal cryptographic encoder).
   - **The Mutual Dependency Cycle:** Highlight the red badge showing the directed 2-cycle between `utils/graph-core` $\leftrightarrow$ `utils/graph-core-adapter`.
3. Explain:
   > "Our graph engine computes Tarjan's Strongly Connected Components (SCC). Because each node retains a fraction $r_i > 0$ of incoming water, cyclic feedback dissipates as a convergent geometric series, strictly terminating without infinite recursion or duplicate payments."

---

## Segment 3: Bradley–Terry Jury Preferences (1:50 – 2:40)

### What to say:
> "How do we decide which dependencies deserve what proportion of downstream flow? We use peer review. Registered domain experts submit EIP-712 authenticated pairwise comparisons ranking library utility."

### What to show on screen:
1. Click **"Jury Preferences"** in the top navigation (`http://localhost:3000/jury`).
2. Show the **EIP-712 Pairwise Judgments Table**:
   - 18 signed comparisons submitted by registered jurors (e.g., Aarav Sharma, Vikram Patel).
3. Show the **Bradley–Terry Minorize-Maximization (MM) Scores**:
   - Explain how maximum likelihood estimation extracts canonical intrinsic weights where $\sum \text{score}_i = 1.0$.
   - Highlight that `pune/qr-ticketing` captured the highest dependency peer score at **30.94%**.

---

## Segment 4: Pune Maintainer Deep-Dive ("Why did I receive this much?") (2:40 – 3:30)

### What to say:
> "A core judging requirement of this challenge is maintainer transparency: can a developer audit why they received their exact wei amount? Let's inspect the Pune QR Ticketing maintainer breakdown."

### What to show on screen:
1. Click **"Pune 'Why?'"** in the top navigation (`http://localhost:3000/packages/pune%2Fqr-ticketing`).
2. Walk through the 3-step breakdown card:
   - **Step 1 (Peer Score):** 30.94% Bradley-Terry preference score.
   - **Step 2 (Water Flow & Retention):** Root retains 20% and passes 80% downwards. Pune captures $0.4610\text{ ETH}$ incoming flow, retains 35% ($0.1613\text{ ETH}$), and passes the remaining 65% to its dependencies (`utils/graph-core`).
   - **Step 3 (Exact Integer Wei Conservation):** BigInt wei arithmetic distributes rounding dust by largest fractional residue, arriving at **`161345126599571613 wei`** ($0.161345\text{ ETH}$, exactly $16.13\%$ of the 1 ETH pot).
3. Click **"Copy Proof"** under Merkle Proof to show the 3 sibling leaf hashes verified against the onchain root.

---

## Segment 5: Claims, Disputes & Testnet Separation (3:30 – 4:30)

### What to say:
> "Finally, let's explore how claims and challenges function onchain, and clarify the separation between our offline demo and live testnet deployment."

### What to show on screen:
1. Click **"Disputes"** (`http://localhost:3000/disputes`):
   - Explain that each proposed distribution has an immutable 3-day challenge window onchain.
   - Any unresolved dispute blocks finalization, preventing premature claims.
2. Click **"Claim Portal"** (`http://localhost:3000/claims`):
   - Switch persona to `Pune QR Ticketing Maintainer (0x2222...)`.
   - Click **"Simulate Claim"**. Watch the status transition to **"Simulated Payout Complete"**.
   - Emphasize:
     > "In this local demo, the Merkle proof is verified against the sample manifest. In a live Sepolia deployment, invoking `DeepFunding.claim()` executes this exact cryptographic verification in EVM bytecode via OpenZeppelin's `MerkleProof`, transfers ETH using Checks-Effects-Interactions, and locks the `hasClaimed` mapping."
3. Open terminal and run the offline automated preflight check:
   ```bash
   npm run preflight
   ```
4. Conclude:
   > "All 7 preflight checks pass, all 27 TypeScript unit tests pass, and all 29 Foundry contract security tests pass with 256 fuzz runs. The repository is 100% reproducible and ready for live Sepolia broadcast upon explicit user authorization."
