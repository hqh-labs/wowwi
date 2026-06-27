import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';
import { createBoardRuntimeState, getBoardTile } from '../../src/gameplay/board/BoardRuntimeState';
import { createBoardTiles } from '../../src/gameplay/board/BlockingSystem';
import { assignTileTypes } from '../../src/gameplay/board/TileAssigner';
import {
  attemptTileSelection,
  completeTileSelection,
  createSelectionState,
} from '../../src/gameplay/selection/SelectionController';
import { parseLevelData } from '../../src/gameplay/level/LevelParser';
import {
  addTileToTray,
  createTrayState,
  getMatchReadyTileTypes,
  isTrayFull,
  type TrayState,
} from '../../src/gameplay/tray/TraySystem';

const levelPath = new URL('../../public/assets/levels/Level_21.json', import.meta.url);
const rawLevel = JSON.parse(readFileSync(levelPath, 'utf-8')) as unknown;
const tutorialPreviewPositionIds = ['L2:-1.5:2.5', 'L2:-0.5:2.5', 'L2:0.5:2.5'];

function createRuntime() {
  const level = parseLevelData(rawLevel, 'Level_21');
  const assignments = assignTileTypes(level.positions, {
    seed: 21000,
    tileTypeCount: 24,
    tutorialPreviewPositionIds,
  });
  const board = createBoardRuntimeState(createBoardTiles(level.positions, assignments).tiles);
  const tray = createTrayState(5);
  const selection = createSelectionState();
  return { board, tray, selection };
}

function fillTray(tray: TrayState): TrayState {
  const { board } = createRuntime();
  let next = tray;
  for (const tile of board.tiles.filter(tile => tile.selectable).slice(0, tray.capacity)) {
    next = addTileToTray(next, tile);
  }
  return next;
}

describe('tray runtime state', () => {
  it('initializes empty with configured capacity', () => {
    const tray = createTrayState(5);
    expect(tray.capacity).toBe(5);
    expect(tray.tiles).toHaveLength(0);
  });

  it('rejects capacity less than 1 or invalid values', () => {
    expect(() => createTrayState(0)).toThrow(/capacity/);
    expect(() => createTrayState(1.5)).toThrow(/capacity/);
  });

  it('adding a tile increases tray count', () => {
    const { board, tray } = createRuntime();
    const next = addTileToTray(tray, board.tiles[0]);
    expect(next.tiles).toHaveLength(1);
  });

  it('never exceeds capacity', () => {
    const tray = fillTray(createTrayState(2));
    const { board } = createRuntime();
    expect(isTrayFull(tray)).toBe(true);
    expect(addTileToTray(tray, board.tiles[4]).tiles).toHaveLength(2);
  });

  it('groups same tile type next to existing same-type tiles', () => {
    const { board } = createRuntime();
    const sameType = board.tiles.filter(tile => tile.tileTypeId === 1);
    const different = board.tiles.find(tile => tile.tileTypeId !== 1);
    if (!different) throw new Error('Expected a different tile type');

    let tray = createTrayState(5);
    tray = addTileToTray(tray, sameType[0]);
    tray = addTileToTray(tray, different);
    tray = addTileToTray(tray, sameType[1]);

    expect(tray.tiles.map(tile => tile.tileTypeId)).toEqual([1, 1, different.tileTypeId]);
  });

  it('keeps stable insertion order for non-matching tile types', () => {
    const { board } = createRuntime();
    const uniqueTiles = [...new Map(board.tiles.map(tile => [tile.tileTypeId, tile])).values()].slice(0, 4);
    let tray = createTrayState(5);
    for (const tile of uniqueTiles) tray = addTileToTray(tray, tile);
    expect(tray.tiles.map(tile => tile.tileTypeId)).toEqual(uniqueTiles.map(tile => tile.tileTypeId));
  });

  it('identifies three same-type tiles as match-ready without removing them', () => {
    const { board } = createRuntime();
    const sameType = board.tiles.filter(tile => tile.tileTypeId === 1);
    let tray = createTrayState(5);
    for (const tile of sameType) tray = addTileToTray(tray, tile);
    expect(getMatchReadyTileTypes(tray)).toEqual([1]);
    expect(tray.tiles).toHaveLength(3);
  });
});

describe('tile selection runtime', () => {
  it('rejects blocked tiles', () => {
    const { board, tray, selection } = createRuntime();
    const blocked = board.tiles.find(tile => !tile.selectable);
    if (!blocked) throw new Error('Expected blocked tile');
    const attempt = attemptTileSelection(board, tray, selection, blocked.id, true);
    expect(attempt).toMatchObject({ accepted: false, reason: 'blocked' });
  });

  it('rejects input while locked', () => {
    const { board, tray } = createRuntime();
    const selectable = board.tiles.find(tile => tile.selectable);
    if (!selectable) throw new Error('Expected selectable tile');
    const attempt = attemptTileSelection(board, tray, { inputLocked: true }, selectable.id, true);
    expect(attempt).toMatchObject({ accepted: false, reason: 'input-locked' });
  });

  it('rejects input when tray is full', () => {
    const { board, selection } = createRuntime();
    const selectable = board.tiles.find(tile => tile.selectable);
    if (!selectable) throw new Error('Expected selectable tile');
    const fullTray = fillTray(createTrayState(5));
    const attempt = attemptTileSelection(board, fullTray, selection, selectable.id, true);
    expect(attempt).toMatchObject({ accepted: false, reason: 'tray-full' });
  });

  it('selecting a tile removes it from board state', () => {
    const { board, tray } = createRuntime();
    const selectable = board.tiles.find(tile => tile.selectable);
    if (!selectable) throw new Error('Expected selectable tile');
    const completion = completeTileSelection(board, tray, selectable);
    expect(getBoardTile(completion.board, selectable.id)).toBeUndefined();
    expect(completion.board.tiles).toHaveLength(71);
  });

  it('selecting a tile adds it to tray state', () => {
    const { board, tray } = createRuntime();
    const selectable = board.tiles.find(tile => tile.selectable);
    if (!selectable) throw new Error('Expected selectable tile');
    const completion = completeTileSelection(board, tray, selectable);
    expect(completion.tray.tiles).toHaveLength(1);
    expect(completion.tray.tiles[0].sourceTileId).toBe(selectable.id);
  });

  it('updates blocking and selectable state after board removal', () => {
    const { board, tray } = createRuntime();
    const selectable = board.tiles.find(tile => tile.selectable);
    if (!selectable) throw new Error('Expected selectable tile');
    const completion = completeTileSelection(board, tray, selectable);
    expect(completion.board.selectableCount).toBe(
      completion.board.tiles.filter(tile => tile.blockerIds.length === 0).length
    );
  });

  it('removed tile cannot be selected again', () => {
    const { board, tray, selection } = createRuntime();
    const selectable = board.tiles.find(tile => tile.selectable);
    if (!selectable) throw new Error('Expected selectable tile');
    const completion = completeTileSelection(board, tray, selectable);
    const attempt = attemptTileSelection(completion.board, completion.tray, selection, selectable.id, true);
    expect(attempt).toMatchObject({ accepted: false, reason: 'removed' });
  });

  it('debug-style counts report remaining board count and tray count', () => {
    const { board, tray } = createRuntime();
    const selectable = board.tiles.find(tile => tile.selectable);
    if (!selectable) throw new Error('Expected selectable tile');
    const completion = completeTileSelection(board, tray, selectable);
    expect(completion.board.tiles.length).toBe(71);
    expect(completion.tray.tiles.length).toBe(1);
  });
});
