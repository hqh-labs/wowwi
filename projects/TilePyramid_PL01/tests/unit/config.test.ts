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
});
