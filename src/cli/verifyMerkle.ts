import fs from 'fs';
import path from 'path';
import { verifyLeafProof } from '../allocation/merkle';

async function main() {
  console.log('=== Verifying Merkle Tree Proofs ===');

  const resultPath = path.resolve(process.cwd(), 'data/sample-result.json');
  if (!fs.existsSync(resultPath)) {
    console.error('Error: sample-result.json not found in data/. Run compute:sample first.');
    process.exit(1);
  }

  const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  const root = result.merkleRoot;
  const leaves = result.merkleLeaves;

  console.log(`Root: ${root}`);
  console.log(`Verifying ${leaves.length} leaf proofs...`);

  let validCount = 0;
  for (const leaf of leaves) {
    const ok = verifyLeafProof(root, leaf);
    if (!ok) {
      console.error(`Proof verification failed for package: ${leaf.packageId}`);
      process.exit(1);
    }
    validCount++;
    console.log(`  ✓ [Verified] ${leaf.packageId}: ${leaf.amountWei} wei -> ${leaf.recipient}`);
  }

  console.log(`\nAll ${validCount}/${leaves.length} Merkle proofs cryptographically verified against root.`);
  console.log('=== Merkle Verification PASSED ===');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
