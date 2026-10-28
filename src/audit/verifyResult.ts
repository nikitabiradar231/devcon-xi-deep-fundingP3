import { DependencyGraph } from '../graph/types';
import { JuryDataset } from '../jury/types';
import { AuditManifest } from './manifest';
import { validateGraph } from '../graph/validateGraph';
import { analyzeCyclesAndDepth } from '../graph/cycleAnalysis';
import { validateJuryDataset } from '../jury/judgments';
import { deriveBradleyTerryWeights } from '../jury/deriveWeights';
import { computeDeepFundingAllocations } from '../allocation/allocate';
import { generateMerkleAllocations, verifyLeafProof } from '../allocation/merkle';
import { hashCanonicalObject, hashAlgorithmVersion } from '../allocation/canonicalize';

export interface VerificationReport {
  passed: boolean;
  checks: {
    graphValid: boolean;
    graphHashMatch: boolean;
    hasCycle: boolean;
    depthCheck: boolean;
    juryDatasetValid: boolean;
    judgmentHashMatch: boolean;
    allocationsMatch: boolean;
    conservationVerified: boolean;
    merkleRootMatch: boolean;
    allProofsValid: boolean;
  };
  details: string[];
}

export function verifyManifestAndResults(
  graph: DependencyGraph,
  juryDataset: JuryDataset,
  manifest: AuditManifest
): VerificationReport {
  const details: string[] = [];

  // 1. Graph validation
  const graphVal = validateGraph(graph);
  if (!graphVal.valid) {
    details.push(`Graph validation failed: ${graphVal.errors.join('; ')}`);
  }

  const computedGraphHash = hashCanonicalObject(graph);
  const graphHashMatch = computedGraphHash === manifest.graphHash;
  if (!graphHashMatch) {
    details.push(`Graph hash mismatch: computed ${computedGraphHash} != manifest ${manifest.graphHash}`);
  }

  // 2. Cycle and depth analysis
  const cycleInfo = analyzeCyclesAndDepth(graph);
  const hasCycle = cycleInfo.hasCycle;
  const depthCheck = cycleInfo.maxDepth >= 3;
  if (!hasCycle) {
    details.push('Cycle check failed: graph does not contain any cycles');
  }
  if (!depthCheck) {
    details.push(`Depth check failed: graph depth is ${cycleInfo.maxDepth}, expected >= 3`);
  }

  // 3. Jury dataset validation
  const juryVal = validateJuryDataset(juryDataset, graph);
  if (!juryVal.valid) {
    details.push(`Jury dataset validation failed: ${juryVal.errors.join('; ')}`);
  }

  const computedJudgmentHash = hashCanonicalObject(juryDataset.judgments);
  const judgmentHashMatch = computedJudgmentHash === manifest.judgmentDatasetHash;
  if (!judgmentHashMatch) {
    details.push(`Judgment hash mismatch: computed ${computedJudgmentHash} != manifest ${manifest.judgmentDatasetHash}`);
  }

  // 4. Recompute weights & allocations
  const juryWeights = deriveBradleyTerryWeights(graphVal.reachablePackages, juryVal.validJudgments, {
    priorAlpha: manifest.parameters.priorAlpha,
    maxIterations: manifest.parameters.maxIterations,
    tolerance: manifest.parameters.tolerance,
  });

  const allocations = computeDeepFundingAllocations(
    graph,
    juryWeights,
    BigInt(manifest.fundingPotWei),
    {
      defaultRetentionFraction: manifest.parameters.defaultRetentionFraction,
      rootRetentionFraction: manifest.parameters.rootRetentionFraction,
      maxIterations: manifest.parameters.maxIterations,
      tolerance: manifest.parameters.tolerance,
    }
  );

  const conservationVerified = allocations.conserved && allocations.totalAllocatedWei === manifest.fundingPotWei;
  if (!conservationVerified) {
    details.push(`Conservation failed: total allocated ${allocations.totalAllocatedWei} != pot ${manifest.fundingPotWei}`);
  }

  // 5. Compare recomputed allocations with manifest
  let allocationsMatch = true;
  if (allocations.allocations.length !== manifest.packages.length) {
    allocationsMatch = false;
    details.push(`Package count mismatch: ${allocations.allocations.length} != manifest ${manifest.packages.length}`);
  } else {
    for (const alloc of allocations.allocations) {
      const manifestPkg = manifest.packages.find(p => p.packageId === alloc.packageId);
      if (!manifestPkg) {
        allocationsMatch = false;
        details.push(`Package ${alloc.packageId} missing in manifest`);
        break;
      }
      if (manifestPkg.amountWei !== alloc.amountWei) {
        allocationsMatch = false;
        details.push(`Amount mismatch for ${alloc.packageId}: ${alloc.amountWei} != ${manifestPkg.amountWei}`);
        break;
      }
    }
  }

  // 6. Merkle root & proofs verification
  const algHash = hashAlgorithmVersion(allocations.algorithmVersion);
  const merkleResult = generateMerkleAllocations(
    BigInt(manifest.distributionId),
    computedGraphHash,
    algHash,
    allocations.allocations
  );

  const merkleRootMatch = merkleResult.root.toLowerCase() === manifest.merkleRoot.toLowerCase();
  if (!merkleRootMatch) {
    details.push(`Merkle root mismatch: computed ${merkleResult.root} != manifest ${manifest.merkleRoot}`);
  }

  let allProofsValid = true;
  for (const leaf of merkleResult.leaves) {
    const valid = verifyLeafProof(merkleResult.root, leaf);
    if (!valid) {
      allProofsValid = false;
      details.push(`Merkle proof verification failed for package ${leaf.packageId}`);
    }
  }

  const passed =
    graphVal.valid &&
    graphHashMatch &&
    hasCycle &&
    depthCheck &&
    juryVal.valid &&
    judgmentHashMatch &&
    allocationsMatch &&
    conservationVerified &&
    merkleRootMatch &&
    allProofsValid;

  return {
    passed,
    checks: {
      graphValid: graphVal.valid,
      graphHashMatch,
      hasCycle,
      depthCheck,
      juryDatasetValid: juryVal.valid,
      judgmentHashMatch,
      allocationsMatch,
      conservationVerified,
      merkleRootMatch,
      allProofsValid,
    },
    details,
  };
}
