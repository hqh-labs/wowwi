import type { BoardRuntimeState } from '../board/BoardRuntimeState';
import { hasPendingMatch } from '../tray/MatchResolver';
import { isTrayFull, type TrayState } from '../tray/TraySystem';
import type { GameOutcomeState } from '../../types';

export interface OutcomeContext {
  board: BoardRuntimeState;
  tray: TrayState;
  matchResolving: boolean;
}

export function evaluateOutcome(context: OutcomeContext): GameOutcomeState {
  if (context.matchResolving) return 'playing';
  if (context.board.tiles.length === 0) return 'won';
  if (isTrayFull(context.tray) && !hasPendingMatch(context.tray)) return 'failed';
  return 'playing';
}

