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
  timer: TimerConfig;
  tutorial: TutorialConfig;
  idleHint: IdleHintConfig;
  debugTimerTutorialIdle: boolean;
  app: AppConfig;
  cta: CtaConfig;
  endCard: EndCardConfig;
  debugCtaEndCardStore: boolean;
  audio: AudioConfig;
  effects: EffectsConfig;
  debugAudioEffects: boolean;
}

export interface AudioConfig {
  enabled: boolean;
  mutedByDefault: boolean;
  unlockOnFirstValidTap: boolean;
  sfxVolume: number;
  sfx: AudioSfxConfig;
  bgm: AudioBgmConfig;
}

export interface AudioSfxConfig {
  tileSelect: string;
  blockedTap: string;
  match: string;
  win: string;
  fail: string;
  ctaClick: string;
}

export interface AudioBgmConfig {
  enabled: boolean;
  assetId: string;
  volume: number;
}

export interface EffectsConfig {
  enabled: boolean;
  tileSelectPop: EffectScaleConfig;
  blockedShake: BlockedShakeEffectConfig;
  matchResolve: MatchResolveEffectConfig;
  trayFullWarning: TrayFullEffectConfig;
  timerWarningPulse: EffectScaleConfig;
  outcomePulse: EffectScaleConfig;
}

export interface EffectScaleConfig {
  enabled: boolean;
  scale: number;
  durationMs: number;
}

export interface BlockedShakeEffectConfig {
  enabled: boolean;
  distance: number;
  durationMs: number;
  repeats: number;
  tint: string;
}

export interface MatchResolveEffectConfig {
  enabled: boolean;
  durationMs: number;
  flashColor: string;
}

export interface TrayFullEffectConfig {
  enabled: boolean;
  durationMs: number;
  alpha: number;
}

export interface AppConfig {
  name: string;
  fallbackUrl: string;
  androidUrl: string;
  iosUrl: string;
  storeOpenMode: 'record-only' | 'navigate';
  safeDevelopmentNavigation: boolean;
  iconAssetId: string;
  logoAssetId: string;
}

export interface CtaConfig {
  enabled: boolean;
  text: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  cornerRadius: number;
  visibleDuringGameplay: boolean;
}

export interface EndCardConfig {
  enabled: boolean;
  showOnWin: boolean;
  showOnFail: boolean;
  titleText: string;
  winMessage: string;
  failMessage: string;
  fullScreenClick: boolean;
  ctaText: string;
}

export interface TimerConfig {
  durationSeconds: number;
  warningSeconds: number;
  startOnFirstValidTap: boolean;
  debugVisible: boolean;
}

export interface TutorialConfig {
  enabled: boolean;
  text: string;
  dismissOnFirstValidTap: boolean;
  previewTileIds: string[];
  dimOpacity: number;
  handEnabled: boolean;
  handAssetId: string;
  handPathMode: 'loop-preview-tiles' | 'first-preview-tile';
}

