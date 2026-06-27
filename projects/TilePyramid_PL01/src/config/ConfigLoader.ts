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
  'trayCapacity',
  'trayLayout',
  'tileFlyDurationMs',
  'inputLockEnabled',
  'blockedTileFeedback',
  'debugMatchReadyMarker',
  'matchResolutionDelayMs',
  'matchResolutionDurationMs',
  'matchResolvingVisual',
  'inputLockDuringMatchResolution',
  'debugOutcomeLabel',
  'timer',
  'tutorial',
  'idleHint',
  'debugTimerTutorialIdle',
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
  if (!Number.isInteger(obj['trayCapacity']) || (obj['trayCapacity'] as number) < 1) {
    throw new ConfigValidationError('Config.trayCapacity must be an integer >= 1');
  }
  validateTrayLayout(obj['trayLayout']);
  if (
    typeof obj['tileFlyDurationMs'] !== 'number' ||
    !Number.isFinite(obj['tileFlyDurationMs']) ||
    obj['tileFlyDurationMs'] < 0
  ) {
    throw new ConfigValidationError('Config.tileFlyDurationMs must be a non-negative finite number');
  }
  if (typeof obj['inputLockEnabled'] !== 'boolean') {
    throw new ConfigValidationError('Config.inputLockEnabled must be a boolean');
  }
  if (!['shake', 'tint', 'none'].includes(obj['blockedTileFeedback'] as string)) {
    throw new ConfigValidationError('Config.blockedTileFeedback must be shake, tint, or none');
  }
  if (typeof obj['debugMatchReadyMarker'] !== 'boolean') {
    throw new ConfigValidationError('Config.debugMatchReadyMarker must be a boolean');
  }
  if (!isNonNegativeFiniteNumber(obj['matchResolutionDelayMs'])) {
    throw new ConfigValidationError('Config.matchResolutionDelayMs must be a non-negative finite number');
  }
  if (!isNonNegativeFiniteNumber(obj['matchResolutionDurationMs'])) {
    throw new ConfigValidationError('Config.matchResolutionDurationMs must be a non-negative finite number');
  }
  if (!['scale-fade', 'none'].includes(obj['matchResolvingVisual'] as string)) {
    throw new ConfigValidationError('Config.matchResolvingVisual must be scale-fade or none');
  }
  if (typeof obj['inputLockDuringMatchResolution'] !== 'boolean') {
    throw new ConfigValidationError('Config.inputLockDuringMatchResolution must be a boolean');
  }
  if (typeof obj['debugOutcomeLabel'] !== 'boolean') {
    throw new ConfigValidationError('Config.debugOutcomeLabel must be a boolean');
  }
  validateTimerConfig(obj['timer']);
  validateTutorialConfig(obj['tutorial']);
  validateIdleHintConfig(obj['idleHint']);
  if (typeof obj['debugTimerTutorialIdle'] !== 'boolean') {
    throw new ConfigValidationError('Config.debugTimerTutorialIdle must be a boolean');
  }

  return data as GameConfig;
}

function isNonNegativeFiniteNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
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

function validateTrayLayout(value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigValidationError('Config.trayLayout must be an object');
  }

  const layout = value as Record<string, unknown>;
  for (const field of ['centerX', 'centerY', 'slotSpacing', 'slotWidth', 'slotHeight', 'tileScale']) {
    if (typeof layout[field] !== 'number' || !Number.isFinite(layout[field])) {
      throw new ConfigValidationError(`Config.trayLayout.${field} must be a finite number`);
    }
  }
  for (const positiveField of ['slotSpacing', 'slotWidth', 'slotHeight', 'tileScale']) {
    if ((layout[positiveField] as number) <= 0) {
      throw new ConfigValidationError(`Config.trayLayout.${positiveField} must be positive`);
    }
  }
}

