# PROPOSED_ARCHITECTURE.md

Project: TilePyramid_PL01
Status: Proposed architecture with BUILD-01 through BUILD-06 implementation notes.

---

## Guiding principles

1. **Config-driven** — gameplay parameters, asset paths, UI styles, audio, tray capacity are in JSON; no magic constants in code.
2. **Gameplay is network-agnostic** — no ad SDK calls inside gameplay modules; adapters inject behaviour via interfaces.
3. **Portrait viewport is invariant** — orientation handling is isolated in one controller; gameplay knows nothing about landscape.
4. **Small build phases** — each module boundary is a natural stopping point; modules are usable or testable before the next is built.
5. **Original assets are separate** — `project-input/` is read-only; `projects/TilePyramid_PL01/assets/` contains only optimized copies.

---

## Module map

```
projects/TilePyramid_PL01/
├── config/
│   └── game.config.json          ← Canonical project configuration
├── assets/                       ← Optimized runtime assets (tracked in git)
│   ├── images/
│   ├── audio/
│   └── fonts/
├── src/
│   ├── main.ts                   ← Entry point; loads config, boots runtime
│   ├── config/
│   │   └── ConfigLoader.ts       ← Reads and validates game.config.json
│   ├── manifest/
│   │   └── AssetManifest.ts      ← Maps logical asset names to file paths
│   ├── orientation/
│   │   └── OrientationController.ts
│   ├── renderer/
│   │   └── RuntimeRenderer.ts    ← Phaser bootstrap; scene registration
│   ├── gameplay/                 ← Gameplay core (no ad SDK dependencies)
│   │   ├── GameplayStateMachine.ts
│   │   ├── board/
│   │   │   ├── TileBoard.ts
│   │   │   ├── BlockingSystem.ts
│   │   │   └── TileAssigner.ts
│   │   ├── tray/
│   │   │   └── TraySystem.ts
│   │   ├── tutorial/
│   │   │   └── TutorialSystem.ts
│   │   ├── timer/
│   │   │   └── TimerSystem.ts
│   │   ├── idle/
│   │   │   ├── IdleHintSystem.ts
│   │   │   └── HintCandidateSelector.ts
│   │   ├── cta/
│   │   │   └── CtaSystem.ts
│   │   ├── store/
│   │   │   └── StoreOpenService.ts
│   │   └── endcard/
│   │       └── EndCardSystem.ts
│   ├── effects/
│   │   └── EffectSystem.ts
│   ├── audio/
│   │   └── AudioSystem.ts
│   ├── cta/
│   │   └── CTASystem.ts          ← Store-open abstraction; no SDK call here
│   ├── adapters/                 ← Network-specific code
│   │   ├── INetworkAdapter.ts    ← Interface
│   │   ├── UnityAdsAdapter.ts
│   │   └── AppLovinAdapter.ts
│   └── validators/
│       └── IValidator.ts
├── tests/
│   └── smoke/
│       └── shell.test.ts
└── dist/                         ← Build output (gitignored)
```

---

## System descriptions

### Canonical project configuration (`config/game.config.json`)

Single source of truth for all tuneable parameters. Consumed by both the playable runtime and the future visual editor.

Fields (proposed):
```json
{
  "project": "TilePyramid_PL01",
  "level": "Level_21",
  "trayCapacity": 5,
  "timer": {
    "durationSeconds": 30,
    "warningSeconds": 5,
    "startOnFirstValidTap": true,
    "debugVisible": true
  },
  "viewport": { "width": 540, "height": 960 },
  "background": "Background_1",
  "tutorial": {
    "enabled": true,
    "text": "Tap to match!",
    "dismissOnFirstValidTap": true,
    "previewTileIds": ["L2:-1.5:2.5", "L2:-0.5:2.5", "L2:0.5:2.5"],
    "dimOpacity": 0.5,
    "handEnabled": true,
    "handAssetId": "Pointer_Hand",
    "handPathMode": "loop-preview-tiles"
  },
  "idleHint": {
    "enabled": true,
    "delaySeconds": 5,
    "preferTrayPairCompletion": true,
    "deterministicFallback": true
  },
  "tileSeed": 21001,
  "audio": { "bgm": "BGM_GamePlay", "volume": 0.5 },
  "app": {
    "name": "Pyramid Quest",
    "fallbackUrl": "https://example.com/pyramid-quest",
    "androidUrl": "https://example.com/pyramid-quest/android",
    "iosUrl": "https://example.com/pyramid-quest/ios",
    "storeOpenMode": "record-only",
    "safeDevelopmentNavigation": true,
    "iconAssetId": "App_Icon",
    "logoAssetId": "App_Logo"
  },
  "cta": {
    "enabled": true,
    "text": "Play Now",
    "position": { "x": 540, "y": 1775 },
    "size": { "width": 420, "height": 112 },
    "fontSize": 36,
    "textColor": "#ffffff",
    "backgroundColor": "#ff3f6e",
    "borderColor": "#fff4a8",
    "cornerRadius": 28,
    "visibleDuringGameplay": true
  },
  "endCard": {
    "enabled": true,
    "showOnWin": true,
    "showOnFail": true,
    "titleText": "Pyramid Quest",
    "winMessage": "Level Complete!",
    "failMessage": "Try Again!",
    "fullScreenClick": true,
    "ctaText": "Play Now"
  }
}
```

