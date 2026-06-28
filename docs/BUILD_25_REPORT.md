# BUILD-25 Report — First Real Second Project Intake

## Summary

BUILD-25 uses the BUILD-23 project-creation pipeline and BUILD-24 asset intake
analyzer to onboard `SecondPlayable_PL01` as the first real second playable
project in the Wowwi repository. This proves the multi-project pipeline works
end-to-end for a new project without copying TilePyramid_PL01 manually.

## New project

| Field | Value |
|---|---|
| Project ID | `SecondPlayable_PL01` |
| Display name | Second Playable Intake |
| Status | `development` |
| Folder | `projects/SecondPlayable_PL01` |
| Created via | `npm run wowwi:create-project -- --id SecondPlayable_PL01 --display-name "Second Playable Intake"` |

## Registry

`tooling/project-registry/projects.json` now contains two projects:

- `TilePyramid_PL01` — `delivery-locked` (unchanged)
- `SecondPlayable_PL01` — `development` (new)

Both pass `npm run wowwi:validate`.

## Asset audit dry-run result

```
Total files: 0
Warnings: 5 (empty intake folders + no assets found)
rawAssetsModified: false
```

No intake assets have been added yet. The intake folders exist and are empty,
which is the expected state for a new development project.

## Preview site behavior

- Home page now lists both registered projects (all statuses).
- `SecondPlayable_PL01` card appears with its `development` status badge.
- A detail page is generated for `SecondPlayable_PL01` that clearly states
  "not playable yet" and contains no Unity or AppLovin preview links.
- No delivery HTML files are copied for development projects.
- `TilePyramid_PL01` preview behavior is unchanged.

## Test results

All 80 tooling tests pass:

- 66 pre-existing tests (registry, create-project, asset-audit, live-preview) — all pass
- 14 new BUILD-25 tests (`tooling/tests/second-project.test.mjs`) — all pass
- 235 TilePyramid unit tests (Vitest) — all pass

## TilePyramid regression

All TilePyramid_PL01 workflows pass without change:
- typecheck, test, build, export:all, validate:exports
- package:candidate, validate:candidate, package:delivery, validate:delivery
- Asset audit validation: PASS

## Files created

- `projects/SecondPlayable_PL01/` — full skeleton (11 files + 4 intake dirs)
- `tooling/tests/second-project.test.mjs` — 14 BUILD-25 tests
- `docs/SECOND_PLAYABLE_INTAKE.md` — intake guide
- `docs/BUILD_25_REPORT.md` — this file

## Files modified

- `tooling/project-registry/projects.json` — `SecondPlayable_PL01` registry entry added
- `apps/internal-preview/scripts/build-preview.mjs` — development project listing
- `README.md` — BUILD-25 added, docs table extended, tooling commands updated
- `CLAUDE.md` — current build phase updated to BUILD-25

## Known limitations

- No real client assets exist yet for `SecondPlayable_PL01`.
- Gameplay runtime is not implemented.
- Export pipeline is not implemented.
- Store URLs are not configured.
- Supported networks have not been assigned.
- Formal solvability is `NOT_APPLICABLE` (no gameplay to evaluate).

## Recommended next build

**BUILD-26**: Receive real client asset pack for `SecondPlayable_PL01`, run the
full asset intake audit, fill in `PROJECT_BRIEF.md` and `ASSET_INTAKE.md`,
and plan the gameplay implementation.