function validateTimerConfig(value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigValidationError('Config.timer must be an object');
  }

  const timer = value as Record<string, unknown>;
  if (!isPositiveFiniteNumber(timer['durationSeconds'])) {
    throw new ConfigValidationError('Config.timer.durationSeconds must be a positive finite number');
  }
  if (!isNonNegativeFiniteNumber(timer['warningSeconds'])) {
    throw new ConfigValidationError('Config.timer.warningSeconds must be a non-negative finite number');
  }
  if ((timer['warningSeconds'] as number) > (timer['durationSeconds'] as number)) {
    throw new ConfigValidationError('Config.timer.warningSeconds must be <= durationSeconds');
  }
  if (typeof timer['startOnFirstValidTap'] !== 'boolean') {
    throw new ConfigValidationError('Config.timer.startOnFirstValidTap must be a boolean');
  }
  if (typeof timer['debugVisible'] !== 'boolean') {
    throw new ConfigValidationError('Config.timer.debugVisible must be a boolean');
  }
}

function validateTutorialConfig(value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigValidationError('Config.tutorial must be an object');
  }

  const tutorial = value as Record<string, unknown>;
  if (typeof tutorial['enabled'] !== 'boolean') {
    throw new ConfigValidationError('Config.tutorial.enabled must be a boolean');
  }
  if (typeof tutorial['text'] !== 'string' || tutorial['text'].trim() === '') {
    throw new ConfigValidationError('Config.tutorial.text must be a non-empty string');
  }
  if (typeof tutorial['dismissOnFirstValidTap'] !== 'boolean') {
    throw new ConfigValidationError('Config.tutorial.dismissOnFirstValidTap must be a boolean');
  }
  if (!Array.isArray(tutorial['previewTileIds']) || tutorial['previewTileIds'].length !== 3) {
    throw new ConfigValidationError('Config.tutorial.previewTileIds must contain exactly three ids');
  }
  for (const id of tutorial['previewTileIds']) {
    if (typeof id !== 'string' || id.trim() === '') {
      throw new ConfigValidationError('Config.tutorial.previewTileIds must contain non-empty strings');
    }
  }
  if (
    typeof tutorial['dimOpacity'] !== 'number' ||
    !Number.isFinite(tutorial['dimOpacity']) ||
    tutorial['dimOpacity'] < 0 ||
    tutorial['dimOpacity'] > 1
  ) {
    throw new ConfigValidationError('Config.tutorial.dimOpacity must be between 0 and 1');
  }
  if (typeof tutorial['handEnabled'] !== 'boolean') {
    throw new ConfigValidationError('Config.tutorial.handEnabled must be a boolean');
  }
  if (typeof tutorial['handAssetId'] !== 'string' || tutorial['handAssetId'].trim() === '') {
    throw new ConfigValidationError('Config.tutorial.handAssetId must be a non-empty string');
  }
  if (!['loop-preview-tiles', 'first-preview-tile'].includes(tutorial['handPathMode'] as string)) {
    throw new ConfigValidationError('Config.tutorial.handPathMode must be loop-preview-tiles or first-preview-tile');
  }
}

function validateIdleHintConfig(value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigValidationError('Config.idleHint must be an object');
  }

  const idleHint = value as Record<string, unknown>;
  if (typeof idleHint['enabled'] !== 'boolean') {
    throw new ConfigValidationError('Config.idleHint.enabled must be a boolean');
  }
  if (!isPositiveFiniteNumber(idleHint['delaySeconds'])) {
    throw new ConfigValidationError('Config.idleHint.delaySeconds must be a positive finite number');
  }
  if (typeof idleHint['preferTrayPairCompletion'] !== 'boolean') {
    throw new ConfigValidationError('Config.idleHint.preferTrayPairCompletion must be a boolean');
  }
  if (typeof idleHint['deterministicFallback'] !== 'boolean') {
    throw new ConfigValidationError('Config.idleHint.deterministicFallback must be a boolean');
  }
}

function isPositiveFiniteNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
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
