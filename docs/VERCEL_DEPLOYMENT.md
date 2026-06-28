# Vercel Deployment — Wowwi Internal Preview

This document covers everything needed to connect the Wowwi repo to Vercel and
deploy the internal preview site. No Vercel CLI is required.

---

## Vercel configuration

`vercel.json` at the repo root:

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

| Field | Value |
|---|---|
| Build command | `npm run vercel:build-preview` |
| Output directory | `apps/internal-preview/dist` |
| Install command | Installs root + TilePyramid deps — **no Playwright** |
| Framework | None (static output) |

---

## What `vercel:build-preview` does (BUILD-17 — Playwright-free)

Runs 5 sequential steps. **No Chromium, no browser, no Playwright system libraries required.**

1. **Validate project registry** — `npm run wowwi:validate` (static JSON + schema)
2. **Export Unity + AppLovin HTML** — `npm run export:all:static` (Vite build + static validation only)
3. **Generate preview delivery manifest** — `npm run vercel:generate-delivery` (copy HTML + write `delivery/preview/delivery-manifest.json`)
4. **Build preview site** — `npm run preview:build`
5. **Validate preview output** — `npm run preview:validate` (static checks only)

**Does NOT call:** `package:candidate`, `package:delivery`, `test:exports`, `test:smoke`, or any Playwright command.

### Why not package:delivery?

`package:delivery` → `package:candidate` → `test:exports` → Playwright Chromium.
Vercel's build environment lacks `libnspr4.so` and other Playwright system libraries.
The Vercel path uses `export:all:static` instead, which skips visual validation entirely.

---

## Local verification before connecting Vercel

Run from the repo root:

```sh
# Quick validation (no delivery rebuild):
npm run wowwi:validate
npm run preview:test
npm run preview:validate

# Full Vercel-like build (simulates what Vercel will run):
npm run vercel:build-preview

# Serve the output locally:
npm run preview:serve
# → http://localhost:4174

# All-in-one preflight (registry + preview tests + vercel build + validate):
npm run vercel:preflight
```

---

## Connecting to Vercel (manual UI steps)

1. Open [vercel.com](https://vercel.com) and sign in.
2. Click **Add New → Project**.
3. Import the GitHub repo **`hqh-labs/wowwi`**.
4. On the Configure Project screen:
   - **Framework Preset**: select **Other**
   - **Build Command**: leave blank (Vercel reads from `vercel.json`)
   - **Output Directory**: leave blank (Vercel reads from `vercel.json`)
   - **Install Command**: leave blank (Vercel reads from `vercel.json`)
5. Click **Deploy**.
6. Wait for the build to complete (~5–10 minutes including Playwright).
7. Open the deployed URL.
8. Verify:
   - Home page shows TilePyramid_PL01 project card
   - Click the project card → detail page shows status, checksums, store URLs
   - Click "Open Unity Preview" → Unity HTML loads and game is playable
   - Click "Open AppLovin Preview" → AppLovin HTML loads and game is playable

---

## What is safe to deploy

| Item | Safe to deploy |
|---|---|
| `dist/index.html` | Yes |
| `dist/projects/TilePyramid_PL01/index.html` | Yes |
| `dist/preview-data.json` | Yes |
| `dist/projects/TilePyramid_PL01/unity.html` | Yes — delivery HTML copy, no secrets |
| `dist/projects/TilePyramid_PL01/applovin.html` | Yes — delivery HTML copy, no secrets |

## What is NOT deployed

| Item | Reason |
|---|---|
| `project-input/raw-assets/` | Immutable client source — never distribute |
| `project-input/extracted-assets/` | Same |
| `projects/TilePyramid_PL01/delivery/` | Gitignored; generated during build |
| `projects/TilePyramid_PL01/exports/` | Gitignored; intermediate |
| `apps/internal-preview/dist/` | Gitignored; generated during build |
| `node_modules/` | Never committed |

---

## Environment variables

No environment variables are required for the current static preview. If future
builds add analytics, API calls, or authentication, add them as Vercel environment
variables and document them here.

---

## Known limitations

1. **Visual smoke tests not run in Vercel.** The Vercel build (`export:all:static`)
   skips Playwright visual validation. Visual boot, portrait/landscape layout, and
   store-open behavioral tests are only confirmed by local `npm run test:exports`
   or `npm run package:delivery`. The Vercel preview HTML is structurally valid
   (static checks pass) but visual confirmation requires a local full QA run.

2. **Build time.** `vercel:build-preview` takes ~15–20s locally (mostly Vite build).
   In Vercel's environment, expect ~2–4 minutes (install + Vite + inlining).

3. **No authentication.** The deployed preview is publicly accessible via the
   Vercel URL. For a truly internal tool, enable Vercel Password Protection or
   Vercel Teams access controls.

4. **Preview delivery HTML is from most recent build.** The content is generated
   fresh on each deploy. If gameplay changes, a new deploy is needed.

---

## Recommended next steps after connecting Vercel

1. Trigger a deploy and verify the 5-step build log in Vercel (no Playwright steps).
2. Open the deployed URL and walk through the manual verification checklist
   (see `docs/VERCEL_PREVIEW_CHECKLIST.md`).
3. Enable Vercel Password Protection for the internal preview.
4. Add a GitHub Actions workflow that runs `npm run vercel:preflight` on PRs before
   merging to main.
5. For full visual QA, run `npm run test:exports` or `npm run package:delivery`
   locally (these still use Playwright as intended).
