import fs from 'fs';
import path from 'path';
import { DependencyGraph } from '../graph/types';
import { JuryDataset } from '../jury/types';
import { validateGraph } from '../graph/validateGraph';
import { analyzeCyclesAndDepth } from '../graph/cycleAnalysis';
import { validateJuryDataset } from '../jury/judgments';
import { deriveBradleyTerryWeights } from '../jury/deriveWeights';
import { computeDeepFundingAllocations } from '../allocation/allocate';
import { generateMerkleAllocations } from '../allocation/merkle';
import { generateAuditManifest } from '../audit/manifest';
import { hashCanonicalObject, hashAlgorithmVersion } from '../allocation/canonicalize';

async function main() {
  console.log('=== Computing Sample Deep Funding Distribution ===');

  const graphPath = path.resolve(process.cwd(), 'data/sample-graph.json');
  const judgmentsPath = path.resolve(process.cwd(), 'data/sample-judgments.json');

  if (!fs.existsSync(graphPath) || !fs.existsSync(judgmentsPath)) {
    console.error('Error: sample-graph.json or sample-judgments.json missing in data/');
    process.exit(1);
  }

  const graph: DependencyGraph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const juryDataset: JuryDataset = JSON.parse(fs.readFileSync(judgmentsPath, 'utf8'));

  // 1. Validate graph
  const graphVal = validateGraph(graph);
  if (!graphVal.valid) {
    console.error('Graph validation errors:', graphVal.errors);
    process.exit(1);
  }
  console.log(`Graph valid: ${graphVal.reachablePackages.length} reachable packages.`);

  // 2. Cycle analysis
  const cycleInfo = analyzeCyclesAndDepth(graph);
  console.log(`Cycles detected: ${cycleInfo.hasCycle} (SCCs: ${cycleInfo.stronglyConnectedComponents.length}, Max Depth: ${cycleInfo.maxDepth})`);
  if (!cycleInfo.hasCycle || cycleInfo.maxDepth < 3) {
    console.error('Warning: sample graph must have at least one cycle and depth >= 3');
  }

  // 3. Validate judgments
  const juryVal = validateJuryDataset(juryDataset, graph);
  if (!juryVal.valid) {
    console.error('Jury dataset validation errors:', juryVal.errors);
    process.exit(1);
  }
  console.log(`Jury valid: ${juryVal.validJudgments.length} valid judgments from ${juryVal.activeJurorSet.size} active jurors.`);

  // 4. Derive weights with Bradley-Terry MM
  const parameters = {
    priorAlpha: 0.05,
    defaultRetentionFraction: 0.30,
    rootRetentionFraction: 0.20,
    maxIterations: 300,
    tolerance: 1e-12,
  };

  const juryWeights = deriveBradleyTerryWeights(graphVal.reachablePackages, juryVal.validJudgments, {
    priorAlpha: parameters.priorAlpha,
    maxIterations: parameters.maxIterations,
    tolerance: parameters.tolerance,
  });
  console.log(`Bradley-Terry converged in ${juryWeights.iterations} iterations.`);

  // 5. Compute Deep Funding Allocations (1 ETH pot = 10^18 wei)
  const potWei = 1_000_000_000_000_000_000n; // 1 ETH
  const allocationResult = computeDeepFundingAllocations(graph, juryWeights, potWei, {
    defaultRetentionFraction: parameters.defaultRetentionFraction,
    rootRetentionFraction: parameters.rootRetentionFraction,
    maxIterations: parameters.maxIterations,
    tolerance: parameters.tolerance,
  });
  console.log(`Allocation complete: ${allocationResult.totalAllocatedWei} wei allocated across ${allocationResult.allocations.length} packages (conserved: ${allocationResult.conserved})`);

  // 6. Generate Merkle Tree
  const distributionId = 1n;
  const graphHash = hashCanonicalObject(graph);
  const algHash = hashAlgorithmVersion(allocationResult.algorithmVersion);

  const merkleResult = generateMerkleAllocations(
    distributionId,
    graphHash,
    algHash,
    allocationResult.allocations
  );
  console.log(`Merkle Root: ${merkleResult.root} (${merkleResult.leafCount} leaves)`);

  // 7. Generate Audit Manifest
  const chainId = 11155111; // Ethereum Sepolia
  const manifest = generateAuditManifest(
    chainId,
    distributionId,
    graph,
    juryDataset,
    allocationResult,
    merkleResult,
    cycleInfo.hasCycle
  );

  // 8. Save outputs to data/
  const resultOutputPath = path.resolve(process.cwd(), 'data/sample-result.json');
  const manifestOutputPath = path.resolve(process.cwd(), 'data/sample-manifest.json');

  const resultData = {
    distributionId: distributionId.toString(),
    chainId,
    graphHash,
    merkleRoot: merkleResult.root,
    fundingPotWei: allocationResult.fundingPotWei,
    fundingPotEth: allocationResult.fundingPotEth,
    totalAllocatedWei: allocationResult.totalAllocatedWei,
    conserved: allocationResult.conserved,
    allocations: allocationResult.allocations,
    merkleLeaves: merkleResult.leaves,
  };

  fs.writeFileSync(resultOutputPath, JSON.stringify(resultData, null, 2));
  fs.writeFileSync(manifestOutputPath, JSON.stringify(manifest, null, 2));

  console.log(`Saved sample result to: ${resultOutputPath}`);
  console.log(`Saved audit manifest to: ${manifestOutputPath}`);
  console.log('=== Compute Completed Successfully ===');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
