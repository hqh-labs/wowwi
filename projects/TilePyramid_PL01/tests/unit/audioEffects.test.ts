import { describe, expect, it } from 'vitest';
import {
  createAudioState,
  recordAudioError,
  requestSfx,
  setAudioMuted,
  startBgm,
  stopBgm,
  unlockAudio,
} from '../../src/gameplay/audio/AudioSystem';
import {
  createEffectState,
  requestEffect,
  setTimerWarningVisual,
} from '../../src/gameplay/effects/EffectSystem';

describe('AudioSystem', () => {
  it('starts locked and respects muted default', () => {
    const state = createAudioState({ enabled: true, mutedByDefault: true, bgmEnabled: false });
    expect(state.enabled).toBe(true);
    expect(state.unlocked).toBe(false);
    expect(state.muted).toBe(true);
    expect(state.lastSfxPlayed).toBeNull();
  });

  it('unlocks only when allowed', () => {
    const state = createAudioState({ enabled: true, mutedByDefault: false, bgmEnabled: false });
    expect(unlockAudio(state, false).unlocked).toBe(false);
    expect(unlockAudio(state, true).unlocked).toBe(true);
  });

  it('does not unlock when disabled', () => {
    const state = createAudioState({ enabled: false, mutedByDefault: false, bgmEnabled: false });
    expect(unlockAudio(state, true).unlocked).toBe(false);
  });

  it('ignores SFX requests while locked', () => {
    const state = createAudioState({ enabled: true, mutedByDefault: false, bgmEnabled: false });
    expect(requestSfx(state, 'Sfx_TileSelect').lastSfxPlayed).toBeNull();
  });

  it('records an SFX request after unlock', () => {
    const state = unlockAudio(createAudioState({ enabled: true, mutedByDefault: false, bgmEnabled: false }), true);
    const next = requestSfx(state, 'Sfx_TileSelect');
    expect(next.lastSfxPlayed).toBe('Sfx_TileSelect');
    expect(next.requestedSfx).toEqual(['Sfx_TileSelect']);
  });

  it('ignores SFX requests while muted', () => {
    const state = unlockAudio(createAudioState({ enabled: true, mutedByDefault: true, bgmEnabled: false }), true);
    expect(requestSfx(state, 'Sfx_TileSelect').lastSfxPlayed).toBeNull();
  });

  it('can unmute before playing SFX', () => {
    const state = unlockAudio(createAudioState({ enabled: true, mutedByDefault: true, bgmEnabled: false }), true);
    const next = requestSfx(setAudioMuted(state, false), 'Sfx_Match');
    expect(next.lastSfxPlayed).toBe('Sfx_Match');
  });

  it('does not start BGM when BGM is disabled', () => {
    const state = unlockAudio(createAudioState({ enabled: true, mutedByDefault: false, bgmEnabled: false }), true);
    expect(startBgm(state).bgmPlaying).toBe(false);
  });

  it('starts and stops BGM when enabled and unlocked', () => {
    const state = unlockAudio(createAudioState({ enabled: true, mutedByDefault: false, bgmEnabled: true }), true);
    expect(startBgm(state).bgmPlaying).toBe(true);
    expect(stopBgm(startBgm(state)).bgmPlaying).toBe(false);
  });

  it('tracks playback errors without changing last SFX', () => {
    const state = requestSfx(
      unlockAudio(createAudioState({ enabled: true, mutedByDefault: false, bgmEnabled: false }), true),
      'Sfx_Fail'
    );
    const next = recordAudioError(state);
    expect(next.errorCount).toBe(1);
    expect(next.lastSfxPlayed).toBe('Sfx_Fail');
  });
});

describe('EffectSystem', () => {
  it('starts with no last effect', () => {
    const state = createEffectState(true);
    expect(state.enabled).toBe(true);
    expect(state.lastEffectTriggered).toBeNull();
  });

  it('records requested effects when enabled', () => {
    const state = requestEffect(createEffectState(true), 'tile-select-pop');
    expect(state.lastEffectTriggered).toBe('tile-select-pop');
  });

  it('ignores requested effects when disabled', () => {
    const state = requestEffect(createEffectState(false), 'blocked-shake');
    expect(state.lastEffectTriggered).toBeNull();
  });

  it('tracks timer warning visual state', () => {
    const active = setTimerWarningVisual(createEffectState(true), true);
    expect(active.timerWarningVisualActive).toBe(true);
    expect(setTimerWarningVisual(active, false).timerWarningVisualActive).toBe(false);
  });

  it('forces timer warning visual off when disabled', () => {
    const active = setTimerWarningVisual(createEffectState(false), true);
    expect(active.timerWarningVisualActive).toBe(false);
  });

  it('keeps formal solvability outside audio/effect state', () => {
    const state = requestEffect(createEffectState(true), 'match-resolve');
    expect(state).not.toHaveProperty('formalSolvability');
  });
});
