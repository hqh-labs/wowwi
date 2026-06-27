import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';
import { calculateBoardLayout } from '../../src/gameplay/board/BoardLayout';
import { createBoardTiles, deriveBlockingRelationships } from '../../src/gameplay/board/BlockingSystem';
import { assignTileTypes, validateTriplets } from '../../src/gameplay/board/TileAssigner';
import { LevelValidationError, parseLevelData } from '../../src/gameplay/level/LevelParser';
import type { BoardLayoutConfig } from '../../src/types';

const levelPath = new URL('../../public/assets/levels/Level_21.json', import.meta.url);
const rawLevel = JSON.parse(readFileSync(levelPath, 'utf-8')) as unknown;
const tutorialPreviewPositionIds = ['L2:-1.5:2.5', 'L2:-0.5:2.5', 'L2:0.5:2.5'];
const layoutConfig: BoardLayoutConfig = {
  centerX: 540,
  centerY: 720,
  spacingX: 110,
  spacingY: 118,
  layerOffsetX: 22,
  layerOffsetY: -22,
  tileScale: 1,
  maxWidth: 980,
  maxHeight: 1120,
};

function createLevel21Board(seed = 21000) {
  const level = parseLevelData(rawLevel, 'Level_21');
  const assignments = assignTileTypes(level.positions, {
    seed,
    tileTypeCount: 24,
    tutorialPreviewPositionIds,
  });
  const board = createBoardTiles(level.positions, assignments);
  return { level, assignments, board };
}

describe('Level_21 parsing and validation', () => {
  it('parses Level_21 successfully', () => {
    const level = parseLevelData(rawLevel, 'Level_21');
    expect(level.id).toBe('Level_21');
    expect(level.layers).toHaveLength(3);
  });

  it('rejects malformed level data', () => {
    expect(() => parseLevelData({ layers: [{ index: 0 }] }, 'bad')).toThrow(LevelValidationError);
  });

  it('rejects duplicate coordinates in a layer', () => {
    const duplicate = {
      layers: [{ index: 0, stones: [{ x: '0.5', y: '0.5' }, { x: '0.5', y: '0.5' }] }],
    };
    expect(() => parseLevelData(duplicate, 'duplicate')).toThrow(/Duplicate coordinate/);
  });

  it('has 72 positions', () => {
    expect(parseLevelData(rawLevel, 'Level_21').positions).toHaveLength(72);
  });
});

describe('blocking output', () => {
  it('is deterministic', () => {
    const level = parseLevelData(rawLevel, 'Level_21');
    const first = [...deriveBlockingRelationships(level.positions).entries()];
    const second = [...deriveBlockingRelationships(level.positions).entries()];
    expect(second).toEqual(first);
  });

  it('topmost-layer tiles have no blockers', () => {
    const { board } = createLevel21Board();
    const topLayer = Math.max(...board.tiles.map(tile => tile.layer));
    expect(board.tiles.filter(tile => tile.layer === topLayer).every(tile => tile.blockerIds.length === 0)).toBe(
      true
    );
  });

  it('at least one lower-layer tile is blocked', () => {
    const { board } = createLevel21Board();
    expect(board.tiles.some(tile => tile.layer < 2 && tile.blockerIds.length > 0)).toBe(true);
  });

  it('selectable count matches blocking output', () => {
    const { board } = createLevel21Board();
    expect(board.selectableCount).toBe(board.tiles.filter(tile => tile.blockerIds.length === 0).length);
    expect(board.blockedCount).toBe(board.tiles.filter(tile => tile.blockerIds.length > 0).length);
  });
});

describe('deterministic tile assignment', () => {
  it('same seed gives the same assignment', () => {
    expect(createLevel21Board(21000).assignments).toEqual(createLevel21Board(21000).assignments);
  });

  it('different seeds normally give a different assignment', () => {
    expect(createLevel21Board(21000).assignments).not.toEqual(createLevel21Board(21001).assignments);
  });

  it('has 72 entries', () => {
    expect(createLevel21Board().assignments).toHaveLength(72);
  });

  it('has 24 tile types', () => {
    const validation = validateTriplets(createLevel21Board().assignments, 24);
    expect(validation.counts.size).toBe(24);
  });

  it('assigns every tile type exactly three times', () => {
    const validation = validateTriplets(createLevel21Board().assignments, 24);
    expect(validation.valid).toBe(true);
    for (const count of validation.counts.values()) {
      expect(count).toBe(3);
    }
  });

  it('assigns tutorial-preview positions the same tile type', () => {
    const assignments = createLevel21Board().assignments;
    const previewTypes = tutorialPreviewPositionIds.map(
      id => assignments.find(assignment => assignment.positionId === id)?.tileTypeId
    );
    expect(previewTypes).toEqual([1, 1, 1]);
  });
});

describe('board layout', () => {
  it('stays inside 1080 x 1920', () => {
    const { board } = createLevel21Board();
    const layout = calculateBoardLayout(board.tiles, layoutConfig, { width: 132, height: 144 });
    expect(layout.bounds.left).toBeGreaterThanOrEqual(0);
    expect(layout.bounds.right).toBeLessThanOrEqual(1080);
    expect(layout.bounds.top).toBeGreaterThanOrEqual(0);
    expect(layout.bounds.bottom).toBeLessThanOrEqual(1920);
  });

  it('preserves tile aspect ratio', () => {
    const { board } = createLevel21Board();
    const layout = calculateBoardLayout(board.tiles, layoutConfig, { width: 132, height: 144 });
    for (const tile of layout.tiles) {
      expect(tile.displayWidth / tile.displayHeight).toBeCloseTo(132 / 144, 5);
    }
  });

  it('has deterministic rendering order', () => {
    const { board } = createLevel21Board();
    const first = calculateBoardLayout(board.tiles, layoutConfig, { width: 132, height: 144 }).tiles.map(
      tile => `${tile.depth}:${tile.id}`
    );
    const second = calculateBoardLayout(board.tiles, layoutConfig, { width: 132, height: 144 }).tiles.map(
      tile => `${tile.depth}:${tile.id}`
    );
    expect(second).toEqual(first);
  });
});
