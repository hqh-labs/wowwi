# Upload Readiness Checklist

Project: TilePyramid_PL01

## Passed locally

- Unity and AppLovin single-file HTML exports generate successfully.
- Upload candidate package generation passes.
- Candidate SHA256 checksums validate.
- Real Google Play and App Store URLs are wired into config, exports, and package
  metadata.
- Both exports are under the 5 MB profile target.
- All runtime resources are embedded.
- No external HTTP/HTTPS asset references are present.
- No local `assets/`, `config/`, or `dist/` references remain.
- No source map, un-inlined JS/CSS, or unresolved export placeholder references
  remain.
- Chromium file:// visual boot validation passes.
- Portrait and landscape export QA passes.
- Gameplay CTA and fail end-card clicks record store-open safely in QA mode.
- Timer starts only after a valid selectable tile tap.
- Blocked taps do not start the timer.
- Tutorial dismisses only after a valid tile tap.
- Match-three preview interaction still clears.
- Landscape side background areas do not trigger gameplay or store-open.
- Formal solvability is explicitly recorded as `NOT YET PROVEN`.

## Still requires manual network upload testing

- Upload Unity HTML to the Unity Ads playable review flow.
- Upload AppLovin HTML to the AppLovin playable review flow.
- Confirm final parser acceptance, preview rendering, and click-through behavior
  inside each network's current review tooling.
- Confirm the host close button remains accessible in each network preview.
- Confirm store-open behavior opens the expected destination in each host
  environment.

## Unity-specific checklist

- Use `upload-candidates/latest/unity/TilePyramid_PL01_unity.html`.
- Confirm Unity provides `window.mraid`.
- Confirm `mraid.open(url)` is available or Unity fallback behavior is accepted.
- Confirm no separate `mraid.js` bootstrap file is required for this upload path.
- Confirm the top-right host close-button overlay is not blocked.
- Confirm final Unity Ads approval result manually.

## AppLovin-specific checklist

- Use `upload-candidates/latest/applovin/TilePyramid_PL01_applovin.html`.
- Confirm AppLovin accepts a single self-contained HTML file below 5 MB.
- Confirm no external bootstrap script is required.
- Confirm store-open fallback behavior is accepted in AppLovin preview.
- Confirm the top-right host close-button overlay is not blocked.
- Confirm final AppLovin approval result manually.

## Manual device/browser checklist

- Open each exported HTML file directly in desktop Chrome.
- Test a mobile-sized portrait viewport.
- Test a mobile-sized landscape viewport.
- Confirm board, background, timer, tutorial, CTA, audio preload, and end card
  render without blank screen.
- Tap side areas in landscape and confirm nothing happens.
- Tap CTA and end card in the network preview and confirm no crash.
- Test on a real Android device if available.
- Test on a real iOS device if available.

## Known risks

- Final Unity Ads and AppLovin approval is not guaranteed by local validation.
- Unity depends on network-provided `window.mraid`.
- Browser popup policy may differ from network webview store-open behavior.
- Chromium file:// behavior may differ from final in-network mobile webviews.
- Formal solvability remains `NOT YET PROVEN`.

## BUILD-13 delivery workflow (added)

- `npm run package:delivery` generates and validates the final delivery package.
- `npm run validate:delivery` re-validates the delivery package standalone.
- `delivery/latest/DELIVERY_README.md` — recipient instructions and checksums.
- `delivery/latest/QA_EVIDENCE.md` — network QA evidence embedded in package.
- `delivery/latest/RELEASE_NOTES.md` — release notes embedded in package.
- `delivery/latest/delivery-manifest.json` — machine-readable delivery manifest.
- `delivery/latest/checksums.sha256` — SHA256 of both HTML delivery files.
- `docs/DELIVERY_CANDIDATE.md` — delivery workflow documentation.
- `docs/NETWORK_QA_EVIDENCE.md` — network upload testing evidence.
- `docs/RELEASE_NOTES_TILEPYRAMID_PL01.md` — project release notes.

## Network QA sign-off (BUILD-12 / BUILD-13)

- Unity Ads: Passed current upload/testing after BUILD-12 window.top fix.
- AppLovin: Passed current AppLovin upload/testing after BUILD-12 window.top fix.
- window.top not present in either export: confirmed by validator and PowerShell scan.
- Formal solvability remains NOT YET PROVEN.
- Final approval not guaranteed by local validation.

## Final sign-off items

- Latest `npm run export:all` passes.
- Latest `npm run validate:exports` passes.
- Latest `npm run test:exports` passes.
- Latest `npm run test:smoke` passes.
- Latest `npm run package:candidate` passes.
- Latest `npm run validate:candidate` passes.
- Latest `npm run package:delivery` passes.
- Latest `npm run validate:delivery` passes.
- Export sizes are recorded in delivery manifest and QA evidence.
- Delivery `checksums.sha256` is recorded and matches HTML files.
- Unity manual upload result is recorded in `docs/NETWORK_QA_EVIDENCE.md`.
- AppLovin manual upload result is recorded in `docs/NETWORK_QA_EVIDENCE.md`.
- Client confirms final destination URL/store behavior.
