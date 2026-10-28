import { DependencyGraph, CycleAnalysisResult, StronglyConnectedComponent } from './types';

export function analyzeCyclesAndDepth(graph: DependencyGraph): CycleAnalysisResult {
  const nodes = Object.keys(graph.packages);
  const adj: Record<string, string[]> = {};
  for (const id of nodes) {
    adj[id] = (graph.packages[id]?.dependencies || []).filter(dep => graph.packages[dep]);
  }

  // Tarjan's SCC algorithm
  let index = 0;
  const indices: Record<string, number> = {};
  const lowlinks: Record<string, number> = {};
  const onStack: Record<string, boolean> = {};
  const stack: string[] = [];
  const sccs: string[][] = [];

  function strongConnect(v: string) {
    indices[v] = index;
    lowlinks[v] = index;
    index++;
    stack.push(v);
    onStack[v] = true;

    for (const w of adj[v] || []) {
      if (indices[w] === undefined) {
        strongConnect(w);
        lowlinks[v] = Math.min(lowlinks[v], lowlinks[w]);
      } else if (onStack[w]) {
        lowlinks[v] = Math.min(lowlinks[v], indices[w]);
      }
    }

    if (lowlinks[v] === indices[v]) {
      const scc: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack[w] = false;
        scc.push(w);
      } while (w !== v);
      sccs.push(scc.sort());
    }
  }

  for (const node of nodes) {
    if (indices[node] === undefined) {
      strongConnect(node);
    }
  }

  const stronglyConnectedComponents: StronglyConnectedComponent[] = sccs.map(comp => {
    // A component is a cycle if it has > 1 node, or 1 node with a self-loop
    const isCycle = comp.length > 1 || (comp.length === 1 && (adj[comp[0]] || []).includes(comp[0]));
    return {
      nodes: comp,
      isCycle,
    };
  });

  const cycleComponents = stronglyConnectedComponents.filter(c => c.isCycle);
  const hasCycle = cycleComponents.length > 0;

  // Extract elementary cycles for explanation
  const detectedCycles: string[][] = [];
  for (const c of cycleComponents) {
    if (c.nodes.length > 1) {
      // Find a simple cycle path within the SCC
      const start = c.nodes[0];
      const visited = new Set<string>();
      const path: string[] = [start];

      function findCycleDfs(curr: string): boolean {
        for (const next of adj[curr] || []) {
          if (!c.nodes.includes(next)) continue;
          if (next === start && path.length > 1) {
            detectedCycles.push([...path, start]);
            return true;
          }
          if (!visited.has(next)) {
            visited.add(next);
            path.push(next);
            if (findCycleDfs(next)) return true;
            path.pop();
            visited.delete(next);
          }
        }
        return false;
      }

      visited.add(start);
      findCycleDfs(start);
    }
  }

  // Compute depth from root using BFS (shortest path distance from root)
  const nodeDepths: Record<string, number> = {};
  let maxDepth = 0;

  if (graph.packages[graph.rootPackageId]) {
    const queue: { id: string; depth: number }[] = [{ id: graph.rootPackageId, depth: 0 }];
    nodeDepths[graph.rootPackageId] = 0;

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (depth > maxDepth) maxDepth = depth;

      for (const dep of adj[id] || []) {
        if (nodeDepths[dep] === undefined) {
          nodeDepths[dep] = depth + 1;
          queue.push({ id: dep, depth: depth + 1 });
        }
      }
    }
  }

  return {
    hasCycle,
    cycles: detectedCycles,
    stronglyConnectedComponents,
    maxDepth,
    nodeDepths,
  };
}
