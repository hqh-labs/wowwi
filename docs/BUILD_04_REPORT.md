# BUILD_04_REPORT.md

Project: TilePyramid_PL01
Phase: BUILD-04 - Match-Three Resolution, Tray Compaction, Basic Win/Fail Rules
Status: COMPLETE
Date: 2026-06-27

---

## Summary

BUILD-04 adds match-three detection and resolution for tray tiles, tray
compaction after matched tiles are removed, and basic `playing` / `won` /
`failed` runtime state. It preserves BUILD-03 tile selection, fly-to-tray
animation, blocker recomputation, and tray grouping.

Formal solvability remains: `NOT YET PROVEN`.

---

## Architecture implemented

Pure logic:
- `src/gameplay/tray/MatchResolver.ts`
- `src/gameplay/outcome/OutcomeEvaluator.ts`

Runtime coordination:
- `GameScene` marks matched tray tiles as resolving, locks input during the
  configured delay/animation, removes exactly one group of three, compacts the
  tray, evaluates win/fail state, and publishes read-only BUILD-04 diagnostics
  on `window.__TILEPYRAMID_BUILD04__`.

---

## Match-three behavior

- After a selected tile enters the tray, the tray is checked for a same-type
  group of three.
- Exactly one group of three is marked resolving, then removed after the
  configured delay and non-final scale/fade animation.
- If more than three same-type tray tiles ever exist, BUILD-04 resolves only the
  first group of three at a time.
- No final effects, particles, or audio are implemented.

## Tray compaction behavior

- Matched tiles are removed from tray state.
- Remaining tray tiles keep stable order.
- Existing tray tiles shift left into the earliest available slots.
- Slot count remains unchanged.

## Basic win rule

The game state becomes `won` when the board is empty and no match resolution is
pending. This conservative BUILD-04 rule allows leftover tray tiles if the board
has been emptied; final win screen behavior is deferred.

## Basic fail rule

The game state becomes `failed` when the tray is full, no match resolution is
pending, and no pending group of three exists. Failure disables input but does
not show a final lose screen, end card, redirect, or audio.

---

## Automated validation

Commands run from `projects/TilePyramid_PL01/`.

- `npm run typecheck`: PASS
- `npm run test`: PASS, 96 unit tests
- `npm run build`: PASS
- `npm run test:smoke`: PASS, 6 Chromium smoke tests

Warnings:
- Vite reports the Phaser chunk is larger than 500 kB after minification.
- Vitest reports the Vite CJS Node API deprecation warning.

---

## Production size

- `dist/index.html`: 8.69 KB raw, 1.68 KB gzip
- `dist/assets/index-3ZHTnulM.js`: 26.81 KB raw, 8.33 KB gzip
- `dist/assets/phaser-YAzv7auA.js`: 1,475.51 KB raw, 338.28 KB gzip
- Total JavaScript: 1,502,322 bytes raw
- Total CSS: 0 bytes
- Runtime images: 1,647,801 bytes raw
- Total production output: 3,167,729 bytes raw

---

## Manual testing instructions

1. From `projects/TilePyramid_PL01/`, run `npm run dev`.
2. Open the Vite URL.
3. Tap the three highlighted top-row preview tiles. They should fly to the tray,
   briefly mark/resolve, then disappear from the tray.
4. Confirm board count drops by three and tray count returns to zero.
5. Rotate or resize to landscape. The portrait gameplay canvas should remain
   centered, with side background areas outside gameplay input.

---

## Known limitations

- No timer.
- No tutorial hand, dim overlay, or idle reminder.
- No audio.
- No final effects or particles.
- No CTA.
- No end card.
- No Unity Ads or AppLovin exporter.
- No visual editor.
- Formal solvability is still not proven.

No commit was made and nothing was pushed.
