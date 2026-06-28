import { describe, it, expect } from 'vitest';
import { validateConfig, ConfigValidationError } from '../../src/config/ConfigLoader';

const VALID: Record<string, unknown> = {
  projectId: 'TilePyramid_PL01',
  designWidth: 1080,
  designHeight: 1920,
  backgroundId: 'Background_1',
  backgroundFit: 'cover',
  viewportAspect: '9:16',
  portraitPolicy: 'fill',
  landscapePolicy: 'letterbox',
  debugOverlay: true,
  levelId: 'Level_21',
  assignmentSeed: 21000,
  tileTypeCount: 24,
  tutorialPreviewPositionIds: ['L2:-1.5:2.5', 'L2:-0.5:2.5', 'L2:0.5:2.5'],
  boardLayout: {
    centerX: 540,
    centerY: 720,
    spacingX: 110,
    spacingY: 118,
    layerOffsetX: 22,
    layerOffsetY: -22,
    tileScale: 1,
    maxWidth: 980,
    maxHeight: 1120,
  },
  debugBlockedState: true,
  trayCapacity: 5,
  trayLayout: {
    centerX: 540,
    centerY: 1580,
    slotSpacing: 148,
    slotWidth: 132,
    slotHeight: 144,
    tileScale: 0.82,
  },
  tileFlyDurationMs: 360,
  inputLockEnabled: true,
  blockedTileFeedback: 'shake',
  debugMatchReadyMarker: true,
  matchResolutionDelayMs: 180,
  matchResolutionDurationMs: 220,
  matchResolvingVisual: 'scale-fade',
  inputLockDuringMatchResolution: true,
  debugOutcomeLabel: true,
  timer: {
    durationSeconds: 30,
    warningSeconds: 5,
    startOnFirstValidTap: true,
    debugVisible: true,
  },
  tutorial: {
    enabled: true,
    text: 'Tap to match!',
    dismissOnFirstValidTap: true,
    previewTileIds: ['L2:-1.5:2.5', 'L2:-0.5:2.5', 'L2:0.5:2.5'],
    dimOpacity: 0.5,
    handEnabled: true,
    handAssetId: 'Pointer_Hand',
    handPathMode: 'loop-preview-tiles',
  },
  idleHint: {
    enabled: true,
    delaySeconds: 5,
    preferTrayPairCompletion: true,
    deterministicFallback: true,
  },
  debugTimerTutorialIdle: true,
  app: {
    name: 'Pyramid Quest',
    fallbackUrl: 'https://example.com/pyramid-quest',
    androidUrl: 'https://example.com/pyramid-quest/android',
    iosUrl: 'https://example.com/pyramid-quest/ios',
    storeOpenMode: 'record-only',
    safeDevelopmentNavigation: true,
    iconAssetId: 'App_Icon',
    logoAssetId: 'App_Logo',
  },
  cta: {
    enabled: true,
    text: 'PLAY NOW',
    position: { x: 540, y: 1775 },
    size: { width: 420, height: 112 },
    fontSize: 42,
    textColor: '#ffffff',
    backgroundColor: '#ff3f6e',
    borderColor: '#fff4a8',
    cornerRadius: 28,
    visibleDuringGameplay: true,
  },
  endCard: {
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
  },
  debugCtaEndCardStore: true,
  audio: {
    enabled: true,
    mutedByDefault: false,
    unlockOnFirstValidTap: true,
    sfxVolume: 0.65,
    sfx: {
      tileSelect: 'Sfx_TileSelect',
      blockedTap: 'Sfx_BlockedTap',
      match: 'Sfx_Match',
      win: 'Sfx_Win',
      fail: 'Sfx_Fail',
      ctaClick: 'Sfx_CtaClick',
    },
    bgm: {
      enabled: false,
      assetId: '',
      volume: 0,
    },
  },
  effects: {
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
  },
  debugAudioEffects: true,
};

