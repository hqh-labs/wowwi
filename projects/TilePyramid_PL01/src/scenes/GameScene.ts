import Phaser from 'phaser';
import { calculateBoardLayout, type BoardLayoutResult } from '../gameplay/board/BoardLayout';
import { createBoardTiles } from '../gameplay/board/BlockingSystem';
import {
  createBoardRuntimeState,
  type BoardRuntimeState,
} from '../gameplay/board/BoardRuntimeState';
import { assignTileTypes, validateTriplets } from '../gameplay/board/TileAssigner';
import {
  attemptTileSelection,
  completeTileSelection,
  createSelectionState,
  type SelectionState,
} from '../gameplay/selection/SelectionController';
import { parseLevelData } from '../gameplay/level/LevelParser';
import type { BoardTile } from '../gameplay/level/LevelTypes';
import { calculateTrayLayout, type TrayLayoutResult } from '../gameplay/tray/TrayLayout';
import {
  createTrayState,
  getMatchReadyTileTypes,
  isTrayFull,
  type TrayState,
} from '../gameplay/tray/TraySystem';
import { resolveAsset } from '../manifest/AssetManifest';
import { classifyOrientation, OrientationController } from '../orientation/OrientationController';
import type { AssetManifestData, Build03Snapshot, GameConfig } from '../types';

const TILE_SOURCE_SIZE = { width: 132, height: 144 };
const BOARD_DEPTH = 1000;
const TRAY_DEPTH = 6000;
const DEBUG_DEPTH = 9000;

export class GameScene extends Phaser.Scene {
  private orientationController!: OrientationController;
  private debugText!: Phaser.GameObjects.Text;
  private debugEnabled = false;
  private boardState!: BoardRuntimeState;
  private trayState!: TrayState;
  private selectionState!: SelectionState;
  private tripletsValid = false;
  private layerCount = 0;
  private boardSprites = new Map<string, Phaser.GameObjects.Image>();
  private previewMarkers = new Map<string, Phaser.GameObjects.Rectangle>();
  private trayObjects: Phaser.GameObjects.GameObject[] = [];
  private snapshot!: Build03Snapshot;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    const config = this.registry.get('gameConfig') as GameConfig;
    const manifest = this.registry.get('assetManifest') as AssetManifestData;

    this.debugEnabled = config.debugOverlay;

    const bgAsset = resolveAsset(manifest, config.backgroundId);
    this.orientationController = new OrientationController(bgAsset?.path ?? '', config.backgroundFit);

    this.initializeRuntime(config);
    this.renderBoard(config);
    this.renderTray(config);
    this.publishSnapshot(config);

