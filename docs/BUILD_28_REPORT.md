# BUILD-28 Report

**Build:** BUILD-28 — Debug-Free Commercial Export + Mode Separation + Safe Network Boot Policy
**Date:** 2026-06-28
**Branch:** `build-28-commercial-mode-export-lock`
**Status:** Complete

---

## Root Issue (from BUILD-27)

BUILD-27 commercial audit found all 8 debug config flags set to `true` in the production export:

```
debugOverlay: true
debugBlockedState: true
debugMatchReadyMarker: true
debugOutcomeLabel: true
debugTimerTutorialIdle: true
debugCtaEndCardStore: true
debugAudioEffects: true
timer.debugVisible: true
```

These caused a debug overlay, gray-tinted blocked tiles, match-ready markers, and debug text to
appear in every exported HTML. Unity and AppLovin uploads passed network parser tests but the visual
output was not commercially deliverable.

Additionally: no export-mode separation existed, no viewability-gated boot policy, and no
commercial-export validator to catch regressions.

---

## What Changed

### 1. First-class build mode

Added `buildMode?: 'development' | 'review' | 'commercial'` to `GameConfig` (optional, backward-
compatible). Source config (`game.config.json`) uses `"development"`. Export pipeline forces
`"commercial"`.

`isDebugAllowed(config)` helper in `ConfigLoader.ts` returns `false` for `commercial` and `review`,
gating all debug rendering at the scene level as a second line of defense.

### 2. Debug flags centralized and zeroed in commercial export

`createExportConfig()` in `single-file-inliner.mjs` now explicitly sets all 8 debug flags to
`false` and `buildMode: 'commercial'` in the exported config. Developers do not need to manually
toggle any flags before exporting.

`GameScene.ts` also gates:
- `this.debugEnabled` on `isDebugAllowed(config) && config.debugOverlay`
- `debugBlockedState` tile tinting on `isDebugAllowed(config) && config.debugBlockedState`
- `timer.debugVisible` behavior on `isDebugAllowed(config) && config.timer.debugVisible`

### 3. Commercial export guard

`validateCommercialMode()` added to `export-validator.mjs`. Runs automatically for any profile
with `buildMode: 'commercial'`. Checks:
- `"buildMode":"commercial"` present in exported config JSON
- `"buildMode":"development"` absent
- None of the 8 debug flags are `true` in the exported config JSON

Integrated into the main `validateExportHtml()` path so it runs during `export:all`, `validate:exports`,
and candidate/delivery validation.

### 4. AppLovin viewability-gated boot policy

New file: `scripts/export/bridge/boot-policy-bridge.mjs`

Generates a `window.__PLAYABLE_BOOT_POLICY__` initialization script injected into the AppLovin
export HTML (before the game bundle). `main.ts` checks for this global before calling `createGame()`:

```ts
const bootPolicy = window.__PLAYABLE_BOOT_POLICY__;
if (bootPolicy && typeof bootPolicy.onReady === 'function') {
  bootPolicy.onReady(startGame);
} else {
  startGame();
}
```

Boot policy behavior:
- MRAID present + viewable → immediate boot
- MRAID present + not viewable → waits for `viewableChange`
- MRAID absent (browser, non-MRAID network) → immediate boot
- One-shot guard (`booted` flag) prevents double boot
- 3-second safety timeout prevents hang

Unity export: `viewabilityGate: false` → `createBootPolicyScript()` returns `''` → no boot delay.

### 5. Export profiles updated

`profiles.mjs`: Added `viewabilityGate` and `buildMode: 'commercial'` to both profiles:
- Unity: `viewabilityGate: false`
- AppLovin: `viewabilityGate: true`

### 6. Registry updated

`commercialUpgradeStatus` changed from `commercial-upgrade-needed` to `commercial-mode-hygiene-pass`.
`commercialUpgradeBlockers` updated to reflect remaining gaps (parameter injection, asset replacement,
end card quality, formal solvability).

---

## Files Created

| File | Purpose |
|---|---|
| `projects/TilePyramid_PL01/scripts/export/bridge/boot-policy-bridge.mjs` | AppLovin viewability boot policy generator |
| `tooling/tests/build28.test.mjs` | 20 BUILD-28 static tests |
| `docs/TILEPYRAMID_COMMERCIAL_MODE_LOCK.md` | Mode design, debug gating, boot policy, QA checklist |
| `docs/BUILD_28_REPORT.md` | This file |

## Files Modified

