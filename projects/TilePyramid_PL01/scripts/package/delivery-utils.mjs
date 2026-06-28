import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  ANDROID_STORE_URL,
  FALLBACK_STORE_URL,
  FORMAL_SOLVABILITY,
  IOS_STORE_URL,
  listFilesRecursive,
  sha256Buffer,
  sha256File,
  validateHtmlStoreUrls,
} from './candidate-utils.mjs';
import {
  findForbiddenTopWindowAccess,
  hasExternalHttpAssetReference,
  hasLocalRuntimeAssetReference,
} from '../export/validators/export-validator.mjs';

export {
  ANDROID_STORE_URL,
  FALLBACK_STORE_URL,
  FORMAL_SOLVABILITY,
  IOS_STORE_URL,
  sha256Buffer,
  sha256File,
};

export const DELIVERY_DISCLAIMER =
  'Local BUILD-13 delivery packaging and validation do not guarantee final Unity Ads or AppLovin approval.';

const MAX_DELIVERY_BYTES = 5 * 1024 * 1024;

export async function validateDeliveryPackage(deliveryRoot) {
  const errors = [];
  const warnings = [];

  const manifestPath = path.join(deliveryRoot, 'delivery-manifest.json');
  const checksumPath = path.join(deliveryRoot, 'checksums.sha256');
  const qaEvidencePath = path.join(deliveryRoot, 'QA_EVIDENCE.md');
  const releaseNotesPath = path.join(deliveryRoot, 'RELEASE_NOTES.md');

  const manifest = await readJsonIfExists(manifestPath, errors, 'Delivery manifest is missing.');
  const checksumsText = await readTextIfExists(checksumPath, errors, 'Checksum file is missing.');
  await readTextIfExists(qaEvidencePath, errors, 'QA evidence file is missing.');
  await readTextIfExists(releaseNotesPath, errors, 'Release notes file are missing.');

  if (!manifest) {
    return makeResult(errors, warnings, null);
  }

  const unityPath = path.join(deliveryRoot, manifest.outputs?.unity?.path ?? '');
  const applovinPath = path.join(deliveryRoot, manifest.outputs?.applovin?.path ?? '');

  await validateDeliveryHtml({
    label: 'Unity',
    filePath: unityPath,
    manifestOutput: manifest.outputs?.unity,
    manifest,
    checksumsText,
    errors,
  });
  await validateDeliveryHtml({
    label: 'AppLovin',
    filePath: applovinPath,
    manifestOutput: manifest.outputs?.applovin,
    manifest,
    checksumsText,
    errors,
  });

  await readTextIfExists(
    path.join(deliveryRoot, 'unity/UPLOAD_NOTES_UNITY.md'),
    errors,
    'Unity upload notes are missing.'
  );
  await readTextIfExists(
    path.join(deliveryRoot, 'applovin/UPLOAD_NOTES_APPLOVIN.md'),
    errors,
    'AppLovin upload notes are missing.'
  );

  if (manifest.formalSolvability !== FORMAL_SOLVABILITY) {
    errors.push('Formal solvability is not recorded as NOT YET PROVEN.');
  }
  if (!/not guarantee/i.test(String(manifest.deliveryDisclaimer ?? ''))) {
    errors.push('Delivery disclaimer is missing from delivery manifest.');
  }
  if (!manifest.networkQaEvidence) {
    errors.push('Network QA evidence is missing from delivery manifest.');
  }

  const storeUrls = normalizeStoreUrls(manifest);
  if (storeUrls.androidUrl !== ANDROID_STORE_URL) {
    errors.push('Android store URL is missing or incorrect in delivery manifest.');
  }
  if (storeUrls.iosUrl !== IOS_STORE_URL) {
    errors.push('iOS store URL is missing or incorrect in delivery manifest.');
  }

  const files = await listFilesRecursive(deliveryRoot).catch(() => []);
  return makeResult(errors, warnings, { manifestPath, checksumPath, fileCount: files.length });
}

async function validateDeliveryHtml({ label, filePath, manifestOutput, manifest, checksumsText, errors }) {
  const html = await readTextIfExists(filePath, errors, `${label} HTML is missing.`);
  if (!html || !manifestOutput) return;

  const actualSize = (await stat(filePath)).size;
  if (actualSize > MAX_DELIVERY_BYTES) {
    errors.push(`${label} HTML exceeds 5 MB size limit (${actualSize} bytes).`);
  }
  if (actualSize !== manifestOutput.sizeBytes) {
    errors.push(`${label} HTML size does not match delivery manifest.`);
  }

  const actualSha = await sha256File(filePath);
  if (actualSha !== manifestOutput.sha256) {
    errors.push(`${label} SHA256 does not match delivery manifest.`);
  }
  const relative = manifestOutput.path.replaceAll('\\', '/');
  if (checksumsText && !checksumsText.includes(`${actualSha}  ${relative}`)) {
    errors.push(`${label} SHA256 is missing or mismatched in checksums.sha256.`);
  }

  for (const forbiddenAccess of findForbiddenTopWindowAccess(html)) {
    errors.push(`Forbidden top-window access detected: ${forbiddenAccess}`);
  }
  if (hasExternalHttpAssetReference(html)) {
    errors.push(`${label} HTML contains an external HTTP/HTTPS resource reference.`);
  }
  if (hasLocalRuntimeAssetReference(html)) {
    errors.push(`${label} HTML contains a local assets/, config/, or dist/ reference.`);
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

function normalizeStoreUrls(manifest) {
  return {
    androidUrl: manifest.storeUrls?.androidUrl ?? manifest.androidStoreUrl ?? '',
    iosUrl: manifest.storeUrls?.iosUrl ?? manifest.iosStoreUrl ?? '',
    fallbackUrl: manifest.storeUrls?.fallbackUrl ?? manifest.fallbackStoreUrl ?? '',
  };
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

function makeResult(errors, warnings, details) {
  return {
    status: errors.length === 0 ? 'PASS' : 'FAIL',
    errors,
    warnings,
    details,
  };
}
