# BUILD-19 Report — Live Preview QA Lock

**Date:** 2026-06-28
**Branch:** build-19-live-preview-qa-lock
**Status:** COMPLETE

---

## 1. Current branch

`build-19-live-preview-qa-lock`

---

## 2. Live preview QA lock implemented

The Vercel internal preview at `https://wowwi.vercel.app` has been manually
QA-verified and locked as a milestone. All four key pages load correctly:

| Page | URL | Result |
|---|---|---|
| Home | `https://wowwi.vercel.app/` | ✔ PASS |
| Detail | `https://wowwi.vercel.app/projects/TilePyramid_PL01` | ✔ PASS |
| Unity preview | `https://wowwi.vercel.app/projects/TilePyramid_PL01/unity` | ✔ PASS |
| AppLovin preview | `https://wowwi.vercel.app/projects/TilePyramid_PL01/applovin` | ✔ PASS |

The BUILD-18 routing fix (absolute preview link paths) is confirmed working on
the live deployment. No 404 errors occur on the Unity or AppLovin preview buttons.

---

## 3. Live preview base URL

`https://wowwi.vercel.app`

---

## 4. QA status per page

| Page | Loads | Correct content | No 404 | Notes |
|---|---|---|---|---|
| Home | ✔ | ✔ | ✔ | Project card shown |
| TilePyramid detail | ✔ | ✔ | ✔ | Metadata, store URLs, QA evidence |
| Unity preview | ✔ | ✔ | ✔ | Game renders, no `window.top` |
| AppLovin preview | ✔ | ✔ | ✔ | Game renders, no `window.top` |

Preview link hrefs on detail page:
- Unity: `/projects/TilePyramid_PL01/unity.html` → Vercel serves at `/projects/TilePyramid_PL01/unity` ✔
- AppLovin: `/projects/TilePyramid_PL01/applovin.html` → Vercel serves at `/projects/TilePyramid_PL01/applovin` ✔

Formal solvability displayed: `NOT YET PROVEN` ✔
Known limitations displayed: 4 items ✔
Store URLs displayed: Android + iOS ✔
Network QA evidence: `PASSED_UPLOAD_TESTING` for Unity and AppLovin ✔

---

## 5. Access notes created

`docs/INTERNAL_PREVIEW_ACCESS_NOTES.md` created. Documents:
- No login or authentication is currently implemented
- Who can access and what is safe to share
- What content is/is not in the deployed preview
- Recommended access controls (Vercel Deployment Protection)
- Future build recommendation

---

## 6. Registry/live metadata changes

Extended `tooling/project-registry/projects.json` with optional live preview
metadata for `TilePyramid_PL01`:

```json
{
  "livePreviewUrl": "https://wowwi.vercel.app/projects/TilePyramid_PL01",
  "livePreviewStatus": "verified",
  "livePreviewLastVerifiedAt": "2026-06-28",
  "livePreviewPages": {
    "home": "https://wowwi.vercel.app/",
    "detail": "https://wowwi.vercel.app/projects/TilePyramid_PL01",
    "unity": "https://wowwi.vercel.app/projects/TilePyramid_PL01/unity",
    "applovin": "https://wowwi.vercel.app/projects/TilePyramid_PL01/applovin"
  }
}
```

These fields are outside the required schema fields and do not affect
`wowwi:validate` or any existing workflow. URLs use Vercel's clean URL format
(no `.html` extension, as `cleanUrls: true` in `vercel.json` serves `.html` files
at extensionless paths).

---

## 7. Validation results

| Check | Result |
|---|---|
| `wowwi:list` | PASS (1 project) |
| `wowwi:validate` | PASS |
| `wowwi:project TilePyramid_PL01 status` | PASS |
| `preview:build` | PASS |
| `preview:validate` (16 checks) | PASS |
| `vercel:build-preview` (5 steps, ~7s, no Playwright) | PASS |
| `preview:validate` (post-Vercel) | PASS |

---

