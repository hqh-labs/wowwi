# BUILD-17 Report — Playwright-Free Vercel Build Pipeline Fix

**Date:** 2026-06-28
**Branch:** build-17-vercel-build-fix
**Status:** COMPLETE

---

## Root cause (confirmed from Vercel logs)

The BUILD-16 Vercel build failed with:

```
Error: Command failed: npm run package:candidate
browserType.launch: Target page, context or browser has been closed
error while loading shared libraries: libnspr4.so
```

The call chain was:
```
vercel:build-preview
  → package:delivery
    → package:candidate
      → test:exports  (npm run export:all && playwright test ...)
        → export:all
          → export-runner.mjs
            → import { validateExportVisualFile } from './validators/export-visual-validator.mjs'
              → import { chromium } from '@playwright/test'
```

Two compounding problems:
1. **Import-time failure:** `export-visual-validator.mjs` statically imports `@playwright/test` at the top level. On Vercel where Playwright is not installed, this import fails — even if the function is never called.
2. **Missing system library:** Even if Playwright were installed, `libnspr4.so` and other Chromium system dependencies are not available in Vercel's build container without explicit `apt-get` installation.

---

## Fix: Playwright-free Vercel export path

### New command chain (no Playwright, no browser)

```
vercel:build-preview
  1. wowwi:validate           (static registry validation)
  2. export:all:static        (Vite build + inline + static checks only)
  3. vercel:generate-delivery (copy HTML → delivery/preview/ + write manifest)
  4. preview:build            (read delivery/preview/ manifest, generate site)
  5. preview:validate         (static content checks)
```

**No call to:** `package:candidate`, `package:delivery`, `test:exports`, `test:smoke`
**No import of:** `export-visual-validator.mjs`, `@playwright/test`
**No system library needed:** `libnspr4.so`, `libnss3`, etc.

### Key design decisions

- **`export-vercel.mjs`** — standalone exporter that imports only Playwright-free modules (`inliner/`, `validators/export-validator.mjs`, `adapters/`, `profiles/`). Does NOT import `export-runner.mjs` (which has a top-level Playwright import).

- **`delivery/preview/`** — Vercel-generated delivery writes here, NOT to `delivery/latest/`. This keeps the real delivery package untouched so `validate:delivery` still passes independently.

- **`build-preview.mjs`** — updated to try `delivery/preview/delivery-manifest.json` first, then fall back to `delivery/latest/delivery-manifest.json`. Works for both Vercel (preview path) and local (real delivery path).

---

## Vercel configuration (updated)

```json
{
  "buildCommand": "npm run vercel:build-preview",
  "outputDirectory": "apps/internal-preview/dist",
  "installCommand": "npm install && cd projects/TilePyramid_PL01 && npm install",
  "framework": null,
  "cleanUrls": true,
  "trailingSlash": false
}
```

**Changed from BUILD-16:** `npx playwright install chromium` removed from `installCommand`.

---

## Validation results

### `npm run vercel:build-preview`

```
STEP 1/5 — Validate project registry:              PASS
STEP 2/5 — Export HTML (static-only, no Playwright): PASS (1,993,760 / 1,993,779 bytes)
STEP 3/5 — Generate preview delivery manifest:     PASS
STEP 4/5 — Build internal preview site:            PASS
STEP 5/5 — Validate preview site (static):         PASS

Vercel build complete in 14.6s (was 113s in BUILD-16)
No Playwright was used.
Output: apps/internal-preview/dist/
```

### `npm run vercel:test` (15 tests)

```
✔  1. vercel.json exists at repo root
✔  2. vercel.json uses the correct build command
✔  3. vercel.json uses apps/internal-preview/dist as output directory
✔  4. vercel.json installCommand does not include playwright
✔  5. vercel-build.mjs does not call package:candidate
✔  6. vercel-build.mjs does not call package:delivery
✔  7. vercel-build.mjs does not call test:exports or test:smoke
✔  8. vercel-build.mjs does not import or require playwright
✔  9. Vercel-safe build produces Unity preview HTML
✔ 10. Vercel-safe build produces AppLovin preview HTML
✔ 11. Vercel output includes preview-data.json and home page
✔ 12. Vercel-safe output contains no window.top
✔ 13. Existing preview tests still pass (16/16)
✔ 14. Existing Wowwi registry tests still pass (15/15)
✔ 15. Local full QA: validate:delivery still passes

tests 15  pass 15  fail 0
```

### `npm run preview:validate` — PASS (13/13)

### `npm test` (root registry) — 15/15 PASS

### `npm run preview:test` — 16/16 PASS

### TilePyramid full local QA (Playwright still works locally)

| Workflow | Result |
|---|---|
| `typecheck` | PASS |
| `test` | 220/220 PASS |
| `export:all:static` | PASS (1,993,760 / 1,993,779 bytes) |
| `validate:exports:static` | PASS |
| `export:all` | PASS (with Playwright visual) |
| `validate:exports` | PASS (with Playwright visual) |
| `test:exports` | 14/14 PASS (Playwright) |
| `validate:delivery` | PASS |

### Preview output sizes

| File | Size |
|---|---|
| `dist/projects/TilePyramid_PL01/unity.html` | 1,993,760 bytes (1.90 MB) |
| `dist/projects/TilePyramid_PL01/applovin.html` | 1,993,779 bytes (1.90 MB) |

---

## Files created

