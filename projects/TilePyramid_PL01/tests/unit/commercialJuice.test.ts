import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ConfigValidationError, isDebugAllowed, validateConfig } from '../../src/config/ConfigLoader';

const CONFIG_PATH = path.join(process.cwd(), 'public/config/game.config.json');

function loadConfig() {
  return validateConfig(JSON.parse(readFileSync(CONFIG_PATH, 'utf8')));
}

describe('BUILD-29 commercial juice config', () => {
  it('1. end card v2 config exists and is enabled', () => {
    const cfg = loadConfig();
    expect(cfg.commercialJuice?.endCardV2.enabled).toBe(true);
    expect(cfg.commercialJuice?.endCardV2.installText).toMatch(/download|play/i);
  });

  it('2. CTA polish config exists and is enabled', () => {
    const cfg = loadConfig();
    expect(cfg.commercialJuice?.ctaPolish.enabled).toBe(true);
    expect(cfg.commercialJuice?.ctaPolish.tapScale).toBeLessThan(1);
  });

  it('3. match reward feedback config exists and is enabled', () => {
    const cfg = loadConfig();
    expect(cfg.commercialJuice?.matchReward.enabled).toBe(true);
    expect(cfg.commercialJuice?.matchReward.texts.length).toBeGreaterThanOrEqual(3);
  });

  it('4. tray landing feedback config exists and is enabled', () => {
    const cfg = loadConfig();
    expect(cfg.commercialJuice?.trayLanding.enabled).toBe(true);
    expect(cfg.commercialJuice?.trayLanding.popScale).toBeGreaterThan(1);
  });

  it('5. idle hint v2 config exists and is enabled', () => {
    const cfg = loadConfig();
    expect(cfg.commercialJuice?.idleHintV2.enabled).toBe(true);
    expect(cfg.commercialJuice?.idleHintV2.targetPulseScale).toBeGreaterThan(1);
  });

  it('6. timer warning polish config exists and is enabled', () => {
    const cfg = loadConfig();
    expect(cfg.commercialJuice?.timerWarningPolish.enabled).toBe(true);
    expect(cfg.commercialJuice?.timerWarningPolish.dangerColor).toMatch(/^#/);
  });

  it('7. commercial mode still disables debug UI', () => {
    const cfg = validateConfig({ ...loadConfig(), buildMode: 'commercial' });
    expect(isDebugAllowed(cfg)).toBe(false);
  });

  it('8. review mode still hides debug overlay', () => {
    const cfg = validateConfig({ ...loadConfig(), buildMode: 'review' });
    expect(isDebugAllowed(cfg)).toBe(false);
  });

  it('9. commercial juice validation rejects malformed match reward text config', () => {
    const cfg = loadConfig();
    expect(() =>
      validateConfig({
        ...cfg,
        commercialJuice: {
          ...cfg.commercialJuice,
          matchReward: { ...cfg.commercialJuice?.matchReward, texts: [] },
        },
      })
    ).toThrow(ConfigValidationError);
  });
});