| File | Change |
|---|---|
| `projects/TilePyramid_PL01/src/types.ts` | Added `BuildMode` type, `buildMode?` to `GameConfig`, `PlayableBootPolicy` interface, `__PLAYABLE_BOOT_POLICY__` on Window |
| `projects/TilePyramid_PL01/src/config/ConfigLoader.ts` | Added `isDebugAllowed()`, `isCommercialMode()`, `buildMode` optional validation |
| `projects/TilePyramid_PL01/src/scenes/GameScene.ts` | Gated `debugEnabled`, `debugBlockedState`, `timer.debugVisible` on `isDebugAllowed()` |
| `projects/TilePyramid_PL01/src/main.ts` | Boot policy hook before `createGame()` |
| `projects/TilePyramid_PL01/public/config/game.config.json` | Added `"buildMode": "development"` |
| `projects/TilePyramid_PL01/scripts/export/inliner/single-file-inliner.mjs` | `createExportConfig()` forces commercial mode + zeros all debug flags; injects boot policy script |
| `projects/TilePyramid_PL01/scripts/export/validators/export-validator.mjs` | Added `validateCommercialMode()`, `getCommercialModeChecks()` |
| `projects/TilePyramid_PL01/scripts/export/profiles/profiles.mjs` | Added `viewabilityGate` and `buildMode` to both profiles |
| `projects/TilePyramid_PL01/scripts/export/bridge/store-open-bridge.mjs` | Unchanged |
| `tooling/project-registry/projects.json` | Updated commercial upgrade status and blockers |
| `docs/COMMERCIAL_READY_CRITERIA.md` | Updated section 8 (all PASS), section 11.4 (PASS), gate summary |
| `CLAUDE.md` | Current phase → BUILD-28 |
| `README.md` | Added BUILD-28 to phase list |

---

## Build Mode Design

```
game.config.json:   buildMode: "development"  (source of truth for local dev)
                         ↓
createExportConfig():   buildMode: "commercial"  (overridden at export time)
                         ↓
exported HTML:      "buildMode":"commercial" in window.__GAME_CONFIG__
                         ↓
validateCommercialMode(): confirms commercial mode + all debug flags false
```

```
GameScene.ts:   isDebugAllowed(config) = config.buildMode !== 'commercial' && !== 'review'
                ↓ false in commercial export
                → debugEnabled = false → no overlay, no markers
                → debugBlockedState skipped → no tile tinting
                → timer.debugVisible skipped → timer only shows during 'playing'
```

---

## Export Validation Added

`validateCommercialMode(html, profile)` — returns array of error strings. Empty = PASS.

Checks (for `profile.buildMode === 'commercial'`):
- `"buildMode":"commercial"` present in HTML
- `"buildMode":"development"` absent from HTML
- `"debugOverlay":true` absent
- `"debugBlockedState":true` absent
- `"debugMatchReadyMarker":true` absent
- `"debugOutcomeLabel":true` absent
- `"debugTimerTutorialIdle":true` absent
- `"debugCtaEndCardStore":true` absent
- `"debugAudioEffects":true` absent
- `"debugVisible":true` absent

---

## Network Boot Policy Changes

| Network | Before BUILD-28 | After BUILD-28 |
|---|---|---|
| AppLovin | Phaser boots immediately on page load | Boots after MRAID viewableChange (or immediately if no MRAID) |
| Unity | Phaser boots immediately on page load | Unchanged — no boot policy injected |

AppLovin boot policy is implemented as a standalone pre-bundle script injection (not a modification
to Phaser or game logic). `main.ts` boot policy hook is backward-compatible: absent `__PLAYABLE_BOOT_POLICY__`
→ immediate boot (unchanged behavior for all existing development/Unity paths).

---

## Validation Results

| Suite | Result |
|---|---|
| `typecheck` | PASS |
| `npm run test` (235 unit tests) | 235/235 PASS |
| `npm run export:all` | PASS (unity: 1999110 bytes, applovin: 2000216 bytes) |
| `npm run validate:exports` | PASS (commercial mode validation included) |
| `npm run package:candidate` | PASS |
| `npm run validate:candidate` | PASS |
| `npm run package:delivery` | PASS |
| `npm run validate:delivery` | PASS |
| `node --test tooling/tests/build28.test.mjs` | 20/20 PASS |
| `npm run wowwi:validate` | PASS (both projects) |
| All tooling tests | PASS |
| `preview:build` + `preview:validate` | PASS |
| `vercel:build-preview` | PASS |
| `vercel:test` (17) | 17/17 PASS |
| `live-preview:test` (8) | 8/8 PASS |

---

## Remaining Commercial Blockers After BUILD-28

| Blocker | Required Build |
|---|---|
| Store URLs not injectable at ad-serve time (`__WOWWI_PARAMS__`) | BUILD-31 |
| No asset/theme replacement pipeline | BUILD-32 |
| End card visual composition below commercial standard | BUILD-29 |
| No combo/reward feedback | BUILD-29 |
| Formal solvability NOT YET PROVEN | Separate track |

TilePyramid_PL01 `commercialUpgradeStatus` is now `commercial-mode-hygiene-pass`.
It is **not** marked `commercial-ready`.

---

## Confirmations

- **No partner code was copied.** Implementation derived entirely from BUILD-27 docs.
- **No raw or extracted client assets were modified.**
- **No gameplay rules were changed.** Timer, tray, board, matching, tutorial, idle hint, audio,
  and effects logic are all unchanged. The only behavior change is that debug overlays and tints
  do not render in `commercial` or `review` mode, and the AppLovin export now has a viewability
  boot policy.
- **Nothing was committed or pushed.**
