# BUILD-12 Upload Fix Report

Date: 2026-06-28
Branch: `build-12-window-top-upload-fix`
Project: `projects/TilePyramid_PL01`

## Upload Error

Unity candidate upload rejected `TilePyramid_PL01_unity.html` with:

`Creative pack validation failed: Your responsive playable is not allowed to use window.top`

## Root Cause

The exported playable bundled Phaser input-manager code that referenced `window.top` while registering mouse and touch listeners for top-window input events. The store-open bridge did not use `window.top`; the forbidden string came from the bundled dependency code included in the generated single-file HTML.

## Source Fix

- Phaser runtime configuration now disables window-level input events with `input.windowEvents: false`.
- The Vite build pipeline now sanitizes known top-window access spellings in emitted chunks before export inlining, replacing them with same-window equivalents.
- The store-open bridge remains MRAID-first and keeps QA mode record-only behavior. Browser fallback still uses only current-window APIs: `window.open(url, "_blank", "noopener")`, then `window.location.href`.

## Validator Hardening

Export validation and upload candidate validation now fail on these forbidden patterns:

- `window.top`
- `globalThis.top`
- `self.top`
- `top.location`
- `parent.top`
- `window.parent.top`

The validation error format is:

`Forbidden top-window access detected: window.top`

## Candidate Outputs

Unity candidate:

- Path: `upload-candidates/latest/unity/TilePyramid_PL01_unity.html`
- Size: `1,993,760` bytes
- SHA256: `155e384d959a83933264d6e388b537318ce4458c14e53a66fc8c0a2b5be0423f`
- `window.top`: not present

AppLovin candidate:

- Path: `upload-candidates/latest/applovin/TilePyramid_PL01_applovin.html`
- Size: `1,993,779` bytes
- SHA256: `a29bd366233cee2deaf03fb413dae62f431e5a677c18640db0eec50de1dfaa74`
- `window.top`: not present

## Validation Summary

- `npm run typecheck`: PASS
- `npm run test`: PASS, 209 unit tests
- `npm run build`: PASS
- `npm run export:all`: PASS
- `npm run validate:exports`: PASS
- `npm run test:exports`: PASS, 14 Chromium export tests
- `npm run test:smoke`: PASS, 26 Chromium smoke tests
- `npm run measure:size`: PASS
- `npm run package:candidate`: PASS
- `npm run validate:candidate`: PASS
- PowerShell scan for `window.top` in `exports/latest` and `upload-candidates/latest`: no matches
- PowerShell scan for broader top-window patterns: no matches

## Store URLs

- Android: `https://play.google.com/store/apps/details?id=com.skl.pyramid.quest.match3.tile.puzzle.games`
- iOS: `https://apps.apple.com/us/app/tile-pyramid-match-quest/id6755671033`
- Fallback: Android / Google Play URL

Export metadata and candidate manifests still include Android, iOS, and fallback store URLs.

## Known Limitations

- Final Unity Ads and AppLovin approval is still not guaranteed by local validation.
- Unity export still expects network-provided `window.mraid` in the real ad environment.
- Network webviews may differ from Chromium file and preview testing.
- Formal solvability remains `NOT YET PROVEN`.

## Manual Upload Retry

Upload the regenerated Unity candidate file:

`projects/TilePyramid_PL01/upload-candidates/latest/unity/TilePyramid_PL01_unity.html`

Then, if needed, upload the regenerated AppLovin candidate file:

`projects/TilePyramid_PL01/upload-candidates/latest/applovin/TilePyramid_PL01_applovin.html`
