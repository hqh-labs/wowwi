import type { BuildMode, GameConfig } from '../types';

export type { BuildMode, GameConfig };

const VALID_BUILD_MODES: BuildMode[] = ['development', 'review', 'commercial'];

export function isCommercialMode(config: GameConfig): boolean {
  return config.buildMode === 'commercial';
}

export function isDebugAllowed(config: GameConfig): boolean {
  return config.buildMode !== 'commercial' && config.buildMode !== 'review';
}

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
  'app',
  'cta',
  'endCard',
  'debugCtaEndCardStore',
  'audio',
  'effects',
  'debugAudioEffects',
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
  if (obj['buildMode'] !== undefined && !VALID_BUILD_MODES.includes(obj['buildMode'] as BuildMode)) {
    throw new ConfigValidationError(`Config.buildMode must be one of: ${VALID_BUILD_MODES.join(', ')}`);
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
  validateAppConfig(obj['app']);
  validateCtaConfig(obj['cta']);
  validateEndCardConfig(obj['endCard']);
  if (typeof obj['debugCtaEndCardStore'] !== 'boolean') {
    throw new ConfigValidationError('Config.debugCtaEndCardStore must be a boolean');
  }
  validateAudioConfig(obj['audio']);
  validateEffectsConfig(obj['effects']);
  if (obj['commercialJuice'] !== undefined) {
    validateCommercialJuiceConfig(obj['commercialJuice']);
  }
  if (typeof obj['debugAudioEffects'] !== 'boolean') {
    throw new ConfigValidationError('Config.debugAudioEffects must be a boolean');
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

function validateAppConfig(value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigValidationError('Config.app must be an object');
  }
  const app = value as Record<string, unknown>;
  for (const field of ['name', 'fallbackUrl', 'androidUrl', 'iosUrl', 'iconAssetId', 'logoAssetId']) {
    if (typeof app[field] !== 'string' || (app[field] as string).trim() === '') {
      throw new ConfigValidationError(`Config.app.${field} must be a non-empty string`);
    }
  }
  if (!['record-only', 'navigate'].includes(app['storeOpenMode'] as string)) {
    throw new ConfigValidationError('Config.app.storeOpenMode must be record-only or navigate');
  }
  if (typeof app['safeDevelopmentNavigation'] !== 'boolean') {
    throw new ConfigValidationError('Config.app.safeDevelopmentNavigation must be a boolean');
  }
}

function validateCtaConfig(value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigValidationError('Config.cta must be an object');
  }
  const cta = value as Record<string, unknown>;
  if (typeof cta['enabled'] !== 'boolean') {
    throw new ConfigValidationError('Config.cta.enabled must be a boolean');
  }
  if (typeof cta['text'] !== 'string' || cta['text'].trim() === '') {
    throw new ConfigValidationError('Config.cta.text must be a non-empty string');
  }
  validatePoint(cta['position'], 'Config.cta.position');
  validateSize(cta['size'], 'Config.cta.size');
  if (!isPositiveFiniteNumber(cta['fontSize'])) {
    throw new ConfigValidationError('Config.cta.fontSize must be a positive finite number');
  }
  for (const field of ['textColor', 'backgroundColor', 'borderColor']) {
    if (typeof cta[field] !== 'string' || (cta[field] as string).trim() === '') {
      throw new ConfigValidationError(`Config.cta.${field} must be a non-empty string`);
    }
  }
  if (!isNonNegativeFiniteNumber(cta['cornerRadius'])) {
    throw new ConfigValidationError('Config.cta.cornerRadius must be a non-negative finite number');
  }
  if (typeof cta['visibleDuringGameplay'] !== 'boolean') {
    throw new ConfigValidationError('Config.cta.visibleDuringGameplay must be a boolean');
  }
}

function validateEndCardConfig(value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigValidationError('Config.endCard must be an object');
  }
  const endCard = value as Record<string, unknown>;
  for (const field of ['enabled', 'showOnWin', 'showOnFail', 'fullScreenClick', 'entranceAnimation']) {
    if (typeof endCard[field] !== 'boolean') {
      throw new ConfigValidationError(`Config.endCard.${field} must be a boolean`);
    }
  }
  if (endCard['enabled']) {
    for (const field of ['titleText', 'winMessage', 'failMessage', 'ctaText']) {
      if (typeof endCard[field] !== 'string' || (endCard[field] as string).trim() === '') {
        throw new ConfigValidationError(`Config.endCard.${field} must be a non-empty string when enabled`);
      }
    }
  }
  for (const field of ['winMessageColor', 'failMessageColor']) {
    if (typeof endCard[field] !== 'string' || (endCard[field] as string).trim() === '') {
      throw new ConfigValidationError(`Config.endCard.${field} must be a non-empty string`);
    }
  }
}

