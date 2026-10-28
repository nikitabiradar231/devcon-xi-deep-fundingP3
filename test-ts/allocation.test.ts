import { describe, it, expect } from 'vitest';
import { DependencyGraph } from '../src/graph/types';
import { JuryDataset } from '../src/jury/types';
import { deriveBradleyTerryWeights } from '../src/jury/deriveWeights';
import { computeDeepFundingAllocations } from '../src/allocation/allocate';
import fs from 'fs';
import path from 'path';

describe('Deep Funding Allocation Engine & Exact Pot Conservation', () => {
  const graphPath = path.resolve(process.cwd(), 'data/sample-graph.json');
  const judgmentsPath = path.resolve(process.cwd(), 'data/sample-judgments.json');
  const graph: DependencyGraph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const juryDataset: JuryDataset = JSON.parse(fs.readFileSync(judgmentsPath, 'utf8'));

  const packageIds = Object.keys(graph.packages).sort();
  const juryWeights = deriveBradleyTerryWeights(packageIds, juryDataset.judgments, {
    priorAlpha: 0.05,
    maxIterations: 300,
    tolerance: 1e-12,
  });

  it('allocates 1 ETH with 100% exact integer wei conservation', () => {
    const potWei = 1_000_000_000_000_000_000n; // 1 ETH
    const result = computeDeepFundingAllocations(graph, juryWeights, potWei, {
      defaultRetentionFraction: 0.30,
      rootRetentionFraction: 0.20,
      maxIterations: 300,
      tolerance: 1e-12,
    });

    expect(result.conserved).toBe(true);
    expect(result.totalAllocatedWei).toBe(potWei.toString());
    expect(result.allocations).toHaveLength(8);

    // Sum every package's wei amount
    let sumWei = 0n;
    for (const alloc of result.allocations) {
      sumWei += BigInt(alloc.amountWei);
      expect(BigInt(alloc.amountWei)).toBeGreaterThan(0n);
    }
    expect(sumWei).toBe(potWei);
  });

  it('conserves pot exactly for small pots with high rounding dust', () => {
    const potWei = 777n; // Odd small amount prone to integer truncation
    const result = computeDeepFundingAllocations(graph, juryWeights, potWei);

    expect(result.conserved).toBe(true);
    expect(result.totalAllocatedWei).toBe('777');

    let sumWei = 0n;
    for (const alloc of result.allocations) {
      sumWei += BigInt(alloc.amountWei);
    }
    expect(sumWei).toBe(777n);
  });

  it('handles zero funding pot without division by zero', () => {
    const potWei = 0n;
    const result = computeDeepFundingAllocations(graph, juryWeights, potWei);

    expect(result.conserved).toBe(true);
    expect(result.totalAllocatedWei).toBe('0');
    for (const alloc of result.allocations) {
      expect(alloc.amountWei).toBe('0');
    }
  });

  it('ensures each eligible package is allocated exactly once', () => {
    const potWei = 1_000_000_000_000_000_000n;
    const result = computeDeepFundingAllocations(graph, juryWeights, potWei);

    const allocatedIds = result.allocations.map(a => a.packageId);
    const uniqueIds = new Set(allocatedIds);
    expect(uniqueIds.size).toBe(packageIds.length);
    expect(allocatedIds.sort()).toEqual(packageIds.sort());
  });

  it('allocates non-trivial funds to transitive dependencies in cycles', () => {
    const potWei = 1_000_000_000_000_000_000n;
    const result = computeDeepFundingAllocations(graph, juryWeights, potWei);

    const graphCore = result.packageMap['utils/graph-core'];
    const adapter = result.packageMap['utils/graph-core-adapter'];
    const encoding = result.packageMap['utils/encoding'];

    expect(graphCore).toBeDefined();
    expect(adapter).toBeDefined();
    expect(encoding).toBeDefined();

    expect(BigInt(graphCore.amountWei)).toBeGreaterThan(0n);
    expect(BigInt(adapter.amountWei)).toBeGreaterThan(0n);
    expect(BigInt(encoding.amountWei)).toBeGreaterThan(0n);
  });
});
