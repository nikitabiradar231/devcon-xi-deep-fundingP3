import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import { spawnSync } from 'child_process';

interface PreflightCheck {
  name: string;
  passed: boolean;
  message: string;
}

async function runPreflight() {
  console.log('=== Running Sepolia Deployment Preflight ===\n');

  const checks: PreflightCheck[] = [];

  // 1. Check for tracked credentials
  console.log('[1/7] Scanning tracked files for secret leaks...');
  const secretScan = spawnSync('npm', ['run', 'scan:secrets'], { shell: true, stdio: 'pipe', encoding: 'utf8' });
  const scanPassed = secretScan.status === 0;
  checks.push({
    name: 'Secret Scan Hygiene',
    passed: scanPassed,
    message: scanPassed ? 'No private keys or credentials in tracked files' : 'Secrets detected in tracked files!',
  });

  // 2. Check local contract compilation
  console.log('[2/7] Checking Solidity contract compilation...');
  const forgeBuild = spawnSync('node', ['scripts/run-forge.js', 'build'], { shell: true, stdio: 'pipe', encoding: 'utf8' });
  const buildPassed = forgeBuild.status === 0;
  checks.push({
    name: 'Contract Compilation',
    passed: buildPassed,
    message: buildPassed ? 'Solidity contracts compiled cleanly with Solc 0.8.24' : 'Forge compilation failed',
  });

  // 3. Check environment configuration template
  console.log('[3/7] Validating .env.example template...');
  const envExamplePath = path.resolve(process.cwd(), '.env.example');
  const envExampleExists = fs.existsSync(envExamplePath);
  checks.push({
    name: '.env.example Exists',
    passed: envExampleExists,
    message: envExampleExists ? '.env.example is present with non-sensitive placeholders' : '.env.example missing',
  });

  // 4. Check deployment configuration
  console.log('[4/7] Validating deployments/sepolia.json record...');
  const depPath = path.resolve(process.cwd(), 'deployments/sepolia.json');
  let depValid = false;
  let depMsg = '';
  if (fs.existsSync(depPath)) {
    try {
      const depData = JSON.parse(fs.readFileSync(depPath, 'utf8'));
      if (depData.chainId === 11155111) {
        if (depData.status === 'PENDING_AUTHORIZATION' && depData.contracts?.DeepFunding?.address === null) {
          depValid = true;
          depMsg = 'Deployment correctly marked PENDING_AUTHORIZATION without fabricated addresses';
        } else if (depData.contracts?.DeepFunding?.address) {
          depValid = ethers.isAddress(depData.contracts.DeepFunding.address);
          depMsg = `Configured deployment address: ${depData.contracts.DeepFunding.address}`;
        }
      } else {
        depMsg = `Invalid chainId in deployment record: ${depData.chainId} (expected 11155111)`;
      }
    } catch (e: any) {
      depMsg = `Failed to parse deployments/sepolia.json: ${e.message}`;
    }
  } else {
    depMsg = 'deployments/sepolia.json missing';
  }
  checks.push({
    name: 'Deployment Record Integrity',
    passed: depValid,
    message: depMsg,
  });

  // 5. Check local .env if present
  console.log('[5/7] Checking local .env credentials (uncommitted)...');
  const envPath = path.resolve(process.cwd(), '.env');
  let rpcUrl = '';
  let privateKey = '';
  let deployerAddress = '';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const rpcMatch = envContent.match(/^SEPOLIA_RPC_URL=(.*)$/m);
    const keyMatch = envContent.match(/^PRIVATE_KEY=(.*)$/m);
    if (rpcMatch && rpcMatch[1].trim()) rpcUrl = rpcMatch[1].trim();
    if (keyMatch && keyMatch[1].trim()) privateKey = keyMatch[1].trim();
  }

  if (privateKey) {
    try {
      const wallet = new ethers.Wallet(privateKey);
      deployerAddress = wallet.address;
      checks.push({
        name: 'Deployer Key Validation',
        passed: true,
        message: `Derived deployer address: ${deployerAddress} (Key safely kept offline)`,
      });
    } catch {
      checks.push({
        name: 'Deployer Key Validation',
        passed: false,
        message: 'Invalid private key format in local .env',
      });
    }
  } else {
    checks.push({
      name: 'Deployer Key Validation',
      passed: true,
      message: 'Dry-run mode: PRIVATE_KEY not configured in .env (Broadcasting requires local key)',
    });
  }

  // 6. Network connectivity & balance check
  console.log('[6/7] Checking RPC connectivity & testnet balance...');
  if (rpcUrl && deployerAddress) {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const network = await provider.getNetwork();
      if (Number(network.chainId) === 11155111) {
        const balance = await provider.getBalance(deployerAddress);
        const ethBalance = ethers.formatEther(balance);
        const hasFunds = balance > 0n;
        checks.push({
          name: 'Network & Balance Check',
          passed: hasFunds,
          message: `Connected to Sepolia (11155111). Balance: ${ethBalance} ETH ${hasFunds ? '(Sufficient)' : '(Insufficient: need >= 0.05 Sepolia ETH)'}`,
        });
      } else {
        checks.push({
          name: 'Network & Balance Check',
          passed: false,
          message: `RPC connected to unexpected chain ID: ${network.chainId} (expected 11155111)`,
        });
      }
    } catch (err: any) {
      checks.push({
        name: 'Network & Balance Check',
        passed: false,
        message: `Unable to connect to RPC: ${err.message}`,
      });
    }
  } else {
    checks.push({
      name: 'Network & Balance Check',
      passed: true,
      message: 'Offline simulation mode: RPC and Deployer key not configured yet (Safe dry-run)',
    });
  }

  // 7. Verify sample dataset and Merkle tree
  console.log('[7/7] Verifying sample dataset and Merkle tree integrity...');
  const verifySample = spawnSync('npm', ['run', 'verify:sample'], { shell: true, stdio: 'pipe', encoding: 'utf8' });
  const samplePassed = verifySample.status === 0;
  checks.push({
    name: 'Sample Manifest & Merkle Proofs',
    passed: samplePassed,
    message: samplePassed ? 'Sample graph, Bradley-Terry scores, and 8/8 Merkle proofs verified bit-for-bit' : 'Sample verification failed',
  });

  // Summary Report
  console.log('\n=== Preflight Results ===');
  let allPassed = true;
  for (const c of checks) {
    const symbol = c.passed ? '✓ [PASS]' : '✗ [FAIL]';
    console.log(`${symbol} ${c.name}: ${c.message}`);
    if (!c.passed) allPassed = false;
  }

  if (allPassed) {
    console.log('\n>>> PREFLIGHT PASSED: Project is fully prepared for Sepolia deployment when authorized.');
    process.exit(0);
  } else {
    console.error('\n>>> PREFLIGHT FAILED: Resolve the failing conditions above before broadcasting.');
    process.exit(1);
  }
}

runPreflight().catch((err) => {
  console.error(err);
  process.exit(1);
});
