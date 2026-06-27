# BUILD-07 Report: Asset Optimization and Production Size Control

Project: TilePyramid_PL01
Branch: build-07-asset-optimization

## Architecture implemented

- Added `projects/TilePyramid_PL01/scripts/asset-plan.mjs` as the explicit optimization plan.
- Added `projects/TilePyramid_PL01/scripts/optimize-assets.mjs` for rerunnable runtime image generation.
- Added `projects/TilePyramid_PL01/scripts/measure-size.mjs` for production output measurement.
- Added npm scripts:
  - `npm run optimize:assets`
  - `npm run measure:size`
- Updated `public/config/asset-manifest.json` to point used runtime images at optimized WebP files.
- Removed superseded runtime PNG copies from `public/assets/images/` so they are not copied into production `dist`.

## Optimization tool used

The pipeline uses the existing local `@playwright/test` dependency to launch Chromium and encode images through browser canvas `toDataURL('image/webp', quality)`.

No global tools were installed. No raw or extracted source assets were modified.

## Runtime assets optimized

| Asset | Source path | Output path | Original bytes | Optimized bytes | Dimensions |
|---|---|---|---:|---:|---|
| Background_1 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Background/Background_1.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/background_1.webp` | 1,079,161 | 32,552 | 1024x1024 |
| Pointer_Hand | `project-input/extracted-assets/TilePyramid_TrueGameplay/Pointer/1768988491461.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/pointer_hand.webp` | 98,921 | 11,046 | 503x496 |
| App_Icon | `project-input/extracted-assets/TilePyramid_TrueGameplay/App icon/Icon_PyramidQuest.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/app_icon_384.webp` | 1,016,358 | 19,820 | 384x384 |
| App_Logo | `project-input/extracted-assets/TilePyramid_TrueGameplay/Logo/Logo (1).png` | `projects/TilePyramid_PL01/public/assets/images/optimized/logo_520.webp` | 172,624 | 24,676 | 520x267 |
| Tile_01 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/1.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_01.webp` | 27,724 | 5,964 | 132x144 |
| Tile_02 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/2.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_02.webp` | 25,840 | 5,448 | 132x144 |
| Tile_03 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/3.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_03.webp` | 20,893 | 4,632 | 132x144 |
| Tile_04 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/4.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_04.webp` | 22,809 | 4,856 | 132x144 |
| Tile_05 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/5.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_05.webp` | 21,064 | 4,074 | 132x144 |
| Tile_06 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/6.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_06.webp` | 27,571 | 5,392 | 132x144 |
| Tile_07 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/7.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_07.webp` | 24,731 | 5,222 | 132x144 |
| Tile_08 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/8.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_08.webp` | 19,745 | 3,976 | 132x144 |
| Tile_09 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/9.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_09.webp` | 23,560 | 5,182 | 132x144 |
| Tile_10 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/10.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_10.webp` | 22,641 | 4,914 | 132x144 |
| Tile_11 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/11.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_11.webp` | 24,192 | 5,014 | 132x144 |
| Tile_12 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/12.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_12.webp` | 29,345 | 6,074 | 132x144 |
| Tile_13 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/13.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_13.webp` | 27,517 | 5,596 | 132x144 |
| Tile_14 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/14.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_14.webp` | 24,276 | 5,306 | 132x144 |
| Tile_15 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/15.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_15.webp` | 22,365 | 4,782 | 132x144 |
| Tile_16 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/16.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_16.webp` | 25,065 | 5,346 | 132x144 |
| Tile_17 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/17.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_17.webp` | 22,016 | 4,112 | 132x144 |
| Tile_18 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/18.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_18.webp` | 18,910 | 4,312 | 132x144 |
| Tile_19 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/19.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_19.webp` | 23,368 | 4,458 | 132x144 |
| Tile_20 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/20.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_20.webp` | 21,997 | 4,994 | 132x144 |
| Tile_21 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/21.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_21.webp` | 20,334 | 4,152 | 132x144 |
| Tile_22 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/22.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_22.webp` | 23,233 | 4,914 | 132x144 |
| Tile_23 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/23.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_23.webp` | 24,061 | 5,318 | 132x144 |
| Tile_24 | `project-input/extracted-assets/TilePyramid_TrueGameplay/Tile Set/24.png` | `projects/TilePyramid_PL01/public/assets/images/optimized/tiles/tile_24.webp` | 25,383 | 5,066 | 132x144 |

## Total before/after comparison

- BUILD-06 production output: 4,480,212 bytes.
- BUILD-07 production output: 1,752,642 bytes.
- Total saved: 2,727,570 bytes.
- BUILD-06 runtime images: 2,935,704 bytes.
- BUILD-07 runtime images: 207,198 bytes.
- Runtime image bytes saved: 2,728,506 bytes.

## Build-size measurements

- JavaScript raw: 1,522,320 bytes.
- JavaScript gzip estimate: 350,962 bytes.
- CSS: 0 bytes.
- Runtime images: 207,198 bytes.
- Total production output: 1,752,642 bytes.
- Largest file remains `dist/assets/phaser-YAzv7auA.js` at 1,475,508 bytes.

## Test results

- `npm run optimize:assets`: passed; generated 28 optimized WebP runtime images.
- `npm run typecheck`: passed.
- `npm run test`: passed, 10 files, 144 tests.
- `npm run build`: passed.
- `npm run test:smoke`: passed, Chromium ran 12 tests.
- `npm run measure:size`: passed.

Warnings:
- Vite reports the existing large Phaser chunk warning.
- Vitest reports the existing Vite CJS Node API deprecation warning.

## Manual visual test instructions

From `projects/TilePyramid_PL01/`:

```bash
npm run optimize:assets
npm run dev
```

Open the printed local URL and inspect:

- Background fills the full browser viewport in portrait and landscape.
- Tile faces remain readable and transparent edges look clean.
- Tutorial hand pointer remains visible and correctly shaped.
- App icon and logo remain readable on the end card.
- CTA remains visible and clickable.
- Portrait gameplay remains centered in landscape.
- Landscape side background areas do not trigger gameplay or store-open.

## Known limitations

- WebP quality was chosen for large size wins and acceptable smoke-test behavior; final creative review may tune quality upward for specific assets.
- App icon is resized to 384x384 for end-card display rather than preserving store-icon source dimensions.
- End-card icon/logo visual checks are documented manually; end-card natural win remains hard to reach through full gameplay.
- Phaser remains the largest production file and was not optimized in BUILD-07.
- Formal solvability is still NOT YET PROVEN.

## Explicit non-scope confirmations

- Audio was not implemented.
- Final effects and particles were not implemented.
- Unity Ads exporter was not implemented.
- AppLovin exporter was not implemented.
- MRAID integration was not implemented.
- Network packaging was not implemented.
- Visual editor was not implemented.
