# BUILD-18 Report — Vercel Preview Routing Fix

**Date:** 2026-06-28
**Branch:** build-18-preview-routing-fix
**Status:** COMPLETE

---

## Live Vercel issue found

After merging BUILD-17, the live Vercel deployment showed:
- Home page loads ✓
- TilePyramid_PL01 detail page loads ✓
- Clicking "Open Unity Preview" → `404: NOT_FOUND` at `/projects/unity`
- Clicking "Open AppLovin Preview" → `404: NOT_FOUND` at `/projects/applovin`

---

## Root cause

In `apps/internal-preview/scripts/build-preview.mjs`, the preview links were generated as:

```js
const unityPreviewPath = `unity.html`;
const applovinPreviewPath = `applovin.html`;
```

The detail page is at `dist/projects/TilePyramid_PL01/index.html`. Under Vercel's config:

```json
"cleanUrls": true,
"trailingSlash": false
```

Vercel strips `index.html` from directory index URLs and removes the trailing slash, so the detail page URL becomes:

```
/projects/TilePyramid_PL01    ← no trailing slash
```

From that URL, the browser resolves relative `unity.html` against the last `/` in the path:

```
base: /projects/
href: unity.html
result: /projects/unity.html
cleanUrls redirect → /projects/unity → 404
```

This was a browser URL resolution issue, not a server routing issue. The files existed in the right place; the hrefs pointed to the wrong URL.

The same issue would occur locally with `preview:serve` if the user navigated to `/projects/TilePyramid_PL01` (without trailing slash), though clicking from the home page (which links to `projects/TilePyramid_PL01/index.html`) worked locally since the `.html` URL preserved the path.

---

## Fix implemented

Changed `build-preview.mjs` to use absolute root paths:

```js
// BEFORE (broken on Vercel)
const unityPreviewPath = `unity.html`;
const applovinPreviewPath = `applovin.html`;

// AFTER (correct on Vercel and locally)
const unityPreviewPath = `/projects/${project.projectId}/unity.html`;
const applovinPreviewPath = `/projects/${project.projectId}/applovin.html`;
```

### Why absolute paths work

**On Vercel** — `/projects/TilePyramid_PL01/unity.html` is an explicit absolute path. Vercel's cleanUrls serves `unity.html` at this path correctly (redirecting to `/projects/TilePyramid_PL01/unity` if needed, which serves the file).

**Locally** — `serve-preview.mjs` maps request paths directly to `dist/`. The file `dist/projects/TilePyramid_PL01/unity.html` exists and is served at `/projects/TilePyramid_PL01/unity.html`.

---

## Correct preview URLs

| Network | Generated link href | Resolves to (local) | Resolves to (Vercel) |
|---|---|---|---|
| Unity | `/projects/TilePyramid_PL01/unity.html` | `dist/projects/TilePyramid_PL01/unity.html` | `/projects/TilePyramid_PL01/unity` (cleanUrls) |
| AppLovin | `/projects/TilePyramid_PL01/applovin.html` | `dist/projects/TilePyramid_PL01/applovin.html` | `/projects/TilePyramid_PL01/applovin` (cleanUrls) |

---

## Validator hardening

Updated `validate-lib.mjs` to reject known-broken link patterns:

1. **Reject `/projects/unity`** — missing project ID (pre-BUILD-18 bug)
2. **Reject `/projects/applovin`** — missing project ID (pre-BUILD-18 bug)
3. **Verify preview link targets exist in dist** — parse `class="preview-link"` hrefs and check each target file

The validator now parses the generated TilePyramid detail page and:
- Checks for known-bad href patterns
- Resolves each preview-link href and verifies the target file exists in dist

`validate-preview.mjs` updated to BUILD-18 with 3 new check labels:
- `detail page Unity link is not missing project ID`
- `detail page AppLovin link is not missing project ID`
- `preview link targets exist in dist`

---

## Validation results

### `npm run wowwi:list` — PASS (1 project)

### `npm run wowwi:validate` — PASS

### `npm run preview:build` — PASS

### `npm run preview:validate` — PASS (16/16 checks)

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
  PASS  detail page Unity link is not missing project ID
  PASS  detail page AppLovin link is not missing project ID
  PASS  preview link targets exist in dist