describe('validateConfig', () => {
  it('accepts a valid config', () => {
    const cfg = validateConfig({ ...VALID });
    expect(cfg.projectId).toBe('TilePyramid_PL01');
    expect(cfg.designWidth).toBe(1080);
    expect(cfg.designHeight).toBe(1920);
    expect(cfg.debugOverlay).toBe(true);
  });

  it('throws when passed null', () => {
    expect(() => validateConfig(null)).toThrow(ConfigValidationError);
  });

  it('throws when passed a non-object', () => {
    expect(() => validateConfig('string')).toThrow(ConfigValidationError);
    expect(() => validateConfig(42)).toThrow(ConfigValidationError);
  });

  it('throws when projectId is missing', () => {
    const bad = { ...VALID };
    delete bad['projectId'];
    expect(() => validateConfig(bad)).toThrow(/projectId/);
  });

  it('throws when designWidth is zero', () => {
    expect(() => validateConfig({ ...VALID, designWidth: 0 })).toThrow(/designWidth/);
  });

  it('throws when designWidth is negative', () => {
    expect(() => validateConfig({ ...VALID, designWidth: -100 })).toThrow(/designWidth/);
  });

  it('throws when designHeight is missing', () => {
    const bad = { ...VALID };
    delete bad['designHeight'];
    expect(() => validateConfig(bad)).toThrow(/designHeight/);
  });

  it('throws when backgroundFit is invalid', () => {
    expect(() => validateConfig({ ...VALID, backgroundFit: 'stretch' })).toThrow(/backgroundFit/);
  });

  it('accepts backgroundFit contain', () => {
    expect(() => validateConfig({ ...VALID, backgroundFit: 'contain' })).not.toThrow();
  });

  it('throws when debugOverlay is not boolean', () => {
    expect(() => validateConfig({ ...VALID, debugOverlay: 'yes' })).toThrow(/debugOverlay/);
  });

  it('throws when backgroundId is empty string', () => {
    expect(() => validateConfig({ ...VALID, backgroundId: '  ' })).toThrow(/backgroundId/);
  });

  it('throws when tutorial preview ids do not contain exactly three ids', () => {
    expect(() => validateConfig({ ...VALID, tutorialPreviewPositionIds: ['a'] })).toThrow(
      /tutorialPreviewPositionIds/
    );
  });

  it('throws when board layout tileScale is invalid', () => {
    expect(() =>
      validateConfig({ ...VALID, boardLayout: { ...(VALID['boardLayout'] as object), tileScale: 0 } })
    ).toThrow(/tileScale/);
  });

  it('throws when trayCapacity is invalid', () => {
    expect(() => validateConfig({ ...VALID, trayCapacity: 0 })).toThrow(/trayCapacity/);
  });

  it('throws when tray layout slot size is invalid', () => {
    expect(() =>
      validateConfig({ ...VALID, trayLayout: { ...(VALID['trayLayout'] as object), slotWidth: -1 } })
    ).toThrow(/slotWidth/);
  });

  it('throws when match resolution duration is invalid', () => {
    expect(() => validateConfig({ ...VALID, matchResolutionDurationMs: -1 })).toThrow(
      /matchResolutionDurationMs/
    );
  });

  it('throws when match resolving visual is invalid', () => {
    expect(() => validateConfig({ ...VALID, matchResolvingVisual: 'sparkle' })).toThrow(
      /matchResolvingVisual/
    );
  });

  it('throws when timer duration is invalid', () => {
    expect(() => validateConfig({ ...VALID, timer: { ...(VALID['timer'] as object), durationSeconds: 0 } })).toThrow(
      /timer.durationSeconds/
    );
  });

  it('throws when tutorial preview ids are invalid', () => {
    expect(() =>
      validateConfig({ ...VALID, tutorial: { ...(VALID['tutorial'] as object), previewTileIds: ['a'] } })
    ).toThrow(/tutorial.previewTileIds/);
  });

  it('throws when idle hint delay is invalid', () => {
    expect(() =>
      validateConfig({ ...VALID, idleHint: { ...(VALID['idleHint'] as object), delaySeconds: -1 } })
    ).toThrow(/idleHint.delaySeconds/);
  });

  it('throws when CTA size is invalid', () => {
    expect(() =>
      validateConfig({ ...VALID, cta: { ...(VALID['cta'] as object), size: { width: 0, height: 112 } } })
    ).toThrow(/cta.size.width/);
  });

  it('throws when CTA position is invalid', () => {
    expect(() =>
      validateConfig({ ...VALID, cta: { ...(VALID['cta'] as object), position: { x: 'center', y: 1775 } } })
    ).toThrow(/cta.position.x/);
  });

  it('throws when enabled end card text is missing', () => {
    expect(() =>
      validateConfig({ ...VALID, endCard: { ...(VALID['endCard'] as object), winMessage: ' ' } })
    ).toThrow(/endCard.winMessage/);
  });

  it('throws when audio SFX volume is invalid', () => {
    expect(() =>
      validateConfig({ ...VALID, audio: { ...(VALID['audio'] as object), sfxVolume: 2 } })
    ).toThrow(/audio.sfxVolume/);
  });

  it('allows disabled BGM without an asset id', () => {
    expect(() => validateConfig({ ...VALID })).not.toThrow();
  });

  it('throws when enabled BGM has no asset id', () => {
    const audio = VALID['audio'] as Record<string, unknown>;
    expect(() =>
      validateConfig({ ...VALID, audio: { ...audio, bgm: { enabled: true, assetId: '', volume: 0.4 } } })
    ).toThrow(/audio.bgm.assetId/);
  });

  it('throws when blocked shake repeats is invalid', () => {
    const effects = VALID['effects'] as Record<string, unknown>;
    expect(() =>
      validateConfig({ ...VALID, effects: { ...effects, blockedShake: { enabled: true, distance: 10, durationMs: 48, repeats: -1, tint: '#ff5d73' } } })
    ).toThrow(/blockedShake.repeats/);
  });
});
