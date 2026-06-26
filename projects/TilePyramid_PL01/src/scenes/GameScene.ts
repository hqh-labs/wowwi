import Phaser from 'phaser';
import type { GameConfig, AssetManifestData } from '../types';
import { resolveAsset } from '../manifest/AssetManifest';
import { OrientationController, classifyOrientation } from '../orientation/OrientationController';

export class GameScene extends Phaser.Scene {
  private orientationController!: OrientationController;
  private debugText!: Phaser.GameObjects.Text;
  private debugEnabled = false;

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

  private createDebugOverlay(config: GameConfig): void {
    const W = config.designWidth;
    const H = config.designHeight;

    const g = this.add.graphics();

    // Viewport border
    g.lineStyle(6, 0x00ff88, 0.7);
    g.strokeRect(3, 3, W - 6, H - 6);

    // Corner accents
    const arm = 60;
    g.lineStyle(6, 0x00ff88, 1.0);
    // top-left
    g.lineBetween(3, 3, 3 + arm, 3);
    g.lineBetween(3, 3, 3, 3 + arm);
    // top-right
    g.lineBetween(W - 3, 3, W - 3 - arm, 3);
    g.lineBetween(W - 3, 3, W - 3, 3 + arm);
    // bottom-left
    g.lineBetween(3, H - 3, 3 + arm, H - 3);
    g.lineBetween(3, H - 3, 3, H - 3 - arm);
    // bottom-right
    g.lineBetween(W - 3, H - 3, W - 3 - arm, H - 3);
    g.lineBetween(W - 3, H - 3, W - 3, H - 3 - arm);

    // Center crosshair
    g.lineStyle(2, 0x00ff88, 0.3);
    g.lineBetween(W / 2 - 50, H / 2, W / 2 + 50, H / 2);
    g.lineBetween(W / 2, H / 2 - 50, W / 2, H / 2 + 50);

    this.debugText = this.add
      .text(W / 2, H / 2, this.getDebugLines(config), {
        color: '#00ff88',
        fontSize: '44px',
        fontFamily: 'monospace',
        align: 'center',
        backgroundColor: '#00000099',
        padding: { x: 28, y: 18 },
        lineSpacing: 8,
      })
      .setOrigin(0.5);
  }

  private getDebugLines(config: GameConfig): string {
    const orientation = classifyOrientation(window.innerWidth, window.innerHeight);
    const gs = this.scale.gameSize;
    return [
      config.projectId,
      `${config.designWidth} × ${config.designHeight}`,
      `Browser: ${window.innerWidth} × ${window.innerHeight}`,
      `Orientation: ${orientation}`,
      `Canvas: ${Math.round(gs.width)} × ${Math.round(gs.height)}`,
      'BUILD-01 shell',
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