    if (this.debugEnabled) {
      this.createDebugOverlay(config);

      this.orientationController.onOrientationChange(() => {
        this.updateDebugText(config);
      });

      this.scale.on('resize', () => {
        this.updateDebugText(config);
      });
    }
  }

  private initializeRuntime(config: GameConfig): void {
    const rawLevel = this.cache.json.get(config.levelId) as unknown;
    const level = parseLevelData(rawLevel, config.levelId);
    const assignments = assignTileTypes(level.positions, {
      seed: config.assignmentSeed,
      tileTypeCount: config.tileTypeCount,
      tutorialPreviewPositionIds: config.tutorialPreviewPositionIds,
    });
    const initialBoard = createBoardTiles(level.positions, assignments);

    this.layerCount = level.layers.length;
    this.tripletsValid = validateTriplets(assignments, config.tileTypeCount).valid;
    this.boardState = createBoardRuntimeState(initialBoard.tiles);
    this.trayState = createTrayState(config.trayCapacity);
    this.selectionState = createSelectionState();
  }

  private renderBoard(config: GameConfig): void {
    const layout = calculateBoardLayout(this.boardState.tiles, config.boardLayout, TILE_SOURCE_SIZE);
    const layoutById = new Map(layout.tiles.map(tile => [tile.id, tile]));
    const previewIds = new Set(config.tutorialPreviewPositionIds);

    for (const tile of this.boardState.tiles) {
      const tileLayout = layoutById.get(tile.id);
      if (!tileLayout) throw new Error(`Missing layout for tile ${tile.id}`);

      const sprite = this.add
        .image(tileLayout.screenX, tileLayout.screenY, tile.assetId)
        .setName('build03-board-tile-sprite')
        .setDepth(BOARD_DEPTH + tileLayout.depth)
        .setScale(config.boardLayout.tileScale)
        .setInteractive({ useHandCursor: true });

      sprite.on('pointerdown', () => this.handleTileTap(config, tile.id));
      this.boardSprites.set(tile.id, sprite);

      if (this.debugEnabled && previewIds.has(tile.id)) {
        const marker = this.add
          .rectangle(
            tileLayout.screenX,
            tileLayout.screenY,
            tileLayout.displayWidth + 10,
            tileLayout.displayHeight + 10
          )
          .setStrokeStyle(5, 0x00ff88, 0.95)
          .setDepth(BOARD_DEPTH + tileLayout.depth + 1);
        marker.setData('previewMarkerFor', tile.id);
        this.previewMarkers.set(tile.id, marker);
      }
    }

    this.updateBoardVisualStates(config);
  }

  private handleTileTap(config: GameConfig, tileId: string): void {
    const attempt = attemptTileSelection(
      this.boardState,
      this.trayState,
      this.selectionState,
      tileId,
      config.inputLockEnabled
    );

    this.selectionState = attempt.selection;
    this.publishSnapshot(config);
    this.updateDebugText(config);

    if (!attempt.accepted) {
      if (attempt.reason === 'blocked') this.showBlockedFeedback(config, tileId);
      if (attempt.reason === 'tray-full') this.showTrayFullFeedback();
      return;
    }

    this.flyTileToTray(config, attempt.tile);
  }

  private flyTileToTray(config: GameConfig, tile: BoardTile): void {
    const sprite = this.boardSprites.get(tile.id);
    if (!sprite) {
      this.finishTileSelection(config, tile);
      return;
    }

    const previewTray = completeTileSelection(this.boardState, this.trayState, tile).tray;
    const trayLayout = calculateTrayLayout(previewTray, config.trayLayout);
    const target = trayLayout.tiles.find(layout => layout.sourceTileId === tile.id);
    if (!target) throw new Error(`Missing tray target for tile ${tile.id}`);

    sprite.disableInteractive();
    sprite.setDepth(TRAY_DEPTH + 100);

    this.tweens.add({
      targets: sprite,
      x: target.screenX,
      y: target.screenY,
      scale: config.trayLayout.tileScale,
      duration: config.tileFlyDurationMs,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        sprite.destroy();
        this.boardSprites.delete(tile.id);
        this.finishTileSelection(config, tile);
      },
    });
  }

  private finishTileSelection(config: GameConfig, tile: BoardTile): void {
    const completion = completeTileSelection(this.boardState, this.trayState, tile);
    this.boardState = completion.board;
    this.trayState = completion.tray;
    this.selectionState = completion.selection;

    this.updateBoardVisualStates(config);
    this.renderTray(config);
    this.publishSnapshot(config);
    this.updateDebugText(config);
  }

  private updateBoardVisualStates(config: GameConfig): void {
    const tilesById = new Map(this.boardState.tiles.map(tile => [tile.id, tile]));

    for (const [tileId, sprite] of this.boardSprites) {
      const tile = tilesById.get(tileId);
      if (!tile) {
        sprite.destroy();
        this.previewMarkers.get(tileId)?.destroy();
        this.previewMarkers.delete(tileId);
        this.boardSprites.delete(tileId);
        continue;
      }

      sprite.clearTint().setAlpha(1);
      sprite.setData('tileId', tile.id);
      sprite.setData('selectable', tile.selectable);
      sprite.setData('tileTypeId', tile.tileTypeId);

      if (!tile.selectable && config.debugBlockedState) {
        sprite.setTint(0x5a5f75).setAlpha(0.58);
      }
    }
  }

  private renderTray(config: GameConfig): void {
    for (const object of this.trayObjects) object.destroy();
    this.trayObjects = [];

    const layout = calculateTrayLayout(this.trayState, config.trayLayout);
    const matchReadyTypes = new Set(getMatchReadyTileTypes(this.trayState));

    const background = this.add
      .rectangle(
        layout.bounds.left + layout.bounds.width / 2,
        layout.bounds.top + layout.bounds.height / 2,
        layout.bounds.width + 42,
        layout.bounds.height + 34,
        0x18213a,
        0.74
      )
      .setStrokeStyle(4, 0x7fd7ff, isTrayFull(this.trayState) ? 0.95 : 0.45)
      .setDepth(TRAY_DEPTH - 10)
      .setName('build03-tray-background');
    this.trayObjects.push(background);

    for (const slot of layout.slots) {
      const slotObject = this.add
        .rectangle(slot.screenX, slot.screenY, slot.width, slot.height, 0x0d1224, 0.78)
        .setStrokeStyle(4, 0xe7f7ff, 0.58)
        .setDepth(TRAY_DEPTH)
        .setName('build03-tray-slot');
      slotObject.setData('slotIndex', slot.slotIndex);
      this.trayObjects.push(slotObject);
    }

    for (const tile of layout.tiles) {
      const sprite = this.add
        .image(tile.screenX, tile.screenY, tile.assetId)
        .setScale(config.trayLayout.tileScale)
        .setDepth(TRAY_DEPTH + 20 + tile.slotIndex)
        .setName('build03-tray-tile');
      sprite.setData('sourceTileId', tile.sourceTileId);
      sprite.setData('tileTypeId', tile.tileTypeId);
      this.trayObjects.push(sprite);

      if (this.debugEnabled && config.debugMatchReadyMarker && matchReadyTypes.has(tile.tileTypeId)) {
        const marker = this.add
          .rectangle(tile.screenX, tile.screenY, tile.width + 8, tile.height + 8)
          .setStrokeStyle(5, 0xffd447, 0.95)
          .setDepth(TRAY_DEPTH + 19 + tile.slotIndex)
          .setName('build03-match-ready-marker');
        this.trayObjects.push(marker);
      }
    }
  }

  private showBlockedFeedback(config: GameConfig, tileId: string): void {
    const sprite = this.boardSprites.get(tileId);
    if (!sprite || config.blockedTileFeedback === 'none') return;

    if (config.blockedTileFeedback === 'tint') {
      const originalTint = sprite.tintTopLeft;
      sprite.setTint(0xff5d73);
      this.time.delayedCall(150, () => {
        if (sprite.active) {
          sprite.setTint(originalTint);
          this.updateBoardVisualStates(config);
        }
      });
      return;
    }

    const originalX = sprite.x;
    this.tweens.add({
      targets: sprite,
      x: { from: originalX - 10, to: originalX + 10 },
      duration: 48,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        if (sprite.active) sprite.setX(originalX);
      },
    });
  }

  private showTrayFullFeedback(): void {
    const background = this.trayObjects.find(object => object.name === 'build03-tray-background');
    if (!background) return;
    this.tweens.add({
      targets: background,
      alpha: { from: 1, to: 0.55 },
      duration: 90,
      yoyo: true,
      repeat: 2,
    });
  }

  private createDebugOverlay(config: GameConfig): void {
    const W = config.designWidth;
    const H = config.designHeight;
    const g = this.add.graphics().setDepth(DEBUG_DEPTH);

    g.lineStyle(6, 0x00ff88, 0.7);
    g.strokeRect(3, 3, W - 6, H - 6);

    const arm = 60;
    g.lineStyle(6, 0x00ff88, 1.0);
    g.lineBetween(3, 3, 3 + arm, 3);
    g.lineBetween(3, 3, 3, 3 + arm);
    g.lineBetween(W - 3, 3, W - 3 - arm, 3);
    g.lineBetween(W - 3, 3, W - 3, 3 + arm);
    g.lineBetween(3, H - 3, 3 + arm, H - 3);
    g.lineBetween(3, H - 3, 3, H - 3 - arm);
    g.lineBetween(W - 3, H - 3, W - 3 - arm, H - 3);
    g.lineBetween(W - 3, H - 3, W - 3, H - 3 - arm);

    this.debugText = this.add
      .text(32, 32, this.getDebugLines(config), {
        color: '#00ff88',
        fontSize: '27px',
        fontFamily: 'monospace',
        align: 'left',
        backgroundColor: '#00000099',
        padding: { x: 18, y: 14 },
        lineSpacing: 3,
      })
      .setOrigin(0)
      .setDepth(DEBUG_DEPTH + 1);
  }

  private getDebugLines(config: GameConfig): string {
    const orientation = classifyOrientation(window.innerWidth, window.innerHeight);
    const gs = this.scale.gameSize;
    const snapshot = this.snapshot;
    return [
      config.projectId,
      `${config.designWidth} x ${config.designHeight}`,
      `Browser: ${window.innerWidth} x ${window.innerHeight}`,
      `Orientation: ${orientation}`,
      `Canvas: ${Math.round(gs.width)} x ${Math.round(gs.height)}`,
      `Level: ${snapshot.levelId}`,
      `Seed: ${snapshot.seed}`,
      `Board remaining: ${snapshot.remainingBoardCount}`,
      `Tray: ${snapshot.trayCount}/${snapshot.trayCapacity}`,
      `Selectable: ${snapshot.selectableCount}`,
      `Blocked: ${snapshot.blockedCount}`,
      `Input locked: ${snapshot.inputLocked}`,
      `Tray full: ${snapshot.trayFull}`,
      `Triplets: ${snapshot.tripletValidation}`,
      `Formal solvability: ${snapshot.formalSolvability}`,
      'BUILD-03 tray',
    ].join('\n');
  }

  private updateDebugText(config: GameConfig): void {
    if (this.debugText?.active) {
      this.debugText.setText(this.getDebugLines(config));
    }
  }

  private publishSnapshot(config: GameConfig): void {
    const boardLayout = calculateBoardLayout(this.boardState.tiles, config.boardLayout, TILE_SOURCE_SIZE);
    const trayLayout = calculateTrayLayout(this.trayState, config.trayLayout);
    this.snapshot = createSnapshot(
      config,
      this.boardState,
      this.trayState,
      this.selectionState,
      boardLayout,
      trayLayout,
      this.tripletsValid,
      this.layerCount
    );
    window.__TILEPYRAMID_BUILD02__ = Object.freeze(this.snapshot);
    window.__TILEPYRAMID_BUILD03__ = Object.freeze(this.snapshot);
  }

  shutdown(): void {
    this.orientationController?.destroy();
  }
}

