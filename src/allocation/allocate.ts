import { DependencyGraph } from '../graph/types';
import { JuryWeightOutput } from '../jury/types';

export interface PackageAllocation {
  packageId: string;
  name: string;
  maintainer: string;
  intrinsicJuryScore: number;     // Bradley-Terry score
  normalizedJuryWeight: number;   // Normalized among eligible packages
  retentionFraction: number;      // Fraction kept by this node
  flowThrough: number;            // Total water flow passing through this node
  allocatedWeight: number;        // Final fraction of the funding pot [0..1]
  amountWei: string;              // Exact integer wei amount as string
  amountEth: string;              // Formatted ETH amount
  sharePercentage: number;        // Percentage (0..100%)
  explanation: string;            // Plain-English explanation
}

export interface AllocationEngineResult {
  algorithmVersion: string;
  fundingPotWei: string;
  fundingPotEth: string;
  totalAllocatedWei: string;
  remainderWei: string;
  conserved: boolean;
  allocations: PackageAllocation[];
  packageMap: Record<string, PackageAllocation>;
  propagationIterations: number;
}

export function computeDeepFundingAllocations(
  graph: DependencyGraph,
  juryOutput: JuryWeightOutput,
  fundingPotWei: bigint,
  options: {
    defaultRetentionFraction?: number;
    rootRetentionFraction?: number;
    maxIterations?: number;
    tolerance?: number;
  } = {}
): AllocationEngineResult {
  const defaultRetention = options.defaultRetentionFraction ?? 0.30;
  const rootRetention = options.rootRetentionFraction ?? 0.20;
  const maxIterations = options.maxIterations ?? 300;
  const tolerance = options.tolerance ?? 1e-12;

  const rootId = graph.rootPackageId;
  const packageIds = Object.keys(graph.packages).sort();
  const M = packageIds.length;

  if (M === 0) {
    throw new Error('Cannot run allocation on empty graph');
  }
  if (!graph.packages[rootId]) {
    throw new Error(`Root package '${rootId}' missing from graph`);
  }

  const pkgIndex: Record<string, number> = {};
  packageIds.forEach((id, idx) => {
    pkgIndex[id] = idx;
  });

  // Determine retention fractions
  const retention: number[] = packageIds.map(id => {
    const pkg = graph.packages[id];
    if (id === rootId) {
      return pkg.retentionFraction ?? rootRetention;
    }
    const deps = (pkg.dependencies || []).filter(dep => graph.packages[dep]);
    // Leaf nodes keep 100% of received water
    if (deps.length === 0) {
      return 1.0;
    }
    return pkg.retentionFraction ?? defaultRetention;
  });

  // Construct transition matrix P where P[u][v] is flow fraction sent from u to v
  // P[u][v] = (1 - retention[u]) * (pi[v] / sum_{k in deps(u)} pi[k])
  const P: number[][] = Array.from({ length: M }, () => Array(M).fill(0));

  for (let u = 0; u < M; u++) {
    const uId = packageIds[u];
    const deps = (graph.packages[uId].dependencies || []).filter(dep => graph.packages[dep]);
    const passDown = 1.0 - retention[u];

    if (deps.length > 0 && passDown > 0) {
      const depIndices = deps.map(d => pkgIndex[d]);
      const totalJuryWeight = depIndices.reduce((sum, v) => sum + (juryOutput.scores[packageIds[v]] || 1e-6), 0);

      for (const v of depIndices) {
        const vWeight = juryOutput.scores[packageIds[v]] || 1e-6;
        P[u][v] = passDown * (vWeight / totalJuryWeight);
      }
    }
  }

  // Initial injection: 1.0 at root package
  const rootIdx = pkgIndex[rootId];
  const e: number[] = Array(M).fill(0);
  e[rootIdx] = 1.0;

  // Power iteration: F^(t+1) = e + F^(t) * P
  let F: number[] = [...e];
  let iter = 0;

  for (iter = 0; iter < maxIterations; iter++) {
    const nextF: number[] = [...e];
    for (let u = 0; u < M; u++) {
      if (F[u] > 0) {
        for (let v = 0; v < M; v++) {
          if (P[u][v] > 0) {
            nextF[v] += F[u] * P[u][v];
          }
        }
      }
    }

    let maxDiff = 0;
    for (let i = 0; i < M; i++) {
      const diff = Math.abs(nextF[i] - F[i]);
      if (diff > maxDiff) maxDiff = diff;
    }

    F = nextF;
    if (maxDiff < tolerance) {
      iter++;
      break;
    }
  }

  // Calculate retained continuous allocation weights
  const rawRetainedWeights: number[] = packageIds.map((_, i) => F[i] * retention[i]);
  const sumRetained = rawRetainedWeights.reduce((a, b) => a + b, 0);

  // Normalize final continuous weights so sum is exactly 1.0
  const normalizedWeights: number[] = rawRetainedWeights.map(w => w / sumRetained);

  // Exact Integer Wei Allocation with Largest Remainder Method using BigInt integer math
  const potBig = BigInt(fundingPotWei);

  // Use a high-precision integer scale (10^14) to represent normalized weights without floating point loss
  const WEIGHT_SCALE = 100_000_000_000_000n; // 10^14
  const scaledWeights: bigint[] = normalizedWeights.map(w => BigInt(Math.round(w * 1e14)));
  const sumScaled = scaledWeights.reduce((a, b) => a + b, 0n);

  const floorAllocations: bigint[] = [];
  const remainders: { idx: number; id: string; remainder: bigint }[] = [];
  let totalFloor = 0n;

  for (let i = 0; i < M; i++) {
    const numerator = potBig * scaledWeights[i];
    const floorAmount = numerator / sumScaled;
    const rem = numerator % sumScaled;

    floorAllocations.push(floorAmount);
    totalFloor += floorAmount;

    remainders.push({
      idx: i,
      id: packageIds[i],
      remainder: rem,
    });
  }

  const dustWei = potBig - totalFloor;
  if (dustWei < 0n || dustWei > BigInt(M)) {
    throw new Error(`Invalid dust remainder calculation: ${dustWei} (total floor: ${totalFloor}, pot: ${potBig})`);
  }

  // Sort descending by remainder, tie-breaker: lexicographical package ID
  remainders.sort((a, b) => {
    if (b.remainder !== a.remainder) {
      return b.remainder > a.remainder ? 1 : -1;
    }
    return a.id.localeCompare(b.id);
  });

  // Distribute 1 wei dust to top remainders
  const finalAllocationsBig: bigint[] = [...floorAllocations];
  for (let d = 0; d < Number(dustWei); d++) {
    const targetIdx = remainders[d].idx;
    finalAllocationsBig[targetIdx] += 1n;
  }

  // Invariant verification: sum of all allocations == potBig exactly
  let totalAllocated = 0n;
  for (const amt of finalAllocationsBig) {
    totalAllocated += amt;
  }

  const conserved = totalAllocated === potBig;
  if (!conserved) {
    throw new Error(`CRITICAL INVARIANT VIOLATION: Total allocated (${totalAllocated}) != Funding pot (${potBig})`);
  }

  // Format ETH string
  function formatEth(wei: bigint): string {
    const ethNum = Number(wei) / 1e18;
    return ethNum.toFixed(6);
  }

  // Build package allocation records
  const allocations: PackageAllocation[] = [];
  const packageMap: Record<string, PackageAllocation> = {};

  for (let i = 0; i < M; i++) {
    const id = packageIds[i];
    const pkg = graph.packages[id];
    const amtWei = finalAllocationsBig[i].toString();
    const amtEth = formatEth(finalAllocationsBig[i]);
    const weight = normalizedWeights[i];
    const sharePct = Number((weight * 100).toFixed(4));
    const juryScore = juryOutput.scores[id] || 0;
    const stats = juryOutput.packageDetails[id];

    // Build plain-English explanation
    let explanation = '';
    if (id === rootId) {
      explanation = `Lead event application '${pkg.name}' received the initial thank-you pot, retained ${(retention[i] * 100).toFixed(0)}%, and deterministically flowed the remaining ${((1 - retention[i]) * 100).toFixed(0)}% down to its open source dependencies according to registered jury preferences.`;
    } else {
      const matchSummary = stats ? `won ${stats.wins}, tied ${stats.ties}, and lost ${stats.losses} pairwise matchups` : 'evaluated by jury';
      explanation = `'${pkg.name}' received ${amtEth} ETH (${sharePct}% of pot) because the registered jury evaluated its critical contribution to the event app (${matchSummary}). Dependency water flowed through the graph, with this package retaining ${(retention[i] * 100).toFixed(0)}% of its incoming flow and passing the rest to its own dependencies.`;
    }

    const record: PackageAllocation = {
      packageId: id,
      name: pkg.name,
      maintainer: pkg.maintainer,
      intrinsicJuryScore: juryScore,
      normalizedJuryWeight: juryScore,
      retentionFraction: retention[i],
      flowThrough: F[i],
      allocatedWeight: weight,
      amountWei: amtWei,
      amountEth: amtEth,
      sharePercentage: sharePct,
      explanation,
    };

    allocations.push(record);
    packageMap[id] = record;
  }

  return {
    algorithmVersion: `${juryOutput.algorithmVersion}-deepflow-v1`,
    fundingPotWei: potBig.toString(),
    fundingPotEth: formatEth(potBig),
    totalAllocatedWei: totalAllocated.toString(),
    remainderWei: '0',
    conserved: true,
    allocations,
    packageMap,
    propagationIterations: iter,
  };
}
