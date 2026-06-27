# BUILD_03_REPORT.md

Project: TilePyramid_PL01
Phase: BUILD-03 - Tray, Tile Selection, and Fly-to-Tray Interaction
Status: COMPLETE
Date: 2026-06-27

---

## Summary

BUILD-03 adds a configurable tray shell, selectable-tile interaction, blocked-tile
rejection, input locking during a fly-to-tray animation, board removal after the
animation completes, tray insertion/grouping, and live blocker recomputation.

Match-three removal is not implemented. Three same-type tray tiles can be marked
as match-ready in debug mode, but they remain in the tray.

Formal solvability remains: `NOT YET PROVEN`.

---

## Architecture implemented

Pure logic:
- `src/gameplay/board/BoardRuntimeState.ts`
- `src/gameplay/tray/TraySystem.ts`
- `src/gameplay/tray/TrayLayout.ts`
- `src/gameplay/selection/SelectionController.ts`

Runtime coordination:
- `GameScene` now coordinates board state, tray state, selection state, Phaser
  board rendering, Phaser tray rendering, fly-to-tray tweens, blocked-tap
  feedback, and read-only diagnostics snapshots.
- `window.__TILEPYRAMID_BUILD03__` exposes read-only counts and positions for
  Playwright tests. It does not expose mutation commands or gameplay cheats.

---

## Tray behavior

- Default configured capacity: 5
- Tray capacity comes from `public/config/game.config.json`.
- Tray slots are rendered programmatically with Phaser rectangles to support
  configurable capacity. No tray UI asset was copied.
- Tiles preserve aspect ratio in tray slots.
- Same tile types are grouped adjacent to existing same-type tiles.
- Non-matching tile types keep stable insertion order.
- Tray never exceeds capacity.
- If tray is full, additional tile selection is prevented. No lose state is
  triggered.

## Selection behavior

- Selectable board tiles are interactive.
- Blocked board tiles reject selection and show a small reversible shake.
- Input is locked while a tile is flying into the tray.
- A selected tile flies from its board position to its computed tray slot.
- At animation completion the tile is removed from board state and added to tray
  state.

## Blocking update behavior

- Removing a board tile recomputes blocker IDs from the remaining board tiles.
- Newly unblocked tiles become selectable.
- Removed tiles are no longer rendered or clickable.
- Diagnostics update board count, tray count, selectable count, blocked count,
  input lock, and tray-full state.

---

## Runtime assets copied

No new runtime assets were copied in BUILD-03.

Existing BUILD-02 runtime assets reused:
- `public/assets/levels/Level_21.json`
- `public/assets/images/tiles/tile_01.png` through `tile_24.png`
- `public/assets/images/Background_1.png`

Original files under `project-input/` were not modified.

---

## Automated validation

Commands run from `projects/TilePyramid_PL01/`.

- `npm run typecheck`: PASS
- `npm run test`: PASS, 78 unit tests
- `npm run build`: PASS
- `npm run test:smoke`: PASS, 9 Chromium smoke tests

Warnings:
- Vite reports the Phaser chunk is larger than 500 kB after minification.
- Vitest reports the Vite CJS Node API deprecation warning.

---

## Production size

- `dist/index.html`: 8.50 KB raw, 1.62 KB gzip
- `dist/assets/index-DJ1LusNw.js`: 23.57 KB raw, 7.60 KB gzip
- `dist/assets/phaser-YAzv7auA.js`: 1,475.51 KB raw, 338.28 KB gzip
- Total JavaScript: 1,499,082 bytes raw
- Total CSS: 0 bytes
- Runtime images: 1,647,801 bytes raw
- Total production output: 3,164,107 bytes raw

---

## Manual testing instructions

1. From `projects/TilePyramid_PL01/`, run `npm run dev`.
2. Open the Vite URL.
3. Tap a bright/selectable top-layer tile. It should fly to the tray, the board
   count should drop by one, and the tray count should increase by one.
4. Tap a dimmed/blocked lower-layer tile. It should shake briefly and not enter
   the tray.
5. Rotate or resize to landscape. The portrait gameplay canvas should remain
   centered, with side background areas outside gameplay input.

---

## Known limitations

- Match-three removal is intentionally not implemented.
- Tray visuals are programmatic placeholders, not final art.
- No lose state occurs when the tray is full.
- No formal solver exists yet; solvability remains not proven.
- Debug overlay may visually overlap the play area.

Not implemented in BUILD-03:
- Timer
- Win state
- Lose state
- Tutorial hand
- Tutorial dim overlay
- Idle reminder
- Effects or particles
- Audio
- CTA
- End card
- Unity Ads exporter
- AppLovin exporter
- Visual editor

No commit was made and nothing was pushed.