function validateAudioConfig(value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigValidationError('Config.audio must be an object');
  }
  const audio = value as Record<string, unknown>;
  for (const field of ['enabled', 'mutedByDefault', 'unlockOnFirstValidTap']) {
    if (typeof audio[field] !== 'boolean') {
      throw new ConfigValidationError(`Config.audio.${field} must be a boolean`);
    }
  }
  if (
    typeof audio['sfxVolume'] !== 'number' ||
    !Number.isFinite(audio['sfxVolume']) ||
    audio['sfxVolume'] < 0 ||
    audio['sfxVolume'] > 1
  ) {
    throw new ConfigValidationError('Config.audio.sfxVolume must be between 0 and 1');
  }
  if (typeof audio['sfx'] !== 'object' || audio['sfx'] === null) {
    throw new ConfigValidationError('Config.audio.sfx must be an object');
  }
  const sfx = audio['sfx'] as Record<string, unknown>;
  for (const field of ['tileSelect', 'blockedTap', 'match', 'win', 'fail', 'ctaClick']) {
    if (typeof sfx[field] !== 'string' || (sfx[field] as string).trim() === '') {
      throw new ConfigValidationError(`Config.audio.sfx.${field} must be a non-empty string`);
    }
  }
  if (typeof audio['bgm'] !== 'object' || audio['bgm'] === null) {
    throw new ConfigValidationError('Config.audio.bgm must be an object');
  }
  const bgm = audio['bgm'] as Record<string, unknown>;
  if (typeof bgm['enabled'] !== 'boolean') {
    throw new ConfigValidationError('Config.audio.bgm.enabled must be a boolean');
  }
  if (bgm['enabled'] && (typeof bgm['assetId'] !== 'string' || (bgm['assetId'] as string).trim() === '')) {
    throw new ConfigValidationError('Config.audio.bgm.assetId must be a non-empty string when enabled');
  }
  if (typeof bgm['assetId'] !== 'string') {
    throw new ConfigValidationError('Config.audio.bgm.assetId must be a string');
  }
  if (
    typeof bgm['volume'] !== 'number' ||
    !Number.isFinite(bgm['volume']) ||
    bgm['volume'] < 0 ||
    bgm['volume'] > 1
  ) {
    throw new ConfigValidationError('Config.audio.bgm.volume must be between 0 and 1');
  }
}

function validateEffectsConfig(value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigValidationError('Config.effects must be an object');
  }
  const effects = value as Record<string, unknown>;
  if (typeof effects['enabled'] !== 'boolean') {
    throw new ConfigValidationError('Config.effects.enabled must be a boolean');
  }
  validateScaleEffect(effects['tileSelectPop'], 'Config.effects.tileSelectPop');
  validateBlockedShakeEffect(effects['blockedShake']);
  validateMatchResolveEffect(effects['matchResolve']);
  validateTrayFullEffect(effects['trayFullWarning']);
  validateScaleEffect(effects['timerWarningPulse'], 'Config.effects.timerWarningPulse');
  if (typeof effects['timerWarningContinuousPulse'] !== 'boolean') {
    throw new ConfigValidationError('Config.effects.timerWarningContinuousPulse must be a boolean');
  }
  validateScaleEffect(effects['outcomePulse'], 'Config.effects.outcomePulse');
  validateScaleEffect(effects['ctaPulse'], 'Config.effects.ctaPulse');
  validateMatchSparkleConfig(effects['matchSparkle']);
  validateBoardEntranceConfig(effects['boardEntrance']);
}

