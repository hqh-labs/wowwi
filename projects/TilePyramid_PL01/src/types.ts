export interface GameConfig {
  projectId: string;
  designWidth: number;
  designHeight: number;
  backgroundId: string;
  backgroundFit: 'cover' | 'contain' | 'fill';
  viewportAspect: string;
  portraitPolicy: 'fill';
  landscapePolicy: 'letterbox';
  debugOverlay: boolean;
}

export interface AssetEntry {
  id: string;
  type: 'image' | 'audio' | 'font';
  path: string;
  source: string;
}

export interface AssetManifestData {
  version: string;
  assets: AssetEntry[];
}

declare global {
  interface Window {
    __GAME_CONFIG__: GameConfig;
    __ASSET_MANIFEST__: AssetManifestData;
  }
}
