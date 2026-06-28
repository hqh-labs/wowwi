# BUILD-15 Report — Internal Preview Site Foundation

**Date:** 2026-06-28
**Branch:** build-15-preview-site-foundation
**Status:** COMPLETE

---

## Objective

Create a local internal preview site foundation. Reads the project registry and
delivery manifests, copies delivery HTML into a static dist folder, and generates
project pages with metadata, checksums, QA evidence, store URLs, and playable HTML
preview links.

---

## Preview site details

| Item | Value |
|---|---|
| Output folder | `apps/internal-preview/dist/` |
| Home page | `dist/index.html` |
| TilePyramid project page | `dist/projects/TilePyramid_PL01/index.html` |
| Unity preview HTML | `dist/projects/TilePyramid_PL01/unity.html` |
| AppLovin preview HTML | `dist/projects/TilePyramid_PL01/applovin.html` |
| Preview data JSON | `dist/preview-data.json` |
| Unity preview file size | 1,993,760 bytes (1.90 MB) |
| AppLovin preview file size | 1,993,779 bytes (1.90 MB) |
| New npm dependencies | **Zero** |

---

## Validation results

### `npm run preview:build`

```
Wowwi Preview Build — BUILD-15
──────────────────────────────────────────────────
Loaded registry: 1 project(s)
Copied Unity HTML    → dist/projects/TilePyramid_PL01/unity.html
Copied AppLovin HTML → dist/projects/TilePyramid_PL01/applovin.html
Generated            → dist/projects/TilePyramid_PL01/index.html
Generated            → dist/preview-data.json
Generated            → dist/index.html

Preview build complete. Output: apps/internal-preview/dist/
```

### `npm run preview:validate`

```
  PASS  dist/index.html exists
  PASS  dist/preview-data.json exists
  PASS  dist/projects/TilePyramid_PL01/index.html exists
  PASS  dist/projects/TilePyramid_PL01/unity.html exists
  PASS  dist/projects/TilePyramid_PL01/applovin.html exists
  PASS  preview-data contains Android store URL
  PASS  preview-data contains iOS store URL
  PASS  preview-data formal solvability is NOT YET PROVEN
  PASS  preview-data contains Unity checksum
  PASS  preview-data contains AppLovin checksum
  PASS  dist does not contain project-input
  PASS  Unity preview HTML has no forbidden window.top
  PASS  AppLovin preview HTML has no forbidden window.top

Preview validation: PASS
```

### `npm run preview:serve`

```
Wowwi Internal Preview — BUILD-15
────────────────────────────────────────
  Local: http://localhost:4174
```
(Tested; server started and printed URL; stopped immediately.)

### `npm run preview:test` (16 tests)

```
✔ 1. Preview build can load the registry
✔ 2. Preview build includes TilePyramid_PL01
✔ 3. Preview build reads delivery manifest
✔ 4. Preview output home page exists
✔ 5. Preview output TilePyramid page exists
✔ 6. Preview output Unity HTML exists
✔ 7. Preview output AppLovin HTML exists
✔ 8. Preview data contains Android store URL
✔ 9. Preview data contains iOS store URL
✔ 10. Preview data contains formal solvability NOT YET PROVEN
✔ 11. Preview output does not include project-input
✔ 12. Preview validator rejects missing Unity preview HTML
✔ 13. Preview validator rejects missing AppLovin preview HTML
✔ 14. Preview validator rejects forbidden window.top
✔ 15. Existing Wowwi registry tests still pass
✔ 16. Existing TilePyramid delivery workflow still passes

tests 16  pass 16  fail 0
```

### Root tool commands

```
npm run wowwi:list         PASS (1 project listed)
npm run wowwi:validate     PASS (TilePyramid_PL01)
npm run wowwi:project -- TilePyramid_PL01 status  PASS
npm test                   15/15 PASS (incl. 220 vitest tests in test 15)
```

### TilePyramid_PL01 full pipeline

| Workflow | Result |
|---|---|
| `typecheck` | PASS |
| `test` | 220/220 PASS |
| `build` | PASS |
| `export:all` | PASS (Unity 1,993,760 bytes / AppLovin 1,993,779 bytes) |
| `validate:exports` | PASS |
| `test:exports` | 14/14 PASS (Playwright) |
| `test:smoke` | 26/26 PASS (Playwright) |
| `measure:size` | PASS |
| `package:candidate` | PASS |
| `validate:candidate` | PASS |
| `package:delivery` | PASS |
| `validate:delivery` | PASS |

---

## Files created

| File | Purpose |
|---|---|
| `apps/internal-preview/scripts/build-preview.mjs` | Site generator |
| `apps/internal-preview/scripts/validate-preview.mjs` | CLI validator |
| `apps/internal-preview/scripts/validate-lib.mjs` | Shared validation logic |
| `apps/internal-preview/scripts/serve-preview.mjs` | Local HTTP server |
| `apps/internal-preview/tests/preview-build.test.mjs` | 16 tests |
| `docs/INTERNAL_PREVIEW_SITE.md` | Preview site documentation |
| `docs/VERCEL_PREVIEW_PREP.md` | Vercel readiness documentation |
| `docs/BUILD_15_REPORT.md` | This file |

## Files modified

| File | Change |
|---|---|
| `package.json` | Added `preview:build`, `preview:validate`, `preview:serve`, `preview:test`; bumped version to 0.15.0 |
| `.gitignore` | Added `apps/internal-preview/dist/` |
| `CLAUDE.md` | Updated current build phase to BUILD-15 |
| `README.md` | Added preview site section, updated build list and docs index |

## Files NOT modified

- All files under `project-input/` (untouched)
- All files under `projects/TilePyramid_PL01/src/` (untouched)
- All files under `projects/TilePyramid_PL01/scripts/` (untouched)
- All existing `docs/` files except README-level index (untouched)
- `tooling/` (untouched)

---

## How to use

```sh
# From repo root:

# 1. Build the preview site (reads delivery files automatically)
npm run preview:build

# 2. Serve it
npm run preview:serve
# → Open http://localhost:4174

# 3. Validate it
npm run preview:validate

# 4. Run tests
npm run preview:test
```

If delivery files don't exist yet:
```sh
cd projects/TilePyramid_PL01
npm run package:delivery
cd ../..
npm run preview:build
```

---

## Git status

```
 M .gitignore
 M CLAUDE.md
 M README.md
 M package.json
?? apps/
?? docs/INTERNAL_PREVIEW_SITE.md
?? docs/VERCEL_PREVIEW_PREP.md
```

Nothing committed. Nothing pushed.

---

## Known limitations

- Preview site is static; no live data, no real-time project status.
- `preview:serve` does not support HTTPS or authentication.
- Validator hardcodes TilePyramid_PL01 paths; adding a second project
  requires extending the validator.
- Delivery HTML must exist before preview:build runs. No automatic trigger.
- Vercel deployment is documented but not implemented.

## Recommended next build

**BUILD-16**: Vercel deployment or enhanced project management tooling.
Options include:
- Committing a `vercel.json` and wiring up the build pipeline for actual deployment
- Adding a second project to the registry
- Adding a `wowwi:new-project` scaffolding command