function validateMatchSparkleConfig(value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigValidationError('Config.effects.matchSparkle must be an object');
  }
  const cfg = value as Record<string, unknown>;
  if (typeof cfg['enabled'] !== 'boolean') {
    throw new ConfigValidationError('Config.effects.matchSparkle.enabled must be a boolean');
  }
  if (!Number.isInteger(cfg['count']) || (cfg['count'] as number) <= 0) {
    throw new ConfigValidationError('Config.effects.matchSparkle.count must be a positive integer');
  }
  if (!isPositiveFiniteNumber(cfg['radius'])) {
    throw new ConfigValidationError('Config.effects.matchSparkle.radius must be a positive finite number');
  }
  if (!isNonNegativeFiniteNumber(cfg['durationMs'])) {
    throw new ConfigValidationError('Config.effects.matchSparkle.durationMs must be a non-negative finite number');
  }
  if (typeof cfg['color'] !== 'string' || (cfg['color'] as string).trim() === '') {
    throw new ConfigValidationError('Config.effects.matchSparkle.color must be a non-empty string');
  }
}

function validateBoardEntranceConfig(value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigValidationError('Config.effects.boardEntrance must be an object');
  }
  const cfg = value as Record<string, unknown>;
  if (typeof cfg['enabled'] !== 'boolean') {
    throw new ConfigValidationError('Config.effects.boardEntrance.enabled must be a boolean');
  }
  if (!isNonNegativeFiniteNumber(cfg['durationMs'])) {
    throw new ConfigValidationError('Config.effects.boardEntrance.durationMs must be a non-negative finite number');
  }
  if (!isNonNegativeFiniteNumber(cfg['staggerMs'])) {
    throw new ConfigValidationError('Config.effects.boardEntrance.staggerMs must be a non-negative finite number');
  }
}

function validateScaleEffect(value: unknown, label: string): void {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigValidationError(`${label} must be an object`);
  }
  const effect = value as Record<string, unknown>;
  if (typeof effect['enabled'] !== 'boolean') {
    throw new ConfigValidationError(`${label}.enabled must be a boolean`);
  }
  if (!isPositiveFiniteNumber(effect['scale'])) {
    throw new ConfigValidationError(`${label}.scale must be a positive finite number`);
  }
  if (!isNonNegativeFiniteNumber(effect['durationMs'])) {
    throw new ConfigValidationError(`${label}.durationMs must be a non-negative finite number`);
  }
}

function validateBlockedShakeEffect(value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigValidationError('Config.effects.blockedShake must be an object');
  }
  const effect = value as Record<string, unknown>;
  if (typeof effect['enabled'] !== 'boolean') {
    throw new ConfigValidationError('Config.effects.blockedShake.enabled must be a boolean');
  }
  if (!isNonNegativeFiniteNumber(effect['distance'])) {
    throw new ConfigValidationError('Config.effects.blockedShake.distance must be a non-negative finite number');
  }
  if (!isNonNegativeFiniteNumber(effect['durationMs'])) {
    throw new ConfigValidationError('Config.effects.blockedShake.durationMs must be a non-negative finite number');
  }
  if (!Number.isInteger(effect['repeats']) || (effect['repeats'] as number) < 0) {
    throw new ConfigValidationError('Config.effects.blockedShake.repeats must be a non-negative integer');
  }
  if (typeof effect['tint'] !== 'string' || effect['tint'].trim() === '') {
    throw new ConfigValidationError('Config.effects.blockedShake.tint must be a non-empty string');
  }
}

function validateMatchResolveEffect(value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigValidationError('Config.effects.matchResolve must be an object');
  }
  const effect = value as Record<string, unknown>;
  if (typeof effect['enabled'] !== 'boolean') {
    throw new ConfigValidationError('Config.effects.matchResolve.enabled must be a boolean');
  }
  if (!isNonNegativeFiniteNumber(effect['durationMs'])) {
    throw new ConfigValidationError('Config.effects.matchResolve.durationMs must be a non-negative finite number');
  }
  if (typeof effect['flashColor'] !== 'string' || effect['flashColor'].trim() === '') {
    throw new ConfigValidationError('Config.effects.matchResolve.flashColor must be a non-empty string');
  }
}

function validateTrayFullEffect(value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigValidationError('Config.effects.trayFullWarning must be an object');
  }
  const effect = value as Record<string, unknown>;
  if (typeof effect['enabled'] !== 'boolean') {
    throw new ConfigValidationError('Config.effects.trayFullWarning.enabled must be a boolean');
  }
  if (!isNonNegativeFiniteNumber(effect['durationMs'])) {
    throw new ConfigValidationError('Config.effects.trayFullWarning.durationMs must be a non-negative finite number');
  }
  if (
    typeof effect['alpha'] !== 'number' ||
    !Number.isFinite(effect['alpha']) ||
    effect['alpha'] < 0 ||
    effect['alpha'] > 1
  ) {
    throw new ConfigValidationError('Config.effects.trayFullWarning.alpha must be between 0 and 1');
  }
}

