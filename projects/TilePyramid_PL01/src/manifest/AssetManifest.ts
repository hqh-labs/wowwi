import type { AssetEntry, AssetManifestData } from '../types';

export type { AssetEntry, AssetManifestData };

export class ManifestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ManifestValidationError';
  }
}

export function validateManifest(data: unknown): AssetManifestData {
  if (typeof data !== 'object' || data === null) {
    throw new ManifestValidationError('Manifest must be a non-null object');
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj['version'] !== 'string') {
    throw new ManifestValidationError('Manifest.version must be a string');
  }
  if (!Array.isArray(obj['assets'])) {
    throw new ManifestValidationError('Manifest.assets must be an array');
  }

  for (let i = 0; i < obj['assets'].length; i++) {
    const asset = obj['assets'][i] as Record<string, unknown>;
    if (typeof asset['id'] !== 'string' || asset['id'].trim() === '') {
      throw new ManifestValidationError(`Manifest.assets[${i}].id must be a non-empty string`);
    }
    if (!['image', 'audio', 'font', 'json'].includes(asset['type'] as string)) {
      throw new ManifestValidationError(`Manifest.assets[${i}].type must be image, audio, font, or json`);
    }
    if (typeof asset['path'] !== 'string' || asset['path'].trim() === '') {
      throw new ManifestValidationError(`Manifest.assets[${i}].path must be a non-empty string`);
    }
    if (typeof asset['source'] !== 'string') {
      throw new ManifestValidationError(`Manifest.assets[${i}].source must be a string`);
    }
  }

  return data as AssetManifestData;
}

export function resolveAsset(manifest: AssetManifestData, id: string): AssetEntry | undefined {
  return manifest.assets.find(a => a.id === id);
}

export function loadManifestFromGlobal(): AssetManifestData {
  const raw: unknown = window.__ASSET_MANIFEST__;
  if (!raw) {
    throw new ManifestValidationError('window.__ASSET_MANIFEST__ is not defined — check the inject-config plugin');
  }
  return validateManifest(raw);
}
