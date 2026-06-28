# Release Notes: TilePyramid_PL01

Build: BUILD-13
Date: 2026-06-28
Branch: `build-13-delivery-candidate-lock`

## Project Summary

TilePyramid_PL01 is a match-3 tile puzzle playable ad built with Phaser 3.87.0,
exported as a self-contained single-file HTML for Unity Ads and AppLovin.

**Gameplay:** Match-3 tile selection with a 5-slot tray. Clear all tiles to win.
Timer runs 30 seconds from the first valid tap. Tray full or timer expired = lose.
Tutorial guides the first three taps. CTA visible during gameplay. Fail end card
is the full-screen clickable area.

**Viewport:** Portrait 9:16 canonical. In landscape, the portrait gameplay is
centered; the background adapts. Gameplay UI does not rearrange in landscape.
Side background areas receive no gameplay events.

**Level:** Level_21 (initial level). Tray capacity: 5.

## Store URLs

- Android / Google Play: `https://play.google.com/store/apps/details?id=com.skl.pyramid.quest.match3.tile.puzzle.games`
- iOS / App Store: `https://apps.apple.com/us/app/tile-pyramid-match-quest/id6755671033`
- Fallback: Android / Google Play URL

## Delivery Files

| File | Network | Target |
|------|---------|--------|
| `unity/TilePyramid_PL01_unity.html` | Unity Ads | Single-file HTML upload |
| `applovin/TilePyramid_PL01_applovin.html` | AppLovin | Single-file HTML upload |

Both files are under 5 MB with all assets (images, audio, JavaScript, CSS)
inlined as base64 or data URIs.

## Build History

| Phase | Date | Description |
|-------|------|-------------|
| BUILD-00 | — | Documentation, project requirements, asset audit |
| BUILD-01 | — | Shell, runtime infrastructure (Phaser + Vite) |
| BUILD-02 | — | Level data parser, tile board layout |
| BUILD-03 | — | Tile selection controller, match and tray logic |
| BUILD-04 | — | Timer, tutorial, idle hint system |
| BUILD-05 | — | Audio system, visual effects (particles) |
| BUILD-06 | — | CTA system, fail end card, store-open service |
| BUILD-07 | — | Orientation controller, landscape centering |
| BUILD-08 | — | Asset optimization pipeline |
| BUILD-09 | — | Export pipeline foundation, ad-network adapters |
| BUILD-10 | — | Export validation, Chromium smoke tests, candidate packaging |
| BUILD-11 | — | Upload candidate package, store URL wiring (Android + iOS) |
| BUILD-12 | 2026-06-28 | `window.top` upload fix; Unity rejection resolved |
| BUILD-13 | 2026-06-28 | Delivery candidate lock, final handoff package |

## BUILD-13 Changes

- Added `package:delivery` and `validate:delivery` npm scripts.
- Added `delivery-utils.mjs` with `validateDeliveryPackage` and delivery-specific
  constants.
- Added `package-delivery.mjs` — delivery package generation script.
- Added `validate-delivery.mjs` — standalone delivery validator.
- Added `deliveryPackage.test.ts` — 11 unit tests for delivery package validation.
- Added `docs/DELIVERY_CANDIDATE.md` — delivery workflow documentation.
- Added `docs/NETWORK_QA_EVIDENCE.md` — network upload testing evidence.
- Added `docs/RELEASE_NOTES_TILEPYRAMID_PL01.md` — this file.
- Updated `candidate-utils.mjs` `FINAL_APPROVAL_DISCLAIMER` to reference BUILD-13.
- Updated `package-candidate.mjs` build field to `BUILD-13`.
- Updated `.gitignore` to ignore `delivery/` output folder.
- Updated `CLAUDE.md` current build phase to BUILD-13.
- Updated `docs/UPLOAD_READINESS_CHECKLIST.md` with BUILD-13 sign-off items.

## BUILD-12 Changes (Previous)

- Fixed `window.top` rejection from Unity Ads upload validation.
- Added Phaser `input.windowEvents: false` to eliminate top-window input events.
- Added build-time sanitization of top-window access spellings in emitted chunks.
- Hardened export and candidate validation to reject all forbidden top-window
  patterns (`window.top`, `globalThis.top`, `self.top`, `top.location`,
  `parent.top`, `window.parent.top`).

## Technical Specification

| Item | Value |
|------|-------|
| Runtime | Phaser 3.87.0 |
| Build tool | Vite 6.x |
| Language | TypeScript 5.x |
| Export format | Single-file HTML (all assets inlined) |
| Max file size | 5 MB per network |
| Store-open (Unity) | MRAID-first → `window.open` → `window.location.href` |
| Store-open (AppLovin) | `window.open` → `window.location.href` |
| MRAID bootstrap | Not bundled; network-provided |
| Orientation | Portrait 9:16; landscape centering |
| Safe zone | Top-right 160×160 px (host close button) |
| Timer trigger | First valid tile tap only |
| Forbidden patterns | `window.top`, `parent.top`, external HTTP refs, local path refs |

## Known Limitations

- Final Unity Ads and AppLovin approval is not guaranteed by local validation.
- Unity export expects network-provided `window.mraid`.
- Network webviews may differ from Chromium `file://` QA behavior.
- Formal solvability of Level_21 remains **NOT YET PROVEN**.

Local BUILD-13 delivery packaging and validation do not guarantee final Unity Ads
or AppLovin approval.
