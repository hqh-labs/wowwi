# Asset Intake Analyzer

BUILD-24 adds a repo-root analyzer for client source assets. It scans project
intake folders, classifies source files, writes an audit report, and validates
the report format.

## Commands

Run from the repo root:

```bash
npm run wowwi:audit-assets -- --project TilePyramid_PL01 --dry-run
npm run wowwi:audit-assets -- --project TilePyramid_PL01
npm run wowwi:validate-asset-audit -- --project TilePyramid_PL01
```

`--dry-run` scans and prints a summary without writing report files.

The non-dry-run command writes:

```text
projects/<ProjectID>/docs/ASSET_AUDIT.md
projects/<ProjectID>/docs/asset-audit.json
```

## Folders Scanned

For every registered project, the analyzer checks:

```text
projects/<ProjectID>/input/raw-assets/
projects/<ProjectID>/input/extracted-assets/
projects/<ProjectID>/input/references/
projects/<ProjectID>/input/brief/
```

TilePyramid_PL01 predates the BUILD-23 project skeleton, so the analyzer also
checks the legacy intake folders:

```text
project-input/raw-assets/
project-input/extracted-assets/
project-input/references/
```

## What It Records

The audit records:

- Scanned folder existence, file counts, and byte totals.
- File classification by extension and category.
- Largest source files.
- Archive files.
- JSON parse status and top-level type.
- PNG width and height when available from the PNG header.
- Duplicate basenames across intake folders.
- Warnings and recommendations.
- `rawAssetsModified: false`.

## Asset Safety

The analyzer is read-only for intake assets. It does not modify, move, rename,
delete, recompress, or overwrite raw or extracted client files.

The only writes made by the non-dry-run command are the two generated report files
under the selected project's `docs/` folder.

## Limitations

The analyzer is an intake planning tool. It does not:

- Prove asset licensing or ownership.
- Optimize or convert runtime assets.
- Decide which source assets should ship.
- Edit registry metadata.
- Touch gameplay code or generated HTML.

Use the report as an early warning system before implementation and optimization
work begins.