function createSnapshot(
  config: GameConfig,
  board: BoardRuntimeState,
  tray: TrayState,
  selection: SelectionState,
  boardLayout: BoardLayoutResult,
  trayLayout: TrayLayoutResult,
  tripletsValid: boolean,
  layerCount: number
): Build03Snapshot {
  const layoutById = new Map(boardLayout.tiles.map(tile => [tile.id, tile]));

  return {
    levelId: config.levelId,
    seed: config.assignmentSeed,
    tileCount: board.tiles.length,
    remainingBoardCount: board.tiles.length,
    layerCount,
    selectableCount: board.selectableCount,
    blockedCount: board.blockedCount,
    tileTypeCount: config.tileTypeCount,
    tripletValidation: tripletsValid ? 'PASS' : 'FAIL',
    formalSolvability: 'NOT YET PROVEN',
    spriteCount: board.tiles.length,
    boardBounds: {
      left: boardLayout.bounds.left,
      right: boardLayout.bounds.right,
      top: boardLayout.bounds.top,
      bottom: boardLayout.bounds.bottom,
    },
    tiles: board.tiles.map(tile => {
      const tileLayout = layoutById.get(tile.id);
      if (!tileLayout) throw new Error(`Missing layout for snapshot tile ${tile.id}`);
      return {
        id: tile.id,
        layer: tile.layer,
        x: tile.x,
        y: tile.y,
        screenX: tileLayout.screenX,
        screenY: tileLayout.screenY,
        tileTypeId: tile.tileTypeId,
        selectable: tile.selectable,
        blockerIds: [...tile.blockerIds],
      };
    }),
    trayCount: tray.tiles.length,
    trayCapacity: tray.capacity,
    traySlotCount: trayLayout.slots.length,
    trayFull: isTrayFull(tray),
    inputLocked: selection.inputLocked,
    matchReadyTileTypes: getMatchReadyTileTypes(tray),
    trayTiles: trayLayout.tiles.map(tile => ({
      sourceTileId: tile.sourceTileId,
      tileTypeId: tile.tileTypeId,
      slotIndex: tile.slotIndex,
      screenX: tile.screenX,
      screenY: tile.screenY,
    })),
  };
}
