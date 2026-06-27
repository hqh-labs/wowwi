import { createPositionId, type LevelData, type LevelLayer, type LevelPosition } from './LevelTypes';

export class LevelValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LevelValidationError';
  }
}

export function parseLevelData(data: unknown, levelId: string): LevelData {
  if (typeof levelId !== 'string' || levelId.trim() === '') {
    throw new LevelValidationError('Level id must be a non-empty string');
  }
  if (typeof data !== 'object' || data === null) {
    throw new LevelValidationError('Level data must be a non-null object');
  }

  const root = data as Record<string, unknown>;
  if (!Array.isArray(root['layers'])) {
    throw new LevelValidationError('Level.layers must be an array');
  }
  if (root['layers'].length === 0) {
    throw new LevelValidationError('Level.layers must contain at least one layer');
  }

  const seenLayerIndices = new Set<number>();
  const layers: LevelLayer[] = root['layers'].map((rawLayer, layerArrayIndex) => {
    if (typeof rawLayer !== 'object' || rawLayer === null) {
      throw new LevelValidationError(`Level.layers[${layerArrayIndex}] must be an object`);
    }

    const layerObj = rawLayer as Record<string, unknown>;
    const rawIndex = layerObj['index'];
    if (typeof rawIndex !== 'number' || !Number.isInteger(rawIndex)) {
      throw new LevelValidationError(`Level.layers[${layerArrayIndex}].index must be an integer`);
    }
    const index = rawIndex;
    if (seenLayerIndices.has(index)) {
      throw new LevelValidationError(`Duplicate layer index: ${index}`);
    }
    seenLayerIndices.add(index);

    if (!Array.isArray(layerObj['stones'])) {
      throw new LevelValidationError(`Level.layers[${layerArrayIndex}].stones must be an array`);
    }

    const seenCoordinates = new Set<string>();
    const positions: LevelPosition[] = layerObj['stones'].map((rawStone, stoneIndex) => {
      if (typeof rawStone !== 'object' || rawStone === null) {
        throw new LevelValidationError(`Layer ${index} stone ${stoneIndex} must be an object`);
      }

      const stone = rawStone as Record<string, unknown>;
      const x = parseCoordinate(stone['x'], `Layer ${index} stone ${stoneIndex}.x`);
      const y = parseCoordinate(stone['y'], `Layer ${index} stone ${stoneIndex}.y`);
      const coordKey = `${x}:${y}`;

      if (seenCoordinates.has(coordKey)) {
        throw new LevelValidationError(`Duplicate coordinate in layer ${index}: ${coordKey}`);
      }
      seenCoordinates.add(coordKey);

      return {
        id: createPositionId(index, x, y),
        layer: index,
        x,
        y,
        order: stoneIndex,
      };
    });

    return { index, positions };
  });

  const sortedLayers = [...layers].sort((a, b) => a.index - b.index);
  for (let i = 0; i < sortedLayers.length; i++) {
    if (sortedLayers[i].index !== i) {
      throw new LevelValidationError('Layer indices must be contiguous and start at 0');
    }
  }

  const positions = sortedLayers.flatMap(layer =>
    [...layer.positions].sort((a, b) => a.order - b.order)
  );
  if (positions.length === 0) {
    throw new LevelValidationError('Level must contain at least one stone');
  }
  if (positions.length % 3 !== 0) {
    throw new LevelValidationError('Total stone count must be divisible by 3');
  }

  return { id: levelId, layers: sortedLayers, positions };
}

function parseCoordinate(value: unknown, label: string): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) {
    throw new LevelValidationError(`${label} must be a finite number`);
  }
  return parsed;
}
