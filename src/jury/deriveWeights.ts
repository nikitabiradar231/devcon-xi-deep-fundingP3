import { PairwiseJudgment, JuryWeightOutput, PackageWeightResult } from './types';

export const WEIGHTING_ALGORITHM_VERSION = 'bradley-terry-mm-v1';

export function preferenceToWeights(pref: number): { weightA: number; weightB: number } {
  switch (pref) {
    case 1:
      // A << B: B substantially preferred
      return { weightA: 0.10, weightB: 0.90 };
    case 2:
      // A < B: B somewhat preferred
      return { weightA: 0.25, weightB: 0.75 };
    case 3:
      // A == B: Equal importance
      return { weightA: 0.50, weightB: 0.50 };
    case 4:
      // A > B: A somewhat preferred
      return { weightA: 0.75, weightB: 0.25 };
    case 5:
      // A >> B: A substantially preferred
      return { weightA: 0.90, weightB: 0.10 };
    default:
      throw new Error(`Invalid pairwise preference: ${pref}`);
  }
}

export function deriveBradleyTerryWeights(
  eligiblePackageIds: string[],
  judgments: PairwiseJudgment[],
  options: {
    priorAlpha?: number;
    maxIterations?: number;
    tolerance?: number;
  } = {}
): JuryWeightOutput {
  const packageList = Array.from(new Set(eligiblePackageIds)).sort();
  const M = packageList.length;

  if (M === 0) {
    throw new Error('Cannot derive weights for empty package list');
  }

  const priorAlpha = options.priorAlpha ?? 0.05;
  const maxIterations = options.maxIterations ?? 200;
  const tolerance = options.tolerance ?? 1e-10;

  // Initialize data structures
  const pkgIndex: Record<string, number> = {};
  packageList.forEach((id, idx) => {
    pkgIndex[id] = idx;
  });

  // Pairwise counts and wins
  // N[i][j] = number of comparisons between i and j
  // W[i] = total weighted wins for package i
  const N: number[][] = Array.from({ length: M }, () => Array(M).fill(0));
  const W: number[] = Array(M).fill(0);

  // Detailed statistics
  const stats: Record<string, { comparisons: number; wins: number; losses: number; ties: number }> = {};
  for (const id of packageList) {
    stats[id] = { comparisons: 0, wins: 0, losses: 0, ties: 0 };
  }

  let validCount = 0;
  for (const j of judgments) {
    const i = pkgIndex[j.packageA];
    const k = pkgIndex[j.packageB];

    // Only count comparisons between eligible packages
    if (i !== undefined && k !== undefined && i !== k) {
      const { weightA, weightB } = preferenceToWeights(j.preference);
      N[i][k] += 1;
      N[k][i] += 1;
      W[i] += weightA;
      W[k] += weightB;
      validCount++;

      stats[j.packageA].comparisons += 1;
      stats[j.packageB].comparisons += 1;

      if (weightA > weightB) {
        stats[j.packageA].wins += 1;
        stats[j.packageB].losses += 1;
      } else if (weightA < weightB) {
        stats[j.packageA].losses += 1;
        stats[j.packageB].wins += 1;
      } else {
        stats[j.packageA].ties += 1;
        stats[j.packageB].ties += 1;
      }
    }
  }

  // Initialize pi vector uniformly
  let pi: number[] = Array(M).fill(1 / M);

  // Minorization-Maximization iteration with Dirichlet prior
  let iter = 0;
  for (iter = 0; iter < maxIterations; iter++) {
    const nextPi: number[] = Array(M).fill(0);
    let maxDiff = 0;

    for (let i = 0; i < M; i++) {
      let denom = 0;
      for (let j = 0; j < M; j++) {
        if (i === j) continue;
        const totalComparisons = N[i][j] + (2 * priorAlpha) / M;
        const sumPi = pi[i] + pi[j];
        if (sumPi > 0) {
          denom += totalComparisons / sumPi;
        }
      }

      const numerator = W[i] + priorAlpha;
      nextPi[i] = denom > 0 ? numerator / denom : pi[i];
    }

    // Normalize nextPi
    const sumNext = nextPi.reduce((acc, v) => acc + v, 0);
    for (let i = 0; i < M; i++) {
      nextPi[i] = nextPi[i] / sumNext;
      const diff = Math.abs(nextPi[i] - pi[i]);
      if (diff > maxDiff) {
        maxDiff = diff;
      }
    }

    pi = nextPi;
    if (maxDiff < tolerance) {
      iter++;
      break;
    }
  }

  // Build final result map
  const scores: Record<string, number> = {};
  const packageDetails: Record<string, PackageWeightResult> = {};

  packageList.forEach((id, idx) => {
    scores[id] = pi[idx];
    packageDetails[id] = {
      packageId: id,
      intrinsicScore: pi[idx],
      normalizedScore: pi[idx],
      comparisonsCount: stats[id].comparisons,
      wins: stats[id].wins,
      losses: stats[id].losses,
      ties: stats[id].ties,
    };
  });

  return {
    algorithmVersion: WEIGHTING_ALGORITHM_VERSION,
    scores,
    packageDetails,
    totalJudgments: judgments.length,
    validJudgmentsCount: validCount,
    iterations: iter,
  };
}
