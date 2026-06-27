import Phaser from 'phaser';
import { calculateBoardLayout } from '../gameplay/board/BoardLayout';
import { createBoardTiles } from '../gameplay/board/BlockingSystem';
import { assignTileTypes, validateTriplets } from '../gameplay/board/TileAssigner';
import type { BoardTile } from '../gameplay/level/LevelTypes';
import { parseLevelData } from '../gameplay/level/LevelParser';
import { resolveAsset } from '../manifest/AssetManifest';
import { classifyOrientation, OrientationController } from '../orientation/OrientationController';
import type { AssetManifestData, Build02Snapshot, GameConfig } from '../types';

export class GameScene extends Phaser.Scene {
  private orientationController!: OrientationController;
  private debugText!: Phaser.GameObjects.Text;
  private debugEnabled = false;
  private snapshot!: Build02Snapshot;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    const config = this.registry.get('gameConfig') as GameConfig;
    const manifest = this.registry.get('assetManifest') as AssetManifestData;

    this.debugEnabled = config.debugOverlay;

    const bgAsset = resolveAsset(manifest, config.backgroundId);
    const bgPath = bgAsset?.path ?? '';

    this.orientationController = new OrientationController(bgPath, config.backgroundFit);
    this.createBoard(config);

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

  private createBoard(config: GameConfig): void {
    const rawLevel = this.cache.json.get(config.levelId) as unknown;
    const level = parseLevelData(rawLevel, config.levelId);
    const assignments = assignTileTypes(level.positions, {
      seed: config.assignmentSeed,
      tileTypeCount: config.tileTypeCount,
      tutorialPreviewPositionIds: config.tutorialPreviewPositionIds,
    });
    const tripletValidation = validateTriplets(assignments, config.tileTypeCount);
    const board = createBoardTiles(level.positions, assignments);
    const layout = calculateBoardLayout(board.tiles, config.boardLayout, { width: 132, height: 144 });
    const layoutById = new Map(layout.tiles.map(tile => [tile.id, tile]));
    const previewIds = new Set(config.tutorialPreviewPositionIds);

    for (const tile of board.tiles) {
      const tileLayout = layoutById.get(tile.id);
      if (!tileLayout) throw new Error(`Missing layout for tile ${tile.id}`);

      const sprite = this.add
        .image(tileLayout.screenX, tileLayout.screenY, tile.assetId)
        .setName('build02-tile-sprite')
        .setDepth(tileLayout.depth)
        .setScale(config.boardLayout.tileScale);

      sprite.setData('tileId', tile.id);
      sprite.setData('selectable', tile.selectable);
      sprite.setData('tileTypeId', tile.tileTypeId);

      if (!tile.selectable && config.debugBlockedState) {
        sprite.setTint(0x5a5f75).setAlpha(0.58);
      }

      if (this.debugEnabled && previewIds.has(tile.id)) {
        this.add
          .rectangle(
            tileLayout.screenX,
            tileLayout.screenY,
            tileLayout.displayWidth + 10,
            tileLayout.displayHeight + 10
          )
          .setStrokeStyle(5, 0x00ff88, 0.95)
          .setDepth(tileLayout.depth + 1);
      }
    }

    this.snapshot = createSnapshot(
      config,
      board.tiles,
      layout,
      tripletValidation.valid,
      level.layers.length
    );
    window.__TILEPYRAMID_BUILD02__ = Object.freeze(this.snapshot);
  }

  private createDebugOverlay(config: GameConfig): void {
    const W = config.designWidth;
    const H = config.designHeight;

    const g = this.add.graphics();

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

    g.lineStyle(2, 0x00ff88, 0.3);
    g.lineBetween(W / 2 - 50, H / 2, W / 2 + 50, H / 2);
    g.lineBetween(W / 2, H / 2 - 50, W / 2, H / 2 + 50);

    this.debugText = this.add
      .text(32, 32, this.getDebugLines(config), {
        color: '#00ff88',
        fontSize: '28px',
        fontFamily: 'monospace',
        align: 'left',
        backgroundColor: '#00000099',
        padding: { x: 18, y: 14 },
        lineSpacing: 4,
      })
      .setOrigin(0);
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
      `Tiles: ${snapshot.tileCount}`,
      `Layers: ${snapshot.layerCount}`,
      `Selectable: ${snapshot.selectableCount}`,
      `Blocked: ${snapshot.blockedCount}`,
      `Tile types: ${snapshot.tileTypeCount}`,
      `Triplets: ${snapshot.tripletValidation}`,
      `Formal solvability: ${snapshot.formalSolvability}`,
      'BUILD-02 board',
    ].join('\n');
  }

  private updateDebugText(config: GameConfig): void {
    if (this.debugText?.active) {
      this.debugText.setText(this.getDebugLines(config));
    }
  }

  shutdown(): void {
    this.orientationController?.destroy();
  }
}

function createSnapshot(
  config: GameConfig,
  tiles: BoardTile[],
  layout: ReturnType<typeof calculateBoardLayout>,
  tripletsValid: boolean,
  layerCount: number
): Build02Snapshot {
  const layoutById = new Map(layout.tiles.map(tile => [tile.id, tile]));
  const selectableCount = tiles.filter(tile => tile.selectable).length;

  return {
    levelId: config.levelId,
    seed: config.assignmentSeed,
    tileCount: tiles.length,
    layerCount,
    selectableCount,
    blockedCount: tiles.length - selectableCount,
    tileTypeCount: config.tileTypeCount,
    tripletValidation: tripletsValid ? 'PASS' : 'FAIL',
    formalSolvability: 'NOT YET PROVEN',
    spriteCount: tiles.length,
    boardBounds: {
      left: layout.bounds.left,
      right: layout.bounds.right,
      top: layout.bounds.top,
      bottom: layout.bounds.bottom,
    },
    tiles: tiles.map(tile => {
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
  };
}

