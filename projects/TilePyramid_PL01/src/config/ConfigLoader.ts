import type { GameConfig } from '../types';

export type { GameConfig };

const REQUIRED_FIELDS: (keyof GameConfig)[] = [
  'projectId',
  'designWidth',
  'designHeight',
  'backgroundId',
  'backgroundFit',
  'viewportAspect',
  'portraitPolicy',
  'landscapePolicy',
  'debugOverlay',
];

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

export function validateConfig(data: unknown): GameConfig {
  if (typeof data !== 'object' || data === null) {
    throw new ConfigValidationError('Config must be a non-null object');
  }

  const obj = data as Record<string, unknown>;

  for (const field of REQUIRED_FIELDS) {
    if (!(field in obj)) {
      throw new ConfigValidationError(`Config missing required field: ${field}`);
    }
  }

  if (typeof obj['projectId'] !== 'string' || obj['projectId'].trim() === '') {
    throw new ConfigValidationError('Config.projectId must be a non-empty string');
  }
  if (typeof obj['designWidth'] !== 'number' || obj['designWidth'] <= 0) {
    throw new ConfigValidationError('Config.designWidth must be a positive number');
  }
  if (typeof obj['designHeight'] !== 'number' || obj['designHeight'] <= 0) {
    throw new ConfigValidationError('Config.designHeight must be a positive number');
  }
  if (typeof obj['backgroundId'] !== 'string' || obj['backgroundId'].trim() === '') {
    throw new ConfigValidationError('Config.backgroundId must be a non-empty string');
  }
  if (!['cover', 'contain', 'fill'].includes(obj['backgroundFit'] as string)) {
    throw new ConfigValidationError('Config.backgroundFit must be cover, contain, or fill');
  }
  if (typeof obj['debugOverlay'] !== 'boolean') {
    throw new ConfigValidationError('Config.debugOverlay must be a boolean');
  }

  return data as GameConfig;
}

export function loadConfigFromGlobal(): GameConfig {
  const raw: unknown = window.__GAME_CONFIG__;
  if (!raw) {
    throw new ConfigValidationError('window.__GAME_CONFIG__ is not defined — check the inject-config plugin');
  }
  const config = validateConfig(raw);
  console.log(`Config loaded: ${config.projectId}`);
  return config;
}
