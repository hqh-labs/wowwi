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
  'levelId',
  'assignmentSeed',
  'tileTypeCount',
  'tutorialPreviewPositionIds',
  'boardLayout',
  'debugBlockedState',
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
  if (typeof obj['levelId'] !== 'string' || obj['levelId'].trim() === '') {
    throw new ConfigValidationError('Config.levelId must be a non-empty string');
  }
  if (!Number.isInteger(obj['assignmentSeed'])) {
    throw new ConfigValidationError('Config.assignmentSeed must be an integer');
  }
  if (!Number.isInteger(obj['tileTypeCount']) || (obj['tileTypeCount'] as number) <= 0) {
    throw new ConfigValidationError('Config.tileTypeCount must be a positive integer');
  }
  if (!Array.isArray(obj['tutorialPreviewPositionIds']) || obj['tutorialPreviewPositionIds'].length !== 3) {
    throw new ConfigValidationError('Config.tutorialPreviewPositionIds must contain exactly three ids');
  }
  for (const id of obj['tutorialPreviewPositionIds']) {
    if (typeof id !== 'string' || id.trim() === '') {
      throw new ConfigValidationError('Config.tutorialPreviewPositionIds must contain non-empty strings');
    }
  }
  validateBoardLayout(obj['boardLayout']);
  if (typeof obj['debugBlockedState'] !== 'boolean') {
    throw new ConfigValidationError('Config.debugBlockedState must be a boolean');
  }

  return data as GameConfig;
}

function validateBoardLayout(value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigValidationError('Config.boardLayout must be an object');
  }

  const layout = value as Record<string, unknown>;
  const required = [
    'centerX',
    'centerY',
    'spacingX',
    'spacingY',
    'layerOffsetX',
    'layerOffsetY',
    'tileScale',
  ];

  for (const field of required) {
    if (typeof layout[field] !== 'number' || !Number.isFinite(layout[field])) {
      throw new ConfigValidationError(`Config.boardLayout.${field} must be a finite number`);
    }
  }
  if ((layout['tileScale'] as number) <= 0) {
    throw new ConfigValidationError('Config.boardLayout.tileScale must be positive');
  }
  for (const optionalField of ['maxWidth', 'maxHeight']) {
    if (
      layout[optionalField] !== undefined &&
      (typeof layout[optionalField] !== 'number' || !Number.isFinite(layout[optionalField]))
    ) {
      throw new ConfigValidationError(`Config.boardLayout.${optionalField} must be a finite number`);
    }
  }
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
