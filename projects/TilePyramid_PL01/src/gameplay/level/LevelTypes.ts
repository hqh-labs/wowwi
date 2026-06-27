export interface RawLevelData {
  layers: RawLevelLayer[];
}

export interface RawLevelLayer {
  index: unknown;
  stones: RawStone[];
}

export interface RawStone {
  x: unknown;
  y: unknown;
}

export interface LevelData {
  id: string;
  layers: LevelLayer[];
  positions: LevelPosition[];
}

export interface LevelLayer {
  index: number;
  positions: LevelPosition[];
}

export interface LevelPosition {
  id: string;
  layer: number;
  x: number;
  y: number;
  order: number;
}

export interface TileAssignment {
  positionId: string;
  tileTypeId: number;
  assetId: string;
}

export interface BoardTile extends LevelPosition {
  tileTypeId: number;
  assetId: string;
  blockerIds: string[];
  selectable: boolean;
}

export function formatCoordinate(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value);
}

export function createPositionId(layer: number, x: number, y: number): string {
  return `L${layer}:${formatCoordinate(x)}:${formatCoordinate(y)}`;
}

