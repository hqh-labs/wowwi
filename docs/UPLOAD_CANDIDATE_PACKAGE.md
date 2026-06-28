# Upload Candidate Package

Project: TilePyramid_PL01

## Commands

From `projects/TilePyramid_PL01`:

```bash
npm run package:candidate
npm run validate:candidate
```

`package:candidate` runs exported HTML smoke coverage, export validation, a
production build, then creates `upload-candidates/latest/`.

## Output Structure

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

Generated candidate outputs are ignored by git.

## Store URLs

- Android / Google Play:
  `https://play.google.com/store/apps/details?id=com.skl.pyramid.quest.match3.tile.puzzle.games`
- iOS / App Store:
  `https://apps.apple.com/us/app/tile-pyramid-match-quest/id6755671033`
- Fallback: Google Play URL above.

The fallback is deterministic for unknown user agents. iOS-like user agents use
the App Store URL; Android-like user agents use the Google Play URL.

## Candidate Validation

`npm run validate:candidate` checks:

- Candidate folder exists.
- Unity and AppLovin HTML files exist.
- HTML sizes match the manifest.
- SHA256 checksums match.
- Store URLs are present in generated HTML.
- Upload notes, QA summary, package manifest, and checksum file exist.
- No forbidden raw/source folders are included.
- Final approval disclaimer exists.
- Formal solvability is recorded as `NOT YET PROVEN`.

## Manual Upload Workflow

1. Run `npm run package:candidate`.
2. Run `npm run validate:candidate`.
3. Upload `upload-candidates/latest/unity/TilePyramid_PL01_unity.html` to Unity
   Ads playable review.
4. Upload `upload-candidates/latest/applovin/TilePyramid_PL01_applovin.html` to
   AppLovin playable review.
5. Use each network preview to confirm boot, rendering, close-button access,
   CTA/end-card store-open, Android URL, and iOS URL behavior.

Final Unity Ads and AppLovin approval is not guaranteed. Formal solvability
remains `NOT YET PROVEN`.
