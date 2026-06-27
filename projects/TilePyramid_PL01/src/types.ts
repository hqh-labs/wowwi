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
  levelId: string;
  assignmentSeed: number;
  tileTypeCount: number;
  tutorialPreviewPositionIds: string[];
  boardLayout: BoardLayoutConfig;
  debugBlockedState: boolean;
  trayCapacity: number;
  trayLayout: TrayLayoutConfig;
  tileFlyDurationMs: number;
  inputLockEnabled: boolean;
  blockedTileFeedback: 'shake' | 'tint' | 'none';
  debugMatchReadyMarker: boolean;
  matchResolutionDelayMs: number;
  matchResolutionDurationMs: number;
  matchResolvingVisual: 'scale-fade' | 'none';
  inputLockDuringMatchResolution: boolean;
  debugOutcomeLabel: boolean;
}

export interface BoardLayoutConfig {
  centerX: number;
  centerY: number;
  spacingX: number;
  spacingY: number;
  layerOffsetX: number;
  layerOffsetY: number;
  tileScale: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface TrayLayoutConfig {
  centerX: number;
  centerY: number;
  slotSpacing: number;
  slotWidth: number;
  slotHeight: number;
  tileScale: number;
}

export interface AssetEntry {
  id: string;
  type: 'image' | 'audio' | 'font' | 'json';
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
    __TILEPYRAMID_BUILD02__?: Readonly<Build02Snapshot>;
    __TILEPYRAMID_BUILD03__?: Readonly<Build03Snapshot>;
    __TILEPYRAMID_BUILD04__?: Readonly<Build04Snapshot>;
  }
}

export interface Build02Snapshot {
  levelId: string;
  seed: number;
  tileCount: number;
  layerCount: number;
  selectableCount: number;
  blockedCount: number;
  tileTypeCount: number;
  tripletValidation: 'PASS' | 'FAIL';
  formalSolvability: 'NOT YET PROVEN';
  spriteCount: number;
  boardBounds: { left: number; right: number; top: number; bottom: number };
  tiles: Array<{
    id: string;
    layer: number;
    x: number;
    y: number;
    screenX: number;
    screenY: number;
    tileTypeId: number;
    selectable: boolean;
    blockerIds: string[];
  }>;
}

export interface Build03Snapshot extends Build02Snapshot {
  remainingBoardCount: number;
  trayCount: number;
  trayCapacity: number;
  traySlotCount: number;
  trayFull: boolean;
  inputLocked: boolean;
  matchReadyTileTypes: number[];
  trayTiles: Array<{
    sourceTileId: string;
    tileTypeId: number;
    slotIndex: number;
    screenX: number;
    screenY: number;
  }>;
}

export type GameOutcomeState = 'playing' | 'won' | 'failed';

export interface Build04Snapshot extends Build03Snapshot {
  matchResolving: boolean;
  lastMatchedTileType: number | null;
  gameState: GameOutcomeState;
  resolvingTileIds: string[];
}
