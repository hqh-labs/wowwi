import { describe, it, expect } from 'vitest';
import { validateManifest, resolveAsset, ManifestValidationError } from '../../src/manifest/AssetManifest';

const VALID_ASSET = {
  id: 'Background_1',
  type: 'image',
  path: './assets/images/Background_1.png',
  source: 'Copied from extracted-assets',
};

const VALID = {
  version: '1',
  assets: [VALID_ASSET],
};

describe('validateManifest', () => {
  it('accepts a valid manifest', () => {
    const m = validateManifest({ ...VALID, assets: [{ ...VALID_ASSET }] });
    expect(m.version).toBe('1');
    expect(m.assets).toHaveLength(1);
  });

  it('throws when passed null', () => {
    expect(() => validateManifest(null)).toThrow(ManifestValidationError);
  });

  it('throws when assets is not an array', () => {
    expect(() => validateManifest({ version: '1', assets: {} })).toThrow(/assets/);
  });

  it('throws when asset id is missing', () => {
    const bad = { version: '1', assets: [{ ...VALID_ASSET, id: '' }] };
    expect(() => validateManifest(bad)).toThrow(/id/);
  });

  it('throws when asset type is invalid', () => {
    const bad = { version: '1', assets: [{ ...VALID_ASSET, type: 'video' }] };
    expect(() => validateManifest(bad)).toThrow(/type/);
  });

  it('accepts audio type', () => {
    const good = { version: '1', assets: [{ ...VALID_ASSET, type: 'audio' }] };
    expect(() => validateManifest(good)).not.toThrow();
  });

  it('accepts font type', () => {
    const good = { version: '1', assets: [{ ...VALID_ASSET, type: 'font' }] };
    expect(() => validateManifest(good)).not.toThrow();
  });

  it('accepts json type', () => {
    const good = { version: '1', assets: [{ ...VALID_ASSET, type: 'json' }] };
    expect(() => validateManifest(good)).not.toThrow();
  });

  it('throws when asset path is empty', () => {
    const bad = { version: '1', assets: [{ ...VALID_ASSET, path: '  ' }] };
    expect(() => validateManifest(bad)).toThrow(/path/);
  });

  it('accepts an empty assets array', () => {
    expect(() => validateManifest({ version: '1', assets: [] })).not.toThrow();
  });
});

describe('resolveAsset', () => {
  const manifest = validateManifest({ ...VALID, assets: [{ ...VALID_ASSET }] });

  it('returns the asset for a known id', () => {
    const asset = resolveAsset(manifest, 'Background_1');
    expect(asset).toBeDefined();
    expect(asset?.path).toBe('./assets/images/Background_1.png');
  });

  it('returns undefined for an unknown id', () => {
    expect(resolveAsset(manifest, 'NoSuchAsset')).toBeUndefined();
  });
});
