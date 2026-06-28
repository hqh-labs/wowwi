# BUILD-22 Report: Polished Network QA Lock

Date: 2026-06-28
Branch: `build-22-polished-network-qa-lock`
Project: `TilePyramid_PL01`

## Summary

BUILD-22 records the manual network upload/testing result for the polished
post-BUILD-20 playable candidate generated in BUILD-21. No gameplay rules, level
data, raw assets, extracted assets, generated HTML, or visual polish behavior were
changed in BUILD-22.

The polished candidate passed current Unity upload/testing and passed current
AppLovin upload/testing. This is a point-in-time manual QA lock, not a permanent
approval guarantee.

## Locked Polished Candidate Outputs

| Network | Candidate path | Size | SHA256 | Manual result |
|---|---|---:|---|---|
| Unity | `projects/TilePyramid_PL01/upload-candidates/latest/unity/TilePyramid_PL01_unity.html` | 1,998,718 bytes | `2e792f126dbef7455d4a066b5e153b30de9012351b57748fbaf9a806ff56e669` | PASS |
| AppLovin | `projects/TilePyramid_PL01/upload-candidates/latest/applovin/TilePyramid_PL01_applovin.html` | 1,998,737 bytes | `e656722608c8066adc66c45e676c7d3f58c769886f8195c01d287574ee485b87` | PASS |

## Registry Lock

The project registry now records:

- `polishedCandidateReuploadStatus`: `passed-manual-upload-testing`
- `polishedUnityUploadStatus`: `passed-current-upload-testing`
- `polishedAppLovinUploadStatus`: `passed-current-upload-testing`
- `polishedNetworkQaLockedAt`: `2026-06-28`
- Polished Unity/AppLovin sizes and SHA256 checksums

## Store URLs

- Android / Google Play: `https://play.google.com/store/apps/details?id=com.skl.pyramid.quest.match3.tile.puzzle.games`
- iOS / App Store: `https://apps.apple.com/us/app/tile-pyramid-match-quest/id6755671033`
- Fallback: Android / Google Play URL

## Safety Status

- Unity/AppLovin exports remain single-file HTML.
- Store URL metadata includes Android, iOS, and fallback URLs.
- MRAID bridge behavior is preserved.
- Generated export, candidate, and delivery HTML should continue to scan clean for
  `window.top`, `globalThis.top`, `self.top`, `top.location`, `parent.top`, and
  `window.parent.top`.
- Formal solvability remains `NOT YET PROVEN`.

## Limitations

- Final Unity Ads and AppLovin approval is not guaranteed forever.
- Unity export expects network-provided `window.mraid`.
- Network webviews may differ from Chromium file and preview testing.
- Future network policy or parser changes can require another recheck.
- BUILD-22 does not add upload automation, network API integration, or a level solver.
