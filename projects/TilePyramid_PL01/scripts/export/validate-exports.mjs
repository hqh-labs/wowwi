import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getExportProfile } from './profiles/profiles.mjs';
import { validateExportFile } from './validators/export-validator.mjs';
import { validateExportVisualFile } from './validators/export-visual-validator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifestPath = path.join(root, 'exports/latest/export-manifest.json');

try {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const validations = [];
  for (const item of manifest.networks) {
    const profile = getExportProfile(item.profileId);
    const outputPath = path.join(root, item.outputPath);
    const staticValidation = await validateExportFile({
      filePath: outputPath,
      html: await readFile(outputPath, 'utf8'),
      profile,
    });
    const visualValidation = await validateExportVisualFile({
      filePath: outputPath,
      network: profile.network,
      screenshotPath: path.join(root, `exports/latest/${profile.network}/visual-smoke.png`),
    });
    validations.push({
      ...staticValidation,
      status: staticValidation.status === 'PASS' && visualValidation.status === 'PASS' ? 'PASS' : 'FAIL',
      errors: [...staticValidation.errors, ...visualValidation.errors],
      warnings: [...staticValidation.warnings, ...visualValidation.warnings],
      visual: visualValidation,
    });
  }
  const report = {
    generatedAt: new Date().toISOString(),
    status: validations.every(validation => validation.status === 'PASS') ? 'PASS' : 'FAIL',
    validations,
  };
  await writeFile(path.join(root, 'exports/latest/export-validation-report.json'), JSON.stringify(report, null, 2));
  printSummary(report);
  if (report.status !== 'PASS') process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function printSummary(report) {
  console.log(`Export validation: ${report.status}`);
  for (const validation of report.validations) {
    console.log(
      `${validation.network}: ${validation.filePath} ${validation.actualBytes}/${validation.targetMaxBytes} bytes ${validation.status}`
    );
    for (const warning of validation.warnings) console.log(`  WARNING: ${warning}`);
    for (const error of validation.errors) console.log(`  ERROR: ${error}`);
  }
}
