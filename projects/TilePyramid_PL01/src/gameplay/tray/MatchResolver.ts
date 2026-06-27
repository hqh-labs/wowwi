import type { TrayState, TrayTile } from './TraySystem';

export interface MatchGroup {
  tileTypeId: number;
  sourceTileIds: string[];
}

export function findNextMatchGroup(state: TrayState): MatchGroup | undefined {
  const tilesByType = new Map<number, TrayTile[]>();

  for (const tile of state.tiles) {
    const group = tilesByType.get(tile.tileTypeId) ?? [];
    group.push(tile);
    tilesByType.set(tile.tileTypeId, group);
  }

  for (const tile of state.tiles) {
    const group = tilesByType.get(tile.tileTypeId) ?? [];
    if (group.length >= 3) {
      return {
        tileTypeId: tile.tileTypeId,
        sourceTileIds: group.slice(0, 3).map(matchTile => matchTile.sourceTileId),
      };
    }
  }

  return undefined;
}

export function removeMatchGroup(state: TrayState, group: MatchGroup): TrayState {
  const remainingIds = new Set(group.sourceTileIds);
  return {
    ...state,
    tiles: state.tiles.filter(tile => !remainingIds.has(tile.sourceTileId)),
  };
}

export function hasPendingMatch(state: TrayState): boolean {
  return findNextMatchGroup(state) !== undefined;
}

