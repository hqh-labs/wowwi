export interface AudioState {
  enabled: boolean;
  unlocked: boolean;
  muted: boolean;
  bgmEnabled: boolean;
  bgmPlaying: boolean;
  lastSfxPlayed: string | null;
  errorCount: number;
  requestedSfx: string[];
}

export interface AudioStateOptions {
  enabled: boolean;
  mutedByDefault: boolean;
  bgmEnabled: boolean;
}

export function createAudioState(options: AudioStateOptions): AudioState {
  return {
    enabled: options.enabled,
    unlocked: false,
    muted: options.mutedByDefault,
    bgmEnabled: options.bgmEnabled,
    bgmPlaying: false,
    lastSfxPlayed: null,
    errorCount: 0,
    requestedSfx: [],
  };
}

export function unlockAudio(state: AudioState, allowed: boolean): AudioState {
  if (!state.enabled || !allowed) return state;
  return { ...state, unlocked: true };
}

export function setAudioMuted(state: AudioState, muted: boolean): AudioState {
  return {
    ...state,
    muted,
    bgmPlaying: muted ? false : state.bgmPlaying,
  };
}

export function requestSfx(state: AudioState, assetId: string): AudioState {
  if (!state.enabled || state.muted || !state.unlocked || assetId.trim() === '') {
    return state;
  }

  return {
    ...state,
    lastSfxPlayed: assetId,
    requestedSfx: [...state.requestedSfx, assetId],
  };
}

export function startBgm(state: AudioState): AudioState {
  if (!state.enabled || !state.bgmEnabled || state.muted || !state.unlocked) {
    return state;
  }
  return { ...state, bgmPlaying: true };
}

export function stopBgm(state: AudioState): AudioState {
  return { ...state, bgmPlaying: false };
}

export function recordAudioError(state: AudioState): AudioState {
  return { ...state, errorCount: state.errorCount + 1 };
}
