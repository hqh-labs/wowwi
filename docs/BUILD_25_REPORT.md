# BUILD-25 Report — First Real Second Project Intake

**Branch:** `build-26-second-playable-asset-intake`
**Date:** 2026-06-28
**Status:** Complete

## Objective

Register and scaffold `SecondPlayable_PL01` as the second project in the wowwi
multi-project registry using the BUILD-23 playable project skeleton pipeline.
Show development projects on the internal preview site.

## Acceptance criteria — all met

| # | Criterion | Result |
|---|---|---|
| 1 | `SecondPlayable_PL01` registered in `projects.json` | PASS |
| 2 | Status is `development` | PASS |
| 3 | `wowwi:validate` passes for the new project | PASS |
| 4 | `wowwi:validate` still passes for `TilePyramid_PL01` | PASS |
| 5 | Asset audit dry-run runs without errors | PASS |
| 6 | Preview site home page lists development projects | PASS |
| 7 | Development project detail page generated | PASS |
| 8 | 14 BUILD-25 tests pass | PASS |

## Files changed

### New files
- `projects/SecondPlayable_PL01/` — complete project skeleton (15 files + 4 intake dirs)
- `tooling/tests/second-project.test.mjs` — 22 tests (14 BUILD-25 + 8 BUILD-26)
- `docs/SECOND_PLAYABLE_INTAKE.md` — intake guide
- `docs/BUILD_25_REPORT.md` — this file

### Modified files
- `tooling/project-registry/projects.json` — added `SecondPlayable_PL01` entry
- `apps/internal-preview/scripts/build-preview.mjs` — added `buildDevelopmentProjectPage()` and development project loop in `main()`
- `README.md` — added `SecondPlayable_PL01` to repo layout and cross-reference
- `CLAUDE.md` — updated current build phase

## Notes

The `create-project` pipeline (BUILD-23) was used to scaffold the project.
The preview site `buildHomePage()` was updated to receive all projects (not just
`previewableProjects`) so that development projects appear in the home page card
list.  A new `buildDevelopmentProjectPage()` function generates a minimal detail
page with a "not playable yet" notice instead of the full delivery preview.

Vercel deployment failed after this build because the four intake subdirs
(`raw-assets`, `extracted-assets`, `references`, `brief`) were empty and
therefore not tracked by Git.  That regression is fixed in BUILD-26.
