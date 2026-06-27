import { getBoardTile, removeBoardTile, type BoardRuntimeState } from '../board/BoardRuntimeState';
import type { BoardTile } from '../level/LevelTypes';
import { addTileToTray, isTrayFull, type TrayState } from '../tray/TraySystem';

export type SelectionRejectionReason = 'input-locked' | 'tray-full' | 'not-found' | 'removed' | 'blocked';

export interface SelectionState {
  inputLocked: boolean;
}

export interface SelectionAccepted {
  accepted: true;
  tile: BoardTile;
  selection: SelectionState;
}

export interface SelectionRejected {
  accepted: false;
  reason: SelectionRejectionReason;
  selection: SelectionState;
}

export type SelectionAttempt = SelectionAccepted | SelectionRejected;

export interface SelectionCompletion {
  board: BoardRuntimeState;
  tray: TrayState;
  selection: SelectionState;
}

export function createSelectionState(): SelectionState {
  return { inputLocked: false };
}

export function attemptTileSelection(
  board: BoardRuntimeState,
  tray: TrayState,
  selection: SelectionState,
  tileId: string,
  inputLockEnabled: boolean
): SelectionAttempt {
  if (selection.inputLocked) {
    return { accepted: false, reason: 'input-locked', selection };
  }
  if (isTrayFull(tray)) {
    return { accepted: false, reason: 'tray-full', selection };
  }
  if (board.removedTileIds.includes(tileId)) {
    return { accepted: false, reason: 'removed', selection };
  }

  const tile = getBoardTile(board, tileId);
  if (!tile) {
    return { accepted: false, reason: 'not-found', selection };
  }
  if (!tile.selectable) {
    return { accepted: false, reason: 'blocked', selection };
  }

  return {
    accepted: true,
    tile,
    selection: { inputLocked: inputLockEnabled },
  };
}

export function completeTileSelection(
  board: BoardRuntimeState,
  tray: TrayState,
  selectedTile: BoardTile
): SelectionCompletion {
  return {
    board: removeBoardTile(board, selectedTile.id),
    tray: addTileToTray(tray, selectedTile),
    selection: { inputLocked: false },
  };
}

