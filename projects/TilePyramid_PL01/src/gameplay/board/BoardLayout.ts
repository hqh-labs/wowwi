import type { BoardLayoutConfig } from '../../types';
import type { BoardTile } from '../level/LevelTypes';

export interface TileLayout {
  id: string;
  screenX: number;
  screenY: number;
  displayWidth: number;
  displayHeight: number;
  depth: number;
}

export interface BoardLayoutResult {
  tiles: TileLayout[];
  bounds: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
  };
}

export interface TileSourceSize {
  width: number;
  height: number;
}

export function calculateBoardLayout(
  tiles: BoardTile[],
  config: BoardLayoutConfig,
  sourceSize: TileSourceSize
): BoardLayoutResult {
  const displayWidth = sourceSize.width * config.tileScale;
  const displayHeight = sourceSize.height * config.tileScale;

  const layouts = tiles.map(tile => ({
    id: tile.id,
    screenX: config.centerX + tile.x * config.spacingX + tile.layer * config.layerOffsetX,
    screenY: config.centerY - tile.y * config.spacingY + tile.layer * config.layerOffsetY,
    displayWidth,
    displayHeight,
    depth: tile.layer * 1000 + Math.round((1000 - tile.y * 10) + tile.order),
  }));

  const bounds = calculateBounds(layouts);
  if (config.maxWidth !== undefined && bounds.width > config.maxWidth) {
    throw new Error(`Board layout width ${bounds.width} exceeds maxWidth ${config.maxWidth}`);
  }
  if (config.maxHeight !== undefined && bounds.height > config.maxHeight) {
    throw new Error(`Board layout height ${bounds.height} exceeds maxHeight ${config.maxHeight}`);
  }

  return {
    tiles: [...layouts].sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id)),
    bounds,
  };
}

function calculateBounds(layouts: TileLayout[]): BoardLayoutResult['bounds'] {
  if (layouts.length === 0) {
    return { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };
  }

  const left = Math.min(...layouts.map(tile => tile.screenX - tile.displayWidth / 2));
  const right = Math.max(...layouts.map(tile => tile.screenX + tile.displayWidth / 2));
  const top = Math.min(...layouts.map(tile => tile.screenY - tile.displayHeight / 2));
  const bottom = Math.max(...layouts.map(tile => tile.screenY + tile.displayHeight / 2));

  return {
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}

