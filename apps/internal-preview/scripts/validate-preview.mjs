/**
 * BUILD-15 Preview Validator CLI
 *
 * Usage: node apps/internal-preview/scripts/validate-preview.mjs
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePreviewDist } from './validate-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(HERE, '..');
const DIST = path.join(APP_ROOT, 'dist');

console.log('\nWowwi Preview Validator — BUILD-15');
console.log('─'.repeat(50));

const result = await validatePreviewDist(DIST);

const checks = [
  'dist/index.html exists',
  'dist/preview-data.json exists',
  'dist/projects/TilePyramid_PL01/index.html exists',
  'dist/projects/TilePyramid_PL01/unity.html exists',
  'dist/projects/TilePyramid_PL01/applovin.html exists',
  'preview-data contains Android store URL',
  'preview-data contains iOS store URL',
  'preview-data formal solvability is NOT YET PROVEN',
  'preview-data contains Unity checksum',
  'preview-data contains AppLovin checksum',
  'dist does not contain project-input',
  'Unity preview HTML has no forbidden window.top',
  'AppLovin preview HTML has no forbidden window.top',
];

for (const check of checks) {
  const failed = result.errors.some(e =>
    e.toLowerCase().includes(check.replace(/dist\//g, '').toLowerCase().slice(0, 20))
  );
  console.log(`  ${failed ? 'FAIL' : 'PASS'}  ${check}`);
}

console.log('');
if (result.pass) {
  console.log('Preview validation: PASS\n');
} else {
  console.log(`Preview validation: FAIL\n`);
  for (const e of result.errors) console.log(`  ERROR: ${e}`);
  console.log('');
  process.exitCode = 1;
}
