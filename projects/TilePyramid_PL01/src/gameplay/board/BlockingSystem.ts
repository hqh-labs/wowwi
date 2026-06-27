import type { BoardTile, LevelPosition, TileAssignment } from '../level/LevelTypes';

export interface BlockingResult {
  tiles: BoardTile[];
  selectableCount: number;
  blockedCount: number;
}

export function deriveBlockingRelationships(positions: LevelPosition[]): Map<string, string[]> {
  const blockersByPosition = new Map<string, string[]>();

  for (const lower of positions) {
    const blockers = positions
      .filter(upper => upper.layer === lower.layer + 1 && overlapsAdjacentLayer(upper, lower))
      .map(upper => upper.id)
      .sort();
    blockersByPosition.set(lower.id, blockers);
  }

  return blockersByPosition;
}

export function createBoardTiles(
  positions: LevelPosition[],
  assignments: TileAssignment[]
): BlockingResult {
  const assignmentByPosition = new Map(assignments.map(assignment => [assignment.positionId, assignment]));
  const blockersByPosition = deriveBlockingRelationships(positions);

  const tiles = positions.map(position => {
    const assignment = assignmentByPosition.get(position.id);
    if (!assignment) {
      throw new Error(`Missing tile assignment for ${position.id}`);
    }
    const blockerIds = blockersByPosition.get(position.id) ?? [];
    return {
      ...position,
      tileTypeId: assignment.tileTypeId,
      assetId: assignment.assetId,
      blockerIds,
      selectable: blockerIds.length === 0,
    };
  });

  const selectableCount = tiles.filter(tile => tile.selectable).length;
  return {
    tiles,
    selectableCount,
    blockedCount: tiles.length - selectableCount,
  };
}

export function overlapsAdjacentLayer(upper: LevelPosition, lower: LevelPosition): boolean {
  if (upper.layer !== lower.layer + 1) return false;
  return Math.abs(upper.x - lower.x) < 1 && Math.abs(upper.y - lower.y) < 1;
}

