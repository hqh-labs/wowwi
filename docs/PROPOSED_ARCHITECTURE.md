# PROPOSED_ARCHITECTURE.md

Project: TilePyramid_PL01
Status: Proposed — not implemented. Subject to revision at BUILD-01.

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
  "timerSeconds": 30,
  "viewport": { "width": 540, "height": 960 },
  "background": "Background_1",
  "tutorialEnabled": true,
  "tutorialIdleReminderSeconds": 5,
  "tutorialText": "Tap to match!",
  "tileSeed": 21001,
  "audio": { "bgm": "BGM_GamePlay", "volume": 0.5 },
  "cta": {
    "visible": true,
    "text": "Play Now",
    "font": "PaytoneOne-Regular",
    "fontSize": 36,
    "textColor": "#ffffff",
    "background": "cta_bg",
    "borderGlow": true,
    "position": { "anchorX": 0.5, "anchorY": 0.92 },
    "clickAreaPadding": 20
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

### Blocking system (`BlockingSystem.ts`)

Derives blocking relationships from layer coordinates using the overlap rule in `LEVEL_DATA_ANALYSIS.md`. Returns a boolean `isBlocked(tile)` for any tile. Re-evaluates after each tile removal.

### Tray and matching system (`TraySystem.ts`)

Responsibilities:
- Maintain an ordered list of tiles currently in the tray (max 5).
- Accept a tile from the board.
- After each addition, check for three identical tiles; if found, remove them and emit `matchCleared`.
- Emit `trayFull` when tray reaches capacity with no possible match.
- Expose tray state for renderer and config validation.

### Tutorial system (`TutorialSystem.ts`)

Responsibilities:
- Dim non-highlighted screen areas via overlay.
- Receive a set of three target tile positions to highlight.
- Animate hand pointer towards the first target tile.
- Display `"Tap to match!"` text.
- After `tutorialIdleReminderSeconds` of inactivity, re-pulse the animation.
- Disable itself when the state machine transitions to `PLAYING`.

Does not handle tile selection or match logic — delegates to `TileBoard`.

### Timer system (`TimerSystem.ts`)

Responsibilities:
- Start countdown when notified by state machine (first real tap).
- Count down from `timerSeconds` to zero.
- Emit `timerExpired` event.
- Expose current remaining time for renderer (progress bar or numeric display).

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
- Render the CTA as a **configurable component** — not a static image. The supplied client asset (`CTA button/1768985619153.png`) has baked-in text and is a visual reference only; it is not the production runtime asset.
- All CTA visual properties are driven by `game.config.json`: text content, font, font size, text colour, background image or colour, border/glow, position, and click area padding. Any of these can be changed without code modification.
- Display the CTA button during gameplay.
- Extend the click area to the full screen on the end card.
- Delegate store-open action to the active `INetworkAdapter`.

**The store URL or SDK call is never inside CTASystem.** CTASystem only calls `adapter.openStore()`. This is the hard boundary between gameplay and ad-network code.

### End-card system (`EndCardSystem.ts`)

Responsibilities:
- Show the appropriate end screen (win or lose).
- Make the entire screen clickable.
- Notify `CTASystem` when the screen is clicked.
- In landscape, the full landscape screen is the clickable area (not just the portrait area).

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
