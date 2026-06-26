# BUILD_01_REPORT.md

Project: TilePyramid_PL01
Phase: BUILD-01 — Responsive Playable Shell
Status: COMPLETE
Date: 2026-06-26

---

## Summary

BUILD-01 delivers a working Phaser 3 project scaffold with a verified development and production build pipeline. The shell correctly handles the 9:16 portrait viewport in both portrait and landscape browser orientations. All six acceptance criteria pass. No gameplay logic was implemented.

---

## Architecture implemented

### Layout model

Two independent DOM layers:

| Layer | Element | Purpose |
|---|---|---|
| Background | `#bg-layer` (position: fixed, inset: 0) | Full-screen background image; `pointer-events: none` |
| Canvas | `#game-container > canvas` | Phaser 9:16 canvas; only the canvas receives pointer events |

The full-screen background (`#bg-layer`) is sized by CSS and set by `OrientationController`. It is always behind the Phaser canvas and never captures input.

The Phaser canvas is sized by Phaser's Scale Manager (`FIT + CENTER_BOTH`). At design resolution 1080×1920 the canvas scales to fit the browser viewport while preserving the 9:16 ratio. In landscape the canvas remains portrait-oriented and centered; side areas are background only.

### Config injection

The Vite `inject-config` plugin reads `public/config/game.config.json` and `public/config/asset-manifest.json` at build time and injects them as `window.__GAME_CONFIG__` and `window.__ASSET_MANIFEST__` into `index.html`. This makes the production build fully self-contained (no runtime fetch needed) while allowing hot-reload in development.

### Module map

```
src/
├── main.ts                          Entry point: load config/manifest, create game
├── types.ts                         Shared TypeScript interfaces and global window declarations
├── config/
│   └── ConfigLoader.ts              validateConfig(), loadConfigFromGlobal()
├── manifest/
│   └── AssetManifest.ts             validateManifest(), resolveAsset(), loadManifestFromGlobal()
├── orientation/
│   └── OrientationController.ts     classifyOrientation(), calculateViewport(), OrientationController class
├── renderer/
│   └── RuntimeRenderer.ts           createGame() — Phaser bootstrap
└── scenes/
    ├── BootScene.ts                 Transitions to PreloadScene
    ├── PreloadScene.ts              BUILD-01: no Phaser assets to preload; transitions to GameScene
    └── GameScene.ts                 Sets up OrientationController; optional debug overlay
```

---

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Development server with hot-reload (Vite) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | TypeScript type check (no emit) |
| `npm run test` | Vitest unit tests (41 tests) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:smoke` | Build + Playwright browser smoke tests (10 tests) |

---

## Files created

### Project root
- `projects/TilePyramid_PL01/package.json`
- `projects/TilePyramid_PL01/tsconfig.json`
- `projects/TilePyramid_PL01/vite.config.ts`
- `projects/TilePyramid_PL01/vitest.config.ts`
- `projects/TilePyramid_PL01/playwright.config.ts`
- `projects/TilePyramid_PL01/index.html`

### Public (runtime assets — not bundled through rollup)
- `projects/TilePyramid_PL01/public/config/game.config.json`
- `projects/TilePyramid_PL01/public/config/asset-manifest.json`
- `projects/TilePyramid_PL01/public/assets/images/Background_1.png`

### Source
- `projects/TilePyramid_PL01/src/types.ts`
- `projects/TilePyramid_PL01/src/main.ts`
- `projects/TilePyramid_PL01/src/config/ConfigLoader.ts`
- `projects/TilePyramid_PL01/src/manifest/AssetManifest.ts`
- `projects/TilePyramid_PL01/src/orientation/OrientationController.ts`
- `projects/TilePyramid_PL01/src/renderer/RuntimeRenderer.ts`
- `projects/TilePyramid_PL01/src/scenes/BootScene.ts`
- `projects/TilePyramid_PL01/src/scenes/PreloadScene.ts`
- `projects/TilePyramid_PL01/src/scenes/GameScene.ts`

### Tests
- `projects/TilePyramid_PL01/tests/unit/config.test.ts`
- `projects/TilePyramid_PL01/tests/unit/manifest.test.ts`
- `projects/TilePyramid_PL01/tests/unit/orientation.test.ts`
- `projects/TilePyramid_PL01/tests/unit/viewport.test.ts`
- `projects/TilePyramid_PL01/tests/smoke/shell.test.ts`

### Documentation (this build)
- `docs/BUILD_01_REPORT.md` (this file)

---

## Temporary background

| Field | Value |
|---|---|
| Asset ID | `Background_1` |
| Original source | `project-input/extracted-assets/TilePyramid_TrueGameplay/Background/Background_1.png` |
| Runtime path | `public/assets/images/Background_1.png` (copy; original not touched) |
| Dimensions | 1024 × 1024 px (square) |
| Format | PNG (WebP conversion deferred to BUILD-02) |
| Fit mode | `cover` (fills the background layer; square image crops to fill portrait/landscape viewport) |
| Note | Final background selection is not part of BUILD-01. Replace by updating `backgroundId` in `game.config.json` and adding the new entry to `asset-manifest.json`. |

---

## Automated test results

### Unit tests (Vitest)

```
Test Files  4 passed (4)
Tests       41 passed (41)
Duration    376ms

Tests breakdown:
  config.test.ts       11 tests — validateConfig validation
  manifest.test.ts     11 tests — validateManifest and resolveAsset
  orientation.test.ts   7 tests — classifyOrientation
  viewport.test.ts     12 tests — calculateViewport (portrait and landscape)
