export interface CtaState {
  enabled: boolean;
  visible: boolean;
  clickCount: number;
}

export function createCtaState(enabled: boolean, visibleDuringGameplay: boolean): CtaState {
  return {
    enabled,
    visible: enabled && visibleDuringGameplay,
    clickCount: 0,
  };
}

export function recordCtaClick(state: CtaState): CtaState {
  if (!state.enabled || !state.visible) return state;
  return {
    ...state,
    clickCount: state.clickCount + 1,
  };
}

export function setCtaVisible(state: CtaState, visible: boolean): CtaState {
  return {
    ...state,
    visible: state.enabled && visible,
  };
}
