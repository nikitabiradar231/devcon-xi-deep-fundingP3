import { describe, it, expect } from 'vitest';
import { DependencyGraph } from '../src/graph/types';
import { JuryDataset } from '../src/jury/types';
import { deriveBradleyTerryWeights } from '../src/jury/deriveWeights';
import { computeDeepFundingAllocations } from '../src/allocation/allocate';
import { generateMerkleAllocations, verifyLeafProof } from '../src/allocation/merkle';
import { hashCanonicalObject, hashAlgorithmVersion } from '../src/allocation/canonicalize';
import fs from 'fs';
import path from 'path';

describe('OpenZeppelin Merkle Tree Commitment & Verification', () => {
  const graphPath = path.resolve(process.cwd(), 'data/sample-graph.json');
  const judgmentsPath = path.resolve(process.cwd(), 'data/sample-judgments.json');
  const graph: DependencyGraph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const juryDataset: JuryDataset = JSON.parse(fs.readFileSync(judgmentsPath, 'utf8'));

  const packageIds = Object.keys(graph.packages).sort();
  const juryWeights = deriveBradleyTerryWeights(packageIds, juryDataset.judgments);
  const potWei = 1_000_000_000_000_000_000n;
  const allocations = computeDeepFundingAllocations(graph, juryWeights, potWei);

  const distributionId = 1n;
  const graphHash = hashCanonicalObject(graph);
  const algHash = hashAlgorithmVersion(allocations.algorithmVersion);

  const merkleResult = generateMerkleAllocations(
    distributionId,
    graphHash,
    algHash,
    allocations.allocations
  );

  it('generates a valid Merkle root for all allocations', () => {
    expect(merkleResult.root).toMatch(/^0x[a-f0-9]{64}$/i);
    expect(merkleResult.leafCount).toBe(8);
    expect(merkleResult.leaves).toHaveLength(8);
  });

  it('verifies all generated leaf proofs against the root', () => {
    for (const leaf of merkleResult.leaves) {
      const valid = verifyLeafProof(merkleResult.root, leaf);
      expect(valid).toBe(true);
      expect(leaf.proof.length).toBeGreaterThan(0);
    }
  });

  it('fails verification if an allocation amount is tampered', () => {
    const leaf = merkleResult.leaves[0];
    const tamperedLeaf = {
      ...leaf,
      amountWei: (BigInt(leaf.amountWei) + 1000n).toString(),
    };

    const valid = verifyLeafProof(merkleResult.root, tamperedLeaf);
    expect(valid).toBe(false);
  });

  it('fails verification if recipient address is tampered', () => {
    const leaf = merkleResult.leaves[0];
    const tamperedLeaf = {
      ...leaf,
      recipient: '0x9999999999999999999999999999999999999999',
    };

    const valid = verifyLeafProof(merkleResult.root, tamperedLeaf);
    expect(valid).toBe(false);
  });

  it('fails verification if distribution ID is altered', () => {
    const leaf = merkleResult.leaves[0];
    const tamperedLeaf = {
      ...leaf,
      distributionId: '99',
    };

    const valid = verifyLeafProof(merkleResult.root, tamperedLeaf);
    expect(valid).toBe(false);
  });
});
