import { access } from 'node:fs/promises';
import path from 'node:path';

export const VALID_STATUSES = ['development', 'candidate', 'delivery-locked', 'archived'];

export const REQUIRED_PROJECT_FIELDS = [
  'projectId',
  'displayName',
  'folder',
  'status',
  'supportedNetworks',
  'storeUrls',
  'formalSolvability',
];

export const DELIVERY_LOCKED_REQUIRED_REPO_DOCS = [
  'docs/NETWORK_QA_EVIDENCE.md',
  'docs/DELIVERY_CANDIDATE.md',
];

export const DELIVERY_LOCKED_REQUIRED_WORKFLOWS = [
  'package:delivery',
  'validate:delivery',
];

/**
 * Validates the structural shape of a registry entry (no file system access).
 * Returns { valid: boolean, errors: string[] }.
 */
export function validateRegistryEntry(entry) {
  const errors = [];

  for (const field of REQUIRED_PROJECT_FIELDS) {
    if (entry[field] === undefined || entry[field] === null || entry[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (entry.status && !VALID_STATUSES.includes(entry.status)) {
    errors.push(
      `Invalid status: "${entry.status}". Must be one of: ${VALID_STATUSES.join(', ')}`
    );
  }

  if (entry.storeUrls) {
    if (!entry.storeUrls.androidUrl) errors.push('Missing storeUrls.androidUrl');
    if (!entry.storeUrls.iosUrl) errors.push('Missing storeUrls.iosUrl');
  }

  if (entry.supportedNetworks !== undefined) {
    if (!Array.isArray(entry.supportedNetworks) || entry.supportedNetworks.length === 0) {
      errors.push('supportedNetworks must be a non-empty array');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Checks whether the project folder exists on disk.
 * Returns { valid: boolean, errors: string[] }.
 */
export async function validateProjectFolderExists(entry, repoRoot) {
  const folderPath = path.join(repoRoot, entry.folder ?? '');
  try {
    await access(folderPath);
    return { valid: true, errors: [] };
  } catch {
    return {
      valid: false,
      errors: [`Project folder does not exist: ${entry.folder}`],
    };
  }
}