export interface IdleHintConfig {
  enabled: boolean;
  delaySeconds: number;
  preferTrayPairCompletion: boolean;
  deterministicFallback: boolean;
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

export interface PlayableNetworkRuntime {
  profileId: string;
  network: 'unity' | 'applovin';
  generatedAt: string;
  targetMaxBytes: number;
  orientationPolicy: string;
  timerFirstInteraction: boolean;
  mraidRequired: boolean;
  networkProvidedMraid: boolean;
  requiresNoExternalResources: boolean;
  hostCloseButtonSafeZone: { corner: 'top-right'; width: number; height: number };
  safeAreaPolicy: string;
  domOverlayPolicy: string;
  finalApprovalDisclaimer: string;
  androidStoreUrl: string;
  iosStoreUrl: string;
  fallbackStoreUrl: string;
  storeUrls: {
    androidUrl: string;
    iosUrl: string;
    fallbackUrl: string;
  };
  formalSolvability: 'NOT YET PROVEN';
}

export interface PlayableStoreOpenPayload {
  source: 'gameplay-cta' | 'end-card' | 'unknown';
  url: string;
  network?: string;
}

export interface PlayableStoreOpenResult {
  handled: boolean;
  method: 'mraid.open' | 'window.open' | 'location.href' | 'record-only' | 'failed';
  error?: string;
}

export type PlayableStoreOpenBridge = (payload: PlayableStoreOpenPayload) => PlayableStoreOpenResult;

export interface PlayableStoreOpenDiagnostics {
  network: 'unity' | 'applovin';
  source: PlayableStoreOpenPayload['source'] | null;
  attemptedUrl: string | null;
  methodUsed: PlayableStoreOpenResult['method'] | null;
  errorCount: number;
  lastErrorMessage: string | null;
  androidStoreUrl?: string;
  iosStoreUrl?: string;
  fallbackStoreUrl?: string;
  androidUrl?: string;
  iosUrl?: string;
  fallbackUrl?: string;
  selectedFallbackUrl?: string;
}

declare global {
  interface Window {
    __GAME_CONFIG__: GameConfig;
    __ASSET_MANIFEST__: AssetManifestData;
    __TILEPYRAMID_BUILD02__?: Readonly<Build02Snapshot>;
    __TILEPYRAMID_BUILD03__?: Readonly<Build03Snapshot>;
    __TILEPYRAMID_BUILD04__?: Readonly<Build04Snapshot>;
    __TILEPYRAMID_BUILD05__?: Readonly<Build05Snapshot>;
    __TILEPYRAMID_BUILD06__?: Readonly<Build06Snapshot>;
    __TILEPYRAMID_BUILD08__?: Readonly<Build08Snapshot>;
    __TILEPYRAMID_BUILD09__?: Readonly<Build08Snapshot>;
    __PLAYABLE_NETWORK__?: PlayableNetworkRuntime;
    __PLAYABLE_STORE_OPEN__?: PlayableStoreOpenBridge;
    __PLAYABLE_STORE_OPEN_DIAGNOSTICS__?: PlayableStoreOpenDiagnostics;
    __PLAYABLE_QA_MODE__?: boolean;
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

export interface Build05Snapshot extends Build04Snapshot {
  timerStarted: boolean;
  timerRemaining: number;
  timerDisplaySeconds: number;
  timerWarningActive: boolean;
  timerExpired: boolean;
  tutorialActive: boolean;
  tutorialDismissed: boolean;
  tutorialText: string;
  tutorialHighlightedTileIds: string[];
  tutorialHandVisible: boolean;
  idleHintActive: boolean;
  idleHintTargetTileId: string | null;
  secondsSinceLastValidInteraction: number;
}

export interface Build06Snapshot extends Build05Snapshot {
  ctaVisible: boolean;
  ctaClickCount: number;
  endCardVisible: boolean;
  endCardReason: 'win' | 'fail' | 'none';
  endCardClickCount: number;
  storeOpenCallCount: number;
  lastStoreOpenSource: 'gameplay-cta' | 'end-card' | 'unknown' | null;
  lastStoreOpenUrl: string | null;
  storeOpenMode: 'record-only' | 'navigate';
  storeOpenFallbackUrl: string;
  storeOpenAndroidUrl: string | null;
  storeOpenIosUrl: string | null;
  lastStoreOpenPlatform: 'android' | 'ios' | 'fallback' | null;
}

export interface Build08Snapshot extends Build06Snapshot {
  audioEnabled: boolean;
  audioUnlocked: boolean;
  audioMuted: boolean;
  bgmEnabled: boolean;
  bgmPlaying: boolean;
  lastSfxPlayed: string | null;
  audioErrorCount: number;
  effectsEnabled: boolean;
  lastEffectTriggered: string | null;
  timerWarningVisualActive: boolean;
}
