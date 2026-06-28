# Vercel Preview Preparation

> **BUILD-16 UPDATE:** The Vercel configuration (`vercel.json`) has been created
> and all remaining blockers have been addressed. See
> `docs/VERCEL_DEPLOYMENT.md` for the full deployment guide and
> `docs/VERCEL_PREVIEW_CHECKLIST.md` for the step-by-step checklist.

This document describes what is and is not ready for a future Vercel deployment of
the Wowwi internal preview site. Actual deployment is NOT part of BUILD-15.

## Build command (BUILD-16 — updated)

```sh
npm run vercel:build-preview
```

This runs the full pipeline: registry validation → delivery generation →
delivery validation → preview build → preview validation. The output is
`apps/internal-preview/dist/`.

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

## Vercel configuration — BUILD-16 (COMPLETE)

`vercel.json` exists at the repo root:

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

The build command generates TilePyramid delivery HTML during the Vercel build
itself — no pre-committed delivery files are needed. The Playwright Chromium
browser is installed by the `installCommand`.

## Status summary — updated BUILD-16

| Item | Status |
|---|---|
| Build command defined | DONE |
| Output folder defined | DONE |
| Static-only output (no server runtime) | DONE |
| Zero new npm dependencies | DONE |
| Delivery HTML included in preview output | DONE |
| Raw/extracted assets excluded | DONE |
| preview:validate confirms no forbidden content | DONE |
| vercel.json created | DONE (BUILD-16) |
| Delivery generated during build | DONE (BUILD-16) |
| Local Vercel-like build verified | DONE (BUILD-16) |
| Authentication | NOT YET |
| CI/GitHub Actions workflow | NOT YET |
| Actual Vercel deployment | NOT YET |
