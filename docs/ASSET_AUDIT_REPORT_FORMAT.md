# Asset Audit Report Format

The asset analyzer writes both human-readable Markdown and machine-readable JSON.
The JSON file is the semantic validation target.

## Output Files

```text
projects/<ProjectID>/docs/ASSET_AUDIT.md
projects/<ProjectID>/docs/asset-audit.json
```

## JSON Shape

```json
{
  "projectId": "TilePyramid_PL01",
  "displayName": "Tile Pyramid - Match Quest",
  "generatedAt": "2026-06-28T00:00:00.000Z",
  "scannedFolders": [],
  "totals": {
    "fileCount": 0,
    "totalBytes": 0
  },
  "categories": {},
  "extensions": {},
  "largestFiles": [],
  "archives": [],
  "jsonFiles": [],
  "duplicateNames": [],
  "warnings": [],
  "recommendations": [],
  "rawAssetsModified": false
}
```

## Validation Rules

`npm run wowwi:validate-asset-audit -- --project <ProjectID>` checks that:

- `ASSET_AUDIT.md` exists.
- `asset-audit.json` exists and parses as JSON.
- `projectId` matches the registry project.
- `rawAssetsModified` is exactly `false`.
- `totals.fileCount` and `totals.totalBytes` are numeric.
- `scannedFolders` is a non-empty array.
- `warnings` and `recommendations` are arrays.
- Category counts add up to `totals.fileCount`.

## Category Rules

Files are classified by extension:

| Category | Extensions |
|---|---|
| image | `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.svg`, `.avif` |
| audio | `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac` |
| video | `.mp4`, `.mov`, `.webm` |
| data | `.json`, `.csv`, `.txt`, `.xml` |
| font | `.ttf`, `.otf`, `.woff`, `.woff2` |
| archive | `.zip`, `.rar`, `.7z`, `.tar`, `.gz`, `.tar.gz` |
| design-source | `.psd`, `.ai`, `.fig`, `.sketch` |
| code | `.js`, `.ts`, `.html`, `.css` |
| unknown | Any unsupported or missing extension |

Noise files such as `.DS_Store`, `Thumbs.db`, `desktop.ini`, and `.gitkeep` are
ignored.

## Compatibility Contract

Future tooling should treat `asset-audit.json` as the stable data source. The
Markdown report is for humans and can be reformatted more freely.
