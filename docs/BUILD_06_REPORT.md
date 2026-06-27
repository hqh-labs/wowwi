# BUILD-06 Report: CTA, End Card, and Store-Open Abstraction

Project: TilePyramid_PL01
Branch: build-06-cta-endcard

## Architecture implemented

- Added pure CTA state in `src/gameplay/cta/CtaSystem.ts`.
- Added pure end-card state in `src/gameplay/endcard/EndCardSystem.ts`.
- Added network-agnostic store-open service in `src/gameplay/store/StoreOpenService.ts`.
- Kept Phaser CTA and end-card rendering inside `GameScene`.
- Extended config validation for `app`, `cta`, `endCard`, and debug fields.
- Extended read-only diagnostics as `window.__TILEPYRAMID_BUILD06__`.

## CTA behavior

- Gameplay CTA is visible by default during active gameplay.
- CTA text, position, size, colors, font size, and visibility are config-driven.
- CTA is programmatic; the baked CTA image is not used.
- CTA click records a store-open event through `StoreOpenService`.
- CTA click does not select a tile, mutate board/tray state, start the timer, or dismiss the tutorial.
- CTA remains clickable above the tutorial overlay.

## End card behavior

- A basic end card appears after win or fail.
- End card blocks gameplay input by relying on the existing locked outcome state.
- End card shows app icon, logo, result messaging, and CTA.
- Full-card click area is enabled inside the centered 9:16 gameplay canvas.
- End-card clicks call the same store-open abstraction.
- No final polish effects, particles, or audio were added.

## Store-open abstraction behavior

- `record-only` mode records events without browser navigation.
- `navigate` mode is present but guarded by `safeDevelopmentNavigation`.
- Store-open diagnostics include call count, last source, last URL, and mode.
- No Unity Ads or AppLovin adapter is implemented in BUILD-06.

## Runtime assets copied

- `projects/TilePyramid_PL01/public/assets/images/app_icon.png`
  - Source: `project-input/extracted-assets/TilePyramid_TrueGameplay/App icon/Icon_PyramidQuest.png`
- `projects/TilePyramid_PL01/public/assets/images/logo.png`
  - Source: `project-input/extracted-assets/TilePyramid_TrueGameplay/Logo/Logo (1).png`

Original files under `project-input/` were not moved, renamed, edited, recompressed, or overwritten.

## Test results

- `npm run typecheck`: passed.
- `npm run test`: passed, 9 files, 134 tests.
- `npm run build`: passed.
- `npm run test:smoke`: passed, Chromium ran 11 tests.

Warnings:
- Vite reports the existing large Phaser chunk warning.
- Vitest reports the existing Vite CJS Node API deprecation warning.

## Build-size measurements

- Production JavaScript: 1,522,320 bytes.
- Production CSS: 0 bytes.
- Runtime images: 2,935,704 bytes.
- Total production output: 4,480,212 bytes.
- Main app JS: `dist/assets/index-C_LTDuu_.js`, 46,812 bytes.
- Phaser JS chunk: `dist/assets/phaser-YAzv7auA.js`, 1,475,508 bytes.
- App icon runtime copy: 1,016,358 bytes.
- Logo runtime copy: 172,624 bytes.

## Manual testing instructions

From `projects/TilePyramid_PL01/`:

```bash
npm run dev
```

Open the printed local URL. Confirm:

- The CTA is visible near the lower gameplay area.
- Clicking CTA records store-open diagnostics without changing board/tray state.
- Clicking CTA before a tile tap does not start the timer or dismiss the tutorial.
- Win/fail states show the basic end card.
- Clicking the end card records a store-open event.
- Landscape keeps the portrait canvas centered; side background areas do not trigger gameplay or store-open.

## Known limitations

- End card is basic and not final-polish.
- App icon is copied unchanged and is large; image optimization is deferred.
- End-card natural win is hard to reach manually with the full board, so unit coverage verifies end-card state transitions.
- Full-screen end-card click area is inside the 9:16 gameplay canvas for BUILD-06.
- Formal solvability is still NOT YET PROVEN.

## Explicit non-scope confirmations

- Unity Ads exporter was not implemented.
- AppLovin exporter was not implemented.
- MRAID integration was not implemented.
- Final audio was not implemented.
- Final effects and particles were not implemented.
- Final network packaging was not implemented.
- Visual editor was not implemented.
