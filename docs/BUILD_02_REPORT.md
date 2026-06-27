# BUILD_02_REPORT.md

Project: TilePyramid_PL01
Phase: BUILD-02 - Level Board, Blocking System, Deterministic Assignment
Status: COMPLETE
Date: 2026-06-27

---

## Summary

BUILD-02 renders the static Level_21 tile board inside the existing 1080 x 1920
Phaser shell. It adds pure TypeScript systems for level parsing, schema
validation, coordinate blocking, deterministic tile assignment, triplet
validation, and board layout. No tile can be removed, moved, matched, or used to
change gameplay state in this build.

Formal solvability is not implemented and is explicitly reported as:
`Formal solvability: NOT YET PROVEN`.

---

## Architecture implemented

Pure modules:
- `src/gameplay/level/LevelTypes.ts`
- `src/gameplay/level/LevelParser.ts`
- `src/gameplay/board/BlockingSystem.ts`
- `src/gameplay/board/TileAssigner.ts`
- `src/gameplay/board/BoardLayout.ts`

Runtime integration:
- `PreloadScene` loads the configured level JSON and tile textures from the
  asset manifest.
- `GameScene` parses Level_21, assigns tile types, derives blockers, calculates
  layout, renders 72 static tile sprites, and publishes a read-only
  `window.__TILEPYRAMID_BUILD02__` diagnostics snapshot for smoke tests.
- Debug overlay reports level ID, seed, total tiles, layer count, selectable
  count, blocked count, tile-type count, triplet status, and formal solvability
  status.

---

## Runtime assets copied

All copied files are unchanged runtime copies. Original files under
`project-input/` were not modified.

- `public/assets/levels/Level_21.json`
  - Source: `project-input/extracted-assets/TilePyramid_TrueGameplay/Level Design/Level_21.json`
- `public/assets/images/tiles/tile_01.png` through `tile_24.png`
  - Sources: `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/1.png`
    through `24.png`

No audio, UI chrome, Unity packages, unused tile images, CTA, pointer, logo, or
extra level files were copied.

---

## Level_21 validation result

- Level ID: `Level_21`
- Layers: 3
- Total positions: 72
- Layer indices: contiguous from 0 through 2
- Coordinates: parsed as finite numbers
- Duplicate coordinates: none within any layer
- Triplet divisibility: PASS

## Blocking result

- Blocking is derived from adjacent-layer coordinates using `dx < 1` and
  `dy < 1`.
- Top layer tiles have no blockers.
- At least one lower-layer tile is blocked.
- Initial selectable tiles: 16
- Initial blocked tiles: 56
- No sprite-overlap or hardcoded blocker list is used.

## Assignment result

- Seed: `21000`
- Assignments: 72
- Tile types: 24
- Copies per tile type: exactly 3
- PRNG: local seeded shuffle
- `Math.random()` is not used.

Tutorial-preview positions:
- `L2:-1.5:2.5`
- `L2:-0.5:2.5`
- `L2:0.5:2.5`

All three receive tile type `1`. This is a preview reservation only; BUILD-02
does not implement the tutorial hand, overlay, or guided interaction.

---

## Automated validation

Commands run from `projects/TilePyramid_PL01/`.

- `npm run typecheck`: PASS
- `npm run test`: PASS, 61 unit tests
- `npm run build`: PASS
- `npm run test:smoke`: PASS, 9 Chromium smoke tests

Warnings:
- Vite still reports the Phaser chunk is larger than 500 kB after minification.
  This is the same expected Phaser-size warning as BUILD-01.
- Vitest reports the Vite CJS Node API deprecation warning.

---

## Production size

Build output:
- `dist/index.html`: 8.01 KB raw, 1.49 KB gzip
- `dist/assets/index-DrDxJr85.js`: 15.62 KB raw, 5.47 KB gzip
- `dist/assets/phaser-YAzv7auA.js`: 1,475.51 KB raw, 338.28 KB gzip
- Runtime background image: 1,079.16 KB raw
- Runtime tile images 1-24: 568.64 KB raw total
- Runtime Level_21 JSON: 1.65 KB raw
- Config files: 6.60 KB raw total
- Total production output: 3,155.18 KB raw

---

## Confirmed out of scope

Not implemented:
- Tray UI
- Tile movement into tray
- Match-three removal
- Timer
- Win/lose states
- Tutorial hand
- Idle reminder
- Effects
- Audio
- CTA
- End card
- Unity Ads exporter
- AppLovin exporter
- Visual editor

No commit was made and nothing was pushed.
