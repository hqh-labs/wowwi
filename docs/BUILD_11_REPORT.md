# BUILD-11 Report: Upload Candidate Package and Store URL Wiring

Project: TilePyramid_PL01
Branch: build-11-upload-candidate-package

## Architecture implemented

- Wired real Google Play and App Store URLs into `public/config/game.config.json`.
- Added platform-aware store URL selection to `StoreOpenService`.
- Added store URL metadata to exported HTML runtime metadata, export reports, and
  store-open diagnostics.
- Added upload-candidate package generation under `scripts/package/`.
- Added candidate package validation, SHA256 generation, QA summary, and
  network-specific upload notes.
- Added npm commands:
  - `npm run package:candidate`
  - `npm run validate:candidate`

## Store URL wiring behavior

- Android URL:
  `https://play.google.com/store/apps/details?id=com.skl.pyramid.quest.match3.tile.puzzle.games`
- iOS URL:
  `https://apps.apple.com/us/app/tile-pyramid-match-quest/id6755671033`
- Fallback URL: Android / Google Play URL.
- iOS-like user agents select the App Store URL.
- Android-like user agents select the Google Play URL.
- Unknown user agents select the deterministic fallback.
- Automated QA mode still records store-open without navigating.

## Candidate package behavior

`npm run package:candidate` runs exported HTML smoke tests, export validation,
and a production build, then writes `upload-candidates/latest/`. The package
includes only the Unity HTML, AppLovin HTML, upload notes, QA summary, package
manifest, checksum file, and candidate validation report.

## Output structure

```text
upload-candidates/latest/
├── package-manifest.json
├── checksums.sha256
├── QA_SUMMARY.md
├── candidate-validation-report.json
├── unity/
│   ├── TilePyramid_PL01_unity.html
│   └── UPLOAD_NOTES_UNITY.md
└── applovin/
    ├── TilePyramid_PL01_applovin.html
    └── UPLOAD_NOTES_APPLOVIN.md
```

## Checksums behavior

- SHA256 is computed for each candidate HTML file.
- `checksums.sha256` records both candidate HTML checksums.
- `validate:candidate` recomputes checksums and verifies they match the package
  manifest and checksum file.

## Validation behavior

Candidate validation checks required files, HTML sizes, SHA256 checksums, store
URLs in HTML, forbidden raw/source folders, upload notes, QA summary, final
approval disclaimer, and `Formal solvability: NOT YET PROVEN`.

## Test results

- `npm run typecheck`: PASS.
- `npm run test`: PASS, 201 unit tests.
- `npm run build`: PASS.
- `npm run export:all`: PASS.
- `npm run validate:exports`: PASS.
- `npm run test:exports`: PASS, 14 Chromium exported HTML tests.
- `npm run test:smoke`: PASS, 26 Chromium smoke tests.
- `npm run measure:size`: PASS.
- `npm run package:candidate`: PASS.
- `npm run validate:candidate`: PASS.

## Export sizes

- Unity export: 1,993,143 bytes.
- AppLovin export: 1,993,162 bytes.
- Production total: 1,891,615 bytes.
- JavaScript raw: 1,531,547 bytes.
- Runtime images: 207,198 bytes.
- Runtime audio: 124,108 bytes.

## Package output paths

- Unity: `upload-candidates/latest/unity/TilePyramid_PL01_unity.html`
- AppLovin: `upload-candidates/latest/applovin/TilePyramid_PL01_applovin.html`
- Manifest: `upload-candidates/latest/package-manifest.json`
- Checksums: `upload-candidates/latest/checksums.sha256`

## SHA256

- Unity: `7ca961d1e203fdf264dbb4547b0e36a7eb2725c738e1abf804889913ac414f2e`
- AppLovin: `c2b604e973c7070e9da6d1a62e7c691fe2cf8e9927f8f92a5261decb9e6b53ad`

## Known limitations

- Final Unity Ads and AppLovin approval is not guaranteed.
- Unity export expects network-provided `window.mraid`.
- Network webviews may differ from Chromium file:// QA.
- No upload automation or real network API integration was added.
- No formal level solver was added.
- Formal solvability remains `NOT YET PROVEN`.

## Final upload-readiness status

BUILD-11 produces upload candidate artifacts for manual Unity Ads and AppLovin
review. Final network approval is not guaranteed, and formal solvability is
still not proven.
