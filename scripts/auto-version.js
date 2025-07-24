#!/usr/bin/env node
// @ts-check
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Parse current version
const currentVersion = packageJson.version;
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Increment patch version
const newVersion = `${major}.${minor}.${patch + 1}`;

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`✅ Version updated: ${currentVersion} → ${newVersion}`);

// Also update version in any other files that need it
const filesToUpdate = [
  {
    path: path.join(__dirname, '..', 'public', 'manifest.json'),
    key: 'version'
  }
];

filesToUpdate.forEach(file => {
  if (fs.existsSync(file.path)) {
    try {
      const content = JSON.parse(fs.readFileSync(file.path, 'utf8'));
      content[file.key] = newVersion;
      fs.writeFileSync(file.path, JSON.stringify(content, null, 2) + '\n');
      console.log(`✅ Updated ${path.basename(file.path)}`);
    } catch (e) {
      console.warn(`⚠️  Could not update ${file.path}: ${e.message}`);
    }
  }
});

// Export for use in other scripts
export default newVersion;