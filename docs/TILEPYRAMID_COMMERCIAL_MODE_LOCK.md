# TilePyramid Commercial Mode Lock

**Date:** 2026-06-28
**Build:** BUILD-28
**Status:** Implemented

This document defines the build mode system introduced in BUILD-28, how each mode behaves,
and what commercial mode guarantees for export/candidate/delivery output.

---

## Build Modes

TilePyramid_PL01 supports three first-class build modes via the `buildMode` field in `GameConfig`.

| Mode | Value | Purpose |
|---|---|---|
| Development | `development` | Local development and debugging |
| Review | `review` | Internal review previews; debug hidden |
| Commercial | `commercial` | Network upload, candidate, delivery |

---

## Mode Behavior Table

| Feature | `development` | `review` | `commercial` |
|---|---|---|---|
| Debug overlay | Enabled when `debugOverlay: true` | Disabled | Forcibly disabled |
| Blocked tile tint | Enabled when `debugBlockedState: true` | Disabled | Forcibly disabled |
| Match-ready marker | Enabled when `debugMatchReadyMarker: true` | Disabled | Forcibly disabled |
| Timer debug visible | Enabled when `timer.debugVisible: true` | Disabled | Forcibly disabled |
| Outcome label | Enabled when `debugOutcomeLabel: true` | Disabled | Forcibly disabled |
| Timer/tutorial/idle debug | Enabled when `debugTimerTutorialIdle: true` | Disabled | Forcibly disabled |
| CTA/end-card/store debug | Enabled when `debugCtaEndCardStore: true` | Disabled | Forcibly disabled |
| Audio/effects debug | Enabled when `debugAudioEffects: true` | Disabled | Forcibly disabled |
| Store open | `record-only` | `record-only` | `navigate` |
| Safe dev navigation | `true` | `true` | `false` |
| Viewability gate (AppLovin) | No | No | Yes |
| Boot policy | Immediate | Immediate | MRAID-gated (AppLovin) / Immediate (Unity) |

---

## Which Mode is Used by Export / Candidate / Delivery

All export, candidate, and delivery workflows use **commercial mode by default**:

| Command | Mode | Mechanism |
|---|---|---|
| `npm run export:all` | `commercial` | `createExportConfig()` in inliner |
| `npm run export:unity` | `commercial` | same |
| `npm run export:applovin` | `commercial` | same |
| `npm run package:candidate` | `commercial` | uses exported HTML from above |
| `npm run validate:candidate` | `commercial` | validates exported HTML |
| `npm run package:delivery` | `commercial` | uses exported HTML from above |
| `npm run validate:delivery` | `commercial` | validates exported HTML |

The source file `public/config/game.config.json` uses `buildMode: "development"`. The export
pipeline always overrides this to `commercial` via `createExportConfig()` — the developer does
not need to manually change the source config before exporting.

---

## Debug Features Disabled in Commercial Mode

The following are forcibly disabled by the export pipeline (`createExportConfig()` in
`scripts/export/inliner/single-file-inliner.mjs`):

| Field | Source value | Commercial export value |
|---|---|---|
| `buildMode` | `"development"` | `"commercial"` |
| `debugOverlay` | `true` | `false` |
| `debugBlockedState` | `true` | `false` |
| `debugMatchReadyMarker` | `true` | `false` |
| `debugOutcomeLabel` | `true` | `false` |
| `debugTimerTutorialIdle` | `true` | `false` |
| `debugCtaEndCardStore` | `true` | `false` |
| `debugAudioEffects` | `true` | `false` |
| `timer.debugVisible` | `true` | `false` |

The `GameScene.ts` renderer also gates all debug rendering on `isDebugAllowed(config)` (which
returns `false` for `commercial` and `review` modes), providing a second line of defense in
addition to the config overrides applied at export time.

---

## Commercial Export Validation

`scripts/export/validators/export-validator.mjs` now includes a `validateCommercialMode()` check
that runs automatically for any export profile with `buildMode: 'commercial'`.

### What it catches:

