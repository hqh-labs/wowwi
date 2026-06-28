import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inlineSingleFileHtml } from './inliner/single-file-inliner.mjs';
import { createNetworkExportMetadata } from './adapters/network-adapters.mjs';
import { getExportProfile, listExportProfiles } from './profiles/profiles.mjs';
import { validateExportFile } from './validators/export-validator.mjs';
import { validateExportVisualFile } from './validators/export-visual-validator.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const distDir = path.join(root, 'dist');
const publicDir = path.join(root, 'public');
const exportRoot = path.join(root, 'exports/latest');

export async function runBuildForExport() {
  if (process.platform === 'win32') {
    await execFilePromise('cmd.exe', ['/d', '/s', '/c', 'npm run build -- --mode export'], { cwd: root });
    return;
  }
  await execFilePromise('npm', ['run', 'build', '--', '--mode', 'export'], { cwd: root });
}

export async function exportProfiles(profileIds = listExportProfiles().map(profile => profile.id), options = {}) {
  const generatedAt = new Date().toISOString();
  if (options.clean !== false) {
    await rm(exportRoot, { recursive: true, force: true });
  }
  await mkdir(exportRoot, { recursive: true });
  if (options.build !== false) {
    await runBuildForExport();
  }

  const reports = [];
  for (const profileId of profileIds) {
    const profile = getExportProfile(profileId);
    reports.push(await exportOneProfile(profile, generatedAt));
  }

  const manifest = createExportManifest(reports, generatedAt);
  await writeFile(path.join(exportRoot, 'export-manifest.json'), JSON.stringify(manifest, null, 2));
  await writeFile(path.join(exportRoot, 'export-report.json'), JSON.stringify({ generatedAt, exports: reports }, null, 2));

  if (reports.some(report => report.validation.status !== 'PASS')) {
    throw new Error('One or more exports failed validation.');
  }

  return { generatedAt, reports, manifest };
}

export async function exportOneProfile(profile, generatedAt) {
  const outputDir = path.join(exportRoot, profile.network);
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, profile.outputFileName);
  const inlined = await inlineSingleFileHtml({ distDir, publicDir, profile, generatedAt });
  await writeFile(outputPath, inlined.html);
  const validation = await validateExportFile({
    filePath: outputPath,
    html: await readFile(outputPath, 'utf8'),
    profile,
  });
  const visualValidation = await validateExportVisualFile({
    filePath: outputPath,
    network: profile.network,
    screenshotPath: path.join(outputDir, 'visual-smoke.png'),
  });
  const combinedValidation = {
    ...validation,
    status: validation.status === 'PASS' && visualValidation.status === 'PASS' ? 'PASS' : 'FAIL',
    errors: [...validation.errors, ...visualValidation.errors],
    warnings: [...validation.warnings, ...visualValidation.warnings],
    visual: visualValidation,
  };
  const metadata = createNetworkExportMetadata(profile, combinedValidation, inlined.inlinedAssets);
  const report = {
    ...metadata,
    outputPath: path.relative(root, outputPath).replaceAll('\\', '/'),
    generatedAt,
    validation: combinedValidation,
    inlinedAssets: inlined.inlinedAssets,
    buildInput: {
      distIndex: 'dist/index.html',
      buildMode: 'vite --mode export',
      sourceIndex: path.relative(root, inlined.sourceIndex).replaceAll('\\', '/'),
    },
  };
  await writeFile(path.join(outputDir, 'export-report.json'), JSON.stringify(report, null, 2));
  return report;
}

function createExportManifest(reports, generatedAt) {
  return {
    projectId: 'TilePyramid_PL01',
    generatedAt,
    outputRoot: 'exports/latest',
    networks: reports.map(report => ({
      network: report.network,
      profileId: report.profileId,
      outputPath: report.outputPath,
      status: report.status,
      actualBytes: report.actualBytes,
      targetMaxBytes: report.targetMaxBytes,
    })),
    formalSolvability: 'NOT YET PROVEN',
    finalApprovalGuaranteed: false,
  };
}

function execFilePromise(command, args, options) {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
      if (error) reject(error);
      else resolve();
    });
  });
}
