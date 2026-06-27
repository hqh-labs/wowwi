import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AssetManifestData } from '../../src/types';

const publicRoot = fileURLToPath(new URL('../../public', import.meta.url));
const manifestPath = path.join(publicRoot, 'config/asset-manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as AssetManifestData;

function manifestAsset(id: string) {
  const asset = manifest.assets.find(entry => entry.id === id);
  expect(asset, `Missing manifest asset ${id}`).toBeDefined();
  return asset!;
}

describe('Build-07 optimized runtime assets', () => {
  it('manifest references existing runtime files', () => {
    for (const asset of manifest.assets) {
      const runtimePath = path.resolve(publicRoot, asset.path);
      expect(existsSync(runtimePath), `${asset.id} missing at ${asset.path}`).toBe(true);
    }
  });

  it('optimized tile images exist for all 24 tile types', () => {
    for (let tileTypeId = 1; tileTypeId <= 24; tileTypeId++) {
      const id = `Tile_${String(tileTypeId).padStart(2, '0')}`;
      const asset = manifestAsset(id);
      expect(asset.path).toBe(`./assets/images/optimized/tiles/tile_${String(tileTypeId).padStart(2, '0')}.webp`);
      expect(existsSync(path.resolve(publicRoot, asset.path))).toBe(true);
    }
  });

  it('optimized background exists', () => {
    const asset = manifestAsset('Background_1');
    expect(asset.path).toBe('./assets/images/optimized/background_1.webp');
    expect(existsSync(path.resolve(publicRoot, asset.path))).toBe(true);
  });

  it('optimized app icon exists', () => {
    const asset = manifestAsset('App_Icon');
    expect(asset.path).toBe('./assets/images/optimized/app_icon_384.webp');
    expect(existsSync(path.resolve(publicRoot, asset.path))).toBe(true);
  });

  it('optimized logo exists', () => {
    const asset = manifestAsset('App_Logo');
    expect(asset.path).toBe('./assets/images/optimized/logo_520.webp');
    expect(existsSync(path.resolve(publicRoot, asset.path))).toBe(true);
  });

  it('optimized hand pointer exists if manifest uses it', () => {
    const asset = manifestAsset('Pointer_Hand');
    expect(asset.path).toBe('./assets/images/optimized/pointer_hand.webp');
    expect(existsSync(path.resolve(publicRoot, asset.path))).toBe(true);
  });

  it('no manifest entry points to project-input', () => {
    for (const asset of manifest.assets) {
      expect(asset.path).not.toContain('project-input');
    }
  });

  it('no manifest entry points to missing files', () => {
    const missing = manifest.assets.filter(asset => !existsSync(path.resolve(publicRoot, asset.path)));
    expect(missing).toEqual([]);
  });

  it('production manifest image entries use optimized WebP assets', () => {
    const imageAssets = manifest.assets.filter(asset => asset.type === 'image');
    expect(imageAssets.length).toBeGreaterThan(0);
    for (const asset of imageAssets) {
      expect(asset.path).toContain('/optimized/');
      expect(asset.path.endsWith('.webp')).toBe(true);
    }
  });

  it('formal solvability remains not yet proven in diagnostics contract', () => {
    const formalSolvability = 'NOT YET PROVEN';
    expect(formalSolvability).toBe('NOT YET PROVEN');
  });
});
