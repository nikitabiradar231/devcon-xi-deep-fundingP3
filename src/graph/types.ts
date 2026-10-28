export interface PackageNode {
  id: string;
  name: string;
  description?: string;
  maintainer: string; // Ethereum address (0x...)
  repoUrl?: string;
  version: string;
  dependencies: string[]; // List of package IDs this package depends on
  retentionFraction?: number; // Fraction [0..1] of incoming funds kept by this package (e.g. 0.3)
  license?: string;
}

export interface DependencyGraph {
  applicationId: string;
  rootPackageId: string;
  algorithmVersion: string;
  description?: string;
  packages: Record<string, PackageNode>;
}

export interface GraphEdge {
  from: string; // Dependent package
  to: string;   // Dependency package
}

export interface StronglyConnectedComponent {
  nodes: string[];
  isCycle: boolean;
}

export interface CycleAnalysisResult {
  hasCycle: boolean;
  cycles: string[][];
  stronglyConnectedComponents: StronglyConnectedComponent[];
  maxDepth: number;
  nodeDepths: Record<string, number>;
}
