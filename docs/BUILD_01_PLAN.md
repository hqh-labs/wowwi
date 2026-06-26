# BUILD_01_PLAN.md

Project: TilePyramid_PL01
Phase: BUILD-01
Depends on: BUILD-00 complete

---

## Scope

BUILD-01 produces a **working, deployable playable shell** — no game logic, no tile board, no audio, no tutorial. The goal is a verified development and build pipeline that correctly handles the viewport and orientation requirements.

---

## Deliverables

| Deliverable | Description |
|---|---|
| Phaser 3 project scaffold | `projects/TilePyramid_PL01/` with TypeScript, Vite, Phaser 3 |
| Config loader | Reads `config/game.config.json` at runtime |
| Asset manifest loader | Maps logical names to asset paths |
| Full-screen background | One background image filling the screen; asset selected via config — final background selection is not required for BUILD-01 |
| 9:16 gameplay viewport | Centered portrait canvas, never distorted |
| Landscape handler | Gameplay canvas stays 9:16, background fills landscape |
| Background side-area guard | Taps on letterbox bars do not reach gameplay |
| Development preview | `npm run dev` → hot-reload browser preview |
| Production build | `npm run build` → self-contained HTML + asset bundle |
| Smoke test | Automated check: page loads, canvas visible, no console errors |

---

## Out of scope for BUILD-01

The following must NOT appear in BUILD-01 code:

- Tile rendering or tile data
- Tutorial, hand pointer, overlay
- Tray, tray bar, tray slots
- Timer
- Win or lose state
- Audio playback
- Particle effects
- CTA button
- End card
- Unity Ads adapter
- AppLovin adapter
- Visual editor

---

## File layout after BUILD-01

```
projects/TilePyramid_PL01/
├── config/
│   └── game.config.json
├── assets/
│   └── images/
│       └── Background_1.webp     ← one background for BUILD-01 (temporary; selection via config)
├── src/
│   ├── main.ts
│   ├── config/
│   │   └── ConfigLoader.ts
│   ├── manifest/
│   │   └── AssetManifest.ts
│   ├── orientation/
│   │   └── OrientationController.ts
│   ├── renderer/
│   │   └── RuntimeRenderer.ts
│   └── scenes/
│       ├── BootScene.ts
│       ├── PreloadScene.ts
│       └── GameScene.ts          ← shows background + empty 9:16 frame
├── tests/
│   └── smoke/
│       └── shell.test.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Technical decisions locked for BUILD-01

| Decision | Choice | Reason |
|---|---|---|
| Runtime | Phaser 3.87.0 | See docs/RUNTIME_OPTIONS.md |
| Bundler | Vite 6.x | Fast HMR, native TypeScript, small config |
| Language | TypeScript 5.x | Type safety on configs and level data |
| Test runner | Vitest + Playwright | Vitest for unit, Playwright for smoke |
| Package manager | npm (already present, v11.13.0) | No additional tooling needed |
| Background format | WebP (converted from PNG) | ~70% smaller than source PNG; final background selection deferred — asset is replaceable via config |

---

## Acceptance criteria

All criteria must pass before BUILD-01 is considered complete.

### AC-01: Development server starts

```
GIVEN: npm install completes without error
WHEN:  npm run dev is executed
THEN:  browser opens (or URL is printed)
AND:   page loads without console errors
AND:   page loads in under 3 seconds on localhost
```

### AC-02: 9:16 gameplay canvas in portrait

```
GIVEN: browser viewport is set to 390×844 (iPhone 14 portrait)
WHEN:  page loads
THEN:  a visible canvas is centered on screen
AND:   canvas aspect ratio is exactly 9:16 (width:height)
AND:   canvas fills the available height without overflow
AND:   background image fills the canvas
AND:   no scrollbars appear
```

### AC-03: Centered 9:16 canvas in landscape

```
GIVEN: browser viewport is set to 844×390 (iPhone 14 landscape)
WHEN:  page loads or orientation changes
THEN:  canvas remains 9:16 and is centered horizontally and vertically
AND:   background fills the full 844×390 area (including letterbox bars)
AND:   letterbox side bars are visually distinct (background image behind them)
AND:   tapping on the letterbox side bars logs nothing to the gameplay event bus
```

### AC-04: Config loading

```
GIVEN: game.config.json is present and valid
WHEN:  page loads
THEN:  console (development only) logs "Config loaded: TilePyramid_PL01"
AND:   changing timerSeconds in game.config.json and reloading reflects the new value
       without a code change
```

### AC-05: Production build

```
GIVEN: npm run build completes without error
THEN:  dist/ contains index.html and asset files
AND:   index.html is self-contained (inlines or correctly references all assets)
AND:   total dist/ gzip-compressed size is measured and recorded in this document
AND:   opening dist/index.html in a browser without a dev server works correctly
```

Note: No specific size limit applies to BUILD-01 because there is no exporter in this phase. The measured value becomes the baseline for future comparison at BUILD-07 and BUILD-08.

### AC-06: Smoke test passes

```
GIVEN: npm run test:smoke is executed
THEN:  all tests pass with exit code 0
AND:   smoke test verifies: page title, canvas presence, no console errors
```

---

## Manual test instructions

1. Run `npm install` in `projects/TilePyramid_PL01/`.
2. Run `npm run dev`. Confirm a URL appears and the page opens.
3. In Chrome DevTools → Dimensions, set to iPhone 14 (390×844). Reload. Confirm the canvas fills the screen vertically, the background is visible, and no overflow or scrollbar appears.
4. Rotate to landscape (844×390) in DevTools. Confirm the canvas is centered, black/background bars appear on the sides, and the background image fills the full screen behind the canvas.
5. Click on the left side bar. Confirm no "tile tapped" or similar event appears in the console.
6. Run `npm run build`. Open `dist/index.html` from the filesystem (`file://` URL). Confirm the page loads and the canvas is visible.
7. Measure `dist/` gzip-compressed size and record the value in the "Definition of done" section below. This is the baseline; no pass/fail threshold applies at BUILD-01.
8. Run `npm run test:smoke`. Confirm all tests pass.

---

## Risks for BUILD-01

| Risk | Likelihood | Mitigation |
|---|---|---|
| Phaser Scale Manager edge case on iOS 17 | Low | Test on real device or BrowserStack before BUILD-02 |
| Production bundle exceeds network limit at export time | Unknown until measured | Measure baseline at BUILD-01 completion; confirm actual network limits from current documentation at BUILD-07/08 |
| Vite + Phaser 3 tree-shake issues | Low | Use `phaser/src/...` selective imports if bundle is unexpectedly large |
| Background WebP conversion produces artifacts | Low | Verify visually; keep PNG fallback in manifest |

---

## Definition of done for BUILD-01

- All six acceptance criteria pass.
- Manual test checklist is signed off.
- `docs/BUILD_01_PLAN.md` is updated with "Status: COMPLETE" and actual measured values for gzip-compressed bundle size and page load time.
- Measured bundle size is recorded here as the baseline: `____ KB gzip` (fill in at completion).
- No game logic is present in the codebase.
- No commits have been pushed unless explicitly requested.
