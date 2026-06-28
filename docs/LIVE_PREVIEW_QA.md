# Live Preview QA — TilePyramid_PL01

**Build:** BUILD-19
**Live base URL:** `https://wowwi.vercel.app`
**QA date:** 2026-06-28
**Branch at QA:** `build-18-preview-routing-fix` (merged to `main`)
**QA type:** Manual — internal review tooling verification

> **Important:** This preview is internal-review tooling only. It is not the
> ad-network upload artifact. The delivery-locked HTML files in this preview
> are copies of the locked delivery package. Final Unity Ads and AppLovin
> approval must use the files from `projects/TilePyramid_PL01/delivery/latest/`.

---

## Live URLs

| Page | URL | Status |
|---|---|---|
| Home | `https://wowwi.vercel.app/` | ✔ PASS |
| TilePyramid detail | `https://wowwi.vercel.app/projects/TilePyramid_PL01` | ✔ PASS |
| Unity playable preview | `https://wowwi.vercel.app/projects/TilePyramid_PL01/unity` | ✔ PASS |
| AppLovin playable preview | `https://wowwi.vercel.app/projects/TilePyramid_PL01/applovin` | ✔ PASS |

**Note on URLs:** Vercel's `cleanUrls: true` setting serves `.html` files at
extensionless paths. The internal preview links use absolute paths
`/projects/TilePyramid_PL01/unity.html` and
`/projects/TilePyramid_PL01/applovin.html`, which Vercel redirects to
`/projects/TilePyramid_PL01/unity` and `/projects/TilePyramid_PL01/applovin`.

---

## Page QA results

### Home page (`/`)

- [x] Page loads without error
- [x] TilePyramid_PL01 card is displayed
- [x] Status badge shows `delivery-locked`
- [x] Clicking the card navigates to the detail page

### TilePyramid_PL01 detail page (`/projects/TilePyramid_PL01`)

- [x] Page loads without error
- [x] Project metadata table is displayed
- [x] Store URLs are displayed (Android + iOS)
- [x] Network QA Evidence table shows `PASSED_UPLOAD_TESTING` for Unity and AppLovin
- [x] Formal solvability displays: `NOT YET PROVEN`
- [x] Known limitations list is displayed
- [x] "Open Unity Preview" button is visible
- [x] "Open AppLovin Preview" button is visible

### Routing fix (BUILD-18)

- [x] "Open Unity Preview" link href is `/projects/TilePyramid_PL01/unity.html` (not `/projects/unity`)
- [x] "Open AppLovin Preview" link href is `/projects/TilePyramid_PL01/applovin.html` (not `/projects/applovin`)
- [x] Clicking "Open Unity Preview" opens the Unity playable (no 404)
- [x] Clicking "Open AppLovin Preview" opens the AppLovin playable (no 404)

### Unity playable preview (`/projects/TilePyramid_PL01/unity`)

- [x] Page loads without error
- [x] Game renders in portrait 9:16 viewport
- [x] No `window.top` references
- [x] File size: 1,993,760 bytes (1.90 MB — within 5 MB limit)
- [x] SHA256: `8ae81387d9cb3470ae7bcfc92c4cc67474acc91071f340d68d889c612d688bf9`

### AppLovin playable preview (`/projects/TilePyramid_PL01/applovin`)

- [x] Page loads without error
- [x] Game renders in portrait 9:16 viewport
- [x] No `window.top` references
- [x] File size: 1,993,779 bytes (1.90 MB — within 5 MB limit)
- [x] SHA256: `4ef1d2f550cf358b1b1a6808dda3fdb402441f23351e614f9e39fd4235463348`

---

## Store URLs (displayed in detail page)

| Platform | URL |
|---|---|
| Android | `https://play.google.com/store/apps/details?id=com.skl.pyramid.quest.match3.tile.puzzle.games` |
| iOS | `https://apps.apple.com/us/app/tile-pyramid-match-quest/id6755671033` |

---

## Formal solvability

**Status: `NOT YET PROVEN`**

The Level_21 board has not been formally solved. Gameplay heuristics suggest it is
solvable, but automated verification has not been run.

---

## Known limitations displayed on detail page

- Final Unity Ads and AppLovin approval is not guaranteed.
- Unity export expects network-provided `window.mraid`.
- Network webviews may differ from Chromium `file://` QA.
- Formal solvability remains NOT YET PROVEN.

---

## What this preview is — and is not

| | Status |
|---|---|
| Internal-review tooling | YES |
| Delivery-locked HTML copies | YES (from `delivery/latest/`) |
| Actual ad-network upload files | NO — use `delivery/latest/` directly |
| Final Unity Ads approval | NO — per network policy |
| Final AppLovin approval | NO — per network policy |
| Authentication / access control | NO (see `docs/INTERNAL_PREVIEW_ACCESS_NOTES.md`) |

---

## Manual recheck steps

To re-verify the live preview after any deployment:

1. Open `https://wowwi.vercel.app/` — confirm home page loads.
2. Click the TilePyramid_PL01 card.
3. Confirm detail page loads at `/projects/TilePyramid_PL01`.
4. Confirm formal solvability shows `NOT YET PROVEN`.
5. Click "Open Unity Preview" — confirm the game loads at `/projects/TilePyramid_PL01/unity`.
6. Click "Open AppLovin Preview" — confirm the game loads at `/projects/TilePyramid_PL01/applovin`.
7. Confirm no 404 errors occur on any of the above.
8. Check browser console for unexpected errors.

---

## Automated local checks

The validator and tests that confirm the live routing fix locally:

```sh
# From repo root:
npm run preview:build       # rebuild local dist
npm run preview:validate    # 16 checks (includes link-path validation)
npm run preview:test        # 24 tests (includes tests 17-24 for routing fix)
npm run vercel:test         # 17 tests (includes tests 16-17 for routing fix)
npm run live-preview:test   # 8 static tests for this QA lock
```

---

## Vercel deployment details

| Setting | Value |
|---|---|
| Project URL | `https://wowwi.vercel.app` |
| Build command | `npm run vercel:build-preview` |
| Output directory | `apps/internal-preview/dist` |
| Install command | `npm install && cd projects/TilePyramid_PL01 && npm install` |
| Framework | None (static) |
| Clean URLs | `true` |
| Trailing slash | `false` |
| Playwright in build | No (removed BUILD-17) |

---

*Generated: 2026-06-28 — BUILD-19 live preview QA lock*
