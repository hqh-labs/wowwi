# Second Playable Intake — SecondPlayable_PL01

## Project identity

| Field | Value |
|---|---|
| Project ID | `SecondPlayable_PL01` |
| Display name | Second Playable Intake |
| Status | `development` |
| Folder | `projects/SecondPlayable_PL01` |
| Formal solvability | `NOT_APPLICABLE` |
| Delivery status | `not-started` |
| Supported networks | None assigned yet |

## Generated folder structure

```
projects/SecondPlayable_PL01/
  README.md                    Project overview
  PROJECT_BRIEF.md             Client brief and intent
  ASSET_INTAKE.md              Asset log and ownership notes
  package.json                 Root package file (no scripts yet)
  project.config.json          Project metadata (status: development)
  input/
    README.md                  Intake folder usage guide
    raw-assets/                Client-provided source ZIPs and originals
    extracted-assets/          Files extracted from raw archives (read-only)
    references/                Screenshots, PDFs, reference images
    brief/                     Client brief documents
  docs/
    BUILD_PLAN.md              Planning notes for future build phases
    ASSET_AUDIT_TEMPLATE.md    Template for the formal asset audit
    EXPORT_PLAN.md             Planning notes for the export pipeline
  src/
    README.md                  Placeholder for future gameplay source
  tests/
    README.md                  Placeholder for future test files
```

## How to add raw assets safely

1. Copy client-provided source files (ZIPs, PSDs, PNGs, audio, etc.) into
   `projects/SecondPlayable_PL01/input/raw-assets/`.
2. Do **not** rename, recompress, or modify files once placed there — treat
   them as immutable originals.
3. If a ZIP must be extracted, place extracted content in
   `projects/SecondPlayable_PL01/input/extracted-assets/`. Do not modify the
   originals to perform the extraction.
4. Place reference screenshots, PDFs, and brief documents in
   `projects/SecondPlayable_PL01/input/references/` or
   `projects/SecondPlayable_PL01/input/brief/`.
5. Update `projects/SecondPlayable_PL01/ASSET_INTAKE.md` with ownership notes,
   expected file names, and any file that is still missing.

## How to run the dry-run audit

Dry-run scans intake folders and prints a summary without writing any files:

```bash
npm run wowwi:audit-assets -- --project SecondPlayable_PL01 --dry-run
```

Expected output when no assets have been added:
- Total files: 0
- Warnings include "No intake assets found" and empty-folder notices
- rawAssetsModified: false

## How to run the full audit (after adding assets)

```bash
npm run wowwi:audit-assets -- --project SecondPlayable_PL01
```

This writes:
- `projects/SecondPlayable_PL01/docs/ASSET_AUDIT.md` — Markdown summary
- `projects/SecondPlayable_PL01/docs/asset-audit.json` — Machine-readable audit

Validate the generated report:

```bash
npm run wowwi:validate-asset-audit -- --project SecondPlayable_PL01
```

## What is not implemented yet

- Gameplay runtime (scene, tiles, tray, timer, tutorial)
- Export pipeline (Unity and AppLovin single-file HTML)
- Upload candidate packaging
- Delivery lock
- Asset extraction or optimization
- Network-specific adapters
- Store URLs
- Visual editor

## Registry commands

```bash
npm run wowwi:list
npm run wowwi:validate
npm run wowwi:project -- SecondPlayable_PL01 status
```

## Preview site behavior

`SecondPlayable_PL01` appears on the preview home page with its development
status badge. Its detail page shows:

- Development status badge
- "Not playable yet" notice
- No Unity or AppLovin preview links (no HTML has been generated)

The preview build does not copy or reference any delivery HTML for development
projects.

## Recommended next build

**BUILD-26** or a later phase should:
1. Receive real client assets and add them to the intake folders.
2. Run the full asset audit (`wowwi:audit-assets -- --project SecondPlayable_PL01`).
3. Fill in `PROJECT_BRIEF.md` with client brief, target networks, and store URLs.
4. Fill in `ASSET_INTAKE.md` with source file ownership and notes.
5. Plan the gameplay implementation based on the intake audit findings.