function validateCommercialJuiceConfig(value: unknown): void {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigValidationError('Config.commercialJuice must be an object');
  }
  const cfg = value as Record<string, unknown>;
  if (typeof cfg['enabled'] !== 'boolean') {
    throw new ConfigValidationError('Config.commercialJuice.enabled must be a boolean');
  }
  if (
    typeof cfg['intensity'] !== 'number' ||
    !Number.isFinite(cfg['intensity']) ||
    cfg['intensity'] < 0 ||
    cfg['intensity'] > 1
  ) {
    throw new ConfigValidationError('Config.commercialJuice.intensity must be between 0 and 1');
  }
  validateEndCardV2Config(cfg['endCardV2']);
  validateCtaPolishConfig(cfg['ctaPolish']);
  validateMatchRewardConfig(cfg['matchReward']);
  validateTrayLandingConfig(cfg['trayLanding']);
  validateTileTapPolishConfig(cfg['tileTapPolish']);
  validateIdleHintV2Config(cfg['idleHintV2']);
  validateTimerWarningPolishConfig(cfg['timerWarningPolish']);
  validateBoardDepthConfig(cfg['boardDepth']);
}

function validateEndCardV2Config(value: unknown): void {
  const cfg = expectObject(value, 'Config.commercialJuice.endCardV2');
  expectBoolean(cfg['enabled'], 'Config.commercialJuice.endCardV2.enabled');
  expectNonEmptyString(cfg['installText'], 'Config.commercialJuice.endCardV2.installText');
  expectPositiveInteger(cfg['particleCount'], 'Config.commercialJuice.endCardV2.particleCount');
  expectPositiveInteger(cfg['rayCount'], 'Config.commercialJuice.endCardV2.rayCount');
}

function validateCtaPolishConfig(value: unknown): void {
  const cfg = expectObject(value, 'Config.commercialJuice.ctaPolish');
  expectBoolean(cfg['enabled'], 'Config.commercialJuice.ctaPolish.enabled');
  expectBoolean(cfg['shineEnabled'], 'Config.commercialJuice.ctaPolish.shineEnabled');
  if (!isPositiveFiniteNumber(cfg['tapScale'])) {
    throw new ConfigValidationError('Config.commercialJuice.ctaPolish.tapScale must be a positive finite number');
  }
  expectAlpha(cfg['glowAlpha'], 'Config.commercialJuice.ctaPolish.glowAlpha');
}

function validateMatchRewardConfig(value: unknown): void {
  const cfg = expectObject(value, 'Config.commercialJuice.matchReward');
  expectBoolean(cfg['enabled'], 'Config.commercialJuice.matchReward.enabled');
  if (!Array.isArray(cfg['texts']) || cfg['texts'].length === 0) {
    throw new ConfigValidationError('Config.commercialJuice.matchReward.texts must be a non-empty array');
  }
  for (const text of cfg['texts']) {
    expectNonEmptyString(text, 'Config.commercialJuice.matchReward.texts item');
  }
  if (!isPositiveFiniteNumber(cfg['fontSize'])) {
    throw new ConfigValidationError('Config.commercialJuice.matchReward.fontSize must be a positive finite number');
  }
  if (!isNonNegativeFiniteNumber(cfg['durationMs'])) {
    throw new ConfigValidationError('Config.commercialJuice.matchReward.durationMs must be a non-negative finite number');
  }
  expectPositiveInteger(cfg['burstCount'], 'Config.commercialJuice.matchReward.burstCount');
}

function validateTrayLandingConfig(value: unknown): void {
  const cfg = expectObject(value, 'Config.commercialJuice.trayLanding');
  expectBoolean(cfg['enabled'], 'Config.commercialJuice.trayLanding.enabled');
  if (!isPositiveFiniteNumber(cfg['popScale'])) {
    throw new ConfigValidationError('Config.commercialJuice.trayLanding.popScale must be a positive finite number');
  }
  if (!isNonNegativeFiniteNumber(cfg['durationMs'])) {
    throw new ConfigValidationError('Config.commercialJuice.trayLanding.durationMs must be a non-negative finite number');
  }
  expectNonEmptyString(cfg['glowColor'], 'Config.commercialJuice.trayLanding.glowColor');
}

