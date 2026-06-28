# BUILD-09 Report: Export Foundation, Single-File Build, Unity Adapter, and AppLovin Adapter

Project: TilePyramid_PL01  
Branch: build-09-export-foundation

## Architecture implemented

- Added versioned export profiles under `scripts/export/profiles/`.
- Added a single-file HTML inliner under `scripts/export/inliner/`.
- Added Unity and AppLovin export metadata adapters under `scripts/export/adapters/`.
- Added export validation under `scripts/export/validators/`.
- Added export commands:
  - `npm run export`
  - `npm run export:unity`
  - `npm run export:applovin`
  - `npm run export:all`
  - `npm run validate:exports`
- Added Vite export mode (`vite --mode export`) that bundles runtime JS into a single generated module before HTML inlining.
- Added an exported store-open bridge injected into generated HTML.
- Updated `StoreOpenService` to delegate to `window.__PLAYABLE_STORE_OPEN__` only when export-safe navigation mode is active.
- Ignored generated `projects/TilePyramid_PL01/exports/` outputs in git.

## Export profile design

Profiles are versioned assumptions, not hardcoded scattered constants.

| Profile | Network | Output type | Target max bytes | MRAID state |
|---|---|---|---:|---|
| `unity-2026-06` | Unity Ads | Single HTML | 5,242,880 | Required, expected from network environment |
| `applovin-2026-06` | AppLovin | Single HTML | 5,242,880 | Optional bridge fallback, no bootstrap reference |

Profiles record orientation policy, timer-first-interaction policy, store-open bridge behavior, and the explicit fact that final approval is not guaranteed.

## Unity adapter behavior

- Produces `exports/latest/unity/TilePyramid_PL01_unity.html`.
- Inlines JS, optimized WebP images, MP3 audio, and Level_21 JSON.
- Injects `window.__PLAYABLE_NETWORK__` with `profileId: "unity-2026-06"`.
- Injects `window.__PLAYABLE_STORE_OPEN__`.
- The bridge checks `window.mraid.open` first and falls back to browser navigation behavior.
- Validation warns that MRAID is required by profile but not bundled.

## AppLovin adapter behavior

- Produces `exports/latest/applovin/TilePyramid_PL01_applovin.html`.
- Inlines JS, optimized WebP images, MP3 audio, and Level_21 JSON.
- Injects `window.__PLAYABLE_NETWORK__` with `profileId: "applovin-2026-06"`.
- Injects `window.__PLAYABLE_STORE_OPEN__`.
- External HTTP/HTTPS asset references and local runtime references are rejected.
- `mraid.js` bootstrap references are not allowed by the AppLovin profile.

## Single-file inliner behavior

- Reads the canonical Vite `dist/index.html`.
- Inlines generated Vite script files into `<script>` tags.
- Rewrites every manifest asset path to a data URL.
- Preserves optimized WebP image assets.
- Preserves BUILD-08 MP3 audio assets.
- Replaces injected config with export-safe config:
  - `app.storeOpenMode: "navigate"`
  - `app.safeDevelopmentNavigation: false`
- Injects profile metadata and store-open bridge.
- Removes modulepreload links and local runtime file references from exported HTML.
- Converts inlined manifest `data:` URLs to runtime `blob:` URLs before Phaser starts, so Phaser's JSON, image, and audio loaders work when the exported HTML is opened directly from `file://`.

## Blank-screen root cause and fix

Manual Chrome testing found that both single-file exports could open to a blank
dark page even though static validation passed. Chromium showed that the bundled
JavaScript executed and Phaser created a canvas, but `GameScene` never started
because Phaser's audio preload failed on MP3 `data:` URLs under direct
`file://` loading:

- `Failed to execute 'decodeAudioData' on 'BaseAudioContext': parameter 1 is not of type 'ArrayBuffer'.`

The fix keeps the HTML self-contained but adds an export bootstrap that converts
manifest `data:` URLs into same-document `blob:` URLs before the Vite module
runs. After this change, direct `file://` Chrome/Chromium loading boots the
playable visually for Unity and AppLovin exports.

