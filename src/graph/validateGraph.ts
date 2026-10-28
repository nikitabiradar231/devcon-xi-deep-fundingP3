import { DependencyGraph, PackageNode } from './types';
import { isAddress, getAddress } from 'ethers';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  reachablePackages: string[];
}

export function validateGraph(
  graph: DependencyGraph,
  options: { maxPackages?: number } = {}
): ValidationResult {
  const errors: string[] = [];
  const maxPackages = options.maxPackages ?? 1000;

  if (!graph.applicationId || typeof graph.applicationId !== 'string') {
    errors.push('Graph must have a non-empty applicationId');
  }

  if (!graph.rootPackageId || typeof graph.rootPackageId !== 'string') {
    errors.push('Graph must have a non-empty rootPackageId');
  }

  if (!graph.packages || typeof graph.packages !== 'object') {
    errors.push('Graph packages must be an object');
    return { valid: false, errors, reachablePackages: [] };
  }

  const packageIds = Object.keys(graph.packages);
  if (packageIds.length === 0) {
    errors.push('Graph must contain at least one package');
  }

  if (packageIds.length > maxPackages) {
    errors.push(`Graph exceeds maximum allowed package count (${maxPackages})`);
  }

  if (!graph.packages[graph.rootPackageId]) {
    errors.push(`Root package '${graph.rootPackageId}' not found in packages`);
  }

  // Validate each package
  for (const [id, pkg] of Object.entries(graph.packages)) {
    if (pkg.id !== id) {
      errors.push(`Package key '${id}' does not match package.id '${pkg.id}'`);
    }

    if (!pkg.name || typeof pkg.name !== 'string') {
      errors.push(`Package '${id}' has missing or invalid name`);
    }

    if (!pkg.maintainer || !isAddress(pkg.maintainer)) {
      errors.push(`Package '${id}' has invalid Ethereum maintainer address: '${pkg.maintainer}'`);
    }

    if (!Array.isArray(pkg.dependencies)) {
      errors.push(`Package '${id}' dependencies must be an array`);
      continue;
    }

    // Check for self-dependencies
    if (pkg.dependencies.includes(id)) {
      errors.push(`Package '${id}' has a direct self-dependency`);
    }

    // Check for duplicate dependencies in list
    const depSet = new Set<string>();
    for (const depId of pkg.dependencies) {
      if (depSet.has(depId)) {
        errors.push(`Package '${id}' has duplicate dependency on '${depId}'`);
      }
      depSet.add(depId);

      // Check existence
      if (!graph.packages[depId]) {
        errors.push(`Package '${id}' references non-existent dependency '${depId}'`);
      }
    }

    // Check retention fraction if provided
    if (pkg.retentionFraction !== undefined) {
      if (typeof pkg.retentionFraction !== 'number' || pkg.retentionFraction < 0 || pkg.retentionFraction > 1) {
        errors.push(`Package '${id}' retentionFraction must be a number between 0 and 1`);
      }
    }
  }

  // Compute reachability from root
  const reachableSet = new Set<string>();
  if (graph.packages[graph.rootPackageId]) {
    const queue: string[] = [graph.rootPackageId];
    reachableSet.add(graph.rootPackageId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = graph.packages[current];
      if (node && Array.isArray(node.dependencies)) {
        for (const dep of node.dependencies) {
          if (graph.packages[dep] && !reachableSet.has(dep)) {
            reachableSet.add(dep);
            queue.push(dep);
          }
        }
      }
    }
  }

  // Check disconnected packages
  for (const id of packageIds) {
    if (!reachableSet.has(id)) {
      // Disconnected packages are recorded as warnings/info but can be filtered out
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    reachablePackages: Array.from(reachableSet).sort(),
  };
}
