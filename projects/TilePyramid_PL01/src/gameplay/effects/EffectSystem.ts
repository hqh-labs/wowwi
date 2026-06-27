export type EffectName =
  | 'tile-select-pop'
  | 'blocked-shake'
  | 'match-resolve'
  | 'tray-full-warning'
  | 'timer-warning-pulse'
  | 'outcome-pulse'
  | 'cta-click';

export interface EffectState {
  enabled: boolean;
  lastEffectTriggered: EffectName | null;
  timerWarningVisualActive: boolean;
}

export function createEffectState(enabled: boolean): EffectState {
  return {
    enabled,
    lastEffectTriggered: null,
    timerWarningVisualActive: false,
  };
}

export function requestEffect(state: EffectState, effectName: EffectName): EffectState {
  if (!state.enabled) return state;
  return {
    ...state,
    lastEffectTriggered: effectName,
  };
}

export function setTimerWarningVisual(state: EffectState, active: boolean): EffectState {
  if (!state.enabled) {
    return { ...state, timerWarningVisualActive: false };
  }
  return { ...state, timerWarningVisualActive: active };
}
