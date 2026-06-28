# BUILD-10 Report: Network Compliance Hardening and Final Export QA

Project: TilePyramid_PL01
Branch: build-10-compliance-qa

## Architecture implemented

- Extended versioned Unity/AppLovin export profiles with compliance metadata:
  MRAID dependency, no-external-resource policy, host close-button safe zone,
  DOM pointer policy, and final approval disclaimer.
- Hardened the injected export store-open bridge with MRAID detection,
  defensive `getState()` handling, optional `ready` listener handling,
  fallback timeout, QA-mode record-only behavior, and runtime diagnostics.
- Extended static export validation for both network outputs, source maps,
  un-inlined JS/CSS references, unresolved placeholders, safe-area metadata,
  store-open diagnostics, and final approval disclaimers.
- Extended visual export validation to run Chromium file:// boot checks,
  portrait/landscape canvas checks, pointer-surface checks, and QA-mode CTA
  store-open checks.
- Added `npm run test:exports` for focused exported HTML smoke coverage.

## Compliance hardening done

- Unity and AppLovin outputs remain single HTML files below the 5 MB profile
  target.
- Runtime JS, optimized WebP images, MP3 audio, level JSON, config, and manifest
  are embedded.
- External HTTP/HTTPS asset references and local `assets/`, `config/`, or
  `dist/` references are rejected.
- Source map references, un-inlined JS/CSS file references, and unresolved export
  placeholders are rejected.
- The creative records that it does not intentionally block host close controls.
- The top-right host close-button safe-zone assumption is documented and
  included in profile metadata.
- Background and game-container DOM layers remain non-interactive outside the
  centered gameplay canvas.

## Unity QA result

- Export path: `exports/latest/unity/TilePyramid_PL01_unity.html`
- Size: 1,991,632 bytes / 5,242,880 byte target.
- Static validation: PASS.
- Visual Chromium file:// validation: PASS.
- Exported HTML smoke tests: PASS.
- Warning: Unity MRAID is required by profile but not bundled; the network
  container must provide `window.mraid`.

## AppLovin QA result

- Export path: `exports/latest/applovin/TilePyramid_PL01_applovin.html`
- Size: 1,991,651 bytes / 5,242,880 byte target.
- Static validation: PASS.
- Visual Chromium file:// validation: PASS.
- Exported HTML smoke tests: PASS.

## MRAID/store-open bridge behavior

- `window.__PLAYABLE_STORE_OPEN__` accepts the existing gameplay payload.
- `window.__PLAYABLE_STORE_OPEN_DIAGNOSTICS__` records network, source,
  attempted URL, method used, error count, and last safe error message.
- Method values are `mraid.open`, `window.open`, `location.href`,
  `record-only`, or `failed`.
- Automated export QA sets `window.__PLAYABLE_QA_MODE__ = true`, so CTA and
  end-card clicks are recorded without navigating away.
- Normal local development record-only behavior is unchanged.

## Exported HTML test result

`npm run test:exports` passed 14 Chromium tests against the generated Unity and
AppLovin HTML files. Coverage includes file existence, size, metadata, no
external/local references, no page errors, nonblank rendering, diagnostics, CTA
safety, blocked/valid tile timer rules, match-three preview behavior, fail
end-card store-open, portrait rendering, landscape centering, side-area
inertness, and audio preload boot safety.

## Static validation behavior

`npm run validate:exports` verifies both network outputs, target size,
single-HTML structure, no external/local references, no source maps, no
un-inlined JS/CSS, no unresolved placeholders, required metadata, bridge
presence, MRAID requirement state, timer-first-interaction policy, orientation
policy, host safe-zone metadata, visual smoke result, final approval disclaimer,
and `Formal solvability: NOT YET PROVEN`.

## Visual QA behavior

The validator loads each export through Chromium from `file://`, waits for the
Phaser canvas and BUILD-09 diagnostics, captures a screenshot, checks nonblank
rendering, verifies portrait boot, switches to landscape to verify centered
portrait gameplay, confirms side/background DOM pointer policy, and clicks the
gameplay CTA in QA mode.

## Test results

- `npm run typecheck`: PASS.
- `npm run test`: PASS, 184 unit tests.
- `npm run build`: PASS.
- `npm run export:all`: PASS in focused export run; one earlier run hit the
  shell timeout after printing PASS summaries.
- `npm run validate:exports`: PASS.
- `npm run test:exports`: PASS, 14 Chromium exported HTML tests.
- `npm run test:smoke`: PASS, 26 Chromium smoke tests.
- `npm run measure:size`: PASS.

## Production size

- Total production output: 1,890,711 bytes.
- JavaScript raw: 1,530,913 bytes.
- JavaScript gzip estimate: 352,640 bytes.
- CSS: 0 bytes.
- Runtime images: 207,198 bytes.
- Runtime audio: 124,108 bytes.

## Known limitations

- Final Unity Ads and AppLovin upload acceptance is not guaranteed.
- Unity export expects network-provided `window.mraid`.
- Chromium file:// QA may differ from final network mobile webviews.
- No upload automation or real network API integration was added.
- No formal level solver was added.
- Formal solvability remains `NOT YET PROVEN`.

## Manual test instructions

From `projects/TilePyramid_PL01`:

```bash
npm run export:all
npm run validate:exports
```

Open:

- `exports/latest/unity/TilePyramid_PL01_unity.html`
- `exports/latest/applovin/TilePyramid_PL01_applovin.html`

Manual checks:

- Game boots with no blank screen.
- Background, board, and CTA are visible.
- Tap a valid tile and confirm the timer starts.
- Confirm blocked taps do not start the timer.
- Confirm tutorial dismisses only after a valid tile tap.
- Click CTA and confirm it does not crash.
- Wait for timer fail and confirm the end card appears.
- Click the end card and confirm store-open behavior is recorded or handled by
  the host environment.
- Rotate to landscape and confirm the portrait playable is centered.
- Click side background areas and confirm they do not trigger gameplay or
  store-open.

## Final upload-readiness status

The exports are upload-ready candidates for manual Unity Ads and AppLovin
testing. Final network approval is not guaranteed, and formal solvability is
still not proven.
