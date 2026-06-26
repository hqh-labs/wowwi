import Phaser from 'phaser';
import type { GameConfig, AssetManifestData } from '../types';
import { BootScene } from '../scenes/BootScene';
import { PreloadScene } from '../scenes/PreloadScene';
import { GameScene } from '../scenes/GameScene';

export function createGame(config: GameConfig, manifest: AssetManifestData): Phaser.Game {
  const phaserConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: config.designWidth,
    height: config.designHeight,
    backgroundColor: '#00000000',
    transparent: true,
    parent: 'game-container',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, PreloadScene, GameScene],
    fps: { target: 60, forceSetTimeOut: false },
  };

  const game = new Phaser.Game(phaserConfig);
  game.registry.set('gameConfig', config);
  game.registry.set('assetManifest', manifest);
  return game;
}
