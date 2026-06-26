import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // Config and manifest were stored in the registry by createGame() in main.ts.
    // Nothing else to do at boot — proceed directly to preload.
    this.scene.start('PreloadScene');
  }
}
