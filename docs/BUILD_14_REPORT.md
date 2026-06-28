# BUILD-14 Report — Project Registry and Local Tool Foundation

**Date:** 2026-06-28
**Branch:** build-13-delivery-candidate-lock (BUILD-14 continues on same branch)
**Status:** COMPLETE

---

## Objective

Turn the `wowwi` repository from a single-project folder into a reusable local
playable production tool with a project registry, CLI commands, schema validation,
and a registry test suite.

---

## Validation results

### Root tooling tests (`npm test`)

```
node --test tooling/tests/registry.test.mjs

✔ registry file is valid JSON
✔ TilePyramid_PL01 is registered
✔ TilePyramid_PL01 folder exists on disk
✔ TilePyramid_PL01 required npm scripts exist in package.json
✔ TilePyramid_PL01 store URLs are present
✔ TilePyramid_PL01 supported networks include unity and applovin
✔ TilePyramid_PL01 status is delivery-locked
✔ TilePyramid_PL01 formal solvability is NOT YET PROVEN
✔ registry validator rejects missing project folder
✔ registry validator rejects missing store URLs
✔ registry validator rejects missing supported networks
✔ CLI list command runs and exits 0
✔ CLI project status command runs and exits 0
✔ CLI rejects unknown project ID with non-zero exit
✔ TilePyramid_PL01 existing unit tests still pass

tests 15  pass 15  fail 0
```

### TilePyramid_PL01 vitest suite (unchanged)

```
Test Files  14 passed (14)
     Tests  220 passed (220)
  Duration  673ms
```

### `npm run wowwi:list`

```
Wowwi Project Registry  (1 project)
────────────────────────────────────────────────────────────

  TilePyramid_PL01
    Name:     Tile Pyramid — Match Quest
    Status:   delivery-locked
    Networks: unity, applovin
    Folder:   projects/TilePyramid_PL01
    Solvability: NOT YET PROVEN
```

### `npm run wowwi:validate`

```
Validating 1 project...

  PASS  TilePyramid_PL01

Registry validation: PASS
```

### `npm run wowwi:project -- TilePyramid_PL01 status`

```
Project:      TilePyramid_PL01
Display name: Tile Pyramid — Match Quest
Status:       delivery-locked
Folder:       projects/TilePyramid_PL01
Networks:     unity, applovin

Store URLs:
  Android: https://play.google.com/store/apps/details?id=com.skl.pyramid.quest.match3.tile.puzzle.games
  iOS:     https://apps.apple.com/us/app/tile-pyramid-match-quest/id6755671033
  Fallback: https://play.google.com/store/apps/details?id=com.skl.pyramid.quest.match3.tile.puzzle.games

Last known output sizes:
  Unity HTML:    1,993,760 bytes (1.90 MB)
  AppLovin HTML: 1,993,779 bytes (1.90 MB)

Network QA evidence:
  unity: PASSED_UPLOAD_TESTING
  applovin: PASSED_UPLOAD_TESTING

Formal solvability: NOT YET PROVEN

Available workflows:
  npm run typecheck
  npm run test
  npm run build
  npm run export:all
  npm run validate:exports
  npm run test:exports
  npm run test:smoke
  npm run measure:size
  npm run package:candidate
  npm run validate:candidate
  npm run package:delivery
  npm run validate:delivery

Known limitations:
  - Final Unity Ads and AppLovin approval is not guaranteed.
  - Unity export expects network-provided window.mraid.
  - Network webviews may differ from Chromium file:// QA.
  - Formal solvability remains NOT YET PROVEN.
```

### `npm run package:delivery` (existing workflow, still PASS)

```
Delivery package: PASS
Unity:    unity/TilePyramid_PL01_unity.html  1993760 bytes
AppLovin: applovin/TilePyramid_PL01_applovin.html  1993779 bytes
```

---

## Files created

| File | Reason |
|---|---|
| `package.json` (repo root) | Root package; wowwi:* scripts and test runner |
| `tooling/project-registry/projects.json` | Registry data for TilePyramid_PL01 |
| `tooling/project-registry/schema.mjs` | `validateRegistryEntry`, `validateProjectFolderExists`, constants |
| `tooling/utils/registry-loader.mjs` | `loadRegistry()`, `REPO_ROOT`, `REGISTRY_PATH` |
| `tooling/commands/list-projects.mjs` | `wowwi:list` command |
| `tooling/commands/validate-projects.mjs` | `wowwi:validate` command |
| `tooling/commands/project-command.mjs` | `wowwi:project <id> <cmd>` dispatcher |
| `tooling/commands/run-project-workflow.mjs` | Spawns npm scripts in project folder |
| `tooling/tests/registry.test.mjs` | 15 tests (node:test / node:assert/strict) |
| `docs/WOWWI_TOOL_FOUNDATION.md` | Architecture and usage documentation |
| `docs/PROJECT_REGISTRY.md` | Registry schema and current project list |
| `docs/BUILD_14_REPORT.md` | This file |

## Files modified

| File | Change |
|---|---|
| `CLAUDE.md` | Updated current build phase to BUILD-14 |
| `README.md` | Added tooling section, delivery commands, updated test count, updated build list, extended documentation index |

## Files NOT modified

- All files under `project-input/` (untouched)
- All files under `projects/TilePyramid_PL01/src/` (untouched)
- All files under `projects/TilePyramid_PL01/scripts/` (untouched)
- All existing `docs/` files except README-level index (untouched)
- `.gitignore` (untouched)

---

## Key implementation notes

- **No new runtime dependencies.** All tooling uses Node 18+ built-ins only.
- **`REPO_ROOT` derivation.** `import.meta.url` + two `path.dirname` calls from
  `tooling/utils/registry-loader.mjs`. No `process.cwd()` fragility.
- **Windows compatibility.** `run-project-workflow.mjs` uses
  `cmd.exe /d /s /c "npm run <workflow>"` on win32, matching the pattern already
  in TilePyramid's own scripts.
- **Test 15 nested.** The root `node:test` suite spawns TilePyramid's own vitest
  run as a child process. All 220 project tests pass inside test 15.
- **Delivery chain verified.** `npm run package:delivery` still completes in full
  (14/14 Playwright export tests + 220 unit tests + candidate + delivery).

---

## What remains out of scope

Web dashboard, Vercel deployment, user accounts, cloud storage, upload automation,
billing, visual editor, new gameplay, new project creation UI, level solver, and
network API integrations.
