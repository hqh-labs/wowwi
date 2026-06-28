import Phaser from 'phaser';
import {
  createAudioState,
  recordAudioError,
  requestSfx,
  unlockAudio,
  type AudioState,
} from '../gameplay/audio/AudioSystem';
import { calculateBoardLayout, type BoardLayoutResult } from '../gameplay/board/BoardLayout';
import { createBoardTiles } from '../gameplay/board/BlockingSystem';
import {
  createBoardRuntimeState,
  type BoardRuntimeState,
} from '../gameplay/board/BoardRuntimeState';
import { assignTileTypes, validateTriplets } from '../gameplay/board/TileAssigner';
import { createCtaState, recordCtaClick, setCtaVisible, type CtaState } from '../gameplay/cta/CtaSystem';
import {
  createEndCardState,
  recordEndCardClick,
  updateEndCardForOutcome,
  type EndCardState,
} from '../gameplay/endcard/EndCardSystem';
import {
  createEffectState,
  requestEffect,
  setTimerWarningVisual,
  type EffectName,
  type EffectState,
} from '../gameplay/effects/EffectSystem';
import {
  createIdleHintState,
  resetIdleHint,
  tickIdleHint,
  type IdleHintState,
} from '../gameplay/idle/IdleHintSystem';
import { selectIdleHintTarget } from '../gameplay/idle/HintCandidateSelector';
import { evaluateOutcome } from '../gameplay/outcome/OutcomeEvaluator';
import {
  attemptTileSelection,
  completeTileSelection,
  createSelectionState,
  type SelectionState,
} from '../gameplay/selection/SelectionController';
import { parseLevelData } from '../gameplay/level/LevelParser';
import type { BoardTile } from '../gameplay/level/LevelTypes';
import {
  findNextMatchGroup,
  removeMatchGroup,
  type MatchGroup,
} from '../gameplay/tray/MatchResolver';
import {
  createTimerState,
  getTimerDisplaySeconds,
  registerTimerInteraction,
  tickTimer,
  type TimerState,
} from '../gameplay/timer/TimerSystem';
import { StoreOpenService, type StoreOpenState } from '../gameplay/store/StoreOpenService';
import {
  createTutorialState,
  handleTutorialInteraction,
  hideTutorialAfterOutcome,
  type TutorialState,
} from '../gameplay/tutorial/TutorialSystem';
import { calculateTrayLayout, type TrayLayoutResult } from '../gameplay/tray/TrayLayout';
import {
  createTrayState,
  getMatchReadyTileTypes,
  isTrayFull,
  type TrayState,
} from '../gameplay/tray/TraySystem';
import { resolveAsset } from '../manifest/AssetManifest';
import { isDebugAllowed } from '../config/ConfigLoader';
import { classifyOrientation, OrientationController } from '../orientation/OrientationController';
import type { AssetManifestData, Build08Snapshot, CommercialJuiceConfig, GameConfig, GameOutcomeState } from '../types';

const TILE_SOURCE_SIZE = { width: 132, height: 144 };
const BOARD_DEPTH = 1000;
const TRAY_DEPTH = 6000;
const TIMER_DEPTH = 7800;
const TUTORIAL_DEPTH = 8000;
const CTA_DEPTH = 8500;
const END_CARD_DEPTH = 8700;
const DEBUG_DEPTH = 9000;
const BUILD_ID = 'BUILD-20';
const BUILD_LABEL = 'BUILD-20 creative-polish';

export class GameScene extends Phaser.Scene {
  private orientationController!: OrientationController;
  private debugText!: Phaser.GameObjects.Text;
  private debugEnabled = false;
  private boardState!: BoardRuntimeState;
  private trayState!: TrayState;
  private selectionState!: SelectionState;
  private tripletsValid = false;
  private layerCount = 0;
  private boardSprites = new Map<string, Phaser.GameObjects.Image>();
  private previewMarkers = new Map<string, Phaser.GameObjects.Rectangle>();
  private trayTileSprites = new Map<string, Phaser.GameObjects.Image>();
  private trayObjects: Phaser.GameObjects.GameObject[] = [];
  private resolvingGroup?: MatchGroup;
  private lastMatchedTileType: number | null = null;
  private gameState: GameOutcomeState = 'playing';
  private timerState!: TimerState;
  private tutorialState!: TutorialState;
  private idleHintState!: IdleHintState;
  private ctaState!: CtaState;
  private endCardState!: EndCardState;
  private storeOpenService!: StoreOpenService;
  private storeOpenState!: StoreOpenState;
  private audioState!: AudioState;
  private effectState!: EffectState;
  private snapshot!: Build08Snapshot;
  private timerText?: Phaser.GameObjects.Text;
  private ctaObjects: Phaser.GameObjects.GameObject[] = [];
  private tutorialObjects: Phaser.GameObjects.GameObject[] = [];
  private tutorialHand?: Phaser.GameObjects.Image;
  private idleObjects: Phaser.GameObjects.GameObject[] = [];
  private endCardObjects: Phaser.GameObjects.GameObject[] = [];
  private renderedIdleKey = '';
  private timerWarningLoopTween?: Phaser.Tweens.Tween;
  private matchStreak = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    const config = this.registry.get('gameConfig') as GameConfig;
    const manifest = this.registry.get('assetManifest') as AssetManifestData;

    this.debugEnabled = isDebugAllowed(config) && config.debugOverlay;

    const bgAsset = resolveAsset(manifest, config.backgroundId);
    this.orientationController = new OrientationController(bgAsset?.path ?? '', config.backgroundFit);

    this.initializeRuntime(config);
    this.renderSceneDepth(config);
    this.renderBoard(config);
    this.renderTray(config);
    this.renderTimer(config);
    this.renderTutorial(config);
    this.renderIdleHint(config);
    this.renderGameplayCta(config);
    this.renderEndCard(config);
    this.publishSnapshot(config);

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

  private initializeRuntime(config: GameConfig): void {
    const rawLevel = this.cache.json.get(config.levelId) as unknown;
    const level = parseLevelData(rawLevel, config.levelId);
    const assignments = assignTileTypes(level.positions, {
      seed: config.assignmentSeed,
      tileTypeCount: config.tileTypeCount,
      tutorialPreviewPositionIds: config.tutorialPreviewPositionIds,
    });
    const initialBoard = createBoardTiles(level.positions, assignments);

    this.layerCount = level.layers.length;
    this.tripletsValid = validateTriplets(assignments, config.tileTypeCount).valid;
    this.boardState = createBoardRuntimeState(initialBoard.tiles);
    this.trayState = createTrayState(config.trayCapacity);
    this.selectionState = createSelectionState();
    this.timerState = createTimerState(config.timer.durationSeconds, config.timer.warningSeconds);
    this.tutorialState = createTutorialState({
      enabled: config.tutorial.enabled,
      text: config.tutorial.text,
      previewTileIds: config.tutorial.previewTileIds,
    });
    this.idleHintState = createIdleHintState(config.idleHint.enabled, config.idleHint.delaySeconds);
    this.ctaState = createCtaState(config.cta.enabled, config.cta.visibleDuringGameplay);
    this.endCardState = createEndCardState(config.endCard.enabled);
    this.audioState = createAudioState({
      enabled: config.audio.enabled,
      mutedByDefault: config.audio.mutedByDefault,
      bgmEnabled: config.audio.bgm.enabled,
    });
    this.effectState = createEffectState(config.effects.enabled);
    this.storeOpenService = new StoreOpenService({
      fallbackUrl: config.app.fallbackUrl,
      androidUrl: config.app.androidUrl,
      iosUrl: config.app.iosUrl,
      mode: config.app.storeOpenMode,
      safeDevelopmentNavigation: config.app.safeDevelopmentNavigation,
    });
    this.storeOpenState = this.storeOpenService.getSnapshot();
    this.gameState = 'playing';
  }