## 8. Test results

| Suite | Tests | Result |
|---|---|---|
| `npm test` (registry) | 15/15 | PASS |
| `npm run preview:test` | 24/24 | PASS |
| `npm run vercel:test` | 17/17 | PASS |
| `npm run live-preview:test` (new) | 8/8 | PASS |
| TilePyramid unit tests | 220/220 | PASS |
| TilePyramid `test:exports` (Playwright) | 14/14 | PASS |
| TilePyramid `test:smoke` (Playwright) | 26/26 | PASS |
| TilePyramid `validate:delivery` | PASS | PASS |

---

## 9. Files created or changed

### Created (4 files)

| File | Purpose |
|---|---|
| `docs/LIVE_PREVIEW_QA.md` | Manual QA record for live Vercel preview (home/detail/Unity/AppLovin) |
| `docs/INTERNAL_PREVIEW_ACCESS_NOTES.md` | Access status, content inventory, recommended controls |
| `tooling/tests/live-preview.test.mjs` | 8 static local tests for docs and registry metadata |
| `docs/BUILD_19_REPORT.md` | This file |

### Modified (4 files)

| File | Change |
|---|---|
| `tooling/project-registry/projects.json` | Added `livePreviewUrl`, `livePreviewStatus`, `livePreviewLastVerifiedAt`, `livePreviewPages` |
| `package.json` | Added `live-preview:test` script |
| `CLAUDE.md` | Updated to BUILD-19 |
| `README.md` | Added BUILD-19 to build list; updated test counts; added `live-preview:test` |

---

## 10. Git status

```
 M CLAUDE.md
 M README.md
 M package.json
 M tooling/project-registry/projects.json
?? docs/BUILD_19_REPORT.md
?? docs/INTERNAL_PREVIEW_ACCESS_NOTES.md
?? docs/LIVE_PREVIEW_QA.md
?? tooling/tests/live-preview.test.mjs
```

Nothing committed. Nothing pushed.

---

## 11. Manual live preview recheck instructions

1. Open `https://wowwi.vercel.app/` — confirm home page loads with TilePyramid card.
2. Click the TilePyramid_PL01 card — confirm detail page loads at `/projects/TilePyramid_PL01`.
3. Confirm formal solvability shows `NOT YET PROVEN`.
4. Click "Open Unity Preview" — confirm no 404, game loads.
5. Click "Open AppLovin Preview" — confirm no 404, game loads.
6. Inspect preview button hrefs — confirm they include `/TilePyramid_PL01/` in the path.

To also re-run local validation after any code change:
```sh
npm run preview:build && npm run preview:validate
npm run vercel:build-preview
npm run preview:test        # 24 tests
npm run vercel:test         # 17 tests
npm run live-preview:test   # 8 tests
```

---

## 12. Known limitations

- Live preview has no authentication. Do not share publicly before enabling
  Vercel Deployment Protection. See `docs/INTERNAL_PREVIEW_ACCESS_NOTES.md`.
- Live preview URLs in the registry (`livePreviewPages`) are manually maintained
  and can become stale if the Vercel project URL changes.
- Formal solvability of Level_21 remains NOT YET PROVEN.
- Visual Playwright smoke tests are not run in the Vercel build path.

---

## 13. Recommended next build

**BUILD-20:** Enable Vercel Deployment Protection (password or team-only access)
before sharing the preview URL with external parties. This is a Vercel account
action, not a code change — but BUILD-20 could document the protection status
and add a checklist item to `VERCEL_PREVIEW_CHECKLIST.md`.

Alternatively, the next content build could be a new ad-network profile,
gameplay iteration, or second project onboarding.

---

## 14. No Vercel deployment performed

No Vercel deployment was performed from Claude. The live URL
(`https://wowwi.vercel.app`) was already live from a prior manual deployment
after BUILD-17/18 was merged.

---

## 15. Nothing committed or pushed

Nothing was committed. Nothing was pushed. All changes are working tree only.
