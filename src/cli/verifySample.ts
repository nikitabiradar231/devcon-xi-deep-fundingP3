import fs from 'fs';
import path from 'path';
import { DependencyGraph } from '../graph/types';
import { JuryDataset } from '../jury/types';
import { AuditManifest } from '../audit/manifest';
import { verifyManifestAndResults } from '../audit/verifyResult';

async function main() {
  console.log('=== Verifying Sample Result & Audit Manifest ===');

  const graphPath = path.resolve(process.cwd(), 'data/sample-graph.json');
  const judgmentsPath = path.resolve(process.cwd(), 'data/sample-judgments.json');
  const manifestPath = path.resolve(process.cwd(), 'data/sample-manifest.json');

  if (!fs.existsSync(graphPath) || !fs.existsSync(judgmentsPath) || !fs.existsSync(manifestPath)) {
    console.error('Error: input data files or sample-manifest.json missing in data/');
    process.exit(1);
  }

  const graph: DependencyGraph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const juryDataset: JuryDataset = JSON.parse(fs.readFileSync(judgmentsPath, 'utf8'));
  const manifest: AuditManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const report = verifyManifestAndResults(graph, juryDataset, manifest);

  console.log('Verification Checks:');
  console.log(`- Graph Valid:                ${report.checks.graphValid ? 'PASS' : 'FAIL'}`);
  console.log(`- Graph Hash Match:           ${report.checks.graphHashMatch ? 'PASS' : 'FAIL'}`);
  console.log(`- Directed Cycle Detected:    ${report.checks.hasCycle ? 'PASS' : 'FAIL'}`);
  console.log(`- Minimum Depth (>= 3):       ${report.checks.depthCheck ? 'PASS' : 'FAIL'}`);
  console.log(`- Jury Dataset Valid:         ${report.checks.juryDatasetValid ? 'PASS' : 'FAIL'}`);
  console.log(`- Judgment Hash Match:        ${report.checks.judgmentHashMatch ? 'PASS' : 'FAIL'}`);
  console.log(`- Allocations Exact Match:    ${report.checks.allocationsMatch ? 'PASS' : 'FAIL'}`);
  console.log(`- Exact Payout Conservation:  ${report.checks.conservationVerified ? 'PASS' : 'FAIL'}`);
  console.log(`- Merkle Root Match:          ${report.checks.merkleRootMatch ? 'PASS' : 'FAIL'}`);
  console.log(`- All Merkle Proofs Valid:    ${report.checks.allProofsValid ? 'PASS' : 'FAIL'}`);

  if (report.details.length > 0) {
    console.log('\nDetails/Warnings:');
    report.details.forEach(d => console.log(`  * ${d}`));
  }

  if (!report.passed) {
    console.error('\nVerification FAILED.');
    process.exit(1);
  }

  console.log('\n=== All Verification Checks PASSED (100% Bit-for-Bit Reproducible) ===');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