  update(_time: number, delta: number): void {
    const config = this.registry.get('gameConfig') as GameConfig;

    const nextTimer = tickTimer(this.timerState, delta / 1000, this.gameState);
    const timerChanged =
      nextTimer.remainingSeconds !== this.timerState.remainingSeconds ||
      nextTimer.expired !== this.timerState.expired ||
      nextTimer.warningActive !== this.timerState.warningActive;
    const warningBecameActive = !this.timerState.warningActive && nextTimer.warningActive;
    this.timerState = nextTimer;
    this.effectState = setTimerWarningVisual(this.effectState, this.timerState.warningActive);
    if (warningBecameActive && config.effects.timerWarningPulse.enabled) {
      this.triggerEffect('timer-warning-pulse');
      if (config.effects.timerWarningContinuousPulse) {
        this.startTimerWarningLoop(config);
      }
    }

    if (this.timerState.expired && this.gameState === 'playing') {
      this.timerWarningLoopTween?.stop();
      this.timerWarningLoopTween = undefined;
      this.gameState = 'failed';
      this.selectionState = { inputLocked: true };
      this.playSfx(config, config.audio.sfx.fail);
      this.triggerEffect('outcome-pulse');
      this.pulseOutcomeVisual(config);
      this.tutorialState = hideTutorialAfterOutcome(this.tutorialState);
      this.idleHintState = resetIdleHint(this.idleHintState);
      this.updateEndCardState(config);
      this.renderTutorial(config);
      this.renderIdleHint(config);
      this.renderEndCard(config);
      this.pulseOutcomeVisual(config);
    }

    const targetTileId = selectIdleHintTarget({
      boardTiles: this.boardState.tiles,
      trayTiles: this.trayState.tiles,
      preferTrayPairCompletion: config.idleHint.preferTrayPairCompletion,
      deterministicFallback: config.idleHint.deterministicFallback,
    });
    const nextIdle = tickIdleHint(this.idleHintState, delta / 1000, {
      tutorialDismissed: this.tutorialState.dismissed || !this.tutorialState.enabled,
      inputLocked: this.selectionState.inputLocked,
      matchResolving: this.resolvingGroup !== undefined,
      gameState: this.gameState,
      targetTileId,
    });
    const idleKey = `${nextIdle.active}:${nextIdle.targetTileId ?? 'none'}`;
    const idleChanged = idleKey !== this.renderedIdleKey;
    this.idleHintState = nextIdle;

    if (timerChanged || idleChanged) {
      this.renderTimer(config);
      if (idleChanged) this.renderIdleHint(config);
      this.publishSnapshot(config);
      this.updateDebugText(config);
    }
  }

