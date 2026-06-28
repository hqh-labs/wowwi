import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { findForbiddenTopWindowAccess } from '../export/validators/export-validator.mjs';

export const ANDROID_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.skl.pyramid.quest.match3.tile.puzzle.games';
export const IOS_STORE_URL = 'https://apps.apple.com/us/app/tile-pyramid-match-quest/id6755671033';
export const FALLBACK_STORE_URL = ANDROID_STORE_URL;
export const FINAL_APPROVAL_DISCLAIMER =
  'Local BUILD-21 polished candidate packaging and validation do not guarantee final Unity Ads or AppLovin approval.';
export const FORMAL_SOLVABILITY = 'NOT YET PROVEN';

const FORBIDDEN_SEGMENTS = new Set([
  'project-input',
  'raw-assets',
  'extracted-assets',
  'src',
  'node_modules',
]);

export async function sha256File(filePath) {
  return sha256Buffer(await readFile(filePath));
}

export function sha256Buffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

export async function listFilesRecursive(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function validateCandidatePackage(candidateRoot) {
  const errors = [];
  const warnings = [];
  const manifestPath = path.join(candidateRoot, 'package-manifest.json');
  const checksumPath = path.join(candidateRoot, 'checksums.sha256');
  const qaSummaryPath = path.join(candidateRoot, 'QA_SUMMARY.md');

  const manifest = await readJsonIfExists(manifestPath, errors, 'Package manifest is missing.');
  const checksumsText = await readTextIfExists(checksumPath, errors, 'Checksum file is missing.');
  await readTextIfExists(qaSummaryPath, errors, 'QA summary is missing.');

  if (!manifest) {
    return result(errors, warnings, null);
  }

  const unityPath = path.join(candidateRoot, manifest.outputs?.unity?.path ?? '');
  const applovinPath = path.join(candidateRoot, manifest.outputs?.applovin?.path ?? '');
  const unityNotesPath = path.join(candidateRoot, 'unity/UPLOAD_NOTES_UNITY.md');
  const applovinNotesPath = path.join(candidateRoot, 'applovin/UPLOAD_NOTES_APPLOVIN.md');

  await validateHtmlOutput({
    label: 'Unity',
    filePath: unityPath,
    manifestOutput: manifest.outputs?.unity,
    manifest,
    checksumsText,
    errors,
  });
  await validateHtmlOutput({
    label: 'AppLovin',
    filePath: applovinPath,
    manifestOutput: manifest.outputs?.applovin,
    manifest,
    checksumsText,
    errors,
  });
  await readTextIfExists(unityNotesPath, errors, 'Unity upload notes are missing.');
  await readTextIfExists(applovinNotesPath, errors, 'AppLovin upload notes are missing.');

  if (manifest.formalSolvability !== FORMAL_SOLVABILITY) {
    errors.push('Formal solvability is not recorded as NOT YET PROVEN.');
  }
  if (!/not guarantee final/i.test(String(manifest.finalApprovalDisclaimer ?? ''))) {
    errors.push('Final approval disclaimer is missing from package manifest.');
  }
  const manifestStoreUrls = normalizeStoreUrls(manifest);
  if (manifestStoreUrls.androidUrl !== ANDROID_STORE_URL) {
    errors.push('Android store URL is missing or incorrect in package manifest.');
  }
  if (manifestStoreUrls.iosUrl !== IOS_STORE_URL) {
    errors.push('iOS store URL is missing or incorrect in package manifest.');
  }

  const files = await listFilesRecursive(candidateRoot).catch(() => []);
  for (const file of files) {
    const relative = path.relative(candidateRoot, file).replaceAll('\\', '/');
    const segments = relative.split('/');
    if (segments.some(segment => FORBIDDEN_SEGMENTS.has(segment))) {
      errors.push(`Forbidden package path included: ${relative}`);
    }
  }

  return result(errors, warnings, {
    manifestPath,
    checksumPath,
    qaSummaryPath,
    fileCount: files.length,
  });
}

async function validateHtmlOutput({ label, filePath, manifestOutput, manifest, checksumsText, errors }) {
  const html = await readTextIfExists(filePath, errors, `${label} HTML is missing.`);
  if (!html || !manifestOutput) return;

  const actualSize = (await stat(filePath)).size;
  if (actualSize !== manifestOutput.sizeBytes) {
    errors.push(`${label} HTML size does not match package manifest.`);
  }
  const actualSha = await sha256File(filePath);
  if (actualSha !== manifestOutput.sha256) {
    errors.push(`${label} SHA256 does not match package manifest.`);
  }
  const relative = manifestOutput.path.replaceAll('\\', '/');
  if (checksumsText && !checksumsText.includes(`${actualSha}  ${relative}`)) {
    errors.push(`${label} SHA256 is missing or mismatched in checksums.sha256.`);
  }
  for (const forbiddenAccess of findForbiddenTopWindowAccess(html)) {
    errors.push(`Forbidden top-window access detected: ${forbiddenAccess}`);
  }
  const storeUrlValidation = validateHtmlStoreUrls(html, normalizeStoreUrls(manifest));
  if (!storeUrlValidation.android) {
    errors.push(`${label} HTML does not contain Android store URL metadata.`);
  }
  if (!storeUrlValidation.ios) {
    errors.push(`${label} HTML does not contain iOS store URL metadata.`);
  }
  if (!storeUrlValidation.fallback) {
    errors.push(`${label} HTML does not contain fallback store URL metadata.`);
  }
  if (!html.includes(FORMAL_SOLVABILITY)) {
    errors.push(`${label} HTML does not record formal solvability.`);
  }
}

export function validateHtmlStoreUrls(html, expectedStoreUrls) {
  const metadata = extractPlayableNetworkMetadata(html);
  if (Object.keys(metadata).length > 0) {
    return {
      android:
        metadata.androidStoreUrl === expectedStoreUrls.androidUrl ||
        metadata.storeUrls?.androidUrl === expectedStoreUrls.androidUrl,
      ios:
        metadata.iosStoreUrl === expectedStoreUrls.iosUrl ||
        metadata.storeUrls?.iosUrl === expectedStoreUrls.iosUrl,
      fallback:
        metadata.fallbackStoreUrl === expectedStoreUrls.fallbackUrl ||
        metadata.storeUrls?.fallbackUrl === expectedStoreUrls.fallbackUrl,
    };
  }
  return {
    android: htmlContainsUrlVariant(html, expectedStoreUrls.androidUrl),
    ios: htmlContainsUrlVariant(html, expectedStoreUrls.iosUrl),
    fallback: htmlContainsUrlVariant(html, expectedStoreUrls.fallbackUrl),
  };
}

export function extractPlayableNetworkMetadata(html) {
  const match = html.match(/window\.__PLAYABLE_NETWORK__\s*=\s*({[\s\S]*?})\s*;/);
  if (!match) return {};
  try {
    const parsed = JSON.parse(match[1]);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeStoreUrls(manifest) {
  return {
    androidUrl: manifest.storeUrls?.androidUrl ?? manifest.androidStoreUrl ?? '',
    iosUrl: manifest.storeUrls?.iosUrl ?? manifest.iosStoreUrl ?? '',
    fallbackUrl: manifest.storeUrls?.fallbackUrl ?? manifest.fallbackStoreUrl ?? '',
  };
}

function htmlContainsUrlVariant(html, url) {
  if (!url) return false;
  const variants = new Set([
    url,
    url.replaceAll('/', '\\/'),
    encodeURI(url),
    encodeURIComponent(url),
    url.replaceAll('&', '&amp;'),
  ]);
  return [...variants].some(variant => html.includes(variant));
}

async function readJsonIfExists(filePath, errors, message) {
  const text = await readTextIfExists(filePath, errors, message);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    errors.push(`Could not parse ${path.basename(filePath)}: ${error.message}`);
    return null;
  }
}

async function readTextIfExists(filePath, errors, message) {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    errors.push(message);
    return null;
  }
}

function result(errors, warnings, details) {
  return {
    status: errors.length === 0 ? 'PASS' : 'FAIL',
    errors,
    warnings,
    details,
  };
}
