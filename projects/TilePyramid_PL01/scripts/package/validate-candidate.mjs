import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFile } from 'node:fs/promises';
import { validateCandidatePackage } from './candidate-utils.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const candidateRoot = path.join(root, 'upload-candidates/latest');

const validation = await validateCandidatePackage(candidateRoot);
await writeFile(path.join(candidateRoot, 'candidate-validation-report.json'), JSON.stringify(validation, null, 2)).catch(
  () => {}
);

console.log(`Candidate validation: ${validation.status}`);
for (const warning of validation.warnings) console.log(`  WARNING: ${warning}`);
for (const error of validation.errors) console.log(`  ERROR: ${error}`);

if (validation.status !== 'PASS') {
  process.exitCode = 1;
}