| File | Purpose |
|---|---|
| `projects/TilePyramid_PL01/scripts/export/export-vercel.mjs` | Playwright-free exporter (Vite build + static checks) |
| `projects/TilePyramid_PL01/scripts/export/validate-exports-static.mjs` | Static-only export validator |
| `apps/internal-preview/scripts/generate-preview-delivery.mjs` | Copy exports to `delivery/preview/` + write manifest |
| `docs/BUILD_17_REPORT.md` | This file |

## Files modified

| File | Change |
|---|---|
| `apps/internal-preview/scripts/vercel-build.mjs` | Rewrote pipeline: no package:delivery/candidate/playwright |
| `apps/internal-preview/scripts/build-preview.mjs` | Try `delivery/preview/` first, fall back to `delivery/latest/` |
| `apps/internal-preview/scripts/validate-lib.mjs` | Added playwright check to `validateVercelConfig` |
| `apps/internal-preview/tests/vercel-build.test.mjs` | Rewrote to 15 tests; added tests 4-8 (Playwright-free assertions) |
| `projects/TilePyramid_PL01/package.json` | Added `export:all:static`, `validate:exports:static` |
| `package.json` | Added `vercel:generate-delivery`; bumped to 0.17.0 |
| `vercel.json` | Removed `playwright` from installCommand |
| `CLAUDE.md` | Updated to BUILD-17 |
| `README.md` | Added BUILD-17 to build list |
| `docs/VERCEL_DEPLOYMENT.md` | Updated pipeline description, removed Playwright section |
| `docs/VERCEL_PREVIEW_CHECKLIST.md` | Updated installCommand line |
| `docs/VERCEL_PREVIEW_PREP.md` | Added BUILD-17 notice, updated vercel.json, updated status table |

## Files NOT modified

- All files under `project-input/` (untouched)
- All files under `projects/TilePyramid_PL01/src/` (untouched)
- All gameplay scripts (untouched)
- `export-runner.mjs` (untouched — still used by local `export:all`)
- `export-visual-validator.mjs` (untouched — still used by local `export:all`)
- `package-candidate.mjs`, `package-delivery.mjs` (untouched — still work locally)
- `tooling/` (untouched)

---

## Exact Vercel-safe command chain

```
npm run vercel:build-preview
  Step 1: node tooling/commands/validate-projects.mjs
  Step 2: cd projects/TilePyramid_PL01 && node scripts/export/export-vercel.mjs
            (imports: inliner, export-validator, network-adapters, profiles)
            (does NOT import: export-visual-validator, @playwright/test)
  Step 3: node apps/internal-preview/scripts/generate-preview-delivery.mjs
            (reads exports/latest/export-manifest.json)
            (writes delivery/preview/{unity,applovin}/*.html)
            (writes delivery/preview/delivery-manifest.json)
  Step 4: node apps/internal-preview/scripts/build-preview.mjs
            (reads delivery/preview/delivery-manifest.json)
            (writes apps/internal-preview/dist/)
  Step 5: node apps/internal-preview/scripts/validate-preview.mjs
            (static checks: no window.top, no project-input, checksums, store URLs)
```

## Local full QA (Playwright — unchanged)

```
cd projects/TilePyramid_PL01
npm run typecheck         # TypeScript: PASS
npm run test              # Vitest: 220/220 PASS
npm run export:all        # Full export + visual validation (Playwright)
npm run validate:exports  # Static + visual validation (Playwright)
npm run test:exports      # 14 Playwright tests: PASS
npm run package:candidate # Full candidate package (Playwright)
npm run validate:candidate
npm run package:delivery  # Full delivery package (Playwright)
npm run validate:delivery # PASS
```

---

## Git status

```
 M .claude/settings.json
 M apps/internal-preview/scripts/build-preview.mjs
 M apps/internal-preview/scripts/validate-lib.mjs
 M apps/internal-preview/scripts/vercel-build.mjs
 M apps/internal-preview/tests/vercel-build.test.mjs
 M CLAUDE.md
 M docs/VERCEL_DEPLOYMENT.md
 M docs/VERCEL_PREVIEW_CHECKLIST.md
 M docs/VERCEL_PREVIEW_PREP.md
 M package.json
 M projects/TilePyramid_PL01/package.json
 M README.md
 M vercel.json
?? apps/internal-preview/scripts/generate-preview-delivery.mjs
?? docs/BUILD_17_REPORT.md
?? projects/TilePyramid_PL01/scripts/export/export-vercel.mjs
?? projects/TilePyramid_PL01/scripts/export/validate-exports-static.mjs
```

Nothing committed. Nothing pushed.

---

## Manual Vercel redeploy instructions

After merging this branch to main:

1. Open [vercel.com](https://vercel.com) and go to the project.
2. Trigger a new deployment (push to connected branch or click **Redeploy**).
3. Verify the build log shows:
   - Step 2 shows `export:all:static` (NOT `package:delivery`)
   - No Playwright output
   - Total build time ~2–4 minutes (not 5–10)
4. Verify the deployed URL loads correctly.

If this is a fresh Vercel project connect:

1. Import `hqh-labs/wowwi` in Vercel.
2. Framework Preset: **Other** (leave all build/output/install fields blank — inherited from `vercel.json`).
3. Click **Deploy**.

## Build performance comparison

| Metric | BUILD-16 (broken) | BUILD-17 (fixed) |
|---|---|---|
| installCommand includes playwright | YES | NO |
| Playwright called during build | YES (via package:delivery) | NO |
| Vercel system lib requirement | libnspr4.so etc. | None |
| Local build time | ~113s | ~15s |
| Visual smoke tests in Vercel | YES (then crashed) | NO (by design) |
| Visual smoke tests locally | YES | YES (unchanged) |
| Vercel deploy expected to work | NO (crashed) | YES |
