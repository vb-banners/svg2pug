#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const svgoPath = path.join(__dirname, '../node_modules/svgo/dist/svgo.browser.js');
const outputPath = path.join(__dirname, '../src/vendor/svgo-browser.esm.js');

console.log('Building SVGO browser bundle...');
console.log('Source:', svgoPath);

if (!fs.existsSync(svgoPath)) {
  console.error('Error: SVGO browser build not found at', svgoPath);
  console.log('Checking for alternative locations...');

  // Check if there's a different location
  const altPath = path.join(__dirname, '../node_modules/svgo/dist/svgo.js');
  if (fs.existsSync(altPath)) {
    console.log('Found alternative at:', altPath);
    const content = fs.readFileSync(altPath, 'utf8');
    fs.writeFileSync(outputPath, content);
    console.log('SVGO browser bundle copied successfully!');
    console.log('Output:', outputPath);
  } else {
    console.error('Could not find SVGO dist file');
    process.exit(1);
  }
} else {
  const content = fs.readFileSync(svgoPath, 'utf8');
  fs.writeFileSync(outputPath, content);
  console.log('SVGO browser bundle copied successfully!');
  console.log('Output:', outputPath);
}
