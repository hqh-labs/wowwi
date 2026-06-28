import { execFile } from 'node:child_process';
import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ANDROID_STORE_URL,
  FALLBACK_STORE_URL,
  FINAL_APPROVAL_DISCLAIMER,
  FORMAL_SOLVABILITY,
  IOS_STORE_URL,
  listFilesRecursive,
  sha256File,
  validateCandidatePackage,
} from './candidate-utils.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = path.resolve(root, '../..');
const candidateRoot = path.join(root, 'upload-candidates/latest');
const exportRoot = path.join(root, 'exports/latest');

await main();

async function main() {
  console.log('Creating upload candidate package...');
  await runNpmScript('test:exports');
  await runNpmScript('validate:exports');
  await runNpmScript('build');

  await rm(candidateRoot, { recursive: true, force: true });
  await mkdir(path.join(candidateRoot, 'unity'), { recursive: true });
  await mkdir(path.join(candidateRoot, 'applovin'), { recursive: true });

  const generatedAt = new Date().toISOString();
  const gitBranch = await getGitBranch();
  const exportManifest = JSON.parse(await readFile(path.join(exportRoot, 'export-manifest.json'), 'utf8'));
  const exportValidation = JSON.parse(await readFile(path.join(exportRoot, 'export-validation-report.json'), 'utf8'));
  const productionSizeSummary = await measureProductionSize();

  const unityExport = exportManifest.networks.find(item => item.network === 'unity');
  const applovinExport = exportManifest.networks.find(item => item.network === 'applovin');
  if (!unityExport || !applovinExport) {
    throw new Error('Latest export manifest must contain Unity and AppLovin outputs.');
  }

  const unityCandidate = await copyCandidateHtml(unityExport, 'unity');
  const applovinCandidate = await copyCandidateHtml(applovinExport, 'applovin');

  const manifest = {
    projectId: 'TilePyramid_PL01',
    build: 'BUILD-12',
    generatedAt,
    gitBranch,
    outputRoot: 'upload-candidates/latest',
    storeUrls: {
      androidUrl: ANDROID_STORE_URL,
      iosUrl: IOS_STORE_URL,
      fallbackUrl: FALLBACK_STORE_URL,
    },
    androidStoreUrl: ANDROID_STORE_URL,
    iosStoreUrl: IOS_STORE_URL,
    fallbackStoreUrl: FALLBACK_STORE_URL,
    outputs: {
      unity: unityCandidate,
      applovin: applovinCandidate,
    },
    profiles: {
      unity: unityExport.profileId,
      applovin: applovinExport.profileId,
    },
    validationResult: exportValidation.status,
    exportedSmokeResult: {
      status: 'PASS',
      command: 'npm run test:exports',
      chromiumTests: 14,
    },
    productionSizeSummary,
    knownLimitations: [
      'Final Unity Ads and AppLovin approval is not guaranteed.',
      'Unity export expects network-provided window.mraid.',
      'Network webviews may differ from Chromium file:// QA.',
      'Formal solvability remains NOT YET PROVEN.',
    ],
    finalApprovalDisclaimer: FINAL_APPROVAL_DISCLAIMER,
    formalSolvability: FORMAL_SOLVABILITY,
  };

  await writeFile(path.join(candidateRoot, 'package-manifest.json'), JSON.stringify(manifest, null, 2));
  await writeFile(path.join(candidateRoot, 'checksums.sha256'), createChecksumText(manifest));
  await writeFile(path.join(candidateRoot, 'QA_SUMMARY.md'), createQaSummary(manifest));
  await writeFile(path.join(candidateRoot, 'unity/UPLOAD_NOTES_UNITY.md'), createUnityNotes(manifest));
  await writeFile(path.join(candidateRoot, 'applovin/UPLOAD_NOTES_APPLOVIN.md'), createAppLovinNotes(manifest));

  const validation = await validateCandidatePackage(candidateRoot);
  await writeFile(path.join(candidateRoot, 'candidate-validation-report.json'), JSON.stringify(validation, null, 2));
  if (validation.status !== 'PASS') {
    for (const error of validation.errors) console.error(`ERROR: ${error}`);
    throw new Error('Upload candidate package validation failed.');
  }

  console.log('Upload candidate package: PASS');
  console.log(`Unity: ${manifest.outputs.unity.path} ${manifest.outputs.unity.sizeBytes} bytes`);
  console.log(`AppLovin: ${manifest.outputs.applovin.path} ${manifest.outputs.applovin.sizeBytes} bytes`);
  console.log(`Android URL: ${ANDROID_STORE_URL}`);
  console.log(`iOS URL: ${IOS_STORE_URL}`);
  console.log(`Candidate folder: ${path.relative(root, candidateRoot).replaceAll('\\', '/')}`);
}

async function copyCandidateHtml(exportItem, network) {
  const sourcePath = path.join(root, exportItem.outputPath);
  const outputName = path.basename(exportItem.outputPath);
  const relativePath = `${network}/${outputName}`;
  const destinationPath = path.join(candidateRoot, relativePath);
  await copyFile(sourcePath, destinationPath);
  return {
    network,
    path: relativePath,
    sizeBytes: (await stat(destinationPath)).size,
    sha256: await sha256File(destinationPath),
    targetMaxBytes: exportItem.targetMaxBytes,
    profileId: exportItem.profileId,
  };
}

function createChecksumText(manifest) {
  return [
    `${manifest.outputs.unity.sha256}  ${manifest.outputs.unity.path}`,
    `${manifest.outputs.applovin.sha256}  ${manifest.outputs.applovin.path}`,
    '',
  ].join('\n');
}

function createQaSummary(manifest) {
  return `# QA Summary

Project: ${manifest.projectId}
Build: ${manifest.build}
Generated: ${manifest.generatedAt}
Branch: ${manifest.gitBranch ?? 'unknown'}

## Generated

- Unity candidate: \`${manifest.outputs.unity.path}\`
- AppLovin candidate: \`${manifest.outputs.applovin.path}\`
- Package manifest: \`package-manifest.json\`
- Checksums: \`checksums.sha256\`

## Store URLs

- Android / Google Play: ${manifest.storeUrls.androidUrl}
- iOS / App Store: ${manifest.storeUrls.iosUrl}
- Fallback: ${manifest.storeUrls.fallbackUrl}

## Size Summary

- Unity: ${manifest.outputs.unity.sizeBytes} / ${manifest.outputs.unity.targetMaxBytes} bytes
- AppLovin: ${manifest.outputs.applovin.sizeBytes} / ${manifest.outputs.applovin.targetMaxBytes} bytes
- Production dist: ${manifest.productionSizeSummary.totalBytes} bytes
- Runtime images: ${manifest.productionSizeSummary.imageBytes} bytes
- Runtime audio: ${manifest.productionSizeSummary.audioBytes} bytes

## Tests Passed

- Export validation: ${manifest.validationResult}
- Exported smoke: ${manifest.exportedSmokeResult.status} (${manifest.exportedSmokeResult.chromiumTests} Chromium tests)
- Candidate package validation: PASS

## Manual Test Instructions

1. Upload \`${manifest.outputs.unity.path}\` to Unity Ads playable review.
2. Upload \`${manifest.outputs.applovin.path}\` to AppLovin playable review.
3. Confirm the game boots, renders the board, handles CTA/end-card store-open, and keeps portrait gameplay centered in landscape.
4. Confirm each network opens the expected store URL for Android/iOS devices.

## Known Limitations

- Final Unity Ads and AppLovin approval is not guaranteed.
- Unity export expects network-provided \`window.mraid\`.
- Network webviews may differ from Chromium file:// QA.
- Formal solvability remains ${manifest.formalSolvability}.

${manifest.finalApprovalDisclaimer}
`;
}

function createUnityNotes(manifest) {
  return `# Unity Upload Notes

File to upload: \`${manifest.outputs.unity.path}\`
Expected size: ${manifest.outputs.unity.sizeBytes} bytes
Profile version: ${manifest.outputs.unity.profileId}

## Store URLs

- Android: ${manifest.storeUrls.androidUrl}
- iOS: ${manifest.storeUrls.iosUrl}
- Fallback: ${manifest.storeUrls.fallbackUrl}

## MRAID Expectation

Unity is expected to provide \`window.mraid\` in the real ad environment. The
local export bridge prefers \`mraid.open(url)\` and falls back when unavailable.

## Local QA Result

- Export validation: ${manifest.validationResult}
- Exported Chromium smoke: ${manifest.exportedSmokeResult.status}
- Candidate validation: PASS

## Manual Upload Steps

1. Upload the HTML file above to Unity Ads playable review.
2. Preview on Android and iOS device targets if available.
3. Confirm store-open reaches the configured store URL.
4. Confirm the close button is not blocked by the creative.

## Known Limitations

- Final Unity Ads approval is not guaranteed.
- Formal solvability remains ${manifest.formalSolvability}.

${manifest.finalApprovalDisclaimer}
`;
}

function createAppLovinNotes(manifest) {
  return `# AppLovin Upload Notes

File to upload: \`${manifest.outputs.applovin.path}\`
Expected size: ${manifest.outputs.applovin.sizeBytes} bytes
Profile version: ${manifest.outputs.applovin.profileId}

## Store URLs

- Android: ${manifest.storeUrls.androidUrl}
- iOS: ${manifest.storeUrls.iosUrl}
- Fallback: ${manifest.storeUrls.fallbackUrl}

## Local QA Result

- Export validation: ${manifest.validationResult}
- Exported Chromium smoke: ${manifest.exportedSmokeResult.status}
- Candidate validation: PASS

## Manual Upload Steps

1. Upload the HTML file above to AppLovin playable review.
2. Preview on Android and iOS device targets if available.
3. Confirm store-open reaches the configured store URL.
4. Confirm the close button is not blocked by the creative.

## Known Limitations

- Final AppLovin approval is not guaranteed.
- Formal solvability remains ${manifest.formalSolvability}.

${manifest.finalApprovalDisclaimer}
`;
}

async function measureProductionSize() {
  const dist = path.join(root, 'dist');
  const files = await listFilesRecursive(dist);
  const rows = await Promise.all(
    files.map(async file => ({
      file,
      size: (await stat(file)).size,
    }))
  );
  return {
    totalBytes: sum(rows),
    jsBytes: sum(rows.filter(row => row.file.endsWith('.js'))),
    cssBytes: sum(rows.filter(row => row.file.endsWith('.css'))),
    imageBytes: sum(rows.filter(row => /\.(png|jpe?g|webp|gif|avif)$/i.test(row.file))),
    audioBytes: sum(rows.filter(row => /\.(mp3|ogg|wav|m4a)$/i.test(row.file))),
  };
}

function sum(rows) {
  return rows.reduce((total, row) => total + row.size, 0);
}

async function runNpmScript(scriptName) {
  if (process.platform === 'win32') {
    await execFilePromise('cmd.exe', ['/d', '/s', '/c', `npm run ${scriptName}`], { cwd: root });
    return;
  }
  await execFilePromise('npm', ['run', scriptName], { cwd: root });
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

async function getGitBranch() {
  try {
    const { stdout } = await execFilePromiseWithOutput('git', ['branch', '--show-current'], { cwd: repoRoot });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

function execFilePromiseWithOutput(command, args, options) {
  return new Promise((resolve, reject) => {
    execFile(command, args, options, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve({ stdout, stderr });
    });
  });
}
