import type { GameOutcomeState } from '../../types';

export type EndCardReason = 'win' | 'fail' | 'none';

export interface EndCardState {
  enabled: boolean;
  visible: boolean;
  reason: EndCardReason;
  clickCount: number;
}

export interface EndCardRules {
  showOnWin: boolean;
  showOnFail: boolean;
}

export function createEndCardState(enabled: boolean): EndCardState {
  return {
    enabled,
    visible: false,
    reason: 'none',
    clickCount: 0,
  };
}

export function updateEndCardForOutcome(
  state: EndCardState,
  gameState: GameOutcomeState,
  rules: EndCardRules
): EndCardState {
  if (!state.enabled || state.visible || gameState === 'playing') return state;

  if (gameState === 'won' && rules.showOnWin) {
    return { ...state, visible: true, reason: 'win' };
  }
  if (gameState === 'failed' && rules.showOnFail) {
    return { ...state, visible: true, reason: 'fail' };
  }
  return state;
}

export function recordEndCardClick(state: EndCardState): EndCardState {
  if (!state.enabled || !state.visible) return state;
  return {
    ...state,
    clickCount: state.clickCount + 1,
  };
}
