# BUILD-16 Report — Vercel Deployment Configuration and Deploy Prep

**Date:** 2026-06-28
**Branch:** build-16-vercel-deployment-wiring
**Status:** COMPLETE

---

## Objective

Prepare the Wowwi internal preview site for Vercel deployment by:
- Creating `vercel.json` with the correct build command and output directory
- Creating `vercel:build-preview` (5-step pipeline that generates delivery HTML during build)
- Solving the BUILD-15 blocker: delivery HTML is now generated inside the Vercel build itself
- Adding 14 Vercel-specific tests, preflight script, and deployment documentation
- No actual Vercel deployment was performed

---

## Vercel configuration

**`vercel.json` (repo root):**

```json
{
  "buildCommand": "npm run vercel:build-preview",
  "outputDirectory": "apps/internal-preview/dist",
  "installCommand": "npm install && cd projects/TilePyramid_PL01 && npm install && npx playwright install chromium",
  "framework": null,
  "cleanUrls": true,
  "trailingSlash": false
}
```

**Build command:** `npm run vercel:build-preview`
**Output directory:** `apps/internal-preview/dist`

---

## `vercel:build-preview` pipeline

```
Step 1/5 — wowwi:validate        (registry validation)
Step 2/5 — package:delivery       (TilePyramid delivery + 14 Playwright tests)
Step 3/5 — validate:delivery
Step 4/5 — preview:build
Step 5/5 — preview:validate
```

**Total runtime (local):** ~113s

---

## Validation results

### `npm run vercel:build-preview`

```
STEP 1/5 — Validate project registry:        PASS
STEP 2/5 — Generate TilePyramid delivery:    PASS (14/14 Playwright)
STEP 3/5 — Validate delivery:                PASS
STEP 4/5 — Build internal preview site:      PASS
STEP 5/5 — Validate internal preview site:   PASS

Vercel build complete in 113.3s
Output: apps/internal-preview/dist/
```

### `npm run vercel:test` (14 tests)

```
✔  1. vercel.json exists at repo root
✔  2. vercel.json uses the correct build command
✔  3. vercel.json uses apps/internal-preview/dist as output directory
✔  4. Vercel build command generates TilePyramid delivery first
✔  5. Vercel build command generates preview dist
✔  6. Vercel output includes Unity HTML
✔  7. Vercel output includes AppLovin HTML
✔  8. Vercel output includes preview-data.json
✔  9. Vercel output excludes project-input
✔ 10. Vercel output excludes raw/extracted asset folders
✔ 11. Vercel output contains no forbidden window.top
✔ 12. Existing preview tests still pass (16/16)
✔ 13. Existing Wowwi registry tests still pass (15/15)
✔ 14. Existing TilePyramid delivery workflow still passes

tests 14  pass 14  fail 0
```

### `npm run preview:validate` (13/13 PASS)

All checks including home page, project page, Unity/AppLovin HTML, checksums,
store URLs, formal solvability, no project-input, no window.top.

### Root registry tests (`npm test`)

15/15 PASS — 220 TilePyramid vitest tests included in test 15.

### TilePyramid full suite

| Workflow | Result |
|---|---|
| `typecheck` | PASS |
| `test` | 220/220 PASS |
| `export:all` | PASS (1,993,760 / 1,993,779 bytes) |
| `validate:exports` | PASS |
| `test:exports` | 14/14 PASS (Playwright) |
| `validate:delivery` | PASS |

### Preview output file sizes

| File | Size |
|---|---|
| Unity preview HTML | 1,993,760 bytes (1.90 MB) |
| AppLovin preview HTML | 1,993,779 bytes (1.90 MB) |

---

## Files created

| File | Purpose |
|---|---|
| `vercel.json` | Vercel build/output config |
| `apps/internal-preview/scripts/vercel-build.mjs` | 5-step Vercel build pipeline |
| `apps/internal-preview/scripts/vercel-preflight.mjs` | Pre-deploy full verification |
| `apps/internal-preview/tests/vercel-build.test.mjs` | 14 Vercel deployment tests |
| `docs/VERCEL_DEPLOYMENT.md` | Vercel deployment guide + manual UI steps |
| `docs/VERCEL_PREVIEW_CHECKLIST.md` | Pre/post deployment verification checklist |
| `docs/BUILD_16_REPORT.md` | This file |

## Files modified

| File | Change |
|---|---|
| `apps/internal-preview/scripts/validate-lib.mjs` | Added `validateVercelConfig()` export; added forbidden-dir checks |
| `package.json` | Added `vercel:build-preview`, `vercel:validate-preview`, `vercel:preflight`, `vercel:test`; bumped version to 0.16.0 |
| `CLAUDE.md` | Updated current build phase to BUILD-16 |
| `README.md` | Added Vercel section, updated build list and docs index |
| `docs/VERCEL_PREVIEW_PREP.md` | Updated status table, replaced placeholder vercel.json with real one |

## Files NOT modified

- All files under `project-input/` (untouched)
- All files under `projects/TilePyramid_PL01/src/` (untouched)
- All gameplay scripts (untouched)
- `tooling/` (untouched)
- BUILD-15 scripts: `build-preview.mjs`, `serve-preview.mjs`, `validate-preview.mjs` (untouched)
- BUILD-15 tests: `preview-build.test.mjs` (untouched)

---

## Git status

```
 M CLAUDE.md
 M README.md
 M apps/internal-preview/scripts/validate-lib.mjs
 M docs/VERCEL_PREVIEW_PREP.md
 M package.json
?? apps/internal-preview/scripts/vercel-build.mjs
?? apps/internal-preview/scripts/vercel-preflight.mjs
?? apps/internal-preview/tests/vercel-build.test.mjs
?? docs/VERCEL_DEPLOYMENT.md
?? docs/VERCEL_PREVIEW_CHECKLIST.md
?? vercel.json
```

Nothing committed. Nothing pushed.

---

## Manual Vercel UI steps

1. Open [vercel.com](https://vercel.com) and sign in.
2. Click **Add New → Project**.
3. Import GitHub repo **`hqh-labs/wowwi`**.
4. On Configure Project: set **Framework Preset** to **Other**; leave build/output/install fields blank (inherited from `vercel.json`).
5. Click **Deploy**.
6. Wait ~5–10 min for install + Playwright + 14 export tests + preview build.
7. Open deployed URL and verify:
   - Home page shows TilePyramid_PL01 project card
   - Project detail page shows `delivery-locked` status, checksums, store URLs
   - "Open Unity Preview" link opens the game
   - "Open AppLovin Preview" link opens the game

---

## Known limitations

1. **Playwright in Vercel.** The installCommand runs `npx playwright install chromium` and
   may require Linux system dependencies (`libglib2.0-0`, `libnss3`, etc.) on Vercel's
   build container. If the build fails for this reason, add a `vercel-build.sh` that
   installs dependencies via `apt-get` before `npm install`.

2. **Build time.** ~90–120s locally; 5–10 minutes on first Vercel deploy (Playwright install).

3. **No authentication.** The deployed preview is public by default. Add Vercel
   Password Protection before sharing the URL externally.

4. **Delivery HTML freshness.** Each Vercel deploy regenerates delivery HTML from source.
   If gameplay source changes, the preview delivery HTML will differ from the
   delivery-locked candidate. This is by design for a preview site.

## Recommended next build

**BUILD-17:** Connect the repo to Vercel and verify the live deployment. Or add
GitHub Actions CI that runs `vercel:preflight` on PRs. Or add password protection
to the Vercel deployment.
