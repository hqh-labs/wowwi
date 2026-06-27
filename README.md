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
npm run test          # unit tests (144 tests)
npm run test:smoke    # browser smoke tests (12 tests) - requires Chromium, builds first
```

**Optimize and measure production assets:**
```
npm run optimize:assets
npm run measure:size
```

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
- **BUILD-08**: Unity Ads adapter and export
- **BUILD-09**: Visual editor (config-driven, reads same JSON as playable)

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
