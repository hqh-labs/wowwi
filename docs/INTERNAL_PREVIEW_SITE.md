# Internal Preview Site

Created in BUILD-15. Provides a local static preview of all registered Wowwi
playable projects — metadata, delivery status, QA evidence, and live playable
HTML previews.

## Overview

| Feature | Status |
|---|---|
| Home page (all projects) | Implemented |
| Project detail page | Implemented |
| Unity/AppLovin preview links | Implemented |
| Delivery checksum display | Implemented |
| Store URL display | Implemented |
| QA evidence display | Implemented |
| Known limitations display | Implemented |
| Static site, no server-side runtime | Yes |
| Zero new dependencies | Yes (Node built-ins only) |

## Directory structure

```
apps/internal-preview/
├── scripts/
│   ├── build-preview.mjs      ← site generator (reads registry + delivery)
│   ├── validate-preview.mjs   ← CLI validator
│   ├── validate-lib.mjs       ← shared validation logic (also used by tests)
│   └── serve-preview.mjs      ← local HTTP server (Node http built-in)
├── tests/
│   └── preview-build.test.mjs ← 16 tests (node:test)
└── dist/                      ← generated output (gitignored)
    ├── index.html
    ├── preview-data.json
    └── projects/
        └── TilePyramid_PL01/
            ├── index.html
            ├── unity.html     ← copy of delivery HTML
            └── applovin.html  ← copy of delivery HTML
```

## Commands (run from repo root)

```sh
# Build the preview site
npm run preview:build

# Validate the built site
npm run preview:validate

# Serve the built site at http://localhost:4174
npm run preview:serve

# Run the 16 preview tests
npm run preview:test
```

## How it works

### 1. preview:build

1. Loads `tooling/project-registry/projects.json`
2. For each project, reads `projects/<id>/delivery/latest/delivery-manifest.json`
3. If the manifest is missing, prints an error with the fix command and exits 1
4. Copies Unity and AppLovin delivery HTMLs into `apps/internal-preview/dist/projects/<id>/`
5. Generates a project detail page (`index.html`) with all metadata
6. Generates `dist/preview-data.json` with consolidated metadata
7. Generates `dist/index.html` (home page with all project cards)

### 2. preview:validate

Runs 13 structural and safety checks:
- All expected HTML files exist
- `preview-data.json` contains store URLs, checksums, and formal solvability
- No `project-input/` files are present in dist
- No `window.top` references in copied HTML files

### 3. preview:serve

Serves `dist/` at `http://localhost:4174` using Node's built-in `http` module.
No external packages required. Press Ctrl+C to stop.

### 4. preview:test

16 tests using Node's built-in `node:test`:
- Tests 1–3: Registry and delivery manifest loading
- Tests 4–7: Output file existence checks
- Tests 8–10: preview-data content assertions
- Test 11: Safety check (no project-input in dist)
- Tests 12–14: Validator unit tests (missing Unity HTML, missing AppLovin HTML, window.top)
- Test 15: Regression — existing registry tests (15) still pass
- Test 16: Regression — TilePyramid validate:delivery still passes

## What is gitignored

`apps/internal-preview/dist/` is gitignored. The dist folder is generated locally
and is never committed. This includes the delivery HTML copies.

## If delivery files are missing

If `projects/TilePyramid_PL01/delivery/latest/` does not exist, `preview:build`
exits with:

```
ERROR: Delivery manifest not found for TilePyramid_PL01
  Expected: .../delivery/latest/delivery-manifest.json
  Run: cd projects/TilePyramid_PL01 && npm run package:delivery
```

Run the shown command, then re-run `npm run preview:build`.

## Preview HTML copies

The delivery HTMLs copied to dist are self-contained single-file exports.
They do not reference any external resources. They are safe to open from any
local file path or HTTP server.

They are **not** source files and must never be hand-edited. Regenerate them
via `npm run package:delivery` in the project folder.

## Known limitations

- Preview site is static only. No live data, no server-side rendering.
- Delivery HTML previews require delivery files to exist first.
- The validator checks only the default TilePyramid_PL01 paths; adding a second
  project will require extending the validator.
- preview:serve does not support HTTPS.
- No authentication. For internal use on trusted machines only.
