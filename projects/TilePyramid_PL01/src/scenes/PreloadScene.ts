import Phaser from 'phaser';
import type { AssetManifestData, GameConfig } from '../types';
import { tileAssetId } from '../gameplay/board/TileAssigner';
import { resolveAsset } from '../manifest/AssetManifest';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    const config = this.registry.get('gameConfig') as GameConfig;
    const manifest = this.registry.get('assetManifest') as AssetManifestData;
    const levelAsset = resolveAsset(manifest, config.levelId);

    if (!levelAsset || levelAsset.type !== 'json') {
      throw new Error(`Missing JSON level asset in manifest: ${config.levelId}`);
    }

    this.load.json(config.levelId, levelAsset.path);

    for (let tileTypeId = 1; tileTypeId <= config.tileTypeCount; tileTypeId++) {
      const assetId = tileAssetId(tileTypeId);
      const asset = resolveAsset(manifest, assetId);
      if (!asset || asset.type !== 'image') {
        throw new Error(`Missing tile image asset in manifest: ${assetId}`);
      }
      this.load.image(assetId, asset.path);
    }

    if (config.tutorial.enabled && config.tutorial.handEnabled) {
      const handAsset = resolveAsset(manifest, config.tutorial.handAssetId);
      if (!handAsset || handAsset.type !== 'image') {
        throw new Error(`Missing tutorial hand image asset in manifest: ${config.tutorial.handAssetId}`);
      }
      this.load.image(config.tutorial.handAssetId, handAsset.path);
    }
  }

  create(): void {
    this.scene.start('GameScene');
  }
}

