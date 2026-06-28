import { describe, it, expect } from 'vitest';
import { validateConfig, ConfigValidationError } from '../../src/config/ConfigLoader';

const EFFECTS_BASE = {
  enabled: true,
  tileSelectPop: { enabled: true, scale: 1.14, durationMs: 80 },
  blockedShake: { enabled: true, distance: 12, durationMs: 44, repeats: 3, tint: '#ff5d73' },
  matchResolve: { enabled: true, durationMs: 220, flashColor: '#ffd447' },
  trayFullWarning: { enabled: true, durationMs: 90, alpha: 0.55 },
  timerWarningPulse: { enabled: true, scale: 1.12, durationMs: 300 },
  timerWarningContinuousPulse: true,
  outcomePulse: { enabled: true, scale: 1.02, durationMs: 480 },
  ctaPulse: { enabled: true, scale: 1.05, durationMs: 700 },
  matchSparkle: { enabled: true, count: 6, radius: 54, durationMs: 380, color: '#ffd447' },
  boardEntrance: { enabled: true, durationMs: 260, staggerMs: 12 },
};

const END_CARD_BASE = {
  enabled: true,
  showOnWin: true,
  showOnFail: true,
  titleText: 'Pyramid Quest',
  winMessage: 'Level Complete!',
  failMessage: 'Try Again!',
  winMessageColor: '#ffd447',
  failMessageColor: '#ff7a5c',
  entranceAnimation: true,
  fullScreenClick: true,
  ctaText: 'PLAY NOW',
};

const VALID: Record<string, unknown> = {
  projectId: 'TilePyramid_PL01',
  designWidth: 1080,
  designHeight: 1920,
  backgroundId: 'Background_1',
  backgroundFit: 'cover',
  viewportAspect: '9:16',
  portraitPolicy: 'fill',
  landscapePolicy: 'letterbox',
  debugOverlay: false,
  levelId: 'Level_21',
  assignmentSeed: 21000,
  tileTypeCount: 24,
  tutorialPreviewPositionIds: ['L2:-1.5:2.5', 'L2:-0.5:2.5', 'L2:0.5:2.5'],
  boardLayout: { centerX: 540, centerY: 720, spacingX: 110, spacingY: 118, layerOffsetX: 22, layerOffsetY: -22, tileScale: 1 },
  debugBlockedState: false,
  trayCapacity: 5,
  trayLayout: { centerX: 540, centerY: 1580, slotSpacing: 148, slotWidth: 132, slotHeight: 144, tileScale: 0.82 },
  tileFlyDurationMs: 360,
  inputLockEnabled: true,
  blockedTileFeedback: 'shake',
  debugMatchReadyMarker: false,
  matchResolutionDelayMs: 180,
  matchResolutionDurationMs: 220,
  matchResolvingVisual: 'scale-fade',
  inputLockDuringMatchResolution: true,
  debugOutcomeLabel: false,
  timer: { durationSeconds: 30, warningSeconds: 5, startOnFirstValidTap: true, debugVisible: false },
  tutorial: {
    enabled: true,
    text: 'Tap to match!',
    dismissOnFirstValidTap: true,
    previewTileIds: ['L2:-1.5:2.5', 'L2:-0.5:2.5', 'L2:0.5:2.5'],
    dimOpacity: 0.6,
    handEnabled: true,
    handAssetId: 'Pointer_Hand',
    handPathMode: 'loop-preview-tiles',
  },
  idleHint: { enabled: true, delaySeconds: 5, preferTrayPairCompletion: true, deterministicFallback: true },
  debugTimerTutorialIdle: false,
  app: {
    name: 'Pyramid Quest',
    fallbackUrl: 'https://example.com',
    androidUrl: 'https://example.com/android',
    iosUrl: 'https://example.com/ios',
    storeOpenMode: 'record-only',
    safeDevelopmentNavigation: true,
    iconAssetId: 'App_Icon',
    logoAssetId: 'App_Logo',
  },
  cta: {
    enabled: true,
    text: 'PLAY NOW',
    position: { x: 540, y: 1775 },
    size: { width: 460, height: 116 },
    fontSize: 46,
    textColor: '#ffffff',
    backgroundColor: '#ff3f6e',
    borderColor: '#fff4a8',
    cornerRadius: 32,
    visibleDuringGameplay: true,
  },
  endCard: { ...END_CARD_BASE },
  debugCtaEndCardStore: false,
  audio: {
    enabled: true,
    mutedByDefault: false,
    unlockOnFirstValidTap: true,
    sfxVolume: 0.65,
    sfx: { tileSelect: 'Sfx_TileSelect', blockedTap: 'Sfx_BlockedTap', match: 'Sfx_Match', win: 'Sfx_Win', fail: 'Sfx_Fail', ctaClick: 'Sfx_CtaClick' },
    bgm: { enabled: false, assetId: '', volume: 0 },
  },
  effects: { ...EFFECTS_BASE },
  debugAudioEffects: false,
};

