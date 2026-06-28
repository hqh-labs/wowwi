/**
 * BUILD-17 Vercel-safe exporter.
 *
 * Exports Unity and AppLovin HTML using Vite build + static validation only.
 * Does NOT import export-runner.mjs or export-visual-validator.mjs.
 * No Playwright, no Chromium, no browser. Safe for Vercel's build environment.
 *
 * Usage: node scripts/export/export-vercel.mjs
 * Root shortcut: npm run export:all:static (from projects/TilePyramid_PL01)
 */

import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inlineSingleFileHtml } from './inliner/single-file-inliner.mjs';
import { createNetworkExportMetadata } from './adapters/network-adapters.mjs';
import { getExportProfile, listExportProfiles } from './profiles/profiles.mjs';
import { validateExportFile } from './validators/export-validator.mjs';
// validateExportVisualFile is intentionally NOT imported — @playwright/test unavailable on Vercel

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const distDir = path.join(root, 'dist');
const publicDir = path.join(root, 'public');
const exportRoot = path.join(root, 'exports/latest');
const IS_WIN = process.platform === 'win32';

// ─── vite build ───────────────────────────────────────────────────────────────

async function runBuildForExport() {
  if (IS_WIN) {
    await execFilePromise('cmd.exe', ['/d', '/s', '/c', 'npm run build -- --mode export'], { cwd: root });
    return;
  }
  await execFilePromise('npm', ['run', 'build', '--', '--mode', 'export'], { cwd: root });
}

// ─── per-profile export ───────────────────────────────────────────────────────

async function exportOneProfileStatic(profile, generatedAt, gitBranch) {
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
  // Visual validation skipped — no Playwright on Vercel
  const visualStub = { status: 'SKIPPED', errors: [], warnings: [], details: {} };
  const combinedValidation = {
    ...validation,
    visual: visualStub,
  };
  const metadata = createNetworkExportMetadata(
    profile, combinedValidation, inlined.inlinedAssets, inlined.exportConfig.app
  );
  const report = {
    ...metadata,
    projectId: 'TilePyramid_PL01',
    outputPath: path.relative(root, outputPath).replaceAll('\\', '/'),
    generatedAt,
    gitBranch,
    validation: combinedValidation,
    qaChecks: {
      size: validation.checks.underTargetMaxBytes,
      externalResources: validation.checks.noExternalHttpAssetReferences,
      localReferences: validation.checks.noLocalRuntimeAssetReferences,
      singleHtml: validation.checks.singleHtmlFile,
      sourceMaps: validation.checks.noSourceMapReferences,
      unInlinedJsCss: validation.checks.noUninlinedJsOrCssReferences,
      unresolvedPlaceholders: validation.checks.noUnresolvedPlaceholders,
      networkMetadata: validation.checks.profileMetadataPresent,
      storeOpenBridge: validation.checks.storeOpenBridgePresent,
      storeOpenDiagnostics: validation.checks.storeOpenDiagnosticsPresent,
      mraidRequirement: validation.checks.networkProvidedMraidRecorded,
      orientation: validation.checks.orientationPolicyPresent,
      timerFirstInteraction: validation.checks.timerFirstInteractionPolicyPresent,
      hostCloseButtonSafeZone: validation.checks.hostCloseButtonSafeZonePresent,
      visualBoot: false,
      portrait: false,
      landscape: false,
      storeOpen: false,
      formalSolvability: validation.checks.formalSolvabilityNotProven,
      finalApprovalDisclaimer: validation.checks.finalApprovalDisclaimerPresent,
    },
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

// ─── full export ──────────────────────────────────────────────────────────────

async function exportProfilesStatic() {
  const generatedAt = new Date().toISOString();
  const gitBranch = await getGitBranch();
  await rm(exportRoot, { recursive: true, force: true });
  await mkdir(exportRoot, { recursive: true });
  await runBuildForExport();

  const reports = [];
  for (const profileId of listExportProfiles().map(p => p.id)) {
    const profile = getExportProfile(profileId);
    reports.push(await exportOneProfileStatic(profile, generatedAt, gitBranch));
  }

  const manifest = {
    projectId: 'TilePyramid_PL01',
    generatedAt,
    gitBranch,
    outputRoot: 'exports/latest',
    networks: reports.map(r => ({
      network: r.network,
      profileId: r.profileId,
      outputPath: r.outputPath,
      status: r.status,
      actualBytes: r.actualBytes,
      targetMaxBytes: r.targetMaxBytes,
      finalApprovalDisclaimer: r.finalApprovalDisclaimer,
      storeUrls: r.storeUrls,
    })),
    formalSolvability: 'NOT YET PROVEN',
    finalApprovalGuaranteed: false,
    finalApprovalDisclaimer:
      'Local BUILD-10 validation does not guarantee final Unity Ads or AppLovin approval.',
  };

  await writeFile(
    path.join(exportRoot, 'export-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  await writeFile(
    path.join(exportRoot, 'export-report.json'),
    JSON.stringify(
      {
        projectId: 'TilePyramid_PL01',
        generatedAt,
        gitBranch,
        mode: 'static-only',
        status: reports.every(r => r.validation.status === 'PASS') ? 'PASS' : 'FAIL',
        finalApprovalGuaranteed: false,
        finalApprovalDisclaimer:
          'Local BUILD-10 validation does not guarantee final Unity Ads or AppLovin approval.',
        formalSolvability: 'NOT YET PROVEN',
        exports: reports,
      },
      null,
      2
    )
  );

  if (reports.some(r => r.validation.status !== 'PASS')) {
    throw new Error('One or more exports failed static validation.');
  }

  return { generatedAt, gitBranch, reports, manifest };
}

// ─── helpers ──────────────────────────────────────────────────────────────────

async function getGitBranch() {
  try {
    const { stdout } = await execFilePromiseWithOutput('git', ['branch', '--show-current'], {
      cwd: path.resolve(root, '../..'),
    });
    return stdout.trim() || null;
  } catch {
    return null;
  }
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

function execFilePromiseWithOutput(command, args, options) {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve({ stdout, stderr });
    });
  });
}

// ─── entry point ──────────────────────────────────────────────────────────────

try {
  const result = await exportProfilesStatic();
  console.log('Export summary (static-only — visual validation skipped):');
  for (const report of result.reports) {
    console.log(
      `  ${report.network}: ${report.outputPath}  ${report.actualBytes}/${report.targetMaxBytes} bytes  ${report.validation.status}`
    );
    for (const w of report.validation.warnings) console.log(`  WARNING: ${w}`);
    for (const e of report.validation.errors) console.log(`  ERROR: ${e}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
