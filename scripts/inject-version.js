#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read package.json to get version
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const version = packageJson.version;
const buildDate = new Date().toISOString();

// Read the built index.html (check both possible locations)
let indexPath = path.join(__dirname, '../dist/public/index.html');
if (!fs.existsSync(indexPath)) {
  indexPath = path.join(__dirname, '../dist/index.html');
}
let htmlContent = fs.readFileSync(indexPath, 'utf8');

// Update the version script in the HTML
const versionScriptRegex = /window\.CBLIX2_VERSION = '[^']+'/;
const buildDateRegex = /window\.CBLIX2_BUILD_DATE = '[^']+'/;

htmlContent = htmlContent
  .replace(versionScriptRegex, `window.CBLIX2_VERSION = '${version}'`)
  .replace(buildDateRegex, `window.CBLIX2_BUILD_DATE = '${buildDate}'`);

// Write back
fs.writeFileSync(indexPath, htmlContent);

console.log(`✅ Injected version ${version} and build date ${buildDate}`);