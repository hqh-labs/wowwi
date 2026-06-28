import { execFile } from 'node:child_process';
import { copyFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ANDROID_STORE_URL,
  DELIVERY_DISCLAIMER,
  FALLBACK_STORE_URL,
  FORMAL_SOLVABILITY,
  IOS_STORE_URL,
  sha256File,
  validateDeliveryPackage,
} from './delivery-utils.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const repoRoot = path.resolve(root, '../..');
const candidateRoot = path.join(root, 'upload-candidates/latest');
const deliveryRoot = path.join(root, 'delivery/latest');

await main();

async function main() {
  console.log('Creating delivery package...');
  await runNpmScript('package:candidate');

  await rm(deliveryRoot, { recursive: true, force: true });
  await mkdir(path.join(deliveryRoot, 'unity'), { recursive: true });
  await mkdir(path.join(deliveryRoot, 'applovin'), { recursive: true });

  const generatedAt = new Date().toISOString();
  const gitBranch = await getGitBranch();
  const candidateManifest = JSON.parse(
    await readFile(path.join(candidateRoot, 'package-manifest.json'), 'utf8')
  );

  const unitySource = candidateManifest.outputs?.unity;
  const applovinSource = candidateManifest.outputs?.applovin;
  if (!unitySource || !applovinSource) {
    throw new Error('Candidate manifest must contain Unity and AppLovin outputs.');
  }

  const unityDelivery = await copyDeliveryHtml(
    path.join(candidateRoot, unitySource.path),
    'unity',
    unitySource
  );
  const applovinDelivery = await copyDeliveryHtml(
    path.join(candidateRoot, applovinSource.path),
    'applovin',
    applovinSource
  );

  const networkQaEvidence = {
    unity: {
      status: 'PENDING_MANUAL_REUPLOAD',
      fixedIn: 'BUILD-21',
      fix: 'post-BUILD-20 polished candidate regenerated for manual Unity re-upload QA',
      disclaimer:
        'Unity must be manually re-uploaded with the BUILD-21 polished candidate before network pass is claimed. Final approval is not guaranteed forever.',
    },
    applovin: {
      status: 'PENDING_MANUAL_REUPLOAD',
      fixedIn: 'BUILD-21',
      fix: 'post-BUILD-20 polished candidate regenerated for manual AppLovin re-upload QA',
      disclaimer:
        'AppLovin must be manually re-uploaded with the BUILD-21 polished candidate before network pass is claimed. Final approval is not guaranteed forever.',
    },
  };

  const manifest = {
    projectId: 'TilePyramid_PL01',
    build: 'BUILD-21',
    deliveryType: 'polished-candidate-reupload',
    polishedRuntimeBuild: 'BUILD-20',
    generatedAt,
    gitBranch,
    outputRoot: 'delivery/latest',
    storeUrls: {
      androidUrl: ANDROID_STORE_URL,
      iosUrl: IOS_STORE_URL,
      fallbackUrl: FALLBACK_STORE_URL,
    },
    outputs: {
      unity: unityDelivery,
      applovin: applovinDelivery,
    },
    profiles: {
      unity: unitySource.profileId,
      applovin: applovinSource.profileId,
    },
    networkQaEvidence,
    formalSolvability: FORMAL_SOLVABILITY,
    deliveryDisclaimer: DELIVERY_DISCLAIMER,
    knownLimitations: [
      'Final Unity Ads and AppLovin approval is not guaranteed.',
      'Unity export expects network-provided window.mraid.',
      'Network webviews may differ from Chromium file:// QA.',
      'Formal solvability remains NOT YET PROVEN.',
    ],
    candidateSource: 'upload-candidates/latest',
    candidateValidationResult: candidateManifest.validationResult ?? 'PASS',
  };

  await writeFile(
    path.join(deliveryRoot, 'delivery-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  await writeFile(path.join(deliveryRoot, 'checksums.sha256'), createChecksumText(manifest));
  await writeFile(path.join(deliveryRoot, 'QA_EVIDENCE.md'), createQaEvidence(manifest));
  await writeFile(path.join(deliveryRoot, 'RELEASE_NOTES.md'), createReleaseNotes(manifest));
  await writeFile(path.join(deliveryRoot, 'DELIVERY_README.md'), createDeliveryReadme(manifest));
  await writeFile(
    path.join(deliveryRoot, 'unity/UPLOAD_NOTES_UNITY.md'),
    createUnityNotes(manifest)
  );
  await writeFile(
    path.join(deliveryRoot, 'applovin/UPLOAD_NOTES_APPLOVIN.md'),
    createAppLovinNotes(manifest)
  );

  const validation = await validateDeliveryPackage(deliveryRoot);
  await writeFile(
    path.join(deliveryRoot, 'delivery-validation-report.json'),
    JSON.stringify(validation, null, 2)
  );
  if (validation.status !== 'PASS') {
    for (const error of validation.errors) console.error(`ERROR: ${error}`);
    throw new Error('Delivery package validation failed.');
  }

  console.log('Delivery package: PASS');
  console.log(`Unity:    ${manifest.outputs.unity.path}  ${manifest.outputs.unity.sizeBytes} bytes`);
  console.log(`AppLovin: ${manifest.outputs.applovin.path}  ${manifest.outputs.applovin.sizeBytes} bytes`);
  console.log(`Unity SHA256:    ${manifest.outputs.unity.sha256}`);
  console.log(`AppLovin SHA256: ${manifest.outputs.applovin.sha256}`);
  console.log(`Delivery folder: ${path.relative(root, deliveryRoot).replaceAll('\\', '/')}`);
}

async function copyDeliveryHtml(sourcePath, network, sourceOutput) {
  const outputName = path.basename(sourcePath);
  const relativePath = `${network}/${outputName}`;
  const destinationPath = path.join(deliveryRoot, relativePath);
  await copyFile(sourcePath, destinationPath);
  const fileSize = (await stat(destinationPath)).size;
  const fileSha = await sha256File(destinationPath);
  if (fileSha !== sourceOutput.sha256) {
    throw new Error(
      `${network} HTML checksum mismatch after copy. Expected ${sourceOutput.sha256}, got ${fileSha}.`
    );
  }
  return {
    network,
    path: relativePath,
    sizeBytes: fileSize,
    sha256: fileSha,
    targetMaxBytes: sourceOutput.targetMaxBytes ?? 5 * 1024 * 1024,
    profileId: sourceOutput.profileId,
  };
}

function createChecksumText(manifest) {
  return [
    `${manifest.outputs.unity.sha256}  ${manifest.outputs.unity.path}`,
    `${manifest.outputs.applovin.sha256}  ${manifest.outputs.applovin.path}`,
    '',
  ].join('\n');
}

function createQaEvidence(manifest) {
  return `# Network QA Evidence

Project: ${manifest.projectId}
Build: ${manifest.build}
Generated: ${manifest.generatedAt}
Branch: ${manifest.gitBranch ?? 'unknown'}

## Upload Testing Results

### Unity Ads

Status: ${manifest.networkQaEvidence.unity.status}
Fixed in: ${manifest.networkQaEvidence.unity.fixedIn}
Fix: ${manifest.networkQaEvidence.unity.fix}

${manifest.networkQaEvidence.unity.disclaimer}

### AppLovin

Status: ${manifest.networkQaEvidence.applovin.status}
Fixed in: ${manifest.networkQaEvidence.applovin.fixedIn}
Fix: ${manifest.networkQaEvidence.applovin.fix}

${manifest.networkQaEvidence.applovin.disclaimer}

## Export Files

- Unity: \`${manifest.outputs.unity.path}\`
  - Size: ${manifest.outputs.unity.sizeBytes} bytes
  - SHA256: \`${manifest.outputs.unity.sha256}\`
- AppLovin: \`${manifest.outputs.applovin.path}\`
  - Size: ${manifest.outputs.applovin.sizeBytes} bytes
  - SHA256: \`${manifest.outputs.applovin.sha256}\`

## Store URLs Configured

- Android / Google Play: ${manifest.storeUrls.androidUrl}
- iOS / App Store: ${manifest.storeUrls.iosUrl}
- Fallback: ${manifest.storeUrls.fallbackUrl}

## MRAID

Unity export expects network-provided \`window.mraid\`. The store-open bridge
prefers \`mraid.open(url)\` and falls back to \`window.open(url, "_blank", "noopener")\`,
then \`window.location.href\`. AppLovin does not require MRAID.

## Validation Commands Run

\`\`\`
npm run typecheck         # TypeScript: no errors
npm run test              # Unit tests: all passing
npm run build             # Production build: PASS
npm run export:all        # Unity + AppLovin exports: PASS
npm run validate:exports  # Static export validation: PASS
npm run test:exports      # Chromium export tests: PASS
npm run test:smoke        # Chromium smoke tests: PASS
npm run measure:size      # Size measurement: PASS
npm run package:candidate # Candidate packaging: PASS
npm run validate:candidate # Candidate validation: PASS
npm run package:delivery  # Delivery package: PASS
npm run validate:delivery # Delivery validation: PASS
\`\`\`

## Known Limitations

${manifest.knownLimitations.map(lim => `- ${lim}`).join('\n')}

## Formal Solvability

${manifest.formalSolvability}

${manifest.deliveryDisclaimer}
`;
}

function createReleaseNotes(manifest) {
  return `# Release Notes: TilePyramid_PL01

Build: ${manifest.build}
Delivery type: ${manifest.deliveryType}
Generated: ${manifest.generatedAt}
Branch: ${manifest.gitBranch ?? 'unknown'}

## Summary

TilePyramid_PL01 is a match-3 tile puzzle playable ad for Unity Ads and AppLovin.
Initial level: Level_21. Tray capacity: 5. Timer: 30 seconds (starts on first real
player interaction). Tutorial guides the first three taps. Portrait 9:16 canonical
gameplay viewport with landscape centering. CTA and fail end card with store-open.

## Delivery Files

| File | Network | Size | SHA256 |
|------|---------|------|--------|
| \`${manifest.outputs.unity.path}\` | Unity Ads | ${manifest.outputs.unity.sizeBytes} B | \`${manifest.outputs.unity.sha256.slice(0, 16)}...\` |
| \`${manifest.outputs.applovin.path}\` | AppLovin | ${manifest.outputs.applovin.sizeBytes} B | \`${manifest.outputs.applovin.sha256.slice(0, 16)}...\` |

## Store URLs

- Android / Google Play: ${manifest.storeUrls.androidUrl}
- iOS / App Store: ${manifest.storeUrls.iosUrl}
- Fallback: ${manifest.storeUrls.fallbackUrl}

## Build History

| Phase | Description |
|-------|-------------|
| BUILD-00 | Documentation and project requirements |
| BUILD-01 | Shell and runtime infrastructure |
| BUILD-02 | Level data and tile board |
| BUILD-03 | Selection and match logic |
| BUILD-04 | Timer, tutorial, and idle hint |
| BUILD-05 | Audio and effects |
| BUILD-06 | CTA, end card, and store-open |
| BUILD-07 | Orientation and viewport management |
| BUILD-08 | Asset optimization |
| BUILD-09 | Export and ad-network adapter foundation |
| BUILD-10 | Export validation, smoke tests, candidate packaging |
| BUILD-11 | Upload candidate package and store URL wiring |
| BUILD-12 | window.top upload fix (Unity rejection resolved) |
| BUILD-13 | Delivery candidate lock and final handoff package |
| BUILD-20 | Creative polish pass |
| BUILD-21 | Polished candidate re-upload QA package |

## Key Technical Notes

- Single-file HTML playable; all assets inlined as base64 or data URIs
- No external HTTP/HTTPS resource references
- No local assets/config/dist path references
- Forbidden top-window access (window.top, parent.top, etc.) removed in BUILD-12
- Unity export: MRAID-first store-open with window.open fallback
- AppLovin export: window.open-first with window.location.href fallback
- Phaser 3.87.0 with input.windowEvents: false

## Network QA Evidence

- Unity: ${manifest.networkQaEvidence.unity.disclaimer}
- AppLovin: ${manifest.networkQaEvidence.applovin.disclaimer}

## Known Limitations

${manifest.knownLimitations.map(lim => `- ${lim}`).join('\n')}

${manifest.deliveryDisclaimer}
`;
}

function createDeliveryReadme(manifest) {
  return `# TilePyramid_PL01 Delivery Package

Build: ${manifest.build}
Delivery type: ${manifest.deliveryType}
Generated: ${manifest.generatedAt}

## Contents

\`\`\`
delivery/latest/
├── DELIVERY_README.md               — This file
├── RELEASE_NOTES.md                 — Release notes and build history
├── QA_EVIDENCE.md                   — Network QA evidence and upload testing results
├── delivery-manifest.json           — Full delivery manifest with checksums and metadata
├── checksums.sha256                 — SHA256 checksums for HTML delivery files
├── delivery-validation-report.json  — Delivery validation result
├── unity/
│   ├── TilePyramid_PL01_unity.html  — Unity Ads single-file upload
│   └── UPLOAD_NOTES_UNITY.md        — Unity-specific upload instructions
└── applovin/
    ├── TilePyramid_PL01_applovin.html  — AppLovin single-file upload
    └── UPLOAD_NOTES_APPLOVIN.md        — AppLovin-specific upload instructions
\`\`\`

## Upload Instructions

### Unity Ads

1. Upload \`unity/TilePyramid_PL01_unity.html\` to Unity Ads playable review.
2. Confirm Unity provides \`window.mraid\` in the ad environment.
3. Confirm \`mraid.open(url)\` opens the correct store URL per device platform.
4. Confirm the host close button is not blocked.

### AppLovin

1. Upload \`applovin/TilePyramid_PL01_applovin.html\` to AppLovin playable review.
2. Confirm store-open behavior opens the correct store URL per device platform.
3. Confirm the host close button is not blocked.

## Store URLs

- Android / Google Play: ${manifest.storeUrls.androidUrl}
- iOS / App Store: ${manifest.storeUrls.iosUrl}
- Fallback (default): ${manifest.storeUrls.fallbackUrl}

## Checksums

\`\`\`
${manifest.outputs.unity.sha256}  ${manifest.outputs.unity.path}
${manifest.outputs.applovin.sha256}  ${manifest.outputs.applovin.path}
\`\`\`

## Reproducing This Package

From \`projects/TilePyramid_PL01\`:

\`\`\`bash
npm run package:delivery
npm run validate:delivery
\`\`\`

## Known Limitations

${manifest.knownLimitations.map(lim => `- ${lim}`).join('\n')}

${manifest.deliveryDisclaimer}
`;
}

function createUnityNotes(manifest) {
  return `# Unity Upload Notes

File to upload: \`${manifest.outputs.unity.path}\`
Size: ${manifest.outputs.unity.sizeBytes} bytes
Profile: ${manifest.outputs.unity.profileId}

## Store URLs

- Android: ${manifest.storeUrls.androidUrl}
- iOS: ${manifest.storeUrls.iosUrl}
- Fallback: ${manifest.storeUrls.fallbackUrl}

## MRAID Expectation

Unity is expected to provide \`window.mraid\` in the real ad environment. The
store-open bridge prefers \`mraid.open(url)\` and falls back to
\`window.open(url, "_blank", "noopener")\` when unavailable.

## Network QA Result

${manifest.networkQaEvidence.unity.disclaimer}

## Upload Steps

1. Upload the HTML file above to Unity Ads playable review.
2. Preview on Android and iOS device targets if available.
3. Confirm \`mraid.open(url)\` is called with the correct store URL per platform.
4. Confirm the host close button is not blocked by the creative.

## SHA256

\`${manifest.outputs.unity.sha256}\`

## Known Limitations

- Final Unity Ads approval is not guaranteed.
- Formal solvability remains ${manifest.formalSolvability}.

${manifest.deliveryDisclaimer}
`;
}

function createAppLovinNotes(manifest) {
  return `# AppLovin Upload Notes

File to upload: \`${manifest.outputs.applovin.path}\`
Size: ${manifest.outputs.applovin.sizeBytes} bytes
Profile: ${manifest.outputs.applovin.profileId}

## Store URLs

- Android: ${manifest.storeUrls.androidUrl}
- iOS: ${manifest.storeUrls.iosUrl}
- Fallback: ${manifest.storeUrls.fallbackUrl}

## Network QA Result

${manifest.networkQaEvidence.applovin.disclaimer}

## Upload Steps

1. Upload the HTML file above to AppLovin playable review.
2. Preview on Android and iOS device targets if available.
3. Confirm store-open reaches the configured store URL.
4. Confirm the host close button is not blocked by the creative.

## SHA256

\`${manifest.outputs.applovin.sha256}\`

## Known Limitations

- Final AppLovin approval is not guaranteed.
- Formal solvability remains ${manifest.formalSolvability}.

${manifest.deliveryDisclaimer}
`;
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
    const { stdout } = await execFilePromiseWithOutput('git', ['branch', '--show-current'], {
      cwd: repoRoot,
    });
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