### Asset manifest (`AssetManifest.ts`)

Maps logical names (used in config) to physical file paths. Decouples config from filesystem layout. The visual editor updates this manifest when assets are swapped.

### Runtime renderer (`RuntimeRenderer.ts`)

Thin Phaser bootstrap. Responsibilities:
- Create Phaser.Game with Scale Manager in FIT + CENTER_BOTH mode.
- Register scenes (Boot, Preload, Game, EndCard).
- Pass config and manifest to scenes via Phaser registry.
- Nothing here knows about tile logic.

### Orientation controller (`OrientationController.ts`)

Responsibilities:
- Detect orientation changes.
- Keep gameplay canvas fixed at 9:16 (Scale Manager handles this).
- Resize and reposition full-screen background DOM layer.
- Block tap events from background side areas in landscape.
- Expose a simple `onOrientationChange` event for the EndCard (which goes full-screen in landscape).

No other system handles orientation.

### Gameplay state machine (`GameplayStateMachine.ts`)

States:
```
IDLE → TUTORIAL → PLAYING → WIN | LOSE
```

Transitions:
- `IDLE → TUTORIAL` on scene start (if tutorial enabled).
- `TUTORIAL → PLAYING` on first real player tap.
- `PLAYING → WIN` when all tiles are cleared.
- `PLAYING → LOSE` when timer hits zero OR tray is full with no match.

The state machine owns the timer and coordinates all gameplay systems. Nothing inside gameplay emits CTA or store events directly.

### Tile board (`TileBoard.ts`)

Responsibilities:
- Load level JSON.
- Assign tile types via `TileAssigner`.
- Track which tiles are present.
- Expose a `selectableTiles` computed list (tiles not blocked by any tile on a higher layer).
- Notify listeners when a tile is tapped.
- Emit board-cleared event when empty.

BUILD-02 implementation note: the board is currently static. Pure modules under
`src/gameplay/` parse level data, derive blocking, assign tile types, validate
triplets, and calculate layout. Phaser renders these results but does not remove,
move, match, or mutate tiles.

### Blocking system (`BlockingSystem.ts`)

Derives blocking relationships from layer coordinates using the overlap rule in `LEVEL_DATA_ANALYSIS.md`. Returns a boolean `isBlocked(tile)` for any tile. Re-evaluates after each tile removal.

BUILD-02 established interface:
- `deriveBlockingRelationships(positions)` returns blocker IDs for each stable
  position ID.
- `createBoardTiles(positions, assignments)` returns tile instances with stable
  IDs, layer, coordinate, blocker IDs, and selectable status.
- Initial selectable state is static in BUILD-02 because tile removal is not
  implemented.

### Deterministic assignment (`TileAssigner.ts`)

BUILD-02 established interface:
- `assignTileTypes(positions, { seed, tileTypeCount, tutorialPreviewPositionIds })`
  uses a local seeded PRNG, never `Math.random()`.
- Level_21 uses 24 tile types and 72 assignments.
- `validateTriplets(assignments, tileTypeCount)` verifies exactly three copies
  of every configured tile type.

### Board layout (`BoardLayout.ts`)

BUILD-02 established interface:
- `calculateBoardLayout(tiles, boardLayoutConfig, tileSourceSize)` maps level
  coordinates into the fixed 1080 x 1920 portrait gameplay space.
- Layout constants live in `public/config/game.config.json`, not scene code.

### Tray and matching system (`TraySystem.ts`)

Responsibilities:
- Maintain an ordered list of tiles currently in the tray (max 5).
- Accept a tile from the board.
- After each addition, check for three identical tiles; if found, remove them and emit `matchCleared`.
- Emit `trayFull` when tray reaches capacity with no possible match.
- Expose tray state for renderer and config validation.

