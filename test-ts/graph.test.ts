import { describe, it, expect } from 'vitest';
import { DependencyGraph } from '../src/graph/types';
import { validateGraph } from '../src/graph/validateGraph';
import { analyzeCyclesAndDepth } from '../src/graph/cycleAnalysis';
import { traverseGraphBounded } from '../src/graph/traverseGraph';
import fs from 'fs';
import path from 'path';

describe('Graph Validation and Cycle Analysis', () => {
  it('validates the sample graph successfully', () => {
    const graphPath = path.resolve(process.cwd(), 'data/sample-graph.json');
    const graph: DependencyGraph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));

    const result = validateGraph(graph);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.reachablePackages).toHaveLength(8);
    expect(result.reachablePackages).toContain('kavya/event-app');
    expect(result.reachablePackages).toContain('pune/qr-ticketing');
  });

  it('detects missing root package in graph', () => {
    const invalidGraph: DependencyGraph = {
      applicationId: 'test-app',
      rootPackageId: 'missing-root',
      algorithmVersion: '1.0.0',
      packages: {
        'pkg-a': {
          id: 'pkg-a',
          name: 'Package A',
          maintainer: '0x1111111111111111111111111111111111111111',
          version: '1.0.0',
          dependencies: [],
        },
      },
    };

    const result = validateGraph(invalidGraph);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('missing-root'))).toBe(true);
  });

  it('rejects invalid maintainer address', () => {
    const invalidGraph: DependencyGraph = {
      applicationId: 'test-app',
      rootPackageId: 'pkg-a',
      algorithmVersion: '1.0.0',
      packages: {
        'pkg-a': {
          id: 'pkg-a',
          name: 'Package A',
          maintainer: '0xinvalid_address',
          version: '1.0.0',
          dependencies: [],
        },
      },
    };

    const result = validateGraph(invalidGraph);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('invalid Ethereum maintainer'))).toBe(true);
  });

  it('rejects non-existent dependencies', () => {
    const invalidGraph: DependencyGraph = {
      applicationId: 'test-app',
      rootPackageId: 'pkg-a',
      algorithmVersion: '1.0.0',
      packages: {
        'pkg-a': {
          id: 'pkg-a',
          name: 'Package A',
          maintainer: '0x1111111111111111111111111111111111111111',
          version: '1.0.0',
          dependencies: ['pkg-b'],
        },
      },
    };

    const result = validateGraph(invalidGraph);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('non-existent dependency'))).toBe(true);
  });

  it('rejects self-dependencies', () => {
    const invalidGraph: DependencyGraph = {
      applicationId: 'test-app',
      rootPackageId: 'pkg-a',
      algorithmVersion: '1.0.0',
      packages: {
        'pkg-a': {
          id: 'pkg-a',
          name: 'Package A',
          maintainer: '0x1111111111111111111111111111111111111111',
          version: '1.0.0',
          dependencies: ['pkg-a'],
        },
      },
    };

    const result = validateGraph(invalidGraph);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('direct self-dependency'))).toBe(true);
  });

  it('detects directed cycles and verifies depth >= 3 in sample graph', () => {
    const graphPath = path.resolve(process.cwd(), 'data/sample-graph.json');
    const graph: DependencyGraph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));

    const analysis = analyzeCyclesAndDepth(graph);
    expect(analysis.hasCycle).toBe(true);
    expect(analysis.maxDepth).toBeGreaterThanOrEqual(3);

    // Verify the cycle between utils/graph-core and utils/graph-core-adapter
    const cycleNodes = analysis.stronglyConnectedComponents.find(c => c.isCycle)?.nodes;
    expect(cycleNodes).toBeDefined();
    expect(cycleNodes).toContain('utils/graph-core');
    expect(cycleNodes).toContain('utils/graph-core-adapter');
  });

  it('terminates bounded graph traversal gracefully on cyclic graphs without infinite loops', () => {
    const graphPath = path.resolve(process.cwd(), 'data/sample-graph.json');
    const graph: DependencyGraph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));

    const traversal = traverseGraphBounded(graph, 100);
    expect(traversal.visitedCount).toBe(8);
    expect(traversal.orderedPackages).toHaveLength(8);
    expect(traversal.edges.length).toBeGreaterThan(0);
  });
});