function validateTileTapPolishConfig(value: unknown): void {
  const cfg = expectObject(value, 'Config.commercialJuice.tileTapPolish');
  expectBoolean(cfg['enabled'], 'Config.commercialJuice.tileTapPolish.enabled');
  if (!isNonNegativeFiniteNumber(cfg['liftPixels'])) {
    throw new ConfigValidationError('Config.commercialJuice.tileTapPolish.liftPixels must be a non-negative finite number');
  }
  expectNonEmptyString(cfg['blockedRingColor'], 'Config.commercialJuice.tileTapPolish.blockedRingColor');
  expectAlpha(cfg['selectableGlowAlpha'], 'Config.commercialJuice.tileTapPolish.selectableGlowAlpha');
}

function validateIdleHintV2Config(value: unknown): void {
  const cfg = expectObject(value, 'Config.commercialJuice.idleHintV2');
  expectBoolean(cfg['enabled'], 'Config.commercialJuice.idleHintV2.enabled');
  if (!isPositiveFiniteNumber(cfg['targetPulseScale'])) {
    throw new ConfigValidationError('Config.commercialJuice.idleHintV2.targetPulseScale must be a positive finite number');
  }
  expectNonEmptyString(cfg['trailColor'], 'Config.commercialJuice.idleHintV2.trailColor');
}

function validateTimerWarningPolishConfig(value: unknown): void {
  const cfg = expectObject(value, 'Config.commercialJuice.timerWarningPolish');
  expectBoolean(cfg['enabled'], 'Config.commercialJuice.timerWarningPolish.enabled');
  expectNonEmptyString(cfg['warningColor'], 'Config.commercialJuice.timerWarningPolish.warningColor');
  expectNonEmptyString(cfg['dangerColor'], 'Config.commercialJuice.timerWarningPolish.dangerColor');
  expectAlpha(cfg['glowAlpha'], 'Config.commercialJuice.timerWarningPolish.glowAlpha');
}

function validateBoardDepthConfig(value: unknown): void {
  const cfg = expectObject(value, 'Config.commercialJuice.boardDepth');
  expectBoolean(cfg['enabled'], 'Config.commercialJuice.boardDepth.enabled');
  expectAlpha(cfg['vignetteAlpha'], 'Config.commercialJuice.boardDepth.vignetteAlpha');
  expectAlpha(cfg['boardGlowAlpha'], 'Config.commercialJuice.boardDepth.boardGlowAlpha');
  expectAlpha(cfg['trayGlowAlpha'], 'Config.commercialJuice.boardDepth.trayGlowAlpha');
}

function expectObject(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigValidationError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function expectBoolean(value: unknown, label: string): void {
  if (typeof value !== 'boolean') {
    throw new ConfigValidationError(`${label} must be a boolean`);
  }
}

function expectNonEmptyString(value: unknown, label: string): void {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ConfigValidationError(`${label} must be a non-empty string`);
  }
}

function expectPositiveInteger(value: unknown, label: string): void {
  if (!Number.isInteger(value) || (value as number) <= 0) {
    throw new ConfigValidationError(`${label} must be a positive integer`);
  }
}

function expectAlpha(value: unknown, label: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new ConfigValidationError(`${label} must be between 0 and 1`);
  }
}

function validatePoint(value: unknown, label: string): void {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigValidationError(`${label} must be an object`);
  }
  const point = value as Record<string, unknown>;
  for (const field of ['x', 'y']) {
    if (typeof point[field] !== 'number' || !Number.isFinite(point[field])) {
      throw new ConfigValidationError(`${label}.${field} must be a finite number`);
    }
  }
}

function validateSize(value: unknown, label: string): void {
  if (typeof value !== 'object' || value === null) {
    throw new ConfigValidationError(`${label} must be an object`);
  }
  const size = value as Record<string, unknown>;
  for (const field of ['width', 'height']) {
    if (!isPositiveFiniteNumber(size[field])) {
      throw new ConfigValidationError(`${label}.${field} must be a positive finite number`);
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
