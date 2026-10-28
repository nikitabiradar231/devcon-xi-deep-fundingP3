const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Detect forge binary
let forgeBin = 'forge';
const userHome = os.homedir();
const candidatePaths = [
  path.join(userHome, '.foundry', 'bin', os.platform() === 'win32' ? 'forge.exe' : 'forge'),
  path.join(process.env.USERPROFILE || '', '.foundry', 'bin', 'forge.exe')
];

for (const p of candidatePaths) {
  if (p && fs.existsSync(p)) {
    forgeBin = p;
    break;
  }
}

const args = process.argv.slice(2);
const result = spawnSync(forgeBin, args, {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PATH: `${path.join(userHome, '.foundry', 'bin')}${path.delimiter}${process.env.PATH || ''}`
  }
});

process.exit(result.status ?? 0);
