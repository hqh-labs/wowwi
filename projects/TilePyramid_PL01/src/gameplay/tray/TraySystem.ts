import type { BoardTile } from '../level/LevelTypes';

export interface TrayTile {
  sourceTileId: string;
  tileTypeId: number;
  assetId: string;
}

export interface TrayState {
  capacity: number;
  tiles: TrayTile[];
}

export function createTrayState(capacity: number): TrayState {
  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new Error('Tray capacity must be an integer >= 1');
  }
  return { capacity, tiles: [] };
}

export function isTrayFull(state: TrayState): boolean {
  return state.tiles.length >= state.capacity;
}

export function addTileToTray(state: TrayState, tile: BoardTile): TrayState {
  if (isTrayFull(state)) return state;

  const trayTile: TrayTile = {
    sourceTileId: tile.id,
    tileTypeId: tile.tileTypeId,
    assetId: tile.assetId,
  };
  const sameTypeLastIndex = findLastIndex(state.tiles, existing => existing.tileTypeId === tile.tileTypeId);
  const nextTiles = [...state.tiles];

  if (sameTypeLastIndex >= 0) {
    nextTiles.splice(sameTypeLastIndex + 1, 0, trayTile);
  } else {
    nextTiles.push(trayTile);
  }

  return { ...state, tiles: nextTiles };
}

export function getMatchReadyTileTypes(state: TrayState): number[] {
  const counts = new Map<number, number>();
  for (const tile of state.tiles) {
    counts.set(tile.tileTypeId, (counts.get(tile.tileTypeId) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 3)
    .map(([tileTypeId]) => tileTypeId)
    .sort((a, b) => a - b);
}

function findLastIndex<T>(items: T[], predicate: (item: T) => boolean): number {
  for (let i = items.length - 1; i >= 0; i--) {
    if (predicate(items[i])) return i;
  }
  return -1;
}

