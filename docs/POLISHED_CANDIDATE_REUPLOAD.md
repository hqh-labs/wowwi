# Polished Candidate Re-upload

Project: `TilePyramid_PL01`
Build: `BUILD-21`
Polished runtime: `BUILD-20 creative-polish`

## Why Re-upload Is Needed

BUILD-20 changed the playable's visual/runtime behavior: CTA pulse, stronger CTA styling,
end-card polish, tile lift/glow, match sparkle, blocked tint/shake, timer warning loop,
tutorial rounded rings, tray rounded frame, and the debug label fix to
`BUILD-20 creative-polish`.

Because the candidate HTML is generated from bundled runtime code, Unity and AppLovin
must receive freshly generated post-polish files before this project can be considered
polished-delivery-ready.

## Files To Upload

Unity Ads:

`projects/TilePyramid_PL01/upload-candidates/latest/unity/TilePyramid_PL01_unity.html`

AppLovin:

`projects/TilePyramid_PL01/upload-candidates/latest/applovin/TilePyramid_PL01_applovin.html`

## Fresh Candidate Details

| Network | Size | SHA256 |
|---|---:|---|
| Unity | 1,998,718 bytes | `2e792f126dbef7455d4a066b5e153b30de9012351b57748fbaf9a806ff56e669` |
| AppLovin | 1,998,737 bytes | `e656722608c8066adc66c45e676c7d3f58c769886f8195c01d287574ee485b87` |

## Validation Commands Run

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

## Store URLs Configured

- Android / Google Play: `https://play.google.com/store/apps/details?id=com.skl.pyramid.quest.match3.tile.puzzle.games`
- iOS / App Store: `https://apps.apple.com/us/app/tile-pyramid-match-quest/id6755671033`
- Fallback: Android / Google Play URL

## Top-window Scan

Generated exports, upload candidates, and delivery HTML were scanned for:

`window.top`, `globalThis.top`, `self.top`, `top.location`, `parent.top`, `window.parent.top`

Result: no matches.

## Expected Upload Result

The expected result is that both networks accept the refreshed polished candidate for
preview/review, but final network approval is not guaranteed forever. Do not mark this
candidate as passed until manual Unity and AppLovin upload testing is completed.

## Manual Unity Upload Result

- Date:
- Uploaded by:
- File SHA256:
- Result:
- Notes:

## Manual AppLovin Upload Result

- Date:
- Uploaded by:
- File SHA256:
- Result:
- Notes:

## Known Limitations

- Unity export expects network-provided `window.mraid`.
- Network webviews may differ from Chromium file and preview testing.
- Formal solvability remains `NOT YET PROVEN`.
- BUILD-21 does not perform real Unity/AppLovin upload or network API integration.
