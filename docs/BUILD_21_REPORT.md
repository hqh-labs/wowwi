# BUILD-21 Report: Polished Candidate Re-upload QA Package

Date: 2026-06-28
Branch: `build-21-polished-candidate-reupload`
Project: `TilePyramid_PL01`

## Summary

BUILD-21 regenerates the Unity and AppLovin upload candidates after the BUILD-20
creative polish pass. No gameplay rules, level data, raw assets, extracted assets, or
visual polish behavior were changed in BUILD-21.

The package is ready for manual Unity/AppLovin re-upload QA, but this build does not
claim a network pass. Real network upload/testing must be performed manually and
recorded after upload.

## Fresh Candidate Outputs

| Network | Candidate path | Size | SHA256 |
|---|---|---:|---|
| Unity | `upload-candidates/latest/unity/TilePyramid_PL01_unity.html` | 1,998,718 bytes | `2e792f126dbef7455d4a066b5e153b30de9012351b57748fbaf9a806ff56e669` |
| AppLovin | `upload-candidates/latest/applovin/TilePyramid_PL01_applovin.html` | 1,998,737 bytes | `e656722608c8066adc66c45e676c7d3f58c769886f8195c01d287574ee485b87` |

## Fresh Delivery Outputs

| Network | Delivery path | Size | SHA256 |
|---|---|---:|---|
| Unity | `delivery/latest/unity/TilePyramid_PL01_unity.html` | 1,998,718 bytes | `2e792f126dbef7455d4a066b5e153b30de9012351b57748fbaf9a806ff56e669` |
| AppLovin | `delivery/latest/applovin/TilePyramid_PL01_applovin.html` | 1,998,737 bytes | `e656722608c8066adc66c45e676c7d3f58c769886f8195c01d287574ee485b87` |

## Store URLs

- Android / Google Play: `https://play.google.com/store/apps/details?id=com.skl.pyramid.quest.match3.tile.puzzle.games`
- iOS / App Store: `https://apps.apple.com/us/app/tile-pyramid-match-quest/id6755671033`
- Fallback: Android / Google Play URL

## Safety Status

- Unity/AppLovin exports remain single-file HTML.
- Store URL metadata includes Android, iOS, and fallback URLs.
- MRAID bridge behavior is preserved.
- `window.top`, `globalThis.top`, `self.top`, `top.location`, `parent.top`, and `window.parent.top` are not present in generated export, candidate, or delivery HTML.
- Formal solvability remains `NOT YET PROVEN`.

## Validation Commands

The BUILD-21 package is expected to be validated with:

```bash
npm run typecheck
npm run test
npm run build
npm run export:all
npm run validate:exports
npm run test:exports
npm run test:smoke
npm run measure:size
npm run package:candidate
npm run validate:candidate
npm run package:delivery
npm run validate:delivery
```

Repo-level preview and Vercel-safe checks are expected to run from the repository root:

```bash
npm run wowwi:list
npm run wowwi:validate
npm run wowwi:project -- TilePyramid_PL01 status
npm test
npm run preview:test
npm run preview:build
npm run preview:validate
npm run vercel:build-preview
npm run preview:validate
npm run vercel:test
npm run live-preview:test
```

## Manual Re-upload Status

- Unity Ads: pending manual upload
- AppLovin: pending manual upload

Final Unity Ads and AppLovin approval is not guaranteed forever. Network webviews and
review rules can change after local validation.

## Known Limitations

- Unity export expects network-provided `window.mraid`.
- Network webviews may differ from Chromium file and preview testing.
- Formal solvability remains `NOT YET PROVEN`.
- BUILD-21 does not include upload automation or real network API integration.
