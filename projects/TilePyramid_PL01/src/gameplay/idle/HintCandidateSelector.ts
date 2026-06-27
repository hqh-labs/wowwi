import type { BoardTile } from '../level/LevelTypes';
import type { TrayTile } from '../tray/TraySystem';

export interface HintCandidateContext {
  boardTiles: BoardTile[];
  trayTiles: TrayTile[];
  preferTrayPairCompletion: boolean;
  deterministicFallback: boolean;
}

export function selectIdleHintTarget(context: HintCandidateContext): string | null {
  const selectableTiles = context.boardTiles.filter(tile => tile.selectable);
  if (selectableTiles.length === 0) return null;

  const sortedSelectableTiles = sortTilesForHint(selectableTiles);

  if (context.preferTrayPairCompletion) {
    const trayCounts = new Map<number, number>();
    for (const tile of context.trayTiles) {
      trayCounts.set(tile.tileTypeId, (trayCounts.get(tile.tileTypeId) ?? 0) + 1);
    }

    const pairTypes = [...trayCounts.entries()]
      .filter(([, count]) => count === 1 || count === 2)
      .map(([tileTypeId]) => tileTypeId)
      .sort((a, b) => a - b);

    for (const tileTypeId of pairTypes) {
      const candidate = sortedSelectableTiles.find(tile => tile.tileTypeId === tileTypeId);
      if (candidate) return candidate.id;
    }
  }

  if (!context.deterministicFallback) return null;
  return sortedSelectableTiles[0]?.id ?? null;
}

function sortTilesForHint(tiles: BoardTile[]): BoardTile[] {
  return [...tiles].sort((a, b) => {
    if (b.layer !== a.layer) return b.layer - a.layer;
    if (b.y !== a.y) return b.y - a.y;
    if (a.x !== b.x) return a.x - b.x;
    return a.id.localeCompare(b.id);
  });
}
