# wowwi

Playable ad development repository.

## Current project

**TilePyramid_PL01** — 2D tile-pyramid matching game playable ad.

## Branch model

| Branch | Purpose |
|---|---|
| `main` | Stable baseline; no broken builds |
| `build-00-bootstrap` | Repository init, asset audit, documentation |
| `build-01-*` | Runtime shell, responsive viewport, build tooling |
| `build-NN-*` | One numbered phase per feature increment |

## Repository layout

```
wowwi/
├── docs/                        Documentation and analysis
├── packages/                    Shared packages (future)
├── project-input/
│   ├── raw-assets/              Original client ZIPs (gitignored, SHA-256 verified)
│   ├── extracted-assets/        Extracted raw files (gitignored, read-only)
│   └── references/              Reference screenshots, PDFs, briefs
├── projects/
│   └── TilePyramid_PL01/        The playable ad project
├── scripts/                     Dev and export scripts
├── tests/                       Automated tests
└── dist/                        Build outputs (gitignored)
```

## Asset checksum

| File | SHA-256 |
|---|---|
| `TilePyramid_PL01_assets.zip.zip` | `21132D324A2071298C32A8611AD23674F019F8992A82463F0D2DD0CA400D3BE1` |

## Tooling — multi-project commands

Run from the **repo root** (`wowwi/`):

```sh
npm run wowwi:list                              # list all registered projects
npm run wowwi:validate                          # validate every project against the schema
npm run wowwi:project -- TilePyramid_PL01 status
npm run wowwi:project -- TilePyramid_PL01 test
npm run wowwi:project -- TilePyramid_PL01 export
npm run wowwi:project -- TilePyramid_PL01 package-candidate
npm run wowwi:project -- TilePyramid_PL01 package-delivery
npm test                                        # 15 registry + integration tests
```

See [docs/WOWWI_TOOL_FOUNDATION.md](docs/WOWWI_TOOL_FOUNDATION.md) and
[docs/PROJECT_REGISTRY.md](docs/PROJECT_REGISTRY.md) for details.

## Preview site

```sh
npm run preview:build       # generate static preview site
npm run preview:validate    # validate the generated site
npm run preview:serve       # serve at http://localhost:4174
npm run preview:test        # run 16 preview tests
```

See [docs/INTERNAL_PREVIEW_SITE.md](docs/INTERNAL_PREVIEW_SITE.md) for details.

## Vercel deployment

```sh
npm run vercel:build-preview  # full pipeline: delivery → preview → validate
npm run vercel:validate-preview
npm run vercel:preflight      # registry + preview tests + vercel build + validate
npm run vercel:test           # run 14 Vercel deployment tests
```

See [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md) and
[docs/VERCEL_PREVIEW_CHECKLIST.md](docs/VERCEL_PREVIEW_CHECKLIST.md) for details.

---

## Quick start — TilePyramid_PL01

All commands run from `projects/TilePyramid_PL01/`.

**Install dependencies** (one-time):
```
npm install
```

**Start the development preview:**
```
npm run dev
```
Open the URL printed in the terminal (usually `http://localhost:5173`).

**Run the test suite:**
```
npm run test          # unit tests (220 tests)
npm run test:smoke    # browser smoke tests, including exported HTML - requires Chromium
npm run test:exports  # exported Unity/AppLovin HTML smoke tests only
```

**Optimize and measure production assets:**
```
npm run optimize:assets
npm run measure:size
```

**Export playable HTML files:**
```
npm run export          # exports Unity and AppLovin
npm run export:unity    # Unity only
npm run export:applovin # AppLovin only
npm run validate:exports
npm run test:exports    # export + run exported HTML smoke tests
```

**Create upload candidate package:**
```
npm run package:candidate
npm run validate:candidate
```

**Create delivery package (final lock):**
```
npm run package:delivery
npm run validate:delivery
```

Generated exports are written under `projects/TilePyramid_PL01/exports/latest/`
and are ignored by git by default. Export validation loads those files in
Chromium and verifies they render, not only that they are statically
self-contained.

To install the Playwright browser (first-time only):
```
npx playwright install chromium
```

**Create a production build:**
```
npm run build
npm run preview       # serve the build at http://localhost:4173
```

---

## Build phases

- **BUILD-00**: Repository bootstrap, asset audit, technical documentation ← complete
- **BUILD-01**: Runtime, build tooling, responsive playable shell ← complete
- **BUILD-02**: Static Level_21 board, blocking system, deterministic tile assignment
- **BUILD-03**: Tray UI, tile selection, fly-to-tray interaction
- **BUILD-04**: Match-three resolution, tray compaction, basic win/fail rules
- **BUILD-05**: Timer, initial tutorial, and idle reminder
- **BUILD-06**: CTA, end card, and store-open abstraction
- **BUILD-07**: Asset optimization and production size control
- **BUILD-08**: Basic audio and visual feedback effects
- **BUILD-09**: Export foundation, single-file build, Unity and AppLovin adapters
- **BUILD-10**: Network compliance hardening and final export QA
- **BUILD-11**: Upload candidate package and store URL wiring
- **BUILD-12**: Network compliance hardening — window.top removed, Unity re-upload
- **BUILD-13**: Delivery candidate lock, network QA evidence, final handoff package
- **BUILD-14**: Project registry and local tool foundation
- **BUILD-15**: Internal preview site foundation
- **BUILD-16**: Vercel deployment configuration and deploy prep ← current

## Documentation index

| Document | Contents |
|---|---|
| `CLAUDE.md` | Permanent AI collaboration rules |
| `docs/PROJECT_REQUIREMENTS.md` | Locked gameplay and architecture requirements |
| `docs/ASSET_AUDIT.md` | Full audit of client-provided assets |
| `docs/LEVEL_DATA_ANALYSIS.md` | Level JSON format, blocking derivation, tile assignment |
| `docs/RUNTIME_OPTIONS.md` | Phaser vs PixiJS vs Custom Canvas comparison |
| `docs/PROPOSED_ARCHITECTURE.md` | System boundaries and module map |
| `docs/BUILD_01_PLAN.md` | Acceptance criteria for the next build phase |
| `docs/DELIVERY_CANDIDATE.md` | Delivery package workflow and output structure |
| `docs/NETWORK_QA_EVIDENCE.md` | Unity/AppLovin upload test evidence |
| `docs/RELEASE_NOTES_TILEPYRAMID_PL01.md` | Full build history and technical spec |
| `docs/WOWWI_TOOL_FOUNDATION.md` | Root tooling layer: registry, commands, tests |
| `docs/PROJECT_REGISTRY.md` | Registry schema and current project list |
| `docs/INTERNAL_PREVIEW_SITE.md` | Preview site: build, serve, validate, test |
| `docs/VERCEL_PREVIEW_PREP.md` | Vercel readiness status (updated BUILD-16) |
| `docs/VERCEL_DEPLOYMENT.md` | Full Vercel deployment guide and manual UI steps |
| `docs/VERCEL_PREVIEW_CHECKLIST.md` | Pre-deploy and post-deploy verification checklist |
