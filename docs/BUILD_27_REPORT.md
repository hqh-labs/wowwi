# BUILD-27 Report — Partner Reference Commercial Audit

**Branch:** `build-27-partner-reference-commercial-audit`
**Date:** 2026-06-28
**Status:** Complete

---

## Objective

Perform a commercial reference audit of the partner AppLovin playable (`TilePyramid_PA_TrueGPHardLevel_AppLovin_240226.html`) and compare it against TilePyramid_PL01 (BUILD-22 polished candidate). Produce a clear commercial upgrade specification.

No code was changed. No partner code was copied. No gameplay was modified.

---

## Pre-Audit Fix: `.gitignore` Update

Added pattern `project-input/references/partner-playables/*.html` to `.gitignore`
so the partner reference file is not committed. Confirmed via `git status --short` —
the file no longer appears in the status output.

---

## Partner File Summary

| Field | Value |
|---|---|
| File | `TilePyramid_PA_TrueGPHardLevel_AppLovin_240226.html` |
| Engine | **Cocos Creator 3.10.1** |
| Export target | **AppLovin** |
| File size | ~3.8 MB |
| Packaging | Single HTML with base64 ZIP bundle (~2.77 MB decoded payload) |
| MRAID | Full MRAID 2.x via `super_html` bridge |
| Viewability | `viewableChange` listener — engine boots only when ad is viewable |
| Parameters | `window.__PLAYABLE_PARAMETERS__` with `storeLink_android` / `storeLink_ios` |
| Review mode | `super_html.is_hide_download` flag |
| AppLovin SDK | `mainTheOneSdk` setter intercept |
| Code quality | Minified and obfuscated (professional commercial build) |

---

## Commercial Gap Summary

See `docs/TILEPYRAMID_COMMERCIAL_GAP_ANALYSIS.md` for the full table.

**Critical gaps (blocking commercial delivery):**

1. **Debug flags active in production export** — All 8 debug config flags (`debugOverlay`,
   `debugBlockedState`, `debugMatchReadyMarker`, `debugOutcomeLabel`, `debugTimerTutorialIdle`,
   `debugCtaEndCardStore`, `debugAudioEffects`, `timer.debugVisible`) are `true` in
   `game.config.json`. The exported playable shows debug information in production.

2. **No export-mode separation** — No `commercial` / `review` / `development` mode system.
   The same config is used for development and production exports.

3. **No viewability-gated engine start** — Phaser engine boots immediately on page load.
   The commercial standard (per partner) is to boot only after `mraid.isViewable()` is true.

4. **No `__PLAYABLE_PARAMETERS__` equivalent** — Store URLs are burned into the HTML at
   build time. Cannot be changed per-client without re-export.

**High gaps (limiting commercial scalability):**

5. **No asset / theme replacement pipeline** — Tile art, background, logo, icon are fixed.
6. **No parameter injection for AppLovin Max SDK** — No `mainTheOneSdk` integration.
7. **End card visual composition below commercial standard** — Functional but sparse.

---

## Main Missing Systems

| System | Description | Target Build |
|---|---|---|
| Export-mode separation | debug / review / commercial profiles | BUILD-28 |
| Viewability gate | MRAID viewability listener in boot path | BUILD-28 |
| `__WOWWI_PARAMS__` injection | Runtime store URL / CTA override | BUILD-31 |
| Asset / theme replacement | Tile/bg/logo swap via config | BUILD-32 |
| Commercial QA validator | Debug-marker check in export validation | BUILD-28 |
| Combo / reward feedback | Multi-match counter and burst | BUILD-29 |
| End card visual richness | Animated BG, reveal sequence | BUILD-29 |

---

## Commercial Upgrade Build Sequence

| Build | Title | Key Deliverable |
|---|---|---|
| BUILD-28 | Commercial Visual Shell v2 | Debug-free commercial export; viewability gate; mode separation |
| BUILD-29 | Juice / Effects System v2 | Combo, richer end card, tray landing, idle hint v2 |
| BUILD-30 | Debug / Review / Export Mode Separation | First-class `buildMode`; remove legacy debug flags |
| BUILD-31 | Parametric Config System | `__WOWWI_PARAMS__`; layered configs; injectable store URLs |
| BUILD-32 | Variant Generator / Asset Replacement | Theme config; tile/bg/logo swap; variant CLI |
| BUILD-33 | Commercial QA + Network Re-upload v2 | Final commercial lock; Unity + AppLovin upload |

See `docs/TILEPYRAMID_COMMERCIAL_UPGRADE_SPEC.md` for full per-build scope.

---

## Parametric Template Spec Summary

Five config file layers: `gameplay.config.json`, `theme.config.json`,
`creative.config.json`, `network.config.json`, `variant.config.json`.

Priority (highest wins): `window.__WOWWI_PARAMS__` > `variant` > `network` > `creative` > `theme` > `gameplay`.

Key injectable parameters: `storeLink_android`, `storeLink_ios`, `ctaText`, `buildMode`, `timerDuration`.

See `docs/TILEPYRAMID_PARAMETRIC_TEMPLATE_SPEC.md` for the full spec.

---

## Commercial-Ready Criteria Summary

14 FAIL items at BUILD-22 baseline. Most critical: 9 debug-flag failures in section 8
(all blocking commercial delivery). BUILD-28 is the minimum required build before
any commercial delivery.

See `docs/COMMERCIAL_READY_CRITERIA.md` for the full checklist.

---

## Files Created

| File | Description |
|---|---|
| `docs/PARTNER_REFERENCE_AUDIT.md` | Static analysis of the partner AppLovin export |
| `docs/TILEPYRAMID_COMMERCIAL_GAP_ANALYSIS.md` | Gap table: current vs partner vs target |
| `docs/TILEPYRAMID_COMMERCIAL_UPGRADE_SPEC.md` | Proposed BUILD-28 through BUILD-33 specs |
| `docs/TILEPYRAMID_PARAMETRIC_TEMPLATE_SPEC.md` | Future config architecture and injection model |
| `docs/COMMERCIAL_READY_CRITERIA.md` | Pass/fail commercial delivery checklist |
| `docs/BUILD_27_REPORT.md` | This file |
| `tooling/tests/build27.test.mjs` | 14 static tests verifying docs and criteria |

## Files Modified

| File | Change |
|---|---|
| `.gitignore` | Added `project-input/references/partner-playables/*.html` |
| `CLAUDE.md` | Updated current build phase to BUILD-27 |
| `README.md` | Added BUILD-27 to build phase list |
| `tooling/project-registry/projects.json` | Added `commercialUpgradeStatus` and `technicalVersion` metadata |

---

## Legal / Safety Confirmation

- No partner source code was copied.
- No partner minified or obfuscated JavaScript was extracted.
- No partner proprietary class implementations were reproduced.
- No partner asset files were extracted or used.
- All analysis is category-level observation only.
- The partner file is local-only and gitignored.

---

## Asset Integrity Confirmation

- No raw or extracted client assets in `project-input/` were modified.
- No TilePyramid gameplay or export code was changed.
- No files were committed or pushed.
- No global software was installed.