BUILD-03 established interface:
- `createTrayState(capacity)` validates configurable tray capacity.
- `addTileToTray(state, tile)` inserts beside existing same-type tiles when
  possible, otherwise appends in stable order.
- `getMatchReadyTileTypes(state)` identifies three-or-more same-type tray groups
  for debug marking only. It does not remove matches in BUILD-03.

BUILD-04 established interface:
- `findNextMatchGroup(tray)` detects the next same-type group of three. If more
  than three of a type exist, only the first group of three is resolved.
- `removeMatchGroup(tray, group)` removes the matched tiles and leaves remaining
  tray tiles compacted in stable order.
- Match resolution locks input while the non-final scale/fade animation runs.

### Selection controller (`SelectionController.ts`)

BUILD-03 established interface:
- `attemptTileSelection(board, tray, selection, tileId, inputLockEnabled)` rejects
  blocked tiles, removed tiles, full tray, and locked input before animation.
- `completeTileSelection(board, tray, selectedTile)` removes the tile from board
  state, adds it to tray state, recomputes blocking/selectable board state, and
  unlocks input.
- `GameScene` coordinates Phaser rendering and animation; selection and tray
  insertion rules remain pure and testable without Phaser.

### Outcome evaluator (`OutcomeEvaluator.ts`)

BUILD-04 established interface:
- `evaluateOutcome({ board, tray, matchResolving })` returns `playing`, `won`,
  or `failed`.
- Win is conservative: board empty and no match resolution pending. Leftover tray
  tiles are allowed if the board is empty.
- Fail occurs only when the tray is full, no match resolution is pending, and no
  pending group of three exists.

### Tutorial system (`TutorialSystem.ts`)

Responsibilities:
- Track whether the initial tutorial is enabled, active, or dismissed.
- Preserve the configured preview tile IDs and tutorial text.
- Dismiss only after a valid selectable tile interaction when configured.
- Ignore blocked tile interactions.

BUILD-05 established interface:
- `createTutorialState({ enabled, text, previewTileIds })` creates the initial
  active/inactive tutorial state.
- `handleTutorialInteraction(state, interaction, dismissOnFirstValidTap)`
  dismisses only on `valid-selectable`.
- Phaser rendering lives in `GameScene`: dim overlay, highlight rings, text, and
  hand pointer. The pure tutorial module does not handle selection or rendering.

### Timer system (`TimerSystem.ts`)

Responsibilities:
- Keep countdown state independent from Phaser.
- Start only after the first valid selectable tile interaction.
- Tick only while gameplay state is `playing`.
- Clamp remaining time at zero and expose warning/expired flags.

BUILD-05 established interface:
- `createTimerState(durationSeconds, warningSeconds)` initializes an unstarted
  timer with full remaining duration.
- `registerTimerInteraction(state, interaction, startOnFirstValidTap)` starts
  only on `valid-selectable`.
- `tickTimer(state, deltaSeconds, gameState)` advances only while started and
  playing, never below zero.
- `getTimerDisplaySeconds(state)` exposes a whole-second countdown for UI.

### Idle hint system (`IdleHintSystem.ts`, `HintCandidateSelector.ts`)

Responsibilities:
- Count time since the last valid selectable interaction after tutorial dismissal.
- Hide while input is locked, a match is resolving, or the game has won/failed.
- Show after the configured delay with a deterministic target tile.
- Prefer a currently selectable board tile that completes an existing tray pair.

BUILD-05 established interface:
- `createIdleHintState(enabled, delaySeconds)` initializes idle tracking.
- `resetIdleHint(state)` clears the active hint and timer after a valid tap.
- `tickIdleHint(state, deltaSeconds, context)` handles the timing and visibility
  rules without Phaser.
- `selectIdleHintTarget({ boardTiles, trayTiles, preferTrayPairCompletion,
  deterministicFallback })` chooses a currently selectable tile without
  `Math.random()`.

### Effect system (`EffectSystem.ts`)

Responsibilities:
- Receive effect requests by name (e.g. `"matchBurst"`, `"tileShatter"`).
- Play the corresponding Phaser particle effect or CSS animation.
- Re-implement the Unity shatter effect as a canvas particle sequence.
- No effect system code is imported by gameplay logic — effects are triggered via events.

### Audio system (`AudioSystem.ts`)

