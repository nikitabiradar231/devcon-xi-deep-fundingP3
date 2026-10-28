import { DependencyGraph } from '../graph/types';
import { JuryDataset } from '../jury/types';
import { AllocationEngineResult } from '../allocation/allocate';
import { MerkleAllocationResult } from '../allocation/merkle';
import { canonicalizeJson, hashCanonicalObject, hashUtf8 } from '../allocation/canonicalize';

export interface AuditManifest {
  schemaVersion: string;
  algorithmVersion: string;
  chainId: number;
  distributionId: string;
  graphHash: string;
  judgmentDatasetHash: string;
  jurorSetHash: string;
  merkleRoot: string;
  fundingPotWei: string;
  fundingPotEth: string;
  totalAllocatedWei: string;
  exactPotConserved: boolean;
  leafCount: number;
  parameters: {
    priorAlpha: number;
    defaultRetentionFraction: number;
    rootRetentionFraction: number;
    maxIterations: number;
    tolerance: number;
  };
  packages: Array<{
    packageId: string;
    name: string;
    maintainer: string;
    intrinsicJuryScore: number;
    normalizedJuryWeight: number;
    retentionFraction: number;
    allocatedWeight: number;
    amountWei: string;
    amountEth: string;
    sharePercentage: number;
    merkleProof: string[];
    leafHash: string;
    explanation: string;
  }>;
  summary: {
    totalPackages: number;
    totalJurors: number;
    totalJudgments: number;
    hasCycle: boolean;
  };
  manifestHash?: string;
}

export function generateAuditManifest(
  chainId: number,
  distributionId: bigint | number,
  graph: DependencyGraph,
  juryDataset: JuryDataset,
  allocationResult: AllocationEngineResult,
  merkleResult: MerkleAllocationResult,
  hasCycle: boolean
): AuditManifest {
  const graphHash = hashCanonicalObject(graph);
  const judgmentHash = hashCanonicalObject(juryDataset.judgments);
  const jurorSetHash = hashCanonicalObject(juryDataset.jurors);

  const packageRecords = allocationResult.allocations.map(a => {
    const leafData = merkleResult.proofMap[a.packageId];
    return {
      packageId: a.packageId,
      name: a.name,
      maintainer: a.maintainer,
      intrinsicJuryScore: a.intrinsicJuryScore,
      normalizedJuryWeight: a.normalizedJuryWeight,
      retentionFraction: a.retentionFraction,
      allocatedWeight: a.allocatedWeight,
      amountWei: a.amountWei,
      amountEth: a.amountEth,
      sharePercentage: a.sharePercentage,
      merkleProof: leafData?.proof || [],
      leafHash: leafData?.leafHash || '',
      explanation: a.explanation,
    };
  });

  const manifest: AuditManifest = {
    schemaVersion: '1.0.0',
    algorithmVersion: allocationResult.algorithmVersion,
    chainId,
    distributionId: distributionId.toString(),
    graphHash,
    judgmentDatasetHash: judgmentHash,
    jurorSetHash,
    merkleRoot: merkleResult.root,
    fundingPotWei: allocationResult.fundingPotWei,
    fundingPotEth: allocationResult.fundingPotEth,
    totalAllocatedWei: allocationResult.totalAllocatedWei,
    exactPotConserved: allocationResult.conserved,
    leafCount: merkleResult.leafCount,
    parameters: {
      priorAlpha: 0.05,
      defaultRetentionFraction: 0.30,
      rootRetentionFraction: 0.20,
      maxIterations: 300,
      tolerance: 1e-12,
    },
    packages: packageRecords,
    summary: {
      totalPackages: packageRecords.length,
      totalJurors: juryDataset.jurors.length,
      totalJudgments: juryDataset.judgments.length,
      hasCycle,
    },
  };

  const canon = canonicalizeJson(manifest);
  manifest.manifestHash = hashUtf8(canon);

  return manifest;
}