  private renderSceneDepth(config: GameConfig): void {
    const juice = getCommercialJuice(config);
    if (!juice?.boardDepth.enabled) return;

    const W = config.designWidth;
    const H = config.designHeight;
    const depth = juice.boardDepth;

    const boardGlow = this.add
      .ellipse(W / 2, 805, 930, 1020, 0x7fd7ff, depth.boardGlowAlpha * juice.intensity)
      .setDepth(BOARD_DEPTH - 35)
      .setName('build29-board-depth-glow');
    this.tweens.add({
      targets: boardGlow,
      alpha: depth.boardGlowAlpha * 0.55 * juice.intensity,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const trayGlow = this.add
      .ellipse(W / 2, config.trayLayout.centerY, 780, 260, 0xffd447, depth.trayGlowAlpha * juice.intensity)
      .setDepth(TRAY_DEPTH - 35)
      .setName('build29-tray-depth-glow');
    this.tweens.add({
      targets: trayGlow,
      alpha: depth.trayGlowAlpha * 0.45 * juice.intensity,
      duration: 1450,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const vignette = this.add.graphics()
      .setDepth(BOARD_DEPTH - 60)
      .setName('build29-scene-vignette');
    vignette.fillStyle(0x020617, depth.vignetteAlpha * juice.intensity);
    vignette.fillRect(0, 0, W, 180);
    vignette.fillRect(0, H - 220, W, 220);
    vignette.fillRect(0, 0, 70, H);
    vignette.fillRect(W - 70, 0, 70, H);
  }

  private renderBoard(config: GameConfig): void {
    const layout = calculateBoardLayout(this.boardState.tiles, config.boardLayout, TILE_SOURCE_SIZE);
    const layoutById = new Map(layout.tiles.map(tile => [tile.id, tile]));
    const previewIds = new Set(config.tutorialPreviewPositionIds);

    // Compute stagger order: bottom layer first, top-to-bottom within each layer
    const sortedIds = [...this.boardState.tiles]
      .sort((a, b) => a.layer - b.layer || a.y - b.y || a.x - b.x)
      .map(t => t.id);
    const entranceOrder = new Map(sortedIds.map((id, i) => [id, i]));

    for (const tile of this.boardState.tiles) {
      const tileLayout = layoutById.get(tile.id);
      if (!tileLayout) throw new Error(`Missing layout for tile ${tile.id}`);

      const sprite = this.add
        .image(tileLayout.screenX, tileLayout.screenY, tile.assetId)
        .setName('build04-board-tile-sprite')
        .setDepth(BOARD_DEPTH + tileLayout.depth)
        .setScale(config.boardLayout.tileScale)
        .setInteractive({ useHandCursor: true });

      sprite.on('pointerdown', () => this.handleTileTap(config, tile.id));
      this.boardSprites.set(tile.id, sprite);

      if (config.effects.enabled && config.effects.boardEntrance.enabled) {
        sprite.setAlpha(0);
        const idx = entranceOrder.get(tile.id) ?? 0;
        this.tweens.add({
          targets: sprite,
          alpha: 1,
          duration: config.effects.boardEntrance.durationMs,
          delay: idx * config.effects.boardEntrance.staggerMs,
          ease: 'Sine.easeOut',
        });
      }

      if (this.debugEnabled && previewIds.has(tile.id)) {
        const marker = this.add
          .rectangle(
            tileLayout.screenX,
            tileLayout.screenY,
            tileLayout.displayWidth + 10,
            tileLayout.displayHeight + 10
          )
          .setStrokeStyle(5, 0x00ff88, 0.95)
          .setDepth(BOARD_DEPTH + tileLayout.depth + 1);
        marker.setData('previewMarkerFor', tile.id);
        this.previewMarkers.set(tile.id, marker);
      }
    }

    this.updateBoardVisualStates(config);
  }

  private handleTileTap(config: GameConfig, tileId: string): void {
    if (this.gameState !== 'playing') {
      this.publishSnapshot(config);
      this.updateDebugText(config);
      return;
    }

    const attempt = attemptTileSelection(
      this.boardState,
      this.trayState,
      this.selectionState,
      tileId,
      config.inputLockEnabled
    );

    this.selectionState = attempt.selection;
    this.publishSnapshot(config);
    this.updateDebugText(config);

    if (!attempt.accepted) {
      this.timerState = registerTimerInteraction(this.timerState, 'blocked', config.timer.startOnFirstValidTap);
      this.tutorialState = handleTutorialInteraction(
        this.tutorialState,
        'blocked',
        config.tutorial.dismissOnFirstValidTap
      );
      this.playSfx(config, config.audio.sfx.blockedTap);
      if (attempt.reason === 'blocked') {
        this.triggerEffect('blocked-shake');
        this.showBlockedFeedback(config, tileId);
      }
      if (attempt.reason === 'tray-full') {
        this.triggerEffect('tray-full-warning');
        this.showTrayFullFeedback(config);
      }
      this.renderTutorial(config);
      this.publishSnapshot(config);
      this.updateDebugText(config);
      return;
    }

    this.unlockAudioForGameplay(config);
    this.playSfx(config, config.audio.sfx.tileSelect);
    this.triggerEffect('tile-select-pop');
    this.timerState = registerTimerInteraction(
      this.timerState,
      'valid-selectable',
      config.timer.startOnFirstValidTap
    );
    this.tutorialState = handleTutorialInteraction(
      this.tutorialState,
      'valid-selectable',
      config.tutorial.dismissOnFirstValidTap
    );
    this.idleHintState = resetIdleHint(this.idleHintState);
    this.renderTimer(config);
    this.renderTutorial(config);
    this.renderIdleHint(config);
    this.publishSnapshot(config);
    this.updateDebugText(config);
    this.flyTileToTray(config, attempt.tile);
  }

  private flyTileToTray(config: GameConfig, tile: BoardTile): void {
    const sprite = this.boardSprites.get(tile.id);
    if (!sprite) {
      this.finishTileSelection(config, tile);
      return;
    }

    const previewTray = completeTileSelection(this.boardState, this.trayState, tile).tray;
    const trayLayout = calculateTrayLayout(previewTray, config.trayLayout);
    const target = trayLayout.tiles.find(layout => layout.sourceTileId === tile.id);
    if (!target) throw new Error(`Missing tray target for tile ${tile.id}`);

    sprite.disableInteractive();
    sprite.setDepth(TRAY_DEPTH + 100);
    const juice = getCommercialJuice(config);
    if (juice?.tileTapPolish.enabled) {
      sprite.y -= juice.tileTapPolish.liftPixels;
    }
    if (config.effects.enabled && config.effects.tileSelectPop.enabled) {
      sprite.setScale(config.boardLayout.tileScale * config.effects.tileSelectPop.scale);

      const glowSize = TILE_SOURCE_SIZE.width * config.boardLayout.tileScale * 1.6;
      const glow = this.add
        .ellipse(sprite.x, sprite.y, glowSize, glowSize * (TILE_SOURCE_SIZE.height / TILE_SOURCE_SIZE.width), 0xffffff, 0.32)
        .setDepth(TRAY_DEPTH + 99);
      this.tweens.add({
        targets: glow,
        alpha: 0,
        scale: 1.5,
        duration: config.effects.tileSelectPop.durationMs * 3,
        ease: 'Sine.easeOut',
        onComplete: () => { if (glow.active) glow.destroy(); },
      });
    }

    this.tweens.add({
      targets: sprite,
      x: target.screenX,
      y: target.screenY,
      scale: config.trayLayout.tileScale,
      duration: config.tileFlyDurationMs,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        sprite.destroy();
        this.boardSprites.delete(tile.id);
        this.finishTileSelection(config, tile);
      },
    });
  }

  private finishTileSelection(config: GameConfig, tile: BoardTile): void {
    const completion = completeTileSelection(this.boardState, this.trayState, tile);
    this.boardState = completion.board;
    this.trayState = completion.tray;
    this.selectionState = completion.selection;

    this.updateBoardVisualStates(config);
    this.renderTray(config, tile.id);

    const matchGroup = findNextMatchGroup(this.trayState);
    if (matchGroup) {
      this.startMatchResolution(config, matchGroup);
      return;
    }

    this.matchStreak = 0;
    this.updateOutcome(config);
    this.updateDebugText(config);
  }

  private startMatchResolution(config: GameConfig, group: MatchGroup): void {
    this.resolvingGroup = group;
    this.lastMatchedTileType = group.tileTypeId;
    this.matchStreak += 1;
    this.selectionState = { inputLocked: config.inputLockDuringMatchResolution };
    this.playSfx(config, config.audio.sfx.match);
    this.triggerEffect('match-resolve');
    this.renderTray(config);
    this.showMatchResolveFlash(config);
    this.showMatchSparkle(config, group);
    this.showMatchReward(config, group);
    this.publishSnapshot(config);
    this.updateDebugText(config);

    this.time.delayedCall(config.matchResolutionDelayMs, () => {
      const targets = group.sourceTileIds
        .map(sourceTileId => this.trayTileSprites.get(sourceTileId))
        .filter((sprite): sprite is Phaser.GameObjects.Image => Boolean(sprite?.active));

      const complete = () => this.finishMatchResolution(config, group);

      if (config.matchResolvingVisual === 'none' || targets.length === 0 || config.matchResolutionDurationMs === 0) {
        complete();
        return;
      }

      this.tweens.add({
        targets,
        scale: config.trayLayout.tileScale * 0.25,
        alpha: 0,
        duration: config.matchResolutionDurationMs,
        ease: 'Cubic.easeIn',
        onComplete: complete,
      });
    });
  }

  private finishMatchResolution(config: GameConfig, group: MatchGroup): void {
    this.trayState = removeMatchGroup(this.trayState, group);
    this.resolvingGroup = undefined;
    this.selectionState = { inputLocked: false };
    this.renderTray(config);
    this.updateOutcome(config);
    this.updateDebugText(config);
  }

  private updateOutcome(config: GameConfig): void {
    const previousState = this.gameState;
    const evaluatedState = evaluateOutcome({
      board: this.boardState,
      tray: this.trayState,
      matchResolving: this.resolvingGroup !== undefined,
    });
    this.gameState = this.timerState.expired ? 'failed' : evaluatedState;
    if (previousState === 'playing' && this.gameState === 'won') {
      this.playSfx(config, config.audio.sfx.win);
      this.triggerEffect('outcome-pulse');
    } else if (previousState === 'playing' && this.gameState === 'failed') {
      this.playSfx(config, config.audio.sfx.fail);
      this.triggerEffect('outcome-pulse');
    }
    if (this.gameState !== 'playing') {
      this.selectionState = { inputLocked: true };
      this.tutorialState = hideTutorialAfterOutcome(this.tutorialState);
      this.idleHintState = resetIdleHint(this.idleHintState);
      this.updateEndCardState(config);
      this.renderTutorial(config);
      this.renderIdleHint(config);
      this.renderEndCard(config);
      this.pulseOutcomeVisual(config);
    }
    this.publishSnapshot(config);
  }

  private updateBoardVisualStates(config: GameConfig): void {
    const tilesById = new Map(this.boardState.tiles.map(tile => [tile.id, tile]));
    const juice = getCommercialJuice(config);

    for (const [tileId, sprite] of this.boardSprites) {
      const tile = tilesById.get(tileId);
      if (!tile) {
        sprite.destroy();
        this.previewMarkers.get(tileId)?.destroy();
        this.previewMarkers.delete(tileId);
        this.boardSprites.delete(tileId);
        continue;
      }

      sprite.clearTint().setAlpha(1);
      sprite.setData('tileId', tile.id);
      sprite.setData('selectable', tile.selectable);
      sprite.setData('tileTypeId', tile.tileTypeId);
      if (juice?.tileTapPolish.enabled && tile.selectable) {
        sprite.setAlpha(0.98);
      }

      if (!tile.selectable && isDebugAllowed(config) && config.debugBlockedState) {
        sprite.setTint(0x5a5f75).setAlpha(0.58);
      }
    }
  }

  private renderTray(config: GameConfig, landingTileId?: string): void {
    for (const object of this.trayObjects) object.destroy();
    this.trayObjects = [];
    this.trayTileSprites.clear();

    const layout = calculateTrayLayout(this.trayState, config.trayLayout);
    const matchReadyTypes = new Set(getMatchReadyTileTypes(this.trayState));
    const resolvingIds = new Set(this.resolvingGroup?.sourceTileIds ?? []);
    const juice = getCommercialJuice(config);

    const trayBgX = layout.bounds.left - 21;
    const trayBgY = layout.bounds.top - 17;
    const trayBgW = layout.bounds.width + 42;
    const trayBgH = layout.bounds.height + 34;
    const trayCorner = 18;
    const strokeAlpha = isTrayFull(this.trayState) ? 0.95 : 0.48;

    const background = this.add.graphics()
      .setDepth(TRAY_DEPTH - 10)
      .setName('build04-tray-background');
    background.fillStyle(0x111a32, 0.86);
    background.fillRoundedRect(trayBgX, trayBgY, trayBgW, trayBgH, trayCorner);
    background.lineStyle(10, 0xffffff, 0.08);
    background.strokeRoundedRect(trayBgX + 4, trayBgY + 4, trayBgW - 8, trayBgH - 8, trayCorner);
    background.lineStyle(4, 0x7fd7ff, strokeAlpha);
    background.strokeRoundedRect(trayBgX, trayBgY, trayBgW, trayBgH, trayCorner);
    this.trayObjects.push(background);

    if (juice?.trayLanding.enabled) {
      const glow = this.add
        .ellipse(
          layout.bounds.left + layout.bounds.width / 2,
          layout.bounds.top + layout.bounds.height / 2,
          layout.bounds.width + 92,
          layout.bounds.height + 70,
          colorFromHex(juice.trayLanding.glowColor),
          0.16 * juice.intensity
        )
        .setDepth(TRAY_DEPTH - 18)
        .setName('build29-tray-soft-glow');
      this.trayObjects.push(glow);
    }

    for (const slot of layout.slots) {
      const slotObject = this.add
        .rectangle(slot.screenX, slot.screenY, slot.width, slot.height, 0x0d1224, 0.78)
        .setStrokeStyle(4, 0xe7f7ff, 0.58)
        .setDepth(TRAY_DEPTH)
        .setName('build04-tray-slot');
      slotObject.setData('slotIndex', slot.slotIndex);
      this.trayObjects.push(slotObject);
    }

    for (const tile of layout.tiles) {
      const sprite = this.add
        .image(tile.screenX, tile.screenY, tile.assetId)
        .setScale(config.trayLayout.tileScale)
        .setDepth(TRAY_DEPTH + 20 + tile.slotIndex)
        .setName('build04-tray-tile');
      sprite.setData('sourceTileId', tile.sourceTileId);
      sprite.setData('tileTypeId', tile.tileTypeId);
      this.trayTileSprites.set(tile.sourceTileId, sprite);
      this.trayObjects.push(sprite);

      if (resolvingIds.has(tile.sourceTileId)) {
        sprite.setTint(0xffd447).setAlpha(0.85);
      }

      if (juice?.trayLanding.enabled && matchReadyTypes.has(tile.tileTypeId)) {
        const readyGlow = this.add
          .ellipse(
            tile.screenX,
            tile.screenY,
            tile.width + 24,
            tile.height + 24,
            0xffd447,
            resolvingIds.has(tile.sourceTileId) ? 0.24 : 0.16
          )
          .setDepth(TRAY_DEPTH + 18 + tile.slotIndex)
          .setName('build29-match-ready-glow');
        this.trayObjects.push(readyGlow);
      }

      if (juice?.trayLanding.enabled && landingTileId === tile.sourceTileId) {
        sprite.setScale(config.trayLayout.tileScale * juice.trayLanding.popScale);
        this.tweens.add({
          targets: sprite,
          scale: config.trayLayout.tileScale,
          duration: juice.trayLanding.durationMs,
          ease: 'Back.easeOut',
        });
        this.showTrayLandingRipple(config, tile.screenX, tile.screenY);
      }

      if (this.debugEnabled && config.debugMatchReadyMarker && matchReadyTypes.has(tile.tileTypeId)) {
        const marker = this.add
          .rectangle(tile.screenX, tile.screenY, tile.width + 8, tile.height + 8)
          .setStrokeStyle(5, resolvingIds.has(tile.sourceTileId) ? 0xff7a45 : 0xffd447, 0.95)
          .setDepth(TRAY_DEPTH + 19 + tile.slotIndex)
          .setName('build04-match-ready-marker');
        this.trayObjects.push(marker);
      }
    }
  }

  private showBlockedFeedback(config: GameConfig, tileId: string): void {
    const sprite = this.boardSprites.get(tileId);
    if (
      !sprite ||
      config.blockedTileFeedback === 'none' ||
      !config.effects.enabled ||
      !config.effects.blockedShake.enabled
    ) {
      return;
    }

    const juice = getCommercialJuice(config);
    if (juice?.tileTapPolish.enabled) {
      const ring = this.add
        .ellipse(
          sprite.x,
          sprite.y,
          TILE_SOURCE_SIZE.width * config.boardLayout.tileScale + 28,
          TILE_SOURCE_SIZE.height * config.boardLayout.tileScale + 28
        )
        .setStrokeStyle(8, colorFromHex(juice.tileTapPolish.blockedRingColor), 0.9)
        .setDepth(sprite.depth + 2)
        .setName('build29-blocked-tile-denial-ring');
      this.tweens.add({
        targets: ring,
        alpha: 0,
        scale: 1.26,
        duration: 260,
        ease: 'Cubic.easeOut',
        onComplete: () => { if (ring.active) ring.destroy(); },
      });
    }

    if (config.blockedTileFeedback === 'tint') {
      const originalTint = sprite.tintTopLeft;
      sprite.setTint(colorFromHex(config.effects.blockedShake.tint));
      this.time.delayedCall(config.effects.blockedShake.durationMs * (config.effects.blockedShake.repeats + 1), () => {
        if (sprite.active) {
          sprite.setTint(originalTint);
          this.updateBoardVisualStates(config);
        }
      });
      return;
    }

    const originalX = sprite.x;
    sprite.setTint(colorFromHex(config.effects.blockedShake.tint));
    const totalMs = config.effects.blockedShake.durationMs * 2 * (config.effects.blockedShake.repeats + 1);
    this.time.delayedCall(totalMs, () => {
      if (sprite.active) {
        sprite.clearTint();
        this.updateBoardVisualStates(config);
      }
    });
    this.tweens.add({
      targets: sprite,
      x: {
        from: originalX - config.effects.blockedShake.distance,
        to: originalX + config.effects.blockedShake.distance,
      },
      duration: config.effects.blockedShake.durationMs,
      yoyo: true,
      repeat: config.effects.blockedShake.repeats,
      onComplete: () => {
        if (sprite.active) sprite.setX(originalX);
      },
    });
  }

  private showTrayFullFeedback(config: GameConfig): void {
    if (!config.effects.enabled || !config.effects.trayFullWarning.enabled) return;
    const background = this.trayObjects.find(object => object.name === 'build04-tray-background');
    if (!background) return;
    this.tweens.add({
      targets: background,
      alpha: { from: 1, to: config.effects.trayFullWarning.alpha },
      duration: config.effects.trayFullWarning.durationMs,
      yoyo: true,
      repeat: 2,
    });
  }

  private showTrayLandingRipple(config: GameConfig, x: number, y: number): void {
    const juice = getCommercialJuice(config);
    if (!juice?.trayLanding.enabled) return;
    const ripple = this.add
      .ellipse(x, y, 148, 116)
      .setStrokeStyle(6, colorFromHex(juice.trayLanding.glowColor), 0.72 * juice.intensity)
      .setDepth(TRAY_DEPTH + 16)
      .setName('build29-tray-landing-ripple');
    this.trayObjects.push(ripple);
    this.tweens.add({
      targets: ripple,
      alpha: 0,
      scale: 1.45,
      duration: juice.trayLanding.durationMs * 2,
      ease: 'Cubic.easeOut',
      onComplete: () => { if (ripple.active) ripple.destroy(); },
    });
  }

  private renderGameplayCta(config: GameConfig): void {
    for (const object of this.ctaObjects) object.destroy();
    this.ctaObjects = [];

    this.ctaState = setCtaVisible(this.ctaState, this.gameState === 'playing' && config.cta.visibleDuringGameplay);
    if (!this.ctaState.visible) return;

    const juice = getCommercialJuice(config);
    if (juice?.ctaPolish.enabled) {
      const glow = this.add
        .ellipse(
          config.cta.position.x,
          config.cta.position.y,
          config.cta.size.width + 88,
          config.cta.size.height + 58,
          colorFromHex(config.cta.borderColor),
          juice.ctaPolish.glowAlpha * juice.intensity
        )
        .setDepth(CTA_DEPTH - 2)
        .setName('build29-gameplay-cta-glow');
      this.ctaObjects.push(glow);

      const shell = this.add.graphics()
        .setPosition(config.cta.position.x, config.cta.position.y)
        .setDepth(CTA_DEPTH - 1)
        .setName('build29-gameplay-cta-shell');
      shell.fillStyle(colorFromHex(config.cta.backgroundColor), 0.98);
      shell.fillRoundedRect(
        -config.cta.size.width / 2,
        -config.cta.size.height / 2,
        config.cta.size.width,
        config.cta.size.height,
        config.cta.cornerRadius
      );
      shell.lineStyle(8, colorFromHex(config.cta.borderColor), 1);
      shell.strokeRoundedRect(
        -config.cta.size.width / 2,
        -config.cta.size.height / 2,
        config.cta.size.width,
        config.cta.size.height,
        config.cta.cornerRadius
      );
      shell.lineStyle(3, 0xffffff, 0.45);
      shell.strokeRoundedRect(
        -config.cta.size.width / 2 + 9,
        -config.cta.size.height / 2 + 9,
        config.cta.size.width - 18,
        config.cta.size.height - 18,
        Math.max(0, config.cta.cornerRadius - 8)
      );
      this.ctaObjects.push(shell);

      if (juice.ctaPolish.shineEnabled) {
        const shine = this.add
          .rectangle(
            config.cta.position.x - config.cta.size.width * 0.32,
            config.cta.position.y - config.cta.size.height * 0.22,
            config.cta.size.width * 0.34,
            12,
            0xffffff,
            0.38
          )
          .setAngle(-10)
          .setDepth(CTA_DEPTH)
          .setName('build29-gameplay-cta-shine');
        this.ctaObjects.push(shine);
        this.tweens.add({
          targets: shine,
          x: config.cta.position.x + config.cta.size.width * 0.34,
          alpha: { from: 0.18, to: 0.52 },
          duration: 1250,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }

    const bg = this.add
      .rectangle(
        config.cta.position.x,
        config.cta.position.y,
        config.cta.size.width,
        config.cta.size.height,
        colorFromHex(config.cta.backgroundColor),
        juice?.ctaPolish.enabled ? 0.01 : 0.96
      )
      .setStrokeStyle(6, colorFromHex(config.cta.borderColor), 1)
      .setDepth(CTA_DEPTH)
      .setName('build06-gameplay-cta')
      .setInteractive({ useHandCursor: true });
    bg.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.handleGameplayCtaClick(config);
    });
    this.ctaObjects.push(bg);

    const label = this.add
      .text(config.cta.position.x, config.cta.position.y, config.cta.text, {
        color: config.cta.textColor,
        fontSize: `${config.cta.fontSize}px`,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(CTA_DEPTH + 1)
      .setName('build06-gameplay-cta-text');
    this.ctaObjects.push(label);

    if (config.effects.enabled && config.effects.ctaPulse.enabled) {
      this.tweens.add({
        targets: this.ctaObjects.filter(object => object.active),
        scale: config.effects.ctaPulse.scale,
        duration: config.effects.ctaPulse.durationMs,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private handleGameplayCtaClick(config: GameConfig): void {
    this.playSfx(config, config.audio.sfx.ctaClick);
    this.triggerEffect('cta-click');
    this.pulseCtaTapFeedback(config, this.ctaObjects);
    this.ctaState = recordCtaClick(this.ctaState);
    this.storeOpenState = this.storeOpenService.openStore('gameplay-cta');
    this.publishSnapshot(config);
    this.updateDebugText(config);
  }

  private pulseCtaTapFeedback(config: GameConfig, objects: Phaser.GameObjects.GameObject[]): void {
    const juice = getCommercialJuice(config);
    if (!juice?.ctaPolish.enabled) return;
    const targets = objects.filter(object => object.active);
    this.tweens.add({
      targets,
      scale: juice.ctaPolish.tapScale,
      duration: 70,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  private updateEndCardState(config: GameConfig): void {
    this.endCardState = updateEndCardForOutcome(this.endCardState, this.gameState, {
      showOnWin: config.endCard.showOnWin,
      showOnFail: config.endCard.showOnFail,
    });
    if (this.endCardState.visible) {
      this.ctaState = setCtaVisible(this.ctaState, false);
      for (const object of this.ctaObjects) object.destroy();
      this.ctaObjects = [];
    }
  }

  private renderEndCard(config: GameConfig): void {
    for (const object of this.endCardObjects) object.destroy();
    this.endCardObjects = [];

    if (!this.endCardState.visible) return;
    const juice = getCommercialJuice(config);

    const surface = this.add
      .rectangle(
        config.designWidth / 2,
        config.designHeight / 2,
        config.designWidth,
        config.designHeight,
        0x050b18,
        juice?.endCardV2.enabled ? 0.94 : 0.9
      )
      .setDepth(END_CARD_DEPTH)
      .setName('build06-end-card-surface');
    if (config.endCard.fullScreenClick) {
      surface.setInteractive({ useHandCursor: true });
      surface.on(
        'pointerdown',
        (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
          event.stopPropagation();
          this.handleEndCardClick(config);
        }
      );
    }
    this.endCardObjects.push(surface);

    if (juice?.endCardV2.enabled) {
      const rays = this.add.graphics()
        .setPosition(config.designWidth / 2, 500)
        .setDepth(END_CARD_DEPTH + 0.2)
        .setName('build29-end-card-rays');
      for (let i = 0; i < juice.endCardV2.rayCount; i += 1) {
        const angle = (i / juice.endCardV2.rayCount) * Math.PI * 2;
        const width = 0.08;
        rays.fillStyle(i % 2 === 0 ? 0xffd447 : 0x7fd7ff, 0.12 * juice.intensity);
        rays.slice(0, 0, 940, angle - width, angle + width, false);
        rays.fillPath();
      }
      this.endCardObjects.push(rays);
      this.tweens.add({
        targets: rays,
        angle: 360,
        duration: 18000,
        repeat: -1,
        ease: 'Linear',
      });

      const iconGlow = this.add
        .ellipse(config.designWidth / 2, 420, 340, 340, 0xffd447, 0.24 * juice.intensity)
        .setDepth(END_CARD_DEPTH + 0.8)
        .setName('build29-end-card-icon-glow');
      this.endCardObjects.push(iconGlow);

      for (let i = 0; i < juice.endCardV2.particleCount; i += 1) {
        const x = 130 + ((i * 79) % 820);
        const y = 220 + ((i * 137) % 980);
        const particle = this.add
          .circle(x, y, i % 3 === 0 ? 5 : 3, i % 2 === 0 ? 0xffd447 : 0x7fd7ff, 0.38)
          .setDepth(END_CARD_DEPTH + 0.6)
          .setName('build29-end-card-particle');
        this.endCardObjects.push(particle);
        this.tweens.add({
          targets: particle,
          y: y - 34,
          alpha: { from: 0.16, to: 0.52 },
          duration: 1300 + i * 28,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }

    const icon = this.add
      .image(config.designWidth / 2, 420, config.app.iconAssetId)
      .setDisplaySize(256, 256)
      .setDepth(END_CARD_DEPTH + 1)
      .setName('build06-end-card-icon');
    this.endCardObjects.push(icon);

    const logo = this.add
      .image(config.designWidth / 2, 720, config.app.logoAssetId)
      .setDisplaySize(540, 277)
      .setDepth(END_CARD_DEPTH + 1)
      .setName('build06-end-card-logo');
    this.endCardObjects.push(logo);

    const title = this.add
      .text(config.designWidth / 2, 220, config.endCard.titleText, {
        color: '#ffffff',
        fontSize: '62px',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#081225',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(END_CARD_DEPTH + 2)
      .setName('build29-end-card-title');
    this.endCardObjects.push(title);

    const message = this.endCardState.reason === 'win' ? config.endCard.winMessage : config.endCard.failMessage;
    const messageColor = this.endCardState.reason === 'win' ? config.endCard.winMessageColor : config.endCard.failMessageColor;
    const messageText = this.add
      .text(config.designWidth / 2, 1010, message, {
        color: messageColor,
        fontSize: '74px',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#111827',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(END_CARD_DEPTH + 2)
      .setName('build06-end-card-message');
    this.endCardObjects.push(messageText);

    let installCopy: Phaser.GameObjects.Text | undefined;
    if (juice?.endCardV2.enabled) {
      installCopy = this.add
        .text(config.designWidth / 2, 1110, juice.endCardV2.installText, {
          color: '#e7f7ff',
          fontSize: '42px',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'bold',
          stroke: '#081225',
          strokeThickness: 7,
        })
        .setOrigin(0.5)
        .setDepth(END_CARD_DEPTH + 2)
        .setName('build29-end-card-install-text');
      this.endCardObjects.push(installCopy);
    }

    const ctaY = 1310;
    if (juice?.ctaPolish.enabled) {
      const ctaGlow = this.add
        .ellipse(config.designWidth / 2, ctaY, 650, 188, colorFromHex(config.cta.borderColor), juice.ctaPolish.glowAlpha)
        .setDepth(END_CARD_DEPTH + 1)
        .setName('build29-end-card-cta-glow');
      this.endCardObjects.push(ctaGlow);
    }
    const ctaBg = this.add
      .rectangle(config.designWidth / 2, ctaY, 520, 132, colorFromHex(config.cta.backgroundColor), 0.98)
      .setStrokeStyle(7, colorFromHex(config.cta.borderColor), 1)
      .setDepth(END_CARD_DEPTH + 2)
      .setName('build06-end-card-cta')
      .setInteractive({ useHandCursor: true });
    ctaBg.on('pointerdown', (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.handleEndCardClick(config);
    });
    this.endCardObjects.push(ctaBg);

    const ctaLabel = this.add
      .text(config.designWidth / 2, ctaY, config.endCard.ctaText, {
        color: config.cta.textColor,
        fontSize: '50px',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(END_CARD_DEPTH + 3)
      .setName('build06-end-card-cta-text');
    this.endCardObjects.push(ctaLabel);

    if (config.endCard.entranceAnimation) {
      const enterTargets = [title, icon, logo, messageText, ...(installCopy ? [installCopy] : [])];
      enterTargets.forEach((target, i) => {
        target.setAlpha(0);
        target.setScale(0.92);
        this.tweens.add({
          targets: target,
          alpha: 1,
          scale: 1,
          duration: 380,
          delay: i * 85,
          ease: 'Back.easeOut',
        });
      });
    }

    if (config.effects.enabled && config.effects.ctaPulse.enabled) {
      this.tweens.add({
        targets: [ctaBg, ctaLabel],
        scale: config.effects.ctaPulse.scale,
        duration: config.effects.ctaPulse.durationMs,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private handleEndCardClick(config: GameConfig): void {
    this.playSfx(config, config.audio.sfx.ctaClick);
    this.triggerEffect('cta-click');
    this.pulseCtaTapFeedback(config, this.endCardObjects);
    this.endCardState = recordEndCardClick(this.endCardState);
    this.storeOpenState = this.storeOpenService.openStore('end-card');
    this.publishSnapshot(config);
    this.updateDebugText(config);
  }

  private renderTimer(config: GameConfig): void {
    if (!this.timerText) {
      this.timerText = this.add
        .text(config.designWidth / 2, 96, '', {
          color: '#ffffff',
          fontSize: '54px',
          fontFamily: 'Arial, sans-serif',
          fontStyle: 'bold',
          stroke: '#1a2442',
          strokeThickness: 8,
        })
        .setOrigin(0.5)
        .setDepth(TIMER_DEPTH)
        .setName('build05-timer-text');
    }

    const displaySeconds = getTimerDisplaySeconds(this.timerState);
    const juice = getCommercialJuice(config);
    const warningColor =
      juice?.timerWarningPolish.enabled && displaySeconds <= 2
        ? juice.timerWarningPolish.dangerColor
        : juice?.timerWarningPolish.enabled
          ? juice.timerWarningPolish.warningColor
          : '#ff5d73';
    this.timerText
      .setText(`Time ${displaySeconds}`)
      .setColor(this.timerState.warningActive ? warningColor : '#ffffff')
      .setStroke(
        this.timerState.warningActive && juice?.timerWarningPolish.enabled ? '#4b0d1a' : '#1a2442',
        this.timerState.warningActive && juice?.timerWarningPolish.enabled ? 11 : 8
      );
    if (!this.timerWarningLoopTween) {
      this.timerText.setScale(
        this.timerState.warningActive && config.effects.timerWarningPulse.enabled
          ? config.effects.timerWarningPulse.scale
          : 1
      );
    }
    this.timerText.setVisible((isDebugAllowed(config) && config.timer.debugVisible) || this.gameState === 'playing');
  }

  private renderTutorial(config: GameConfig): void {
    this.clearTutorialObjects();

    if (!this.tutorialState.active || this.gameState !== 'playing') return;

    const targets = this.getTileTargets(config, this.tutorialState.previewTileIds);

    const overlay = this.add
      .rectangle(
        config.designWidth / 2,
        config.designHeight / 2,
        config.designWidth,
        config.designHeight,
        0x020617,
        config.tutorial.dimOpacity
      )
      .setDepth(TUTORIAL_DEPTH)
      .setName('build05-tutorial-dim');
    this.tutorialObjects.push(overlay);

    for (const target of targets) {
      const ringW = target.width + 28;
      const ringH = target.height + 28;
      const ring = this.add.graphics()
        .setPosition(target.screenX, target.screenY)
        .setDepth(TUTORIAL_DEPTH + 5)
        .setName('build05-tutorial-highlight');
      ring.lineStyle(8, 0xffd447, 0.98);
      ring.strokeRoundedRect(-ringW / 2, -ringH / 2, ringW, ringH, 12);
      ring.lineStyle(4, 0xfffbe6, 0.5);
      ring.strokeRoundedRect(-ringW / 2 - 5, -ringH / 2 - 5, ringW + 10, ringH + 10, 14);
      ring.setData('tileId', target.id);
      this.tutorialObjects.push(ring);
      this.tweens.add({
        targets: ring,
        alpha: { from: 0.68, to: 1 },
        scale: { from: 0.94, to: 1.06 },
        duration: 640,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    const label = this.add
      .text(config.designWidth / 2, 290, this.tutorialState.text, {
        color: '#ffffff',
        fontSize: '72px',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#14192d',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(TUTORIAL_DEPTH + 8)
      .setName('build05-tutorial-text');
    this.tutorialObjects.push(label);

    if (config.tutorial.handEnabled && targets.length > 0) {
      const firstTarget = targets[0];
      const hand = this.add
        .image(firstTarget.screenX + 74, firstTarget.screenY + 86, config.tutorial.handAssetId)
        .setScale(0.62)
        .setDepth(TUTORIAL_DEPTH + 10)
        .setName('build05-tutorial-hand');
      this.tutorialHand = hand;
      this.tutorialObjects.push(hand);
      this.tweens.add({
        targets: hand,
        x: firstTarget.screenX + 42,
        y: firstTarget.screenY + 48,
        scale: 0.54,
        alpha: { from: 0.82, to: 1 },
        duration: 560,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private startTimerWarningLoop(config: GameConfig): void {
    if (!this.timerText?.active) return;
    this.timerWarningLoopTween?.stop();
    this.timerWarningLoopTween = this.tweens.add({
      targets: this.timerText,
      scale: config.effects.timerWarningPulse.scale,
      duration: config.effects.timerWarningPulse.durationMs,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private renderIdleHint(config: GameConfig): void {
    for (const object of this.idleObjects) object.destroy();
    this.idleObjects = [];
    this.renderedIdleKey = `${this.idleHintState.active}:${this.idleHintState.targetTileId ?? 'none'}`;

    if (!this.idleHintState.active || !this.idleHintState.targetTileId || this.gameState !== 'playing') return;

    const [target] = this.getTileTargets(config, [this.idleHintState.targetTileId]);
    if (!target) return;

    const ring = this.add
      .ellipse(target.screenX, target.screenY, target.width + 34, target.height + 34)
      .setStrokeStyle(7, 0x7fd7ff, 0.96)
      .setDepth(TUTORIAL_DEPTH + 20)
      .setName('build05-idle-highlight');
    ring.setData('tileId', target.id);
    this.idleObjects.push(ring);

    this.tweens.add({
      targets: ring,
      alpha: { from: 0.45, to: 1 },
      scale: { from: 0.94, to: getCommercialJuice(config)?.idleHintV2.enabled ? getCommercialJuice(config)!.idleHintV2.targetPulseScale : 1.06 },
      duration: 520,
      yoyo: true,
      repeat: -1,
    });

    const juice = getCommercialJuice(config);
    if (juice?.idleHintV2.enabled) {
      const trail = this.add
        .ellipse(
          target.screenX + 34,
          target.screenY + 42,
          target.width * 0.76,
          target.height * 0.42,
          colorFromHex(juice.idleHintV2.trailColor),
          0.18 * juice.intensity
        )
        .setAngle(-24)
        .setDepth(TUTORIAL_DEPTH + 19)
        .setName('build29-idle-guidance-trail');
      this.idleObjects.push(trail);
      this.tweens.add({
        targets: trail,
        x: target.screenX - 12,
        y: target.screenY - 10,
        alpha: { from: 0.08, to: 0.28 },
        duration: 720,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    if (config.tutorial.handEnabled) {
      const hand = this.add
        .image(target.screenX + 72, target.screenY + 82, config.tutorial.handAssetId)
        .setScale(0.5)
        .setDepth(TUTORIAL_DEPTH + 21)
        .setName('build05-idle-hand');
      this.idleObjects.push(hand);
      this.tweens.add({
        targets: hand,
        x: target.screenX + 38,
        y: target.screenY + 44,
        duration: 560,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private getTileTargets(config: GameConfig, tileIds: string[]): Array<{
    id: string;
    screenX: number;
    screenY: number;
    width: number;
    height: number;
  }> {
    const layout = calculateBoardLayout(this.boardState.tiles, config.boardLayout, TILE_SOURCE_SIZE);
    const layoutById = new Map(layout.tiles.map(tile => [tile.id, tile]));

    return tileIds
      .map(id => {
        const tile = layoutById.get(id);
        if (!tile) return undefined;
        return {
          id,
          screenX: tile.screenX,
          screenY: tile.screenY,
          width: tile.displayWidth,
          height: tile.displayHeight,
        };
      })
      .filter((target): target is { id: string; screenX: number; screenY: number; width: number; height: number } =>
        Boolean(target)
      );
  }

  private clearTutorialObjects(): void {
    for (const object of this.tutorialObjects) object.destroy();
    this.tutorialObjects = [];
    this.tutorialHand = undefined;
  }

  private unlockAudioForGameplay(config: GameConfig): void {
    this.audioState = unlockAudio(this.audioState, config.audio.unlockOnFirstValidTap);
  }

  private playSfx(config: GameConfig, assetId: string): void {
    const beforeCount = this.audioState.requestedSfx.length;
    this.audioState = requestSfx(this.audioState, assetId);
    if (this.audioState.requestedSfx.length === beforeCount) return;

    try {
      this.sound.play(assetId, { volume: config.audio.sfxVolume });
    } catch {
      this.audioState = recordAudioError(this.audioState);
    }
  }

  private triggerEffect(effectName: EffectName): void {
    this.effectState = requestEffect(this.effectState, effectName);
  }

  private showMatchResolveFlash(config: GameConfig): void {
    if (!config.effects.enabled || !config.effects.matchResolve.enabled) return;

    const layout = calculateTrayLayout(this.trayState, config.trayLayout);
    const flash = this.add
      .rectangle(
        layout.bounds.left + layout.bounds.width / 2,
        layout.bounds.top + layout.bounds.height / 2,
        layout.bounds.width + 56,
        layout.bounds.height + 48,
        colorFromHex(config.effects.matchResolve.flashColor),
        0.2
      )
      .setDepth(TRAY_DEPTH + 18)
      .setName('build08-match-flash');

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 1.08,
      duration: config.effects.matchResolve.durationMs,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });
  }

  private showMatchSparkle(config: GameConfig, group: MatchGroup): void {
    if (!config.effects.enabled || !config.effects.matchSparkle.enabled) return;
    const { count, radius, durationMs, color } = config.effects.matchSparkle;
    const sparkColor = colorFromHex(color);
    const trayLayout = calculateTrayLayout(this.trayState, config.trayLayout);

    for (const sourceTileId of group.sourceTileIds.slice(0, 3)) {
      const tileLayout = trayLayout.tiles.find(t => t.sourceTileId === sourceTileId);
      if (!tileLayout) continue;

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const g = this.add.graphics()
          .setPosition(tileLayout.screenX, tileLayout.screenY)
          .setDepth(TRAY_DEPTH + 30);
        g.fillStyle(sparkColor, 0.92);
        g.fillCircle(0, 0, 5);

        this.tweens.add({
          targets: g,
          x: tileLayout.screenX + Math.cos(angle) * radius,
          y: tileLayout.screenY + Math.sin(angle) * radius,
          alpha: 0,
          scale: 0.3,
          duration: durationMs,
          ease: 'Cubic.easeOut',
          onComplete: () => { if (g.active) g.destroy(); },
        });
      }
    }
  }

  private showMatchReward(config: GameConfig, group: MatchGroup): void {
    const juice = getCommercialJuice(config);
    if (!juice?.matchReward.enabled) return;
    const trayLayout = calculateTrayLayout(this.trayState, config.trayLayout);
    const targets = group.sourceTileIds
      .map(sourceTileId => trayLayout.tiles.find(tile => tile.sourceTileId === sourceTileId))
      .filter((tile): tile is NonNullable<typeof tile> => Boolean(tile));
    if (targets.length === 0) return;

    const centerX = targets.reduce((sum, tile) => sum + tile.screenX, 0) / targets.length;
    const centerY = targets.reduce((sum, tile) => sum + tile.screenY, 0) / targets.length - 112;
    const rewardText = juice.matchReward.texts[Math.min(this.matchStreak - 1, juice.matchReward.texts.length - 1)] ?? 'Nice!';
    const text = this.add
      .text(centerX, centerY, rewardText, {
        color: '#ffffff',
        fontSize: `${juice.matchReward.fontSize}px`,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
        stroke: '#111827',
        strokeThickness: 8,
      })
      .setOrigin(0.5)
      .setDepth(TRAY_DEPTH + 70)
      .setName('build29-match-reward-text');

    this.tweens.add({
      targets: text,
      y: centerY - 54,
      alpha: 0,
      scale: { from: 0.85, to: 1.16 },
      duration: juice.matchReward.durationMs,
      ease: 'Cubic.easeOut',
      onComplete: () => { if (text.active) text.destroy(); },
    });

    const color = colorFromHex(config.effects.matchSparkle.color);
    for (let i = 0; i < juice.matchReward.burstCount; i += 1) {
      const angle = (i / juice.matchReward.burstCount) * Math.PI * 2;
      const burst = this.add
        .rectangle(centerX, centerY + 28, 10, 22, color, 0.78)
        .setAngle(Phaser.Math.RadToDeg(angle))
        .setDepth(TRAY_DEPTH + 66)
        .setName('build29-match-reward-burst');
      this.tweens.add({
        targets: burst,
        x: centerX + Math.cos(angle) * 95,
        y: centerY + 28 + Math.sin(angle) * 72,
        alpha: 0,
        scale: 0.4,
        duration: juice.matchReward.durationMs * 0.82,
        ease: 'Cubic.easeOut',
        onComplete: () => { if (burst.active) burst.destroy(); },
      });
    }
  }

  private pulseOutcomeVisual(config: GameConfig): void {
    if (!config.effects.enabled || !config.effects.outcomePulse.enabled) return;

    const targets = this.endCardObjects.filter(object => object.active);
    if (targets.length === 0) return;

    this.tweens.add({
      targets,
      scale: config.effects.outcomePulse.scale,
      duration: config.effects.outcomePulse.durationMs,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  private createDebugOverlay(config: GameConfig): void {
    const W = config.designWidth;
    const H = config.designHeight;
    const g = this.add.graphics().setDepth(DEBUG_DEPTH);

    g.lineStyle(6, 0x00ff88, 0.7);
    g.strokeRect(3, 3, W - 6, H - 6);

    const arm = 60;
    g.lineStyle(6, 0x00ff88, 1.0);
    g.lineBetween(3, 3, 3 + arm, 3);
    g.lineBetween(3, 3, 3, 3 + arm);
    g.lineBetween(W - 3, 3, W - 3 - arm, 3);
    g.lineBetween(W - 3, 3, W - 3, 3 + arm);
    g.lineBetween(3, H - 3, 3 + arm, H - 3);
    g.lineBetween(3, H - 3, 3, H - 3 - arm);
    g.lineBetween(W - 3, H - 3, W - 3 - arm, H - 3);
    g.lineBetween(W - 3, H - 3, W - 3, H - 3 - arm);

    this.debugText = this.add
      .text(32, 32, this.getDebugLines(config), {
        color: '#00ff88',
        fontSize: '26px',
        fontFamily: 'monospace',
        align: 'left',
        backgroundColor: '#00000099',
        padding: { x: 18, y: 14 },
        lineSpacing: 3,
      })
      .setOrigin(0)
      .setDepth(DEBUG_DEPTH + 1);
  }

  private getDebugLines(config: GameConfig): string {
    const orientation = classifyOrientation(window.innerWidth, window.innerHeight);
    const gs = this.scale.gameSize;
    const snapshot = this.snapshot;
    return [
      config.projectId,
      `${config.designWidth} x ${config.designHeight}`,
      `Browser: ${window.innerWidth} x ${window.innerHeight}`,
      `Orientation: ${orientation}`,
      `Canvas: ${Math.round(gs.width)} x ${Math.round(gs.height)}`,
      `Level: ${snapshot.levelId}`,
      `Seed: ${snapshot.seed}`,
      `Board remaining: ${snapshot.remainingBoardCount}`,
      `Tray: ${snapshot.trayCount}/${snapshot.trayCapacity}`,
      `Selectable: ${snapshot.selectableCount}`,
      `Blocked: ${snapshot.blockedCount}`,
      `Input locked: ${snapshot.inputLocked}`,
      `Tray full: ${snapshot.trayFull}`,
      `Match resolving: ${snapshot.matchResolving}`,
      `Last matched: ${snapshot.lastMatchedTileType ?? 'none'}`,
      `Game state: ${snapshot.gameState}`,
      `Timer: ${snapshot.timerStarted ? 'started' : 'waiting'} ${snapshot.timerRemaining.toFixed(2)}s`,
      `Timer warning: ${snapshot.timerWarningActive}`,
      `Tutorial active: ${snapshot.tutorialActive}`,
      `Tutorial dismissed: ${snapshot.tutorialDismissed}`,
      `Idle hint: ${snapshot.idleHintActive ? snapshot.idleHintTargetTileId ?? 'none' : 'off'}`,
      `Idle seconds: ${snapshot.secondsSinceLastValidInteraction.toFixed(2)}`,
      `CTA visible: ${snapshot.ctaVisible}`,
      `CTA clicks: ${snapshot.ctaClickCount}`,
      `End card: ${snapshot.endCardVisible ? snapshot.endCardReason : 'off'}`,
      `End card clicks: ${snapshot.endCardClickCount}`,
      `Store opens: ${snapshot.storeOpenCallCount}`,
      `Last store source: ${snapshot.lastStoreOpenSource ?? 'none'}`,
      `Audio: ${snapshot.audioEnabled ? (snapshot.audioMuted ? 'muted' : 'on') : 'off'} unlocked=${snapshot.audioUnlocked}`,
      `Last SFX: ${snapshot.lastSfxPlayed ?? 'none'}`,
      `Effects: ${snapshot.effectsEnabled ? 'on' : 'off'} last=${snapshot.lastEffectTriggered ?? 'none'}`,
      `Timer warning visual: ${snapshot.timerWarningVisualActive}`,
      `Formal solvability: ${snapshot.formalSolvability}`,
      snapshot.buildLabel,
    ].join('\n');
  }

  private updateDebugText(config: GameConfig): void {
    if (this.debugText?.active) {
      this.debugText.setText(this.getDebugLines(config));
    }
  }

  private publishSnapshot(config: GameConfig): void {
    const boardLayout = calculateBoardLayout(this.boardState.tiles, config.boardLayout, TILE_SOURCE_SIZE);
    const trayLayout = calculateTrayLayout(this.trayState, config.trayLayout);
    this.snapshot = createSnapshot(
      config,
      this.boardState,
      this.trayState,
      this.selectionState,
      boardLayout,
      trayLayout,
      this.tripletsValid,
      this.layerCount,
      this.resolvingGroup,
      this.lastMatchedTileType,
      this.gameState,
      this.timerState,
      this.tutorialState,
      this.idleHintState,
      Boolean(this.tutorialHand?.active),
      this.ctaState,
      this.endCardState,
      this.storeOpenState,
      this.audioState,
      this.effectState
    );
    window.__TILEPYRAMID_BUILD02__ = Object.freeze(this.snapshot);
    window.__TILEPYRAMID_BUILD03__ = Object.freeze(this.snapshot);
    window.__TILEPYRAMID_BUILD04__ = Object.freeze(this.snapshot);
    window.__TILEPYRAMID_BUILD05__ = Object.freeze(this.snapshot);
    window.__TILEPYRAMID_BUILD06__ = Object.freeze(this.snapshot);
    window.__TILEPYRAMID_BUILD08__ = Object.freeze(this.snapshot);
    window.__TILEPYRAMID_BUILD09__ = Object.freeze(this.snapshot);
    window.__TILEPYRAMID_BUILD20__ = Object.freeze(this.snapshot);
  }

  shutdown(): void {
    this.orientationController?.destroy();
    this.timerWarningLoopTween?.stop();
    this.timerWarningLoopTween = undefined;
    for (const object of this.ctaObjects) object.destroy();
    this.ctaObjects = [];
    this.clearTutorialObjects();
    for (const object of this.idleObjects) object.destroy();
    this.idleObjects = [];
    for (const object of this.endCardObjects) object.destroy();
    this.endCardObjects = [];
  }
}

function createSnapshot(
  config: GameConfig,
  board: BoardRuntimeState,
  tray: TrayState,
  selection: SelectionState,
  boardLayout: BoardLayoutResult,
  trayLayout: TrayLayoutResult,
  tripletsValid: boolean,
  layerCount: number,
  resolvingGroup: MatchGroup | undefined,
  lastMatchedTileType: number | null,
  gameState: GameOutcomeState,
  timer: TimerState,
  tutorial: TutorialState,
  idleHint: IdleHintState,
  tutorialHandVisible: boolean,
  cta: CtaState,
  endCard: EndCardState,
  storeOpen: StoreOpenState,
  audio: AudioState,
  effects: EffectState
): Build08Snapshot {
  const layoutById = new Map(boardLayout.tiles.map(tile => [tile.id, tile]));

  return {
    buildId: BUILD_ID,
    buildLabel: BUILD_LABEL,
    levelId: config.levelId,
    seed: config.assignmentSeed,
    tileCount: board.tiles.length,
    remainingBoardCount: board.tiles.length,
    layerCount,
    selectableCount: board.selectableCount,
    blockedCount: board.blockedCount,
    tileTypeCount: config.tileTypeCount,
    tripletValidation: tripletsValid ? 'PASS' : 'FAIL',
    formalSolvability: 'NOT YET PROVEN',
    spriteCount: board.tiles.length,
    boardBounds: {
      left: boardLayout.bounds.left,
      right: boardLayout.bounds.right,
      top: boardLayout.bounds.top,
      bottom: boardLayout.bounds.bottom,
    },
    tiles: board.tiles.map(tile => {
      const tileLayout = layoutById.get(tile.id);
      if (!tileLayout) throw new Error(`Missing layout for snapshot tile ${tile.id}`);
      return {
        id: tile.id,
        layer: tile.layer,
        x: tile.x,
        y: tile.y,
        screenX: tileLayout.screenX,
        screenY: tileLayout.screenY,
        tileTypeId: tile.tileTypeId,
        selectable: tile.selectable,
        blockerIds: [...tile.blockerIds],
      };
    }),
    trayCount: tray.tiles.length,
    trayCapacity: tray.capacity,
    traySlotCount: trayLayout.slots.length,
    trayFull: isTrayFull(tray),
    inputLocked: selection.inputLocked,
    matchReadyTileTypes: getMatchReadyTileTypes(tray),
    trayTiles: trayLayout.tiles.map(tile => ({
      sourceTileId: tile.sourceTileId,
      tileTypeId: tile.tileTypeId,
      slotIndex: tile.slotIndex,
      screenX: tile.screenX,
      screenY: tile.screenY,
    })),
    matchResolving: resolvingGroup !== undefined,
    lastMatchedTileType,
    gameState,
    resolvingTileIds: [...(resolvingGroup?.sourceTileIds ?? [])],
    timerStarted: timer.started,
    timerRemaining: Math.max(0, timer.remainingSeconds),
    timerDisplaySeconds: getTimerDisplaySeconds(timer),
    timerWarningActive: timer.warningActive,
    timerExpired: timer.expired,
    tutorialActive: tutorial.active && gameState === 'playing',
    tutorialDismissed: tutorial.dismissed,
    tutorialText: tutorial.text,
    tutorialHighlightedTileIds: [...tutorial.previewTileIds],
    tutorialHandVisible,
    idleHintActive: idleHint.active && gameState === 'playing',
    idleHintTargetTileId: idleHint.targetTileId,
    secondsSinceLastValidInteraction: idleHint.secondsSinceLastValidInteraction,
    ctaVisible: cta.visible,
    ctaClickCount: cta.clickCount,
    endCardVisible: endCard.visible,
    endCardReason: endCard.reason,
    endCardClickCount: endCard.clickCount,
    storeOpenCallCount: storeOpen.callCount,
    lastStoreOpenSource: storeOpen.lastSource,
    lastStoreOpenUrl: storeOpen.lastUrl,
    storeOpenMode: storeOpen.mode,
    storeOpenFallbackUrl: storeOpen.fallbackUrl,
    storeOpenAndroidUrl: storeOpen.androidUrl,
    storeOpenIosUrl: storeOpen.iosUrl,
    lastStoreOpenPlatform: storeOpen.lastPlatform,
    audioEnabled: audio.enabled,
    audioUnlocked: audio.unlocked,
    audioMuted: audio.muted,
    bgmEnabled: audio.bgmEnabled,
    bgmPlaying: audio.bgmPlaying,
    lastSfxPlayed: audio.lastSfxPlayed,
    audioErrorCount: audio.errorCount,
    effectsEnabled: effects.enabled,
    lastEffectTriggered: effects.lastEffectTriggered,
    timerWarningVisualActive: effects.timerWarningVisualActive,
  };
}

function colorFromHex(value: string): number {
  return Phaser.Display.Color.HexStringToColor(value).color;
}

function getCommercialJuice(config: GameConfig): CommercialJuiceConfig | undefined {
  return config.commercialJuice?.enabled ? config.commercialJuice : undefined;
}