- `"buildMode"` is not `"commercial"` in the exported config JSON
- `"buildMode":"development"` leaked into a commercial export
- Any of the 8 debug flags is `true` in the exported config JSON

### Where validation runs:

- `npm run validate:exports`
- `npm run export:all` (inline validation during export)
- `npm run package:candidate` (candidate validation step)

The validator operates on the **generated HTML output**, not the source config, so it catches
any bugs in the export pipeline itself (belt-and-suspenders approach).

---

## Network Boot Policy

### AppLovin (viewability-gated)

The AppLovin export includes a `window.__PLAYABLE_BOOT_POLICY__` initialization script injected
before the game bundle. `main.ts` checks this global before calling `createGame()`.

**Boot sequence:**
1. Script defines `window.__PLAYABLE_BOOT_POLICY__.onReady(fn)` 
2. `main.ts` calls `onReady(startGame)` instead of calling `startGame()` directly
3. If `window.mraid` exists and `isViewable()` → boots immediately
4. If `window.mraid` exists but not viewable → waits for `viewableChange` event
5. If `window.mraid` absent (local browser, non-MRAID placement) → boots immediately
6. One-shot guard: `booted` flag prevents double boot
7. Safety timeout: always boots after 3 seconds (prevents hang in unusual MRAID states)

**Compatibility:**
- Local browser preview: boots immediately (no MRAID) ✓
- AppLovin MRAID placement: boots when viewable ✓
- Unity export: no boot policy injected → immediate boot ✓

### Unity (no viewability gate)

The Unity export does not include the boot policy script (`viewabilityGate: false` on the Unity
profile → `createBootPolicyScript()` returns `''`). `main.ts` finds
`window.__PLAYABLE_BOOT_POLICY__` undefined and boots immediately.

Unity provides MRAID via the host environment after load; the existing MRAID store-open bridge
handles this correctly at CTA/end-card tap time (not at boot time).

---

## What Remains Not Commercial-Ready After BUILD-28

BUILD-28 removes all debug flags and adds the boot policy foundation. The following gaps remain:

| Gap | Required Build |
|---|---|
| No runtime parameter injection (`__WOWWI_PARAMS__` / `storeLink_android`) | BUILD-31 |
| No asset/theme replacement pipeline | BUILD-32 |
| End card visual composition below commercial standard | BUILD-29 |
| No combo/reward feedback | BUILD-29 |
| Store URLs not injectable at ad-serve time | BUILD-31 |
| Formal solvability NOT YET PROVEN | (separate track) |

TilePyramid_PL01 is **not commercially deliverable** after BUILD-28 for template/reskin use cases
(BUILD-31 required minimum for parameter injection). However, it IS now exportable without any
visible debug UI, which satisfies the minimum threshold for internal commercial review.

---

## Manual QA Checklist — Commercial Export Mode

After running `npm run export:all` from `projects/TilePyramid_PL01/`:

- [ ] Open `exports/latest/unity/TilePyramid_PL01_unity.html` in Chromium
- [ ] No green debug border visible around the canvas
- [ ] No monospace debug text overlay visible
- [ ] Blocked tiles are NOT gray-tinted (debugBlockedState disabled)
- [ ] Tray tiles do NOT show yellow match-ready border markers
- [ ] Timer shows only during active gameplay, not before first tap
- [ ] CTA button visible and pulsing during gameplay
- [ ] End card appears on win/fail without debug labels
- [ ] Tap CTA → store open action fires (check browser console for `__PLAYABLE_STORE_OPEN_DIAGNOSTICS__`)
- [ ] Open `exports/latest/applovin/TilePyramid_PL01_applovin.html` in Chromium
- [ ] Same visual checks as above
- [ ] Check browser console: `window.__PLAYABLE_BOOT_POLICY__` present with `viewabilityGate: true`
- [ ] No `debugOverlay`, `debugBlockedState` or other debug flags are `true` in `window.__GAME_CONFIG__`
- [ ] `window.__GAME_CONFIG__.buildMode` is `"commercial"`
- [ ] Run `npm run validate:exports` → Export validation: PASS (no debug flag errors)