Responsibilities:
- Load and cache audio assets on preload.
- Handle mobile audio unlock automatically (via Phaser's built-in mechanism).
- Expose `play(soundName)`, `playBGM(trackName)`, `stopBGM()`.
- Respect a mute flag.
- No audio system code is imported by gameplay — audio is triggered via events.

### CTA / store-opening abstraction (`CTASystem.ts`)

Responsibilities:
- Track whether the gameplay CTA is enabled, visible, and clicked.
- Keep CTA state separate from board, tray, timer, and tutorial state.
- Delegate store-open action to `StoreOpenService`.
- Render the CTA as a configurable Phaser component, not a baked CTA image.

BUILD-06 established interface:
- `createCtaState(enabled, visibleDuringGameplay)` initializes CTA visibility.
- `recordCtaClick(state)` increments CTA click diagnostics without mutating
  gameplay state.
- `setCtaVisible(state, visible)` allows `GameScene` to hide the CTA when the
  end card appears.

### Store-open service (`StoreOpenService.ts`)

Responsibilities:
- Record store-open events in development-safe `record-only` mode.
- Choose the configured fallback URL.
- Record call source (`gameplay-cta`, `end-card`, or `unknown`).
- Navigate only when config uses `navigate` mode and safe development navigation
  is disabled.

BUILD-06 established interface:
- `StoreOpenService.openStore(source)` records the event and optionally delegates
  navigation.
- `StoreOpenService.getSnapshot()` exposes read-only diagnostics.
- `chooseStoreUrl(config)` centralizes URL selection.

No Unity Ads or AppLovin SDK call exists in BUILD-06.

### End-card system (`EndCardSystem.ts`)

Responsibilities:
- Track whether the basic end card is hidden or visible.
- Show the configured win or fail reason after gameplay outcome.
- Record end-card click count.
- Delegate store-open action through the same `StoreOpenService`.

BUILD-06 established interface:
- `createEndCardState(enabled)` initializes hidden end-card state.
- `updateEndCardForOutcome(state, gameState, rules)` shows the card on win/fail
  according to config.
- `recordEndCardClick(state)` increments end-card click diagnostics.

Phaser rendering lives in `GameScene`: overlay surface, icon, logo, message,
CTA button, and full-card click area inside the centered 9:16 canvas.

### Network adapter interface (`INetworkAdapter.ts`)

```ts
interface INetworkAdapter {
  name: string;
  openStore(): void;
  trackEvent(name: string, params?: Record<string, unknown>): void;
  isReady(): boolean;
}
```

Implementations: `UnityAdsAdapter`, `AppLovinAdapter`.

The active adapter is injected at boot time from `main.ts` based on the detected environment. Gameplay modules never import adapters directly.

### Validator interface (`IValidator.ts`)

Used by scripts (not the runtime) to validate config and level files before export.

```ts
interface IValidator {
  validate(config: GameConfig, levelData: LevelData): ValidationResult;
}
```

Validators check:
- All referenced assets exist.
- Total stone count is divisible by 3.
- Tray capacity ≥ 3.
- Timer > 0.
- Board is solvable (when full tile-assigner is implemented).

### Batch export coordinator (`scripts/export.ts`)

A single CLI script that:
1. Validates config and assets.
2. Runs the production build.
3. Packages output for Unity Ads (ZIP, inject Unity SDK adapter).
4. Packages output for AppLovin (ZIP, inject AppLovin adapter).

Usage: `npm run export` → produces two ZIP files in `dist/`.

---

## Data flow (gameplay loop)

```
Boot
 └─ load config.json
 └─ load asset manifest
 └─ boot Phaser

Preload scene
 └─ load textures, audio, fonts

Game scene
 └─ OrientationController.init()
 └─ TileBoard.load(levelData)
 └─ TileAssigner.assign(board, seed)
 └─ BlockingSystem.computeInitial(board)
 └─ TraySystem.init(trayCapacity)
 └─ TimerSystem.init(timerSeconds)  ← not started yet
 └─ TutorialSystem.start(highlightTiles)
   └─ [player taps tutorial tile]
   └─ StateMachine.transition(PLAYING)
   └─ TimerSystem.start()
   └─ TileBoard.selectTile(tile) → TraySystem.add(tile)
   └─ TraySystem → matchCleared? → EffectSystem.play("matchBurst")
                                 → AudioSystem.play("SFX_Match_3")
   └─ TileBoard.isEmpty()? → StateMachine.transition(WIN)
   └─ TimerSystem.expired? → StateMachine.transition(LOSE)
   └─ TraySystem.full? → StateMachine.transition(LOSE)

EndCard scene
 └─ EndCardSystem.show(WIN | LOSE)
 └─ [player taps anywhere]
 └─ CTASystem.onEndCardTap() → adapter.openStore()
```
