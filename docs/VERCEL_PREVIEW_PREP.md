# Vercel Preview Preparation

This document describes what is and is not ready for a future Vercel deployment of
the Wowwi internal preview site. Actual deployment is NOT part of BUILD-15.

## Build command

```sh
npm run preview:build
```

This generates `apps/internal-preview/dist/` containing static HTML, CSS (inline),
JS (inline), and JSON. No server-side runtime is needed.

## Deploy folder

```
apps/internal-preview/dist/
```

## What is safe to deploy

| Item | Safe | Notes |
|---|---|---|
| `dist/index.html` | Yes | Static home page |
| `dist/projects/TilePyramid_PL01/index.html` | Yes | Static project detail page |
| `dist/preview-data.json` | Yes | Metadata JSON — no secrets |
| `dist/projects/TilePyramid_PL01/unity.html` | Yes (with care) | Delivery HTML copy; contains base64 assets but no secrets |
| `dist/projects/TilePyramid_PL01/applovin.html` | Yes (with care) | Same as above |

## What is NOT safe to deploy

| Item | Reason |
|---|---|
| `project-input/raw-assets/` | Immutable client-provided source material; must not be distributed |
| `project-input/extracted-assets/` | Same |
| `projects/TilePyramid_PL01/exports/` | Intermediate export artifacts; gitignored |
| `projects/TilePyramid_PL01/upload-candidates/` | Upload staging area; gitignored |
| `projects/TilePyramid_PL01/delivery/` | Delivery package source; gitignored |
| Any `.env` or secret files | Not present, but should never be deployed |

## Why delivery HTML can be in preview build output

The Unity and AppLovin delivery HTML files are fully self-contained single-file
exports. All assets (images, audio, JavaScript) are inlined as base64 data URIs.
They contain no absolute local file paths, no secret keys, and no server-side
dependencies. They are the same files that are uploaded to Unity Ads and AppLovin
for review, so they are safe to share with authorized internal reviewers.

## Why raw/extracted assets are not deployed

`project-input/` contains the original client-provided ZIP archives and extracted
source files. These are immutable client materials and are intentionally excluded
from version control and any public or semi-public hosting.

## Vercel configuration (not yet created)

A future `vercel.json` would look like:

```json
{
  "outputDirectory": "apps/internal-preview/dist",
  "buildCommand": "npm run preview:build",
  "installCommand": "echo 'no install needed'",
  "framework": null
}
```

Or via the Vercel dashboard: set root to the repo root, build command to
`npm run preview:build`, output directory to `apps/internal-preview/dist`.

## Remaining work before real deployment

1. **Delivery files must exist before build.** The Vercel build environment starts
   clean. Either:
   - Commit delivery HTML files to a separate branch/storage location, OR
   - Add a pre-build step that runs `package:delivery` (requires full Node + npm
     + Playwright in the build environment — non-trivial)
   - Simplest near-term option: copy delivery HTMLs to a committed
     `apps/internal-preview/public/deliveries/` folder, gitignored from raw assets
     but committed for the preview. This needs a policy decision.

2. **Access control.** The current preview is unauthenticated. For an internal
   site with delivery HTML inside, add Vercel password protection or team
   authentication before deploying.

3. **Preview:build in CI.** Once delivery files are available in CI, add a
   GitHub Actions workflow that runs `npm run preview:build && npm run preview:validate`
   on PRs to the preview branch.

4. **Domain/URL.** Choose whether to use a Vercel-provided URL or a custom domain.

5. **Environment.** No environment variables are needed for the current static
   preview. If future builds add API calls or analytics, create `.env.local` files
   as documented in the `.gitignore` section.

## Status summary

| Item | Status |
|---|---|
| Build command defined | DONE |
| Output folder defined | DONE |
| Static-only output (no server runtime) | DONE |
| Zero new npm dependencies | DONE |
| Delivery HTML included in preview output | DONE |
| Raw/extracted assets excluded | DONE |
| preview:validate confirms no forbidden content | DONE |
| vercel.json created | NOT YET |
| Authentication | NOT YET |
| CI workflow | NOT YET |
| Delivery HTML available in CI build environment | NOT YET — main blocker |
