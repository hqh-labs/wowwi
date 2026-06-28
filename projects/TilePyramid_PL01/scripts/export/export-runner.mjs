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
  const gitBranch = await getGitBranch();
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
    reports.push(await exportOneProfile(profile, generatedAt, gitBranch));
  }

  const manifest = createExportManifest(reports, generatedAt, gitBranch);
  await writeFile(path.join(exportRoot, 'export-manifest.json'), JSON.stringify(manifest, null, 2));
  await writeFile(
    path.join(exportRoot, 'export-report.json'),
    JSON.stringify(
      {
        projectId: 'TilePyramid_PL01',
        generatedAt,
        gitBranch,
        status: reports.every(report => report.validation.status === 'PASS') ? 'PASS' : 'FAIL',
        finalApprovalGuaranteed: false,
        finalApprovalDisclaimer: 'Local BUILD-10 validation does not guarantee final Unity Ads or AppLovin approval.',
        formalSolvability: 'NOT YET PROVEN',
        exports: reports,
      },
      null,
      2
    )
  );

  if (reports.some(report => report.validation.status !== 'PASS')) {
    throw new Error('One or more exports failed validation.');
  }

  return { generatedAt, gitBranch, reports, manifest };
}

export async function exportOneProfile(profile, generatedAt, gitBranch = null) {
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
  const metadata = createNetworkExportMetadata(profile, combinedValidation, inlined.inlinedAssets, inlined.exportConfig.app);
  const report = {
    ...metadata,
    projectId: 'TilePyramid_PL01',
    outputPath: path.relative(root, outputPath).replaceAll('\\', '/'),
    generatedAt,
    gitBranch,
    validation: combinedValidation,
    qaChecks: summarizeQaChecks(combinedValidation),
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

function createExportManifest(reports, generatedAt, gitBranch) {
  return {
    projectId: 'TilePyramid_PL01',
    generatedAt,
    gitBranch,
    outputRoot: 'exports/latest',
    networks: reports.map(report => ({
      network: report.network,
      profileId: report.profileId,
      outputPath: report.outputPath,
      status: report.status,
      actualBytes: report.actualBytes,
      targetMaxBytes: report.targetMaxBytes,
      finalApprovalDisclaimer: report.finalApprovalDisclaimer,
      storeUrls: report.storeUrls,
    })),
    formalSolvability: 'NOT YET PROVEN',
    finalApprovalGuaranteed: false,
    finalApprovalDisclaimer: 'Local BUILD-10 validation does not guarantee final Unity Ads or AppLovin approval.',
  };
}

function summarizeQaChecks(validation) {
  return {
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
    visualBoot: validation.visual?.status === 'PASS',
    portrait: validation.visual?.details?.portrait?.canvasVisible === true,
    landscape: validation.visual?.details?.landscape?.centeredX === true,
    storeOpen: validation.visual?.details?.storeOpen?.methodUsed === 'record-only',
    formalSolvability: validation.checks.formalSolvabilityNotProven,
    finalApprovalDisclaimer: validation.checks.finalApprovalDisclaimerPresent,
  };
}

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
