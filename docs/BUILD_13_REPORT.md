# BUILD-13 Report: Delivery Candidate Lock

Date: 2026-06-28
Branch: `build-13-delivery-candidate-lock`
Project: `projects/TilePyramid_PL01`

## Objective

Freeze the current playable as a delivery candidate and produce clear final
handoff artifacts: a locked delivery package, network QA evidence, release notes,
reproducible commands, and a final handoff checklist.

## Delivery Package

Output folder: `projects/TilePyramid_PL01/delivery/latest/` (gitignored)

### Unity Delivery

- Path: `delivery/latest/unity/TilePyramid_PL01_unity.html`
- Size: `1,993,760` bytes (1.90 MB / 5 MB limit)
- SHA256: `6f3d824f5a4caebde44f2693a86ed9b44b4635acd08628c814e6b4f2227560b8`
- `window.top`: not present

### AppLovin Delivery

- Path: `delivery/latest/applovin/TilePyramid_PL01_applovin.html`
- Size: `1,993,779` bytes (1.90 MB / 5 MB limit)
- SHA256: `caff0e0fa85f6da6d41478c75561b6759e9a50ac10247c7d7e292bf001f1a4c3`
- `window.top`: not present

### Delivery Package Contents

```
delivery/latest/
├── DELIVERY_README.md
├── RELEASE_NOTES.md
├── QA_EVIDENCE.md
├── delivery-manifest.json
├── checksums.sha256
├── delivery-validation-report.json
├── unity/
│   ├── TilePyramid_PL01_unity.html
│   └── UPLOAD_NOTES_UNITY.md
└── applovin/
    ├── TilePyramid_PL01_applovin.html
    └── UPLOAD_NOTES_APPLOVIN.md
```

## Validation Summary

| Command | Result |
|---------|--------|
| `npm run typecheck` | PASS — no TypeScript errors |
| `npm run test` | PASS — 220 unit tests (14 files) |
| `npm run build` | PASS |
| `npm run export:all` | PASS |
| `npm run validate:exports` | PASS |
| `npm run test:exports` | PASS — 14 Chromium export tests |
| `npm run test:smoke` | PASS — 26 Chromium smoke tests |
| `npm run measure:size` | PASS |
| `npm run package:candidate` | PASS |
| `npm run validate:candidate` | PASS |
| `npm run package:delivery` | PASS |
| `npm run validate:delivery` | PASS |

## Unit Test Count

- Total unit test files: 14
- Total unit tests: 220 (was 209; +11 new delivery tests)
- New test file: `tests/unit/deliveryPackage.test.ts`
  - delivery package manifest includes Unity HTML path
  - delivery package manifest includes AppLovin HTML path
  - delivery package manifest includes SHA256 checksums
  - validates a complete delivery package
  - delivery package validation rejects missing Unity HTML
  - delivery package validation rejects missing AppLovin HTML
  - delivery package validation rejects checksum mismatch
  - delivery package validation rejects forbidden window.top
  - delivery package validation verifies store URL metadata
  - delivery package validation records network QA evidence
  - delivery package validation records formal solvability as NOT YET PROVEN

## Production Size

| Metric | Value |
|--------|-------|
| dist total bytes | 1,891,611 |
| JavaScript raw bytes | 1,531,533 |
| JavaScript gzip bytes | 352,861 |
| Runtime image bytes | 207,198 |
| Runtime audio bytes | 124,108 |
| Unity export size | 1,993,760 bytes |
| AppLovin export size | 1,993,779 bytes |

## Store URLs

- Android / Google Play: `https://play.google.com/store/apps/details?id=com.skl.pyramid.quest.match3.tile.puzzle.games`
- iOS / App Store: `https://apps.apple.com/us/app/tile-pyramid-match-quest/id6755671033`
- Fallback: Android / Google Play URL

Both HTML files contain Android, iOS, and fallback store URL metadata validated
by `validateDeliveryPackage`.

## Network QA Evidence

- Unity Ads: Passed current upload/testing after BUILD-12 `window.top` fix.
  Not guaranteed forever.