Preview validation: PASS
```

### `npm run preview:test` — **24/24 PASS** (was 16/16)

New tests 17–24 all pass:
- ✔ 17. Detail page contains unity.html in preview link href
- ✔ 18. Detail page contains applovin.html in preview link href
- ✔ 19. Unity preview link resolves to dist/projects/TilePyramid_PL01/unity.html
- ✔ 20. AppLovin preview link resolves to dist/projects/TilePyramid_PL01/applovin.html
- ✔ 21. Detail page does not contain /projects/unity (broken Vercel path)
- ✔ 22. Detail page does not contain /projects/applovin (broken Vercel path)
- ✔ 23. Preview validator rejects broken Unity preview link (missing project ID)
- ✔ 24. Preview validator rejects broken AppLovin preview link (missing project ID)

### `npm run vercel:build-preview` — PASS (5/5 steps, ~7s, no Playwright)

### `npm run vercel:test` — **17/17 PASS** (was 15/15)

New tests 16–17:
- ✔ 16. Vercel build detail page uses correct Unity preview path (project-scoped)
- ✔ 17. Vercel build detail page uses correct AppLovin preview path (project-scoped)

### `npm test` (root registry) — **15/15 PASS**

### TilePyramid full local QA

| Workflow | Result |
|---|---|
| `typecheck` | PASS |
| `test` | 220/220 PASS |
| `export:all:static` | PASS (1,993,760 / 1,993,779 bytes) |
| `validate:exports:static` | PASS |
| `export:all` | PASS (Playwright) |
| `validate:exports` | PASS (Playwright) |
| `test:exports` | 14/14 PASS (Playwright) |
| `test:smoke` | 26/26 PASS (Playwright) |
| `measure:size` | PASS |
| `package:candidate` | PASS |
| `validate:candidate` | PASS |
| `package:delivery` | PASS |
| `validate:delivery` | PASS |

---

## Files changed

| File | Change |
|---|---|
| `apps/internal-preview/scripts/build-preview.mjs` | Changed preview link hrefs from relative to absolute project-scoped paths |
| `apps/internal-preview/scripts/validate-lib.mjs` | Added link-path validation: reject missing project-ID hrefs, verify target files exist in dist |
| `apps/internal-preview/scripts/validate-preview.mjs` | Updated to BUILD-18; added 3 new check labels |
| `apps/internal-preview/tests/preview-build.test.mjs` | Added 8 tests (17–24) for link path correctness and validator rejection |
| `apps/internal-preview/tests/vercel-build.test.mjs` | Added 2 tests (16–17) for Vercel build link path correctness |
| `CLAUDE.md` | Updated to BUILD-18 |
| `README.md` | Added BUILD-18 to build list |
| `docs/BUILD_18_REPORT.md` | This file |

## Files NOT changed

- `vercel.json` (unchanged — `cleanUrls`/`trailingSlash` settings are correct; the problem was in link generation)
- All gameplay source files (unchanged)
- All export/candidate/delivery scripts (unchanged)
- `export-vercel.mjs`, `export-runner.mjs` (unchanged)
- All files under `project-input/` (unchanged)

---

## Git status

```
 M apps/internal-preview/scripts/build-preview.mjs
 M apps/internal-preview/scripts/validate-lib.mjs
 M apps/internal-preview/scripts/validate-preview.mjs
 M apps/internal-preview/tests/preview-build.test.mjs
 M apps/internal-preview/tests/vercel-build.test.mjs
 M CLAUDE.md
 M README.md
?? docs/BUILD_18_REPORT.md
```

Plus outstanding untracked/modified files from BUILD-17 (not yet committed):
```
 M package.json
 M projects/TilePyramid_PL01/package.json
 M vercel.json
 M apps/internal-preview/scripts/vercel-build.mjs
 M apps/internal-preview/scripts/validate-lib.mjs  (also BUILD-17)
 M apps/internal-preview/tests/vercel-build.test.mjs  (also BUILD-17)
?? apps/internal-preview/scripts/generate-preview-delivery.mjs
?? projects/TilePyramid_PL01/scripts/export/export-vercel.mjs
?? projects/TilePyramid_PL01/scripts/export/validate-exports-static.mjs
?? docs/BUILD_17_REPORT.md
```

Nothing committed. Nothing pushed.

---

## Manual Vercel redeploy instructions

To deploy this fix:

1. Merge `build-18-preview-routing-fix` into `main`.
2. Open [vercel.com](https://vercel.com) and navigate to the wowwi project.
3. Trigger a new deployment (push to connected branch or click **Redeploy**).
4. Verify the build log shows:
   - Step 2 (`export:all:static`) completes without error
   - No Playwright output
5. After deployment, verify:
   - Home page loads
   - TilePyramid_PL01 detail page loads at `/projects/TilePyramid_PL01`
   - Clicking "Open Unity Preview" → opens the Unity HTML (no 404)
   - Clicking "Open AppLovin Preview" → opens the AppLovin HTML (no 404)

No Vercel deployment was performed from Claude.
