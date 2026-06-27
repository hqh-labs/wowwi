import { createBoardTiles } from './BlockingSystem';
import type { BoardTile, TileAssignment } from '../level/LevelTypes';

export interface BoardRuntimeState {
  readonly initialCount: number;
  tiles: BoardTile[];
  removedTileIds: string[];
  selectableCount: number;
  blockedCount: number;
}

export function createBoardRuntimeState(tiles: BoardTile[]): BoardRuntimeState {
  return summarizeBoardState({
    initialCount: tiles.length,
    tiles: [...tiles],
    removedTileIds: [],
    selectableCount: 0,
    blockedCount: 0,
  });
}

export function getBoardTile(state: BoardRuntimeState, tileId: string): BoardTile | undefined {
  return state.tiles.find(tile => tile.id === tileId);
}

export function removeBoardTile(state: BoardRuntimeState, tileId: string): BoardRuntimeState {
  if (state.removedTileIds.includes(tileId)) return state;
  const target = getBoardTile(state, tileId);
  if (!target) return state;

  const remainingTiles = state.tiles.filter(tile => tile.id !== tileId);
  const assignments: TileAssignment[] = remainingTiles.map(tile => ({
    positionId: tile.id,
    tileTypeId: tile.tileTypeId,
    assetId: tile.assetId,
  }));
  const recomputed = createBoardTiles(remainingTiles, assignments);

  return {
    initialCount: state.initialCount,
    tiles: recomputed.tiles,
    removedTileIds: [...state.removedTileIds, tileId],
    selectableCount: recomputed.selectableCount,
    blockedCount: recomputed.blockedCount,
  };
}

function summarizeBoardState(state: BoardRuntimeState): BoardRuntimeState {
  const selectableCount = state.tiles.filter(tile => tile.selectable).length;
  return {
    ...state,
    selectableCount,
    blockedCount: state.tiles.length - selectableCount,
  };
}