```

### Browser smoke tests (Playwright / Chromium)

```
10 passed (21.6s)

  1. loads without uncaught JavaScript errors
  2. canvas is visible in portrait (390×844)
  3. canvas is approximately 9:16 in portrait (390×844)
  4. canvas fits within the portrait viewport
  5. canvas remains portrait-oriented in landscape (844×390)
  6. canvas is approximately 9:16 in landscape (844×390)
  7. canvas fits within the landscape viewport
  8. canvas is horizontally centered in landscape (844×390)
  9. background layer covers the full portrait viewport
 10. background layer covers the full landscape viewport
```

---

## Build size measurements

| File | Raw size | Gzip size |
|---|---|---|
| `dist/index.html` | 2.0 KB | 0.96 KB |
| `dist/assets/index-*.js` (app code) | 6.83 KB | 2.61 KB |
| `dist/assets/phaser-*.js` (Phaser 3) | 1,475 KB | 338 KB |
| `dist/assets/images/Background_1.png` | 1,054 KB | — |
| `dist/config/asset-manifest.json` | 0.3 KB | — |
| `dist/config/game.config.json` | 0.3 KB | — |
| **Total (JS gzip)** | — | **~342 KB** |
| **Total (all dist, raw)** | ~2,538 KB | — |

Phaser 3.87.0 is 338 KB gzip. This is the baseline; no network size limit applies at BUILD-01. Actual limits will be verified against current Unity Ads and AppLovin documentation at BUILD-07 and BUILD-08.

**Warning (expected):** Vite reports the Phaser chunk exceeds 500 KB. This is the Phaser library itself and is expected. Code-splitting or selective Phaser imports can reduce it if needed at export time.

---

## Dependency versions installed

| Package | Version |
|---|---|
| phaser | 3.87.0 |
| typescript | 5.8.3 |
| vite | 6.4.3 |
| vitest | 2.1.9 |
| @playwright/test | 1.52.0 |
| @types/node | 22.15.32 |

---

## Manual test instructions

### Setup
1. Open a terminal in `projects/TilePyramid_PL01/`.
2. Run `npm install` (one-time).

### Development preview
3. Run `npm run dev`. The terminal prints a URL (usually `http://localhost:5173`).
4. Open that URL in a browser.

### Portrait test
5. Open Chrome DevTools (F12) → Device toolbar (Ctrl+Shift+M).
6. Set dimensions to 390 × 844 (iPhone 14 portrait or Custom).
7. Reload.
8. Confirm: the Phaser canvas fills the vertical height and is centered. The background fills the screen. No scrollbars.

### Landscape test
9. Swap dimensions to 844 × 390 (landscape).
10. Confirm: the canvas is portrait-oriented and centered horizontally.
11. Confirm: the background fills the entire 844 × 390 area behind the canvas.
12. Confirm: side areas (left and right of the canvas) show the background image and are not part of the canvas.

### Resize test
13. Drag the DevTools splitter or use the resize handle to continuously change orientation.
14. Confirm: the canvas re-centers smoothly and never exceeds the viewport.

### Side-area input test
15. Click in the visible side bars to the left and right of the canvas (landscape mode).
16. Confirm: no `tile tapped` or similar gameplay event appears in the console.

### Debug overlay disable
17. Edit `public/config/game.config.json`, change `"debugOverlay": true` to `"debugOverlay": false`.
18. Reload the dev server page (no rebuild needed — the plugin re-reads the file on each request).
19. Confirm: the green border, crosshair, and text disappear. The background still fills the screen.
20. Restore `"debugOverlay": true`.

### Production build
21. Run `npm run build`. Confirm it exits with code 0 and `dist/` is created.
22. Run `npm run preview`. Open `http://localhost:4173` in a browser.
23. Repeat portrait and landscape tests.

### Automated tests
24. Run `npm run test`. Confirm 41 tests pass.
25. Run `npm run test:smoke` (builds first, then runs Playwright). Confirm 10 tests pass.

---

## Known limitations

1. **Background is a 1024×1024 square PNG.** Cover-fit scaling crops the image; it is not a problem for the shell but the final background must be provided in a portrait-native format (or WebP-converted with a portrait crop). Deferred to BUILD-02 asset-processing phase.
2. **Phaser chunk is 338 KB gzip.** This is the unmodified Phaser bundle. Size must be measured against actual network limits at BUILD-07/08, not assumed.
3. **No WebP conversion yet.** The background PNG (~1 MB) is used directly. WebP conversion will be added in BUILD-02.
4. **Smoke tests require Chromium.** Run `npx playwright install chromium` once if the binary is missing.
5. **No `.gitignore` for the project subdirectory.** `dist/` and `node_modules/` are currently untracked; a `.gitignore` should be added before the first commit of this project.

---

## Acceptance criteria status

| # | Criterion | Status |
|---|---|---|
| AC-01 | Development server starts, page loads without errors | PASS |
| AC-02 | 9:16 gameplay canvas in portrait (390×844) | PASS (verified by smoke test 2, 3, 4) |
| AC-03 | Centered 9:16 canvas in landscape (844×390) | PASS (verified by smoke tests 5–8) |
| AC-04 | Config loading — console logs project ID; config changes reload without code change | PASS |
| AC-05 | Production build runs; `dist/` is self-contained; size measured | PASS |
| AC-06 | Smoke test passes with exit code 0 | PASS (10/10) |

---

## Confirmation: no gameplay implemented

- No tile rendering or tile data.
- No tutorial, hand pointer, or overlay.
- No tray, tray bar, or tray slots.
- No timer.
- No win or lose state.
- No audio playback.
- No particle effects.
- No CTA button.
- No end card.
- No Unity Ads adapter.
- No AppLovin adapter.
- No visual editor.

---

## Confirmation: nothing committed or pushed

`git status --short` shows only `?? projects/` (untracked new directory). No commit has been made on this branch. No push has been made.
