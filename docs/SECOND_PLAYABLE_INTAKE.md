# Second Playable Intake — SecondPlayable_PL01

## Overview

`SecondPlayable_PL01` is the second project registered in the wowwi multi-project
registry.  It was created in **BUILD-25** using the BUILD-23 playable project
skeleton pipeline and hotfixed in **BUILD-26** to ensure its intake directories
are tracked by Git after a fresh clone.

## Project status

| Field | Value |
|---|---|
| Project ID | `SecondPlayable_PL01` |
| Display name | Second Playable Intake |
| Status | `development` |
| Folder | `projects/SecondPlayable_PL01/` |
| Supported networks | *(none yet)* |
| Delivery candidate | `not-started` |
| Formal solvability | `NOT_APPLICABLE` |

## Intake folder structure

```
projects/SecondPlayable_PL01/
├── input/
│   ├── README.md               # intake instructions
│   ├── raw-assets/
│   │   └── .gitkeep            # tracked so the folder survives git clone
│   ├── extracted-assets/
│   │   └── .gitkeep
│   ├── references/
│   │   └── .gitkeep
│   └── brief/
│       └── .gitkeep
├── docs/
│   ├── BUILD_PLAN.md
│   ├── EXPORT_PLAN.md
│   └── ASSET_AUDIT_TEMPLATE.md
├── src/                        # future playable source
├── tests/                      # future tests
├── ASSET_INTAKE.md             # intake checklist
├── PROJECT_BRIEF.md            # brief placeholder
├── project.config.json         # project config
└── package.json
```

### Why `.gitkeep` files?

Git does not track empty directories.  `wowwi:validate` checks that all four
intake subdirs exist so the asset scanner and audit pipeline can run on a Vercel
build.  Without `.gitkeep` placeholders the intake directories disappear on a
fresh clone and validation fails.

The `.gitkeep` files are excluded from asset counts by the scanner
(`IGNORED_FILE_NAMES` set in `tooling/asset-audit/asset-audit.mjs`), so they
do not pollute audit reports.

## Adding intake assets

Drop client-supplied files into the appropriate intake folder:

| Folder | What goes here |
|---|---|
| `input/raw-assets/` | Original client ZIPs, PSDs, Illustrator files |
| `input/extracted-assets/` | Files extracted from the ZIPs (do not re-compress) |
| `input/references/` | Reference screenshots, PDFs, competitor ads |
| `input/brief/` | Creative brief, spec sheets, copy documents |

Real asset files are gitignored inside all four subdirs (except `.gitkeep`).
Do not commit raw client materials.

## Running the audit

```sh
# Dry run — scan only, write nothing
npm run wowwi:audit-assets -- --project SecondPlayable_PL01 --dry-run

# Write ASSET_AUDIT.md and asset-audit.json to docs/
npm run wowwi:audit-assets -- --project SecondPlayable_PL01

# Validate the written audit
npm run wowwi:validate-asset-audit -- --project SecondPlayable_PL01
```

## Validation

```sh
npm run wowwi:validate
```

Both `TilePyramid_PL01` and `SecondPlayable_PL01` must show `PASS`.
