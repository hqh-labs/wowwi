# EXPORT_VALIDATION.md

Project: TilePyramid_PL01

BUILD-09 export validation is a local foundation check. It verifies generated
single-file HTML structure and profile assumptions, but it does not guarantee
Unity Ads or AppLovin upload acceptance.

## Checks

The validator checks:

- Output path is an `.html` file.
- Output byte size is under the profile target.
- No external HTTP/HTTPS asset references appear in `src`, `href`, or CSS URL
  references.
- No local runtime references to `assets/`, `config/`, or `dist/` remain.
- Network profile metadata is present.
- Store-open bridge is present.
- MRAID requirement and bootstrap state are recorded.
- Orientation policy metadata is present.
- Timer-first-interaction policy metadata is present.
- Formal solvability remains `NOT YET PROVEN`.
- Chromium can load the exported file from `file://`.
- A Phaser canvas exists and BUILD-09 diagnostics are published.
- The exported page produces a non-blank rendered screenshot.
- Export network metadata and store-open bridge are present at runtime.

## Known validation limits

- The validator does not upload to Unity Ads or AppLovin.
- The validator does not prove all network-specific parser quirks.
- The Unity profile records that MRAID is required but not bundled; the export
  relies on the network environment to provide `window.mraid`.
- The AppLovin profile prohibits external HTTP assets and does not permit a
  `mraid.js` bootstrap script reference.
- Exported store-open fallback may be blocked by local browser popup policy
  during manual testing.

## BUILD-09 blank-screen fix

Manual testing found that fully inlined MP3 `data:` URLs could leave Phaser's
audio loader stuck when the exported HTML was opened directly from `file://`.
The export bootstrap now converts inlined manifest `data:` URLs into runtime
`blob:` URLs before Phaser starts. The HTML file remains self-contained, while
Phaser receives loader URLs that work in local Chrome and Chromium smoke tests.
