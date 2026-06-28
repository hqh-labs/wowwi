# Polished Network QA Lock

Project: `TilePyramid_PL01`
Build: `BUILD-22`
Polished runtime: `BUILD-20 creative-polish`
Candidate package: `BUILD-21 polished-candidate-reupload`
Lock date: `2026-06-28`

## What Changed In BUILD-20

BUILD-20 added the creative polish pass: CTA pulse, stronger CTA styling,
end-card polish, tile lift/glow, match sparkle, blocked tint/shake, timer warning
loop, tutorial rounded rings, tray rounded frame, and the runtime debug label
`BUILD-20 creative-polish`.

## Why Re-upload Was Required

The playable HTML is generated from bundled runtime code. Because BUILD-20 changed
runtime presentation and interaction feedback, the Unity and AppLovin candidates
had to be regenerated and manually re-uploaded before the polished build could be
treated as network-QA-locked.

## Manual Re-upload Results

- Unity Ads: PASS - passed current Unity upload/testing.
- AppLovin: PASS - passed current AppLovin upload/testing.
- Overall polished candidate status: polished candidate passed manual re-upload QA.

## Files To Use For Re-delivery

Unity Ads:

`projects/TilePyramid_PL01/upload-candidates/latest/unity/TilePyramid_PL01_unity.html`

AppLovin:

`projects/TilePyramid_PL01/upload-candidates/latest/applovin/TilePyramid_PL01_applovin.html`

## Locked File Details

| Network | Size | SHA256 |
|---|---:|---|
| Unity | 1,998,718 bytes | `2e792f126dbef7455d4a066b5e153b30de9012351b57748fbaf9a806ff56e669` |
| AppLovin | 1,998,737 bytes | `e656722608c8066adc66c45e676c7d3f58c769886f8195c01d287574ee485b87` |

## Store URLs Configured

- Android / Google Play: `https://play.google.com/store/apps/details?id=com.skl.pyramid.quest.match3.tile.puzzle.games`
- iOS / App Store: `https://apps.apple.com/us/app/tile-pyramid-match-quest/id6755671033`
- Fallback: Android / Google Play URL

## Forbidden Top-window Pattern Status

Generated exports, upload candidates, and delivery HTML should scan clean for:

`window.top`, `globalThis.top`, `self.top`, `top.location`, `parent.top`, `window.parent.top`

BUILD-22 validation expects no matches.

## Manual Recheck Instructions

1. Upload the Unity HTML file listed above to the current Unity Ads playable review flow.
2. Confirm parser acceptance, preview rendering, close-button accessibility, and store-open behavior.
3. Upload the AppLovin HTML file listed above to the current AppLovin playable review flow.
4. Confirm parser acceptance, preview rendering, close-button accessibility, and store-open behavior.
5. Re-run local validation before re-delivery if any source, config, export script, package script, or asset changes.
6. Record the current date, network UI result, file size, and SHA256 for each recheck.

## Current Limitations

- Final Unity Ads and AppLovin approval is not guaranteed forever.
- Unity export expects network-provided `window.mraid`.
- Network webviews may differ from Chromium file and preview testing.
- Future network policy or parser changes can require another recheck.
- BUILD-22 does not perform upload automation or network API integration.
- Formal solvability remains `NOT YET PROVEN`.

## Final Approval Disclaimer

The polished candidate passed current manual Unity and AppLovin upload/testing.
This does not guarantee permanent approval, future approval, or future network
policy compatibility.
