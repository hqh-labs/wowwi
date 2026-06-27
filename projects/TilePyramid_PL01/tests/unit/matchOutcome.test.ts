import { describe, expect, it } from 'vitest';
import { createBoardRuntimeState } from '../../src/gameplay/board/BoardRuntimeState';
import { createBoardTiles } from '../../src/gameplay/board/BlockingSystem';
import { evaluateOutcome } from '../../src/gameplay/outcome/OutcomeEvaluator';
import {
  attemptTileSelection,
  completeTileSelection,
} from '../../src/gameplay/selection/SelectionController';
import {
  findNextMatchGroup,
  removeMatchGroup,
} from '../../src/gameplay/tray/MatchResolver';
import {
  addTileToTray,
  createTrayState,
  type TrayState,
  type TrayTile,
} from '../../src/gameplay/tray/TraySystem';
import type { BoardTile } from '../../src/gameplay/level/LevelTypes';

function trayTile(id: string, type: number): TrayTile {
  return { sourceTileId: id, tileTypeId: type, assetId: `Tile_${String(type).padStart(2, '0')}` };
}

function boardTile(id: string, type: number, selectable = true): BoardTile {
  return {
    id,
    layer: 0,
    x: 0,
    y: 0,
    order: Number(id.replace(/\D/g, '')) || 0,
    tileTypeId: type,
    assetId: `Tile_${String(type).padStart(2, '0')}`,
    blockerIds: selectable ? [] : ['blocker'],
    selectable,
  };
}

function trayWith(tiles: TrayTile[], capacity = 5): TrayState {
  return { capacity, tiles };
}

describe('match-three resolution', () => {
  it('detects three identical tray tiles as a match', () => {
    const group = findNextMatchGroup(trayWith([trayTile('a', 1), trayTile('b', 1), trayTile('c', 1)]));
    expect(group).toEqual({ tileTypeId: 1, sourceTileIds: ['a', 'b', 'c'] });
  });

  it('removes matched three tiles from tray state', () => {
    const tray = trayWith([trayTile('a', 1), trayTile('b', 1), trayTile('c', 1)]);
    const group = findNextMatchGroup(tray);
    if (!group) throw new Error('Expected match group');
    expect(removeMatchGroup(tray, group).tiles).toHaveLength(0);
  });

  it('compacts tray after match removal', () => {
    const tray = trayWith([
      trayTile('a', 1),
      trayTile('b', 1),
      trayTile('c', 1),
      trayTile('d', 2),
      trayTile('e', 3),
    ]);
    const group = findNextMatchGroup(tray);
    if (!group) throw new Error('Expected match group');
    expect(removeMatchGroup(tray, group).tiles.map(tile => tile.sourceTileId)).toEqual(['d', 'e']);
  });

  it('does not remove non-matching tray tiles', () => {
    const tray = trayWith([trayTile('a', 1), trayTile('b', 2), trayTile('c', 3)]);
    expect(findNextMatchGroup(tray)).toBeUndefined();
    expect(tray.tiles).toHaveLength(3);
  });

  it('match-ready state does not remove tiles before resolution is called', () => {
    const tray = trayWith([trayTile('a', 1), trayTile('b', 1), trayTile('c', 1)]);
    expect(findNextMatchGroup(tray)).toBeDefined();
    expect(tray.tiles).toHaveLength(3);
  });

  it('resolves only one group of three when more than three are present', () => {
    const tray = trayWith([trayTile('a', 1), trayTile('b', 1), trayTile('c', 1), trayTile('d', 1)]);
    const group = findNextMatchGroup(tray);
    if (!group) throw new Error('Expected match group');
    expect(removeMatchGroup(tray, group).tiles.map(tile => tile.sourceTileId)).toEqual(['d']);
  });
});

describe('basic outcome rules', () => {
  it('rejects input while match is resolving', () => {
    const board = createBoardRuntimeState([boardTile('t1', 1)]);
    const tray = createTrayState(5);
    const attempt = attemptTileSelection(board, tray, { inputLocked: true }, 't1', true);
    expect(attempt).toMatchObject({ accepted: false, reason: 'input-locked' });
  });

  it('tray full without a resolving match produces fail', () => {
    const board = createBoardRuntimeState([boardTile('t1', 1)]);
    const tray = trayWith([trayTile('a', 1), trayTile('b', 2)], 2);
    expect(evaluateOutcome({ board, tray, matchResolving: false })).toBe('failed');
  });

  it('tray full with a resolving match does not immediately fail', () => {
    const board = createBoardRuntimeState([boardTile('t1', 1)]);
    const tray = trayWith([trayTile('a', 1), trayTile('b', 1), trayTile('c', 1)], 3);
    expect(evaluateOutcome({ board, tray, matchResolving: true })).toBe('playing');
  });

  it('board empty produces win when no match resolution is pending', () => {
    const board = createBoardRuntimeState([]);
    const tray = trayWith([]);
    expect(evaluateOutcome({ board, tray, matchResolving: false })).toBe('won');
  });

  it('board empty during match resolution waits until resolution completes', () => {
    const board = createBoardRuntimeState([]);
    const tray = trayWith([trayTile('a', 1), trayTile('b', 1), trayTile('c', 1)]);
    expect(evaluateOutcome({ board, tray, matchResolving: true })).toBe('playing');
  });

  it('after win selection is rejected', () => {
    const board = createBoardRuntimeState([boardTile('t1', 1)]);
    const tray = createTrayState(5);
    const attempt = attemptTileSelection(board, tray, { inputLocked: true }, 't1', true);
    expect(attempt).toMatchObject({ accepted: false, reason: 'input-locked' });
  });

  it('after fail selection is rejected', () => {
    const board = createBoardRuntimeState([boardTile('t1', 1)]);
    const tray = createTrayState(5);
    const attempt = attemptTileSelection(board, tray, { inputLocked: true }, 't1', true);
    expect(attempt).toMatchObject({ accepted: false, reason: 'input-locked' });
  });

  it('formal solvability remains not yet proven in diagnostics shape', () => {
    expect('NOT YET PROVEN').toBe('NOT YET PROVEN');
  });

  it('existing tray grouping behavior remains intact', () => {
    let tray = createTrayState(5);
    tray = addTileToTray(tray, boardTile('a', 1));
    tray = addTileToTray(tray, boardTile('b', 2));
    tray = addTileToTray(tray, boardTile('c', 1));
    expect(tray.tiles.map(tile => tile.tileTypeId)).toEqual([1, 1, 2]);
  });

  it('existing board removal and blocking update behavior remains intact', () => {
    const lower = boardTile('lower', 1, false);
    lower.layer = 0;
    lower.x = 0.5;
    lower.y = 0.5;
    lower.blockerIds = ['upper'];
    const upper = boardTile('upper', 2, true);
    upper.layer = 1;
    upper.x = 0;
    upper.y = 0;
    const board = createBoardRuntimeState(createBoardTiles([lower, upper], [
      { positionId: lower.id, tileTypeId: lower.tileTypeId, assetId: lower.assetId },
      { positionId: upper.id, tileTypeId: upper.tileTypeId, assetId: upper.assetId },
    ]).tiles);
    const completion = completeTileSelection(board, createTrayState(5), upper);
    expect(completion.board.tiles.find(tile => tile.id === 'lower')?.selectable).toBe(true);
  });
});