## Store-open bridge behavior

- Core gameplay still calls `StoreOpenService`.
- Normal local development still uses `record-only` unless config changes.
- Exported HTML injects `window.__PLAYABLE_STORE_OPEN__`.
- When active, `StoreOpenService` delegates to that bridge after recording diagnostics.
- The bridge safely checks `window.mraid.open`; if unavailable, it falls back to `window.open`, then `window.location.href`.

## Validation behavior

The export validator checks:

- Output is a `.html` file.
- Output size is under profile target max bytes.
- No external HTTP/HTTPS asset references are present.
- No local `assets/`, `config/`, or `dist/` runtime references remain.
- Network profile metadata is present.
- Store-open bridge is present.
- MRAID requirement/bootstrap state is recorded.
- Orientation policy metadata is present.
- Timer-first-interaction policy metadata is present.
- Formal solvability remains `NOT YET PROVEN`.

## Export output paths

Generated outputs are ignored by git:

- `projects/TilePyramid_PL01/exports/latest/export-manifest.json`
- `projects/TilePyramid_PL01/exports/latest/export-report.json`
- `projects/TilePyramid_PL01/exports/latest/export-validation-report.json`
- `projects/TilePyramid_PL01/exports/latest/unity/TilePyramid_PL01_unity.html`
- `projects/TilePyramid_PL01/exports/latest/applovin/TilePyramid_PL01_applovin.html`

ZIP packaging was not implemented in BUILD-09.

## Size measurements

Export sizes from `npm run export:all`:

- Unity: 1,988,412 bytes.
- AppLovin: 1,988,424 bytes.
- Profile target max bytes: 5,242,880 bytes each.

Production build size from `npm run measure:size`:

- Total production output: 1,890,711 bytes.
- JavaScript raw: 1,530,913 bytes.
- JavaScript gzip estimate: 352,640 bytes.
- CSS: 0 bytes.
- Runtime images: 207,198 bytes.
- Runtime audio: 124,108 bytes.

## Test results

Commands run from `projects/TilePyramid_PL01/`:

- `npm run typecheck`: passed.
- `npm run test`: passed, 12 files, 179 tests.
- `npm run build`: passed.
- `npm run export:all`: passed; Unity and AppLovin exports validated.
- `npm run validate:exports`: passed.
- `npm run test:smoke`: passed, Chromium ran 19 tests including exported HTML file tests.
- `npm run measure:size`: passed.

Warnings:

- Vite reports the existing large chunk warning.
- Vitest reports the existing Vite CJS Node API deprecation warning.
- Unity export warns that MRAID is required by profile but not bundled.
- BUILD-09 validation explicitly warns that final ad-network approval is not guaranteed.

## Known limitations

- Final Unity Ads and AppLovin upload acceptance is not guaranteed.
- Network profiles are versioned local assumptions and must be re-verified before client delivery.
- The Unity profile does not bundle `mraid.js`; it expects the network environment to provide `window.mraid`.
- The AppLovin profile does not include a `mraid.js` bootstrap reference.
- ZIP packaging was skipped because single-file HTML outputs are the required foundation.
- Exported HTML smoke tests use Chromium and local `file://` loading; final network webviews may still differ.
- Formal solvability remains `NOT YET PROVEN`.

## Manual preview instructions

From `projects/TilePyramid_PL01/`:

```bash
npm run export:all
npm run validate:exports
```

Then open either generated file directly in Chrome:

- `exports/latest/unity/TilePyramid_PL01_unity.html`
- `exports/latest/applovin/TilePyramid_PL01_applovin.html`

Direct `file://` opening is supported for BUILD-09 after the Blob URL bootstrap
fix. The validation command also writes visual smoke screenshots under each
network export folder.

## Preservation confirmations

- BUILD-08 audio/effects are preserved and inlined into exported HTML.
- Optimized WebP assets are preserved.
- Level_21 gameplay, timer, tutorial, idle hint, CTA, end card, and store-open diagnostics are preserved.
- Raw and extracted client assets were not modified.
- No commit or push was made.