describe('BUILD-20 creative polish config', () => {
  it('1. validateConfig accepts full BUILD-20 config', () => {
    const cfg = validateConfig({ ...VALID });
    expect(cfg.effects.ctaPulse.enabled).toBe(true);
    expect(cfg.effects.matchSparkle.enabled).toBe(true);
    expect(cfg.effects.boardEntrance.enabled).toBe(true);
    expect(cfg.endCard.winMessageColor).toBe('#ffd447');
    expect(cfg.endCard.failMessageColor).toBe('#ff7a5c');
  });

  it('2. effects.ctaPulse is validated as a scale effect', () => {
    const cfg = validateConfig({ ...VALID });
    expect(cfg.effects.ctaPulse.scale).toBeGreaterThan(1);
    expect(cfg.effects.ctaPulse.durationMs).toBeGreaterThan(0);
  });

  it('3. validateConfig throws when effects.ctaPulse is missing', () => {
    const { ctaPulse: _, ...effectsWithout } = EFFECTS_BASE as Record<string, unknown>;
    expect(() => validateConfig({ ...VALID, effects: effectsWithout })).toThrow(ConfigValidationError);
  });

  it('4. effects.matchSparkle.count must be a positive integer', () => {
    const bad = { ...EFFECTS_BASE, matchSparkle: { ...EFFECTS_BASE.matchSparkle, count: 0 } };
    expect(() => validateConfig({ ...VALID, effects: bad })).toThrow(/matchSparkle/);
  });

  it('5. effects.matchSparkle.radius must be a positive number', () => {
    const bad = { ...EFFECTS_BASE, matchSparkle: { ...EFFECTS_BASE.matchSparkle, radius: -1 } };
    expect(() => validateConfig({ ...VALID, effects: bad })).toThrow(/matchSparkle/);
  });

  it('6. effects.matchSparkle.color must be a non-empty string', () => {
    const bad = { ...EFFECTS_BASE, matchSparkle: { ...EFFECTS_BASE.matchSparkle, color: '' } };
    expect(() => validateConfig({ ...VALID, effects: bad })).toThrow(/matchSparkle/);
  });

  it('7. effects.timerWarningContinuousPulse must be a boolean', () => {
    const bad = { ...EFFECTS_BASE, timerWarningContinuousPulse: 'yes' };
    expect(() => validateConfig({ ...VALID, effects: bad })).toThrow(/timerWarningContinuousPulse/);
  });

  it('8. effects.boardEntrance.enabled must be a boolean', () => {
    const bad = { ...EFFECTS_BASE, boardEntrance: { enabled: 1, durationMs: 260, staggerMs: 12 } };
    expect(() => validateConfig({ ...VALID, effects: bad })).toThrow(/boardEntrance/);
  });

  it('9. effects.boardEntrance.durationMs must be a non-negative number', () => {
    const bad = { ...EFFECTS_BASE, boardEntrance: { enabled: true, durationMs: -1, staggerMs: 12 } };
    expect(() => validateConfig({ ...VALID, effects: bad })).toThrow(/boardEntrance/);
  });

  it('10. effects.boardEntrance.staggerMs must be a non-negative number', () => {
    const bad = { ...EFFECTS_BASE, boardEntrance: { enabled: true, durationMs: 260, staggerMs: -5 } };
    expect(() => validateConfig({ ...VALID, effects: bad })).toThrow(/boardEntrance/);
  });

  it('11. endCard.winMessageColor must be a non-empty string', () => {
    const bad = { ...END_CARD_BASE, winMessageColor: '' };
    expect(() => validateConfig({ ...VALID, endCard: bad })).toThrow(/winMessageColor/);
  });

  it('12. endCard.failMessageColor must be a non-empty string', () => {
    const bad = { ...END_CARD_BASE, failMessageColor: '   ' };
    expect(() => validateConfig({ ...VALID, endCard: bad })).toThrow(/failMessageColor/);
  });

  it('13. endCard.entranceAnimation must be a boolean', () => {
    const bad = { ...END_CARD_BASE, entranceAnimation: 'true' };
    expect(() => validateConfig({ ...VALID, endCard: bad })).toThrow(/entranceAnimation/);
  });

  it('14. validateConfig throws when endCard.winMessageColor is missing', () => {
    const { winMessageColor: _, ...withoutWin } = END_CARD_BASE as Record<string, unknown>;
    expect(() => validateConfig({ ...VALID, endCard: withoutWin })).toThrow(ConfigValidationError);
  });

  it('15. validateConfig throws when effects.matchSparkle is missing', () => {
    const { matchSparkle: _, ...effectsWithout } = EFFECTS_BASE as Record<string, unknown>;
    expect(() => validateConfig({ ...VALID, effects: effectsWithout })).toThrow(ConfigValidationError);
  });
});
