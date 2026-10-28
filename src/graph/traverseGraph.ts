import { DependencyGraph, PackageNode } from './types';

export interface TraversalResult {
  orderedPackages: PackageNode[];
  edges: { from: string; to: string }[];
  visitedCount: number;
}

export function traverseGraphBounded(
  graph: DependencyGraph,
  maxSteps: number = 5000
): TraversalResult {
  const rootId = graph.rootPackageId;
  const root = graph.packages[rootId];
  if (!root) {
    return { orderedPackages: [], edges: [], visitedCount: 0 };
  }

  const visited = new Set<string>();
  const queue: string[] = [rootId];
  visited.add(rootId);

  const orderedPackages: PackageNode[] = [];
  const edges: { from: string; to: string }[] = [];
  let steps = 0;

  while (queue.length > 0) {
    steps++;
    if (steps > maxSteps) {
      throw new Error(`Graph traversal exceeded step limit of ${maxSteps}. Possible infinite state.`);
    }

    const currentId = queue.shift()!;
    const currentNode = graph.packages[currentId];
    if (currentNode) {
      orderedPackages.push(currentNode);

      for (const depId of currentNode.dependencies || []) {
        if (graph.packages[depId]) {
          edges.push({ from: currentId, to: depId });
          if (!visited.has(depId)) {
            visited.add(depId);
            queue.push(depId);
          }
        }
      }
    }
  }

  return {
    orderedPackages,
    edges,
    visitedCount: visited.size,
  };
}
