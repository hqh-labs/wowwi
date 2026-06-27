import type { LevelPosition, TileAssignment } from '../level/LevelTypes';

export interface TileAssignmentOptions {
  seed: number;
  tileTypeCount: number;
  tutorialPreviewPositionIds: string[];
}

export interface AssignmentValidation {
  valid: boolean;
  counts: Map<number, number>;
}

export function assignTileTypes(
  positions: LevelPosition[],
  options: TileAssignmentOptions
): TileAssignment[] {
  validateAssignmentOptions(positions, options);

  const previewIds = new Set(options.tutorialPreviewPositionIds);
  const remainingCounts = new Map<number, number>();
  for (let tileTypeId = 1; tileTypeId <= options.tileTypeCount; tileTypeId++) {
    remainingCounts.set(tileTypeId, 3);
  }

  for (const previewId of previewIds) {
    if (!positions.some(position => position.id === previewId)) {
      throw new Error(`Tutorial-preview position not found in level: ${previewId}`);
    }
    remainingCounts.set(1, (remainingCounts.get(1) ?? 0) - 1);
  }

  if ((remainingCounts.get(1) ?? 0) < 0) {
    throw new Error('Tutorial-preview group cannot reserve more than three tiles');
  }

  const remainingTypes: number[] = [];
  for (const [tileTypeId, count] of remainingCounts) {
    for (let i = 0; i < count; i++) remainingTypes.push(tileTypeId);
  }

  const shuffledTypes = seededShuffle(remainingTypes, options.seed);
  let nextType = 0;

  return positions.map(position => {
    const tileTypeId = previewIds.has(position.id) ? 1 : shuffledTypes[nextType++];
    return {
      positionId: position.id,
      tileTypeId,
      assetId: tileAssetId(tileTypeId),
    };
  });
}

export function validateTriplets(assignments: TileAssignment[], tileTypeCount: number): AssignmentValidation {
  const counts = new Map<number, number>();
  for (const assignment of assignments) {
    counts.set(assignment.tileTypeId, (counts.get(assignment.tileTypeId) ?? 0) + 1);
  }

  if (counts.size !== tileTypeCount) return { valid: false, counts };
  for (let tileTypeId = 1; tileTypeId <= tileTypeCount; tileTypeId++) {
    if (counts.get(tileTypeId) !== 3) return { valid: false, counts };
  }
  return { valid: true, counts };
}

export function tileAssetId(tileTypeId: number): string {
  return `Tile_${String(tileTypeId).padStart(2, '0')}`;
}

export function seededShuffle<T>(values: T[], seed: number): T[] {
  const shuffled = [...values];
  let state = seed >>> 0;

  for (let i = shuffled.length - 1; i > 0; i--) {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state >>>= 0;
    state ^= state << 5;
    state >>>= 0;
    const j = state % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

function validateAssignmentOptions(positions: LevelPosition[], options: TileAssignmentOptions): void {
  if (!Number.isInteger(options.seed)) {
    throw new Error('Assignment seed must be an integer');
  }
  if (!Number.isInteger(options.tileTypeCount) || options.tileTypeCount <= 0) {
    throw new Error('Tile type count must be a positive integer');
  }
  if (positions.length !== options.tileTypeCount * 3) {
    throw new Error('Position count must equal tileTypeCount * 3');
  }
  if (options.tutorialPreviewPositionIds.length !== 3) {
    throw new Error('Tutorial-preview group must contain exactly three positions');
  }
}

