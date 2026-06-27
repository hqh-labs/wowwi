import type { GameOutcomeState } from '../../types';

export interface IdleHintState {
  enabled: boolean;
  delaySeconds: number;
  active: boolean;
  targetTileId: string | null;
  secondsSinceLastValidInteraction: number;
}

export interface IdleHintTickContext {
  tutorialDismissed: boolean;
  inputLocked: boolean;
  matchResolving: boolean;
  gameState: GameOutcomeState;
  targetTileId: string | null;
}

export function createIdleHintState(enabled: boolean, delaySeconds: number): IdleHintState {
  return {
    enabled,
    delaySeconds,
    active: false,
    targetTileId: null,
    secondsSinceLastValidInteraction: 0,
  };
}

export function resetIdleHint(state: IdleHintState): IdleHintState {
  return {
    ...state,
    active: false,
    targetTileId: null,
    secondsSinceLastValidInteraction: 0,
  };
}

export function tickIdleHint(state: IdleHintState, deltaSeconds: number, context: IdleHintTickContext): IdleHintState {
  if (!state.enabled || !context.tutorialDismissed || context.gameState !== 'playing') {
    return hideHint(state);
  }

  if (context.inputLocked || context.matchResolving) {
    return hideHint(state);
  }

  const secondsSinceLastValidInteraction =
    state.secondsSinceLastValidInteraction + Math.max(0, deltaSeconds);

  if (secondsSinceLastValidInteraction < state.delaySeconds || !context.targetTileId) {
    return {
      ...state,
      active: false,
      targetTileId: null,
      secondsSinceLastValidInteraction,
    };
  }

  return {
    ...state,
    active: true,
    targetTileId: context.targetTileId,
    secondsSinceLastValidInteraction,
  };
}

function hideHint(state: IdleHintState): IdleHintState {
  if (!state.active && state.targetTileId === null) return state;
  return {
    ...state,
    active: false,
    targetTileId: null,
  };
}
