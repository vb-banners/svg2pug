#!/usr/bin/env node
const { spawnSync } = require('child_process');
const { existsSync, rmSync, renameSync } = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const result = spawnSync(npxCommand, ['react-scripts', 'build'], {
  cwd: projectRoot,
  stdio: 'inherit'
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const buildPath = path.join(projectRoot, 'build');
const docsPath = path.join(projectRoot, 'docs');

if (!existsSync(buildPath)) {
  console.error('Expected build directory was not created.');
  process.exit(1);
}

if (existsSync(docsPath)) {
  rmSync(docsPath, { recursive: true, force: true });
}

renameSync(buildPath, docsPath);

console.log('Moved build output to docs/.');
