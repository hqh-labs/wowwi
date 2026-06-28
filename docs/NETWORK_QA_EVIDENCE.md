# Network QA Evidence

Project: TilePyramid_PL01
Build: BUILD-13
Date: 2026-06-28

## Summary

Both Unity Ads and AppLovin upload/testing passed after the BUILD-12 `window.top`
removal fix. This document records the evidence, known limitations, and exact
wording that is appropriate for each claim.

## Approved Claim Wording

Use these phrases:

- "Passed current Unity upload/testing"
- "Passed current AppLovin upload/testing"
- "Upload-ready candidate at this point in time"

Do not use:

- "Guaranteed approved forever"
- "Fully certified by Unity/AppLovin"
- "No future network changes can break this"

## Unity Ads

**Status:** PASSED_UPLOAD_TESTING
**Fixed in:** BUILD-12
**Fix:** Removed `window.top` references from Phaser input manager and sanitized
build output. Phaser now runs with `input.windowEvents: false`.

The Unity candidate was initially rejected with:

> Creative pack validation failed: Your responsive playable is not allowed to use window.top

After the BUILD-12 fix, the regenerated candidate passed current Unity upload
and testing. This does not guarantee future network policy changes will not
require further remediation.

**Passed current Unity upload/testing after BUILD-12 window.top fix. Not guaranteed forever.**

## AppLovin

**Status:** PASSED_UPLOAD_TESTING
**Fixed in:** BUILD-12
**Fix:** Same `window.top` removal; AppLovin single-file HTML passed upload and
review after BUILD-12 regeneration.

**Passed current AppLovin upload/testing after BUILD-12 window.top fix. Not guaranteed forever.**

## Candidate File Details (at BUILD-12 validation)

| Field | Unity | AppLovin |
|-------|-------|----------|
| Filename | `TilePyramid_PL01_unity.html` | `TilePyramid_PL01_applovin.html` |
| Size (bytes) | 1,993,760 | 1,993,779 |
| SHA256 | `155e384d959a83933264d6e388b537318ce4458c14e53a66fc8c0a2b5be0423f` | `a29bd366233cee2deaf03fb413dae62f431e5a677c18640db0eec50de1dfaa74` |
| `window.top` present | No | No |

Current delivery checksums are recorded in `delivery/latest/checksums.sha256`
and `delivery/latest/delivery-manifest.json` at generation time.

## Store URLs Configured

- Android / Google Play: `https://play.google.com/store/apps/details?id=com.skl.pyramid.quest.match3.tile.puzzle.games`
- iOS / App Store: `https://apps.apple.com/us/app/tile-pyramid-match-quest/id6755671033`
- Fallback: Android / Google Play URL

Store URLs are embedded in both HTML files via `window.__PLAYABLE_NETWORK__`
metadata and are validated by `validateDeliveryPackage`.

## MRAID

Unity export expects the ad network to provide `window.mraid` at runtime. The
store-open bridge prefers `mraid.open(url)` and falls back to
`window.open(url, "_blank", "noopener")`, then `window.location.href`. No
`mraid.js` bootstrap file is bundled; Unity is expected to inject it.

AppLovin does not require MRAID. The same store-open bridge provides graceful
fallback.

## Forbidden Patterns

Export validation and candidate/delivery validation check for these forbidden
patterns and fail immediately if found:

- `window.top`
- `window.parent.top`
- `globalThis.top`
- `self.top`
- `parent.top`
- `top.location`

All were absent from both HTML files at BUILD-12 and remain absent in the
delivery package.

## Validation Commands Run

```
npm run typecheck         PASS — no TypeScript errors
npm run test              PASS — 209 unit tests
npm run build             PASS — production build
npm run export:all        PASS — Unity + AppLovin exports generated
npm run validate:exports  PASS — static export validation
npm run test:exports      PASS — 14 Chromium export tests
npm run test:smoke        PASS — 26 Chromium smoke tests
npm run measure:size      PASS — both exports under 5 MB
npm run package:candidate PASS — upload candidate generated and validated
npm run validate:candidate PASS — candidate re-validated standalone
npm run package:delivery  PASS — delivery package generated and validated
npm run validate:delivery PASS — delivery re-validated standalone
```

## Known Limitations

- Final Unity Ads and AppLovin approval is not guaranteed.
- Unity export expects network-provided `window.mraid`.
- Network webviews may differ from Chromium file:// QA behavior.
- Chromium `file://` protocol may differ from real in-network mobile webviews.
- Browser popup policy (for `window.open` fallback) differs from network webview
  store-open behavior.

## Formal Solvability

**NOT YET PROVEN**

Formal board solvability (a mathematical proof that Level_21 is always beatable)
has not been performed. The level appears playable in manual QA but has not been
verified by an exhaustive solver.

## Final Approval Disclaimer

Local BUILD-13 delivery packaging and validation do not guarantee final Unity Ads
or AppLovin approval.
