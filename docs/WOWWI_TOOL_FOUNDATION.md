# WOWWI Tool Foundation

This document describes the root-level tooling layer introduced in BUILD-14.

## Purpose

The tooling layer turns the `wowwi` repository from a single-project folder into a
local multi-project production tool. It provides:

- A **project registry** that declares every playable with its metadata
- **CLI commands** that discover, validate, and operate on registered projects
- A **registry test suite** that runs without extra dependencies (Node built-in `node:test`)
- A consistent entry point so future projects can be onboarded by adding one JSON block

## Guiding constraints

- **No new runtime dependencies.** All tooling is plain ESM with Node built-ins only.
- **No global installs.** Every command runs via `npm run` from the repo root.
- **Non-destructive.** Tooling commands never write to project source. They run
  existing project workflows unchanged.
- **Gameplay independent.** No tooling code touches `src/gameplay/`.

## Directory structure

```
wowwi/                               ← repo root
├── package.json                     ← root package; wowwi:* scripts + test
└── tooling/
    ├── project-registry/
    │   ├── projects.json            ← registry data (one entry per project)
    │   └── schema.mjs               ← validateRegistryEntry / validateProjectFolderExists
    ├── commands/
    │   ├── list-projects.mjs        ← wowwi:list
    │   ├── validate-projects.mjs    ← wowwi:validate
    │   ├── project-command.mjs      ← wowwi:project <id> <cmd>
    │   └── run-project-workflow.mjs ← spawns npm run <workflow> inside project folder
    ├── utils/
    │   └── registry-loader.mjs      ← loadRegistry(), REPO_ROOT, REGISTRY_PATH
    └── tests/
        └── registry.test.mjs        ← 15 tests (node:test / node:assert/strict)
```

## Root npm scripts

| Script | Command | Description |
|---|---|---|
| `wowwi:list` | `node tooling/commands/list-projects.mjs` | Print all registered projects |
| `wowwi:validate` | `node tooling/commands/validate-projects.mjs` | Validate every project against the schema |
| `wowwi:project` | `node tooling/commands/project-command.mjs` | Run a command on a specific project |
| `test` | `node --test tooling/tests/registry.test.mjs` | Run all 15 registry tests |

### Usage examples

```sh
# from repo root

npm run wowwi:list
npm run wowwi:validate
npm run wowwi:project -- TilePyramid_PL01 status
npm run wowwi:project -- TilePyramid_PL01 test
npm run wowwi:project -- TilePyramid_PL01 export
npm run wowwi:project -- TilePyramid_PL01 package-candidate
npm run wowwi:project -- TilePyramid_PL01 package-delivery
npm test
```

## Project commands

| Command | Maps to npm script | Notes |
|---|---|---|
| `status` | (built-in, prints registry fields) | No npm script needed |
| `test` | `test` | Runs project's own unit tests |
| `export` | `export:all` | Builds and exports both network HTMLs |
| `package-candidate` | `package:candidate` | Full candidate pipeline |
| `package-delivery` | `package:delivery` | Full delivery pipeline (runs candidate first) |

## Validation checks (`wowwi:validate`)

For every project:
1. Structural schema — required fields present, valid status enum
2. Project folder exists on disk
3. `package.json` exists and contains every workflow in `availableWorkflows`
4. Store URLs non-empty (androidUrl, iosUrl)
5. `supportedNetworks` non-empty

Additional checks for `delivery-locked` projects:
6. `docs/NETWORK_QA_EVIDENCE.md` present in repo
7. `docs/DELIVERY_CANDIDATE.md` present in repo
8. `package:delivery` and `validate:delivery` in `availableWorkflows`
9. `formalSolvability === "NOT YET PROVEN"`

## Test suite summary

```
npm test
# 15 tests total, 0 failures (node:test)
#  1–8  Registry structure and metadata assertions for TilePyramid_PL01
#  9–11 Schema validator unit tests (structural + FS)
# 12–14 CLI integration tests (list, status, unknown-project error)
# 15    TilePyramid_PL01 vitest suite still passes (220 tests)
```

## REPO_ROOT resolution

`tooling/utils/registry-loader.mjs` derives `REPO_ROOT` at import time using
`import.meta.url`, walking up two `dirname` calls from `tooling/utils/`. This
makes all paths absolute and avoids `process.cwd()` fragility.

## Windows compatibility

`run-project-workflow.mjs` detects `process.platform === 'win32'` and invokes
`cmd.exe /d /s /c "npm run <workflow>"` instead of `npm run` directly, matching
the pattern used in TilePyramid's own package scripts.

## What is NOT in scope for BUILD-14

- Web dashboard or visual editor
- Cloud storage, upload automation, or network API integration
- New gameplay features or board solver
- User accounts, billing, or authentication
- New project creation UI
