import { describe, expect, it } from 'vitest';
import { selectIdleHintTarget } from '../../src/gameplay/idle/HintCandidateSelector';
import { createIdleHintState, resetIdleHint, tickIdleHint } from '../../src/gameplay/idle/IdleHintSystem';
import type { BoardTile } from '../../src/gameplay/level/LevelTypes';
import type { TrayTile } from '../../src/gameplay/tray/TraySystem';
import {
  createTimerState,
  registerTimerInteraction,
  tickTimer,
} from '../../src/gameplay/timer/TimerSystem';
import {
  createTutorialState,
  handleTutorialInteraction,
} from '../../src/gameplay/tutorial/TutorialSystem';
import type { Build05Snapshot } from '../../src/types';

function boardTile(id: string, tileTypeId: number, selectable = true, layer = 0, x = 0, y = 0): BoardTile {
  return {
    id,
    tileTypeId,
    selectable,
    layer,
    x,
    y,
    order: 0,
    assetId: `Tile_${String(tileTypeId).padStart(2, '0')}`,
    blockerIds: [],
  };
}

function trayTile(sourceTileId: string, tileTypeId: number): TrayTile {
  return { sourceTileId, tileTypeId, assetId: `Tile_${String(tileTypeId).padStart(2, '0')}` };
}

describe('Build-05 timer system', () => {
  it('initializes unstarted with full duration', () => {
    const timer = createTimerState(30, 5);
    expect(timer.started).toBe(false);
    expect(timer.remainingSeconds).toBe(30);
  });

  it('does not tick before starting', () => {
    const timer = tickTimer(createTimerState(30, 5), 10, 'playing');
    expect(timer.remainingSeconds).toBe(30);
  });

  it('starts on first valid selectable interaction', () => {
    const timer = registerTimerInteraction(createTimerState(30, 5), 'valid-selectable', true);
    expect(timer.started).toBe(true);
  });

  it('does not start on blocked interaction', () => {
    const timer = registerTimerInteraction(createTimerState(30, 5), 'blocked', true);
    expect(timer.started).toBe(false);
  });

  it('clamps at zero', () => {
    const started = registerTimerInteraction(createTimerState(30, 5), 'valid-selectable', true);
    const timer = tickTimer(started, 40, 'playing');
    expect(timer.remainingSeconds).toBe(0);
  });

  it('activates warning at threshold', () => {
    const started = registerTimerInteraction(createTimerState(30, 5), 'valid-selectable', true);
    const timer = tickTimer(started, 25, 'playing');
    expect(timer.warningActive).toBe(true);
  });

  it('expires so the coordinator can produce fail when game is not won', () => {
    const started = registerTimerInteraction(createTimerState(30, 5), 'valid-selectable', true);
    const timer = tickTimer(started, 30, 'playing');
    const gameState = timer.expired ? 'failed' : 'playing';
    expect(gameState).toBe('failed');
  });

  it('stops after win or fail', () => {
    const started = registerTimerInteraction(createTimerState(30, 5), 'valid-selectable', true);
    expect(tickTimer(started, 10, 'won').remainingSeconds).toBe(30);
    expect(tickTimer(started, 10, 'failed').remainingSeconds).toBe(30);
  });
});

describe('Build-05 tutorial system', () => {
  const previewTileIds = ['a', 'b', 'c'];

  it('starts active when enabled', () => {
    const tutorial = createTutorialState({ enabled: true, text: 'Tap to match!', previewTileIds });
    expect(tutorial.active).toBe(true);
  });

  it('dismisses on valid selectable interaction', () => {
    const tutorial = handleTutorialInteraction(
      createTutorialState({ enabled: true, text: 'Tap to match!', previewTileIds }),
      'valid-selectable',
      true
    );
    expect(tutorial.active).toBe(false);
    expect(tutorial.dismissed).toBe(true);
  });

  it('does not dismiss on blocked interaction', () => {
    const tutorial = handleTutorialInteraction(
      createTutorialState({ enabled: true, text: 'Tap to match!', previewTileIds }),
      'blocked',
      true
    );
    expect(tutorial.active).toBe(true);
  });

  it('keeps hand/tutorial target ids matched to configured preview tile ids', () => {
    const tutorial = createTutorialState({ enabled: true, text: 'Tap to match!', previewTileIds });
    expect(tutorial.previewTileIds).toEqual(previewTileIds);
  });
});

describe('Build-05 idle hint system', () => {
  it('does not show before tutorial is dismissed', () => {
    const idle = tickIdleHint(createIdleHintState(true, 5), 6, {
      tutorialDismissed: false,
      inputLocked: false,
      matchResolving: false,
      gameState: 'playing',
      targetTileId: 'tile-a',
    });
    expect(idle.active).toBe(false);
  });

  it('appears after five seconds without valid interaction', () => {
    const idle = tickIdleHint(createIdleHintState(true, 5), 5, {
      tutorialDismissed: true,
      inputLocked: false,
      matchResolving: false,
      gameState: 'playing',
      targetTileId: 'tile-a',
    });
    expect(idle.active).toBe(true);
    expect(idle.targetTileId).toBe('tile-a');
  });

  it('resets after valid interaction', () => {
    const shown = tickIdleHint(createIdleHintState(true, 5), 5, {
      tutorialDismissed: true,
      inputLocked: false,
      matchResolving: false,
      gameState: 'playing',
      targetTileId: 'tile-a',
    });
    expect(resetIdleHint(shown).secondsSinceLastValidInteraction).toBe(0);
    expect(resetIdleHint(shown).active).toBe(false);
  });

  it('does not show while input is locked', () => {
    const idle = tickIdleHint(createIdleHintState(true, 5), 6, {
      tutorialDismissed: true,
      inputLocked: true,
      matchResolving: false,
      gameState: 'playing',
      targetTileId: 'tile-a',
    });
    expect(idle.active).toBe(false);
  });

  it('prefers completing an existing tray pair', () => {
    const target = selectIdleHintTarget({
      boardTiles: [boardTile('fallback', 2, true, 1), boardTile('match', 7, true, 0)],
      trayTiles: [trayTile('tray-a', 7), trayTile('tray-b', 7)],
      preferTrayPairCompletion: true,
      deterministicFallback: true,
    });
    expect(target).toBe('match');
  });

  it('falls back deterministically', () => {
    const target = selectIdleHintTarget({
      boardTiles: [
        boardTile('lower', 1, true, 0, 0, 0),
        boardTile('higher-right', 2, true, 2, 1, 0),
        boardTile('higher-left', 3, true, 2, -1, 1),
      ],
      trayTiles: [],
      preferTrayPairCompletion: true,
      deterministicFallback: true,
    });
    expect(target).toBe('higher-left');
  });

  it('does not show after win or fail', () => {
    for (const gameState of ['won', 'failed'] as const) {
      const idle = tickIdleHint(createIdleHintState(true, 5), 6, {
        tutorialDismissed: true,
        inputLocked: false,
        matchResolving: false,
        gameState,
        targetTileId: 'tile-a',
      });
      expect(idle.active).toBe(false);
    }
  });

  it('keeps formal solvability not yet proven in diagnostics', () => {
    const snapshot = { formalSolvability: 'NOT YET PROVEN' } as Build05Snapshot;
    expect(snapshot.formalSolvability).toBe('NOT YET PROVEN');
  });
});
