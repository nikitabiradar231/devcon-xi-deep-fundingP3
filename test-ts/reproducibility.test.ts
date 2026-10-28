import { describe, it, expect } from 'vitest';
import { DependencyGraph } from '../src/graph/types';
import { JuryDataset } from '../src/jury/types';
import { AuditManifest } from '../src/audit/manifest';
import { verifyManifestAndResults } from '../src/audit/verifyResult';
import { canonicalizeJson, hashCanonicalObject } from '../src/allocation/canonicalize';
import fs from 'fs';
import path from 'path';

describe('End-to-End Audit & Bit-for-Bit Reproducibility', () => {
  const graphPath = path.resolve(process.cwd(), 'data/sample-graph.json');
  const judgmentsPath = path.resolve(process.cwd(), 'data/sample-judgments.json');
  const manifestPath = path.resolve(process.cwd(), 'data/sample-manifest.json');
  const resultPath = path.resolve(process.cwd(), 'data/sample-result.json');

  const graph: DependencyGraph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const juryDataset: JuryDataset = JSON.parse(fs.readFileSync(judgmentsPath, 'utf8'));
  const manifest: AuditManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const sampleResult = JSON.parse(fs.readFileSync(resultPath, 'utf8'));

  it('independently verifies sample results and passes all 10 checks', () => {
    const report = verifyManifestAndResults(graph, juryDataset, manifest);

    expect(report.passed).toBe(true);
    expect(report.checks.graphValid).toBe(true);
    expect(report.checks.graphHashMatch).toBe(true);
    expect(report.checks.hasCycle).toBe(true);
    expect(report.checks.depthCheck).toBe(true);
    expect(report.checks.juryDatasetValid).toBe(true);
    expect(report.checks.judgmentHashMatch).toBe(true);
    expect(report.checks.allocationsMatch).toBe(true);
    expect(report.checks.conservationVerified).toBe(true);
    expect(report.checks.merkleRootMatch).toBe(true);
    expect(report.checks.allProofsValid).toBe(true);
  });

  it('matches the committed sample-result.json root and allocations', () => {
    expect(manifest.merkleRoot.toLowerCase()).toBe(sampleResult.merkleRoot.toLowerCase());
    expect(manifest.totalAllocatedWei).toBe(sampleResult.totalAllocatedWei);
    expect(manifest.exactPotConserved).toBe(true);
    expect(sampleResult.conserved).toBe(true);
    expect(sampleResult.allocations).toHaveLength(8);
  });

  it('guarantees deterministic canonical JSON serialization independent of key insertion order', () => {
    const obj1 = { z: 1, a: 2, m: { y: 'bar', b: 'foo' } };
    const obj2 = { a: 2, m: { b: 'foo', y: 'bar' }, z: 1 };

    const canon1 = canonicalizeJson(obj1);
    const canon2 = canonicalizeJson(obj2);

    expect(canon1).toBe(canon2);
    expect(hashCanonicalObject(obj1)).toBe(hashCanonicalObject(obj2));
  });
});
