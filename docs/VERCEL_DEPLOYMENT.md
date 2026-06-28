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
  "installCommand": "npm install && cd projects/TilePyramid_PL01 && npm install && npx playwright install chromium",
  "framework": null,
  "cleanUrls": true,
  "trailingSlash": false
}
```

| Field | Value |
|---|---|
| Build command | `npm run vercel:build-preview` |
| Output directory | `apps/internal-preview/dist` |
| Install command | Installs root + TilePyramid deps + Playwright Chromium |
| Framework | None (static output) |

---

## What `vercel:build-preview` does

Runs 5 sequential steps:

1. **Validate project registry** — `npm run wowwi:validate`
2. **Generate TilePyramid_PL01 delivery** — `npm run package:delivery` from `projects/TilePyramid_PL01/`
   — includes Playwright export smoke tests (14 tests, ~90s)
3. **Validate delivery** — `npm run validate:delivery`
4. **Build preview site** — `npm run preview:build`
5. **Validate preview output** — `npm run preview:validate`

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

1. **Playwright dependency.** The build runs `package:delivery` which includes
   Playwright Chromium smoke tests. The install command runs
   `npx playwright install chromium` in Vercel's build container. This adds ~2–4
   minutes to first-time builds and requires Vercel's build environment to have
   access to install Playwright dependencies (`apt-get` may be needed — see
   Playwright CI docs). If Playwright fails in Vercel, consider pre-building
   delivery HTML files on a separate CI runner and caching them.

2. **Build time.** Full `vercel:build-preview` takes ~90–120s locally. In Vercel's
   environment, first-run install + Playwright + tests may take 5–10 minutes.

3. **No authentication.** The deployed preview is publicly accessible via the
   Vercel URL. For a truly internal tool, enable Vercel Password Protection or
   Vercel Teams access controls.

4. **Preview delivery HTML is from most recent build.** The content is generated
   fresh on each deploy. If gameplay changes, a new deploy is needed.

---

## Recommended next steps after connecting Vercel

1. Trigger a deploy and verify the 5-step build log in Vercel.
2. Open the deployed URL and walk through the manual verification checklist
   (see `docs/VERCEL_PREVIEW_CHECKLIST.md`).
3. If Playwright fails in Vercel's environment, consider adding a Vercel build
   image that pre-installs `libglib2.0-0 libnss3 libnspr4 libdbus-1-3 libatk1.0-0
   libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1
   libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2`
   (Playwright Chromium system dependencies on Ubuntu).
4. Enable Vercel Password Protection for the internal preview.
5. Add a GitHub Actions workflow that runs `npm run vercel:preflight` on PRs before
   merging to main.