- AppLovin: Passed current AppLovin upload/testing after BUILD-12 `window.top` fix.
  Not guaranteed forever.

See `docs/NETWORK_QA_EVIDENCE.md` for full evidence and wording guidance.

## Known Warnings

The Vite build emits a chunk size warning about `phaser-*.js` (1,475 kB
uncompressed). This is a known, expected warning — Phaser is a monolithic runtime
and cannot be code-split for this use case. It does not affect the single-file
HTML export, which stays under 2 MB (well within the 5 MB limit).

## Known Limitations

- Final Unity Ads and AppLovin approval is not guaranteed by local validation.
- Unity export expects network-provided `window.mraid`.
- Network webviews may differ from Chromium `file://` QA behavior.
- Formal solvability of Level_21 remains `NOT YET PROVEN`.

## Formal Solvability

**NOT YET PROVEN** — recorded in delivery manifest, HTML files, and QA evidence.

## Files Created

| File | Reason |
|------|--------|
| `projects/TilePyramid_PL01/scripts/package/delivery-utils.mjs` | Delivery validation utilities and `validateDeliveryPackage` |
| `projects/TilePyramid_PL01/scripts/package/package-delivery.mjs` | Delivery package generation script |
| `projects/TilePyramid_PL01/scripts/package/validate-delivery.mjs` | Standalone delivery validator |
| `projects/TilePyramid_PL01/tests/unit/deliveryPackage.test.ts` | 11 unit tests for delivery package validation |
| `docs/DELIVERY_CANDIDATE.md` | Delivery workflow documentation |
| `docs/NETWORK_QA_EVIDENCE.md` | Network upload testing evidence and wording guide |
| `docs/RELEASE_NOTES_TILEPYRAMID_PL01.md` | Project release notes |
| `docs/BUILD_13_REPORT.md` | This file |

## Files Modified

| File | Reason |
|------|--------|
| `projects/TilePyramid_PL01/package.json` | Added `package:delivery` and `validate:delivery` scripts |
| `.gitignore` | Added `projects/TilePyramid_PL01/delivery/` to ignored outputs |
| `projects/TilePyramid_PL01/scripts/package/candidate-utils.mjs` | Updated `FINAL_APPROVAL_DISCLAIMER` from BUILD-12 to BUILD-13 |
| `projects/TilePyramid_PL01/scripts/package/package-candidate.mjs` | Updated build field from `BUILD-12` to `BUILD-13` |
| `CLAUDE.md` | Updated current build phase to BUILD-13 |
| `docs/UPLOAD_READINESS_CHECKLIST.md` | Added BUILD-13 delivery workflow and sign-off items |

## git status --short

```
 M .gitignore
 M CLAUDE.md
 M docs/UPLOAD_READINESS_CHECKLIST.md
 M projects/TilePyramid_PL01/package.json
 M projects/TilePyramid_PL01/scripts/package/candidate-utils.mjs
 M projects/TilePyramid_PL01/scripts/package/package-candidate.mjs
?? docs/DELIVERY_CANDIDATE.md
?? docs/NETWORK_QA_EVIDENCE.md
?? docs/RELEASE_NOTES_TILEPYRAMID_PL01.md
?? projects/TilePyramid_PL01/scripts/package/delivery-utils.mjs
?? projects/TilePyramid_PL01/scripts/package/package-delivery.mjs
?? projects/TilePyramid_PL01/scripts/package/validate-delivery.mjs
?? projects/TilePyramid_PL01/tests/unit/deliveryPackage.test.ts
```

Nothing committed. Nothing pushed.

## Manual Delivery Instructions

From `projects/TilePyramid_PL01`:

```bash
npm run package:delivery
npm run validate:delivery
```

The delivery package will be written to `delivery/latest/`. To archive for
handoff, copy or zip the folder. The folder is gitignored and must be shared
out-of-band (email, file share, etc.).

## Final Approval Disclaimer

Local BUILD-13 delivery packaging and validation do not guarantee final Unity Ads
or AppLovin approval. This document records that both networks passed current
upload/testing after the BUILD-12 `window.top` fix. Network policies, review
criteria, and technical requirements can change at any time.
