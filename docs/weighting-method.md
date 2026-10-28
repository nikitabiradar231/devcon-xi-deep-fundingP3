# Deterministic Bradley–Terry Weighting & Water-Flow Propagation

## 1. Bradley–Terry Model Formulation

The Bradley–Terry model formulates pairwise comparison probabilities between packages $A$ and $B$:
$$P(A \succ B) = \frac{\pi_A}{\pi_A + \pi_B}$$
where $\pi_i > 0$ represents the intrinsic quality or importance score of package $i$.

### Preference Scale Mapping
Judgments are collected on a 5-point discrete scale:
- **1 (A $\ll$ B)**: $w_A = 0.10, w_B = 0.90$
- **2 (A $<$ B)**: $w_A = 0.25, w_B = 0.75$
- **3 (A == B)**: $w_A = 0.50, w_B = 0.50$
- **4 (A $>$ B)**: $w_A = 0.75, w_B = 0.25$
- **5 (A $\gg$ B)**: $w_A = 0.90, w_B = 0.10$

### Maximum Likelihood Estimation via MM Algorithm
Given empirical win counts $W_{ij}$ and total comparisons $N_{ij} = W_{ij} + W_{ji}$, the log-likelihood is maximized iteratively using the Minorize-Maximization (MM) algorithm with a Dirichlet prior $\alpha = 0.05$ for numerical stability across disconnected components:
$$\pi_i^{(t+1)} = \frac{W_i + \alpha}{\sum_{j \ne i} \frac{N_{ij} + 2\alpha}{\pi_i^{(t)} + \pi_j^{(t)}}}$$

Iterations continue until:
$$\max_i |\pi_i^{(t+1)} - \pi_i^{(t)}| < \text{tolerance} \quad (10^{-12})$$
or until `maxIterations` ($300$) is reached. The resulting scores are normalized such that $\sum \pi_i = 1.0$.

---

## 2. Water-Flow Graph Propagation

Let $f_i$ denote the total incoming water flow reaching node $i$.
1. **Root Node**: $f_{\text{root}} = 1.0$.
2. **Node Retention**: Node $i$ retains fraction $r_i \in (0, 1]$ for itself:
   $$\text{retainedWeight}_i = f_i \cdot r_i$$
3. **Outbound Flow**: Node $i$ passes the remainder $(1 - r_i) f_i$ to its outbound dependencies $D(i)$, distributed proportionally to their normalized jury weights:
   $$f_{i \to j} = (1 - r_i) f_i \cdot \frac{\pi_j}{\sum_{k \in D(i)} \pi_k}$$
4. **Cycles**: In graphs with cycles (e.g. $A \leftrightarrow B$), flow is propagated iteratively until the total transferred flow converges below $10^{-12}$. Because each step dissipates flow into node retention ($r_i > 0$), the geometric series strictly converges.

---

## 3. Exact Integer Wei Math & Remainder Distribution

To eliminate rounding leakage and ensure 100% exact conservation of the funding pot:
1. Floor allocations:
   $$\text{amountWei}_i = \lfloor \text{allocatedWeight}_i \times \text{fundingPotWei} \rfloor$$
2. Remainder calculation:
   $$\text{remainder} = \text{fundingPotWei} - \sum_{i=1}^M \text{amountWei}_i$$
3. Deterministic remainder allocation: The residual dust ($0 \le \text{remainder} < M$ wei) is sorted by the largest fractional residue and awarded 1 wei each to the highest fractional recipients.

This mathematically guarantees:
$$\sum_{i=1}^M \text{amountWei}_i \equiv \text{fundingPotWei}$$
