import type { TrayLayoutConfig } from '../../types';
import type { TrayState } from './TraySystem';

export interface TraySlotLayout {
  slotIndex: number;
  screenX: number;
  screenY: number;
  width: number;
  height: number;
}

export interface TrayTileLayout extends TraySlotLayout {
  sourceTileId: string;
  tileTypeId: number;
  assetId: string;
}

export interface TrayLayoutResult {
  slots: TraySlotLayout[];
  tiles: TrayTileLayout[];
  bounds: { left: number; right: number; top: number; bottom: number; width: number; height: number };
}

export function calculateTrayLayout(state: TrayState, config: TrayLayoutConfig): TrayLayoutResult {
  const totalWidth = (state.capacity - 1) * config.slotSpacing + config.slotWidth;
  const leftSlotCenter = config.centerX - ((state.capacity - 1) * config.slotSpacing) / 2;
  const slots: TraySlotLayout[] = [];

  for (let slotIndex = 0; slotIndex < state.capacity; slotIndex++) {
    slots.push({
      slotIndex,
      screenX: leftSlotCenter + slotIndex * config.slotSpacing,
      screenY: config.centerY,
      width: config.slotWidth,
      height: config.slotHeight,
    });
  }

  return {
    slots,
    tiles: state.tiles.map((tile, slotIndex) => ({
      ...slots[slotIndex],
      sourceTileId: tile.sourceTileId,
      tileTypeId: tile.tileTypeId,
      assetId: tile.assetId,
    })),
    bounds: {
      left: config.centerX - totalWidth / 2,
      right: config.centerX + totalWidth / 2,
      top: config.centerY - config.slotHeight / 2,
      bottom: config.centerY + config.slotHeight / 2,
      width: totalWidth,
      height: config.slotHeight,
    },
  };
}

