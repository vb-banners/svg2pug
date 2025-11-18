#!/usr/bin/env node
const { spawnSync } = require('child_process');
const { existsSync, rmSync, renameSync, readdirSync, copyFileSync, mkdirSync, readFileSync, writeFileSync } = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

const buildPath = path.join(projectRoot, 'build');
const docsPath = path.join(projectRoot, 'docs');
const legacyDocsPath = path.join(projectRoot, '.legacy-docs');

if (existsSync(buildPath)) {
  rmSync(buildPath, { recursive: true, force: true });
}

// Keep the previous docs build around temporarily so we can preserve legacy assets
if (existsSync(legacyDocsPath)) {
  rmSync(legacyDocsPath, { recursive: true, force: true });
}

if (existsSync(docsPath)) {
  renameSync(docsPath, legacyDocsPath);
}

const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const result = spawnSync(npxCommand, ['react-scripts', 'build'], {
  cwd: projectRoot,
  stdio: 'inherit'
});

if (result.status !== 0) {
  process.exit(result.status != null ? result.status : 1);
}

if (!existsSync(buildPath)) {
  console.error('Expected build directory was not created.');
  process.exit(1);
}

renameSync(buildPath, docsPath);

// Add cache busting to index.html
const indexPath = path.join(docsPath, 'index.html');
if (existsSync(indexPath)) {
  try {
    let indexContent = readFileSync(indexPath, 'utf8');
    const timestamp = Date.now();
    
    // Add timestamp to external scripts to force reload on new builds
    indexContent = indexContent.replace(/src="([^"]*\/)?pug\.js"/g, `src="$1pug.js?v=${timestamp}"`);
    indexContent = indexContent.replace(/src="([^"]*\/)?he\.js"/g, `src="$1he.js?v=${timestamp}"`);
    indexContent = indexContent.replace(/src="([^"]*\/)?html-to-jade\.js"/g, `src="$1html-to-jade.js?v=${timestamp}"`);
    
    writeFileSync(indexPath, indexContent);
    console.log('Added cache busting timestamps to index.html');
  } catch (e) {
    console.error('Failed to add cache busting to index.html:', e);
  }
}

const copyLegacyAssets = (from, to) => {
  if (!existsSync(from)) return;
  const entries = readdirSync(from, { withFileTypes: true });
  if (!existsSync(to)) {
    mkdirSync(to, { recursive: true });
  }
  for (const entry of entries) {
    const sourcePath = path.join(from, entry.name);
    const targetPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyLegacyAssets(sourcePath, targetPath);
    } else if (!existsSync(targetPath)) {
      copyFileSync(sourcePath, targetPath);
    }
  }
};

// Preserve old hashed chunks (JS/CSS) so previously loaded clients don't 404
copyLegacyAssets(path.join(legacyDocsPath, 'static/js'), path.join(docsPath, 'static/js'));
copyLegacyAssets(path.join(legacyDocsPath, 'static/css'), path.join(docsPath, 'static/css'));
copyLegacyAssets(path.join(legacyDocsPath, 'static/media'), path.join(docsPath, 'static/media'));

if (existsSync(legacyDocsPath)) {
  rmSync(legacyDocsPath, { recursive: true, force: true });
}

console.log('Moved build output to docs/. Preserved legacy assets for cache safety.');
