import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // BUILD-01: No Phaser-managed assets to preload.
    // The background image is applied to the DOM layer by OrientationController.
  }

  create(): void {
    this.scene.start('GameScene');
  }
}
