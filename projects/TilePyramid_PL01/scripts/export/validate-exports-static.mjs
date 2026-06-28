/**
 * BUILD-17 Static export validation (no visual/Playwright).
 *
 * Reads the export manifest and runs static structural checks on each HTML.
 * Does NOT import export-visual-validator.mjs. Safe for Vercel.
 *
 * Usage: node scripts/export/validate-exports-static.mjs
 * Root shortcut: npm run validate:exports:static (from projects/TilePyramid_PL01)
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getExportProfile, listExportProfiles } from './profiles/profiles.mjs';
import { validateExportFile } from './validators/export-validator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifestPath = path.join(root, 'exports/latest/export-manifest.json');

try {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const missingProfiles = listExportProfiles().filter(
    profile => !manifest.networks?.some(item => item.profileId === profile.id)
  );
  if (missingProfiles.length > 0) {
    throw new Error(
      `Export manifest is missing profiles: ${missingProfiles.map(p => p.id).join(', ')}`
    );
  }
  const validations = [];
  for (const expectedProfile of listExportProfiles()) {
    const item = manifest.networks.find(candidate => candidate.profileId === expectedProfile.id);
    if (!item) throw new Error(`Export manifest is missing ${expectedProfile.id}.`);
    const profile = getExportProfile(item.profileId);
    const outputPath = path.join(root, item.outputPath);
    const validation = await validateExportFile({
      filePath: outputPath,
      html: await readFile(outputPath, 'utf8'),
      profile,
    });
    validations.push(validation);
  }
  const report = {
    generatedAt: new Date().toISOString(),
    projectId: 'TilePyramid_PL01',
    mode: 'static-only',
    formalSolvability: 'NOT YET PROVEN',
    status: validations.every(v => v.status === 'PASS') ? 'PASS' : 'FAIL',
    validations,
  };
  await writeFile(
    path.join(root, 'exports/latest/export-static-validation-report.json'),
    JSON.stringify(report, null, 2)
  );
  printSummary(report);
  if (report.status !== 'PASS') process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function printSummary(report) {
  console.log(`Export static validation: ${report.status}`);
  for (const v of report.validations) {
    console.log(
      `  ${v.network}: ${v.filePath}  ${v.actualBytes}/${v.targetMaxBytes} bytes  ${v.status}`
    );
    for (const w of v.warnings) console.log(`  WARNING: ${w}`);
    for (const e of v.errors) console.log(`  ERROR: ${e}`);
  }
}
