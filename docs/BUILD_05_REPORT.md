# BUILD-05 Report: Timer, Initial Tutorial, and Idle Reminder

Project: TilePyramid_PL01
Branch: build-05-timer-tutorial

## Architecture implemented

- Added pure timer logic in `src/gameplay/timer/TimerSystem.ts`.
- Added pure tutorial state rules in `src/gameplay/tutorial/TutorialSystem.ts`.
- Added pure idle hint timing in `src/gameplay/idle/IdleHintSystem.ts`.
- Added deterministic idle candidate selection in `src/gameplay/idle/HintCandidateSelector.ts`.
- Kept Phaser rendering and coordination in `GameScene`.
- Extended the read-only diagnostics snapshot as `window.__TILEPYRAMID_BUILD05__`.
- Extended config validation for `timer`, `tutorial`, `idleHint`, and debug visibility fields.

## Timer behavior

- The timer initializes unstarted at 30 seconds.
- The timer starts only on the first valid selectable tile tap.
- Blocked tile taps do not start the timer.
- The timer ticks only while the game state is `playing`.
- Remaining time clamps to zero and never becomes negative in diagnostics.
- Warning state begins at 5 seconds remaining.
- Timer expiry enters the basic failed state and locks input.
- No final lose screen was added.

## Tutorial behavior

- The initial tutorial starts active when `tutorial.enabled` is true.
- The tutorial displays `Tap to match!`.
- A programmatic dim overlay is rendered over the gameplay viewport.
- The three configured tutorial-preview tile IDs are highlighted.
- A copied hand pointer image is rendered and animated visually.
- The hand pointer does not mutate gameplay or autoplay taps.
- The tutorial dismisses after the first valid selectable tile tap.
- Blocked tile taps leave the tutorial active.

## Idle reminder behavior

- Idle reminder is disabled until the tutorial is dismissed.
- Idle time resets after every valid selectable tile tap.
- Blocked tile taps do not reset idle time.
- The hint is hidden while input is locked, while a match is resolving, and after win/fail.
- After 5 seconds of valid gameplay inactivity, a hint appears.
- The hint prefers a selectable tile that completes an existing tray pair.
- Otherwise it chooses a deterministic currently selectable tile.
- The idle reminder does not autoplay or mutate gameplay.

## Runtime assets copied

- Copied runtime asset:
  - `projects/TilePyramid_PL01/public/assets/images/pointer_hand.png`
- Original source path:
  - `project-input/extracted-assets/TilePyramid_TrueGameplay/Pointer/1768988491461.png`
- The extracted source file was not moved, renamed, edited, recompressed, or overwritten.
- No unrelated UI, audio, Unity package, or VFX asset was copied.

## Test results

- `npm run typecheck`: passed.
- `npm run test`: passed, 8 files, 119 tests.
- `npm run build`: passed.
- `npm run test:smoke`: passed, Chromium ran 10 tests.

Warnings:
- Vite reports the existing large Phaser chunk warning.
- Vitest reports the existing Vite CJS Node API deprecation warning.

## Build-size measurements

- Production JavaScript: 1,513,978 bytes.
- Production CSS: 0 bytes.
- Runtime images: 1,746,722 bytes.
- Total production output: 3,280,020 bytes.
- Main app JS: `dist/assets/index-DiHdZJ7t.js`, 38,470 bytes.
- Phaser JS chunk: `dist/assets/phaser-YAzv7auA.js`, 1,475,508 bytes.
- Pointer hand image: 98,921 bytes.

## Manual testing instructions

From `projects/TilePyramid_PL01/`:

```bash
npm run dev
```

Open the printed local URL. Confirm:

- The initial board appears with the tutorial overlay.
- `Tap to match!` is visible.
- The three tutorial-preview tiles are highlighted.
- A blocked tile tap does not start the timer.
- A valid tutorial tile tap starts the timer and dismisses the tutorial.
- Waiting 5 seconds after a valid interaction shows an idle hint.
- Landscape view keeps the 9:16 gameplay canvas centered.

## Known limitations

- Tutorial dimming uses a simple full-screen overlay plus highlight rings; it does not cut transparent holes around target tiles.
- Timer fail is a basic debug fail state only.
- Timer and hint visuals are development-level, not final polish.
- Formal solvability is still NOT YET PROVEN.

## Explicit non-scope confirmations

- Audio was not implemented.
- CTA was not implemented.
- End card was not implemented.
- Final effects and particles were not implemented.
- Unity Ads exporter was not implemented.
- AppLovin exporter was not implemented.
