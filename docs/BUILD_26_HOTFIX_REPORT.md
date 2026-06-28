# BUILD-26 Hotfix Report — Git-Tracked Intake Directories

**Branch:** `build-26-second-playable-asset-intake`
**Date:** 2026-06-28
**Status:** Complete

## Problem

After BUILD-25 registered `SecondPlayable_PL01`, the Vercel deployment failed
with:

```
SecondPlayable_PL01 failed validation:
- Development project directory missing: input/raw-assets
- Development project directory missing: input/extracted-assets
- Development project directory missing: input/references
- Development project directory missing: input/brief
```

**Root cause:** Git does not track empty directories.  The four intake
subdirectories were created locally by `create-project` but contained no files,
so they were never added to the repository.  On a fresh Vercel clone, the
directories did not exist, and `wowwi:validate` (which checks all
`DEVELOPMENT_REQUIRED_PROJECT_DIRS`) failed.

## Fix

### 1. `.gitignore` — content-level ignore instead of directory-level ignore

Changed `projects/*/input/raw-assets/` (directory ignore) to
`projects/*/input/raw-assets/*` (content ignore).  This allows Git to traverse
the directory and track `.gitkeep` files via negation.

Added negation patterns for all four intake subdirs:

```gitignore
projects/*/input/raw-assets/*
projects/*/input/extracted-assets/*
projects/*/input/references/*
projects/*/input/brief/*

!projects/*/input/raw-assets/.gitkeep
!projects/*/input/extracted-assets/.gitkeep
!projects/*/input/references/.gitkeep
!projects/*/input/brief/.gitkeep
```

Real client assets (ZIPs, PSDs, PNGs, audio, etc.) remain ignored because they
do not match `.gitkeep`.

### 2. Template — `.gitkeep` in every intake subdir

Added empty `.gitkeep` files to the project creation template:

```
tooling/templates/playable-project/input/raw-assets/.gitkeep
tooling/templates/playable-project/input/extracted-assets/.gitkeep
tooling/templates/playable-project/input/references/.gitkeep
tooling/templates/playable-project/input/brief/.gitkeep
```

`copyRenderedTemplateDir` copies these automatically whenever a new project is
created.  No changes to `create-playable-project.mjs` were required.

### 3. SecondPlayable_PL01 — `.gitkeep` files placed

Added the four placeholder files to the live project so the current branch
validates immediately on Vercel:

```
projects/SecondPlayable_PL01/input/raw-assets/.gitkeep
projects/SecondPlayable_PL01/input/extracted-assets/.gitkeep
projects/SecondPlayable_PL01/input/references/.gitkeep
projects/SecondPlayable_PL01/input/brief/.gitkeep
```

## Asset audit compatibility

`IGNORED_FILE_NAMES` in `tooling/asset-audit/asset-audit.mjs` already includes
`.gitkeep`, so placeholder files are excluded from asset counts and will not
appear in audit reports.

## Tests added

`tooling/tests/second-project.test.mjs` contains 22 tests — 14 for BUILD-25
intake validation and 8 for the BUILD-26 gitkeep regression:

| Test | What it verifies |
|---|---|
| 15 | Each intake folder contains a `.gitkeep` |
| 16 | `.gitkeep` files are NOT git-ignored (`git check-ignore` exits 1) |
| 17 | Real asset files ARE still git-ignored |
| 18 | `create-project` dry-run planned files include `.gitkeep` |
| 19 | `create-project` real creation places `.gitkeep` in intake dirs |
| 20 | Project template contains `.gitkeep` in all four intake subdirs |
| 21 | `wowwi:validate` passes for all projects after the fix |
| 22 | Preview home page still lists both projects |

## Files changed

### New files
- `projects/SecondPlayable_PL01/` — full project skeleton including `.gitkeep` files
- `tooling/tests/second-project.test.mjs` — 22 tests
- `tooling/templates/playable-project/input/raw-assets/.gitkeep`
- `tooling/templates/playable-project/input/extracted-assets/.gitkeep`
- `tooling/templates/playable-project/input/references/.gitkeep`
- `tooling/templates/playable-project/input/brief/.gitkeep`
- `docs/BUILD_25_REPORT.md`
- `docs/BUILD_26_HOTFIX_REPORT.md` — this file
- `docs/SECOND_PLAYABLE_INTAKE.md`

### Modified files
- `.gitignore` — switched from directory-level to content-level ignore for intake dirs; added four `.gitkeep` negation patterns
- `tooling/project-registry/projects.json` — registered `SecondPlayable_PL01`
- `apps/internal-preview/scripts/build-preview.mjs` — development project pages
- `README.md` — updated layout and cross-references
- `CLAUDE.md` — updated current build phase

## Verification

```sh
npm run wowwi:validate      # PASS — both projects
node --test tooling/tests/second-project.test.mjs   # 22/22
git check-ignore -v projects/SecondPlayable_PL01/input/raw-assets/.gitkeep
# output shows negation rule — file is NOT ignored
```
