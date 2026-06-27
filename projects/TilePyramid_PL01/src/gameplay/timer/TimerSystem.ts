import type { GameOutcomeState } from '../../types';

export interface TimerState {
  durationSeconds: number;
  warningSeconds: number;
  started: boolean;
  remainingSeconds: number;
  expired: boolean;
  warningActive: boolean;
}

export function createTimerState(durationSeconds: number, warningSeconds: number): TimerState {
  return {
    durationSeconds,
    warningSeconds,
    started: false,
    remainingSeconds: durationSeconds,
    expired: false,
    warningActive: durationSeconds <= warningSeconds,
  };
}

export function startTimer(state: TimerState): TimerState {
  if (state.started || state.expired) return state;
  return {
    ...state,
    started: true,
    warningActive: state.remainingSeconds <= state.warningSeconds,
  };
}

export function registerTimerInteraction(
  state: TimerState,
  interaction: 'valid-selectable' | 'blocked',
  startOnFirstValidTap: boolean
): TimerState {
  if (interaction !== 'valid-selectable' || !startOnFirstValidTap) return state;
  return startTimer(state);
}

export function tickTimer(state: TimerState, deltaSeconds: number, gameState: GameOutcomeState): TimerState {
  if (!state.started || state.expired || gameState !== 'playing') return state;

  const remainingSeconds = Math.max(0, state.remainingSeconds - Math.max(0, deltaSeconds));
  return {
    ...state,
    remainingSeconds,
    expired: remainingSeconds <= 0,
    warningActive: remainingSeconds <= state.warningSeconds,
  };
}

export function getTimerDisplaySeconds(state: TimerState): number {
  return Math.ceil(Math.max(0, state.remainingSeconds));
}
