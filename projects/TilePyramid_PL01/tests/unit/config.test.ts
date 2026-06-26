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
});
