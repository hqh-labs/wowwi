# TilePyramid_PL01 Commercial Gap Analysis

**Reference:** Partner AppLovin playable (Cocos Creator 3.10.1, `TilePyramid_PA_TrueGPHardLevel_AppLovin_240226.html`)
**Baseline:** TilePyramid_PL01 BUILD-22 polished candidate (Phaser 3, ~1.9 MB)
**Date:** 2026-06-28
**Build:** BUILD-27

---

## Summary of Critical Gaps

| Priority | Gap | Status | Target Build |
|---|---|---|---|
| CRITICAL | Debug flags active in production export | Not fixed | BUILD-28 |
| CRITICAL | No export-mode separation (debug / review / commercial) | Not implemented | BUILD-28 |
| HIGH | No viewability-gated engine start | Not implemented | BUILD-28 |
| HIGH | No `__PLAYABLE_PARAMETERS__` runtime injection | Not implemented | BUILD-31 |
| HIGH | No asset/theme replacement pipeline | Not implemented | BUILD-32 |
| MEDIUM | End card visual composition below commercial standard | Partial | BUILD-29 |
| MEDIUM | No combo / reward feedback system | Missing | BUILD-29 |
| MEDIUM | Board entrance composition (background framing) | Partial | BUILD-29 |
| MEDIUM | Missing parameter injection for AppLovin Max SDK | Not implemented | BUILD-31 |
| LOW | File size can be reduced further | 1.9 MB | Ongoing |
| LOW | vConsole / debug console for QA review | Missing | BUILD-30 |

---

## Detailed Gap Table

| Area | Current Wowwi TilePyramid | Partner Reference (observed) | Commercial-Grade Target | Gap Severity | Recommended Fix |
|---|---|---|---|---|---|
| **CTA** | Pink pill, `PLAY NOW`, always visible during gameplay, pulse (1.05×/700 ms) | CTA via `super_html.download()` + `mraid.open()`, `is_hide_download` review toggle | Persistent pulsing CTA, review-mode toggle, MRAID-compliant | MEDIUM | BUILD-28: add commercial-mode CTA config; BUILD-31: hook to `__PLAYABLE_PARAMETERS__` |
| **End card** | Title + win/fail message + icon + logo + CTA, fade-in entrance (BUILD-20) | Richer visual composition expected (commercial standard) | Animated background, icon reveal, score/reward summary, full-screen click | MEDIUM | BUILD-29: richer end-card layout, parallax or animated background |
| **Tutorial / hand** | Rounded ring highlights + hand pointer, 3 tiles, dismisses on first tap | `hand` and `hint` identifiers present; professional animation expected | Smooth hand trajectory, clear "tap here" callout, confident first-3-second UX | MEDIUM | BUILD-29: animated hand with better path easing; callout text styling |
| **Tile selection** | Pop (1.14×/80 ms) + lift glow + fly with Cubic.easeOut | Scale + animation system present | Sharp pop, strong lift glow, elastic tray landing | LOW | BUILD-29: optional elastic landing in tray |
| **Match effect** | 6-dot sparkle burst (BUILD-20) + flash + scale-fade | Animation system present; suspected richer particle burst | Per-tile particle burst with color theming, combo multiplier for 2+ matches | MEDIUM | BUILD-29: combo feedback, color-themed sparkles |
| **Board entrance** | Per-tile stagger fade-in (260 ms, 12 ms stagger) | Smooth engine transition expected | Board slides/scales in from initial state; possibly with loading indicator | LOW | BUILD-29: optional slide-in entrance variant |
| **Tray polish** | Rounded frame (r=18), alpha 0.76, stroke | Tray composition unknown | Clear visual separation, glow when tile lands, full-feedback on tray-full | LOW | BUILD-29: tile-landing glow in tray |
| **Timer warning** | Continuous pulse (1.12×/300 ms loop) | Timer behavior unknown from static | Flash + audio escalation, prominent text color change | LOW | BUILD-29: timer text color-shift in warning state |
| **Idle hint** | 5-second delay, tray-pair preference, deterministic fallback | `hint` identifier present | Immediate and obvious after 3–4 seconds; animated hand + tile highlight | MEDIUM | BUILD-29: reduce idle delay default; sharper hint animation |
| **Level pacing** | Level_21 (fixed), tray capacity 5, 30-second timer | "HardLevel" variant — implies multiple level variants | Multiple levels or variant configs; difficulty ramp within the ad | MEDIUM | BUILD-31: variant config (level, tray capacity, timer) |
| **Param system** | Store URLs hardcoded in `game.config.json` at build time | `window.__PLAYABLE_PARAMETERS__` runtime injection; AppLovin Max `mainTheOneSdk` hook | Runtime-injectable store URLs; network-side A/B without re-export | HIGH | BUILD-31: implement `__PLAYABLE_PARAMETERS__` equivalent |
| **Asset replacement** | No asset replacement pipeline; tiles/bg/icon baked into export | Unknown; Cocos atlas system implied | Theme config replaces tiles, background, logo, icon without code changes | HIGH | BUILD-32: theme/asset config + variant generator |
| **Export packaging** | Data-URI inliner, ~1.9 MB, no external requests | Base64 ZIP bundle, ~3.8 MB raw; runtime unzip | Single-file, self-contained, ≤ 2 MB preferred, no external requests | LOW | Already good; optional ZIP path for larger assets |
| **Debug / review mode** | `debugOverlay: true` in production config (CRITICAL) | `is_hide_download` flag; clean production build, `vConsole` debug build | Separate export profiles: commercial (clean), review (CTA hidden), debug (overlays) | **CRITICAL** | BUILD-28: export-mode separation; config profiles |
| **MRAID / click-through** | `window.__PLAYABLE_STORE_OPEN__` bridge; full MRAID path | `mraid.open(url)` via `super_html.download()` | Consistent MRAID path with fallback, viewability-gated start | HIGH | BUILD-28: add viewability event listener |
| **AppLovin Max SDK** | No `mainTheOneSdk` integration | `mainTheOneSdk` setter intercept for parameter injection | AppLovin Max parameter hook for store URL injection | HIGH | BUILD-31: integrate `mainTheOneSdk` or `__PLAYABLE_PARAMETERS__` hook |
| **Viewability gate** | Engine starts immediately at page load | `viewableChange` + `b_start_ads` one-shot guard | Game boots only after ad is viewable; idle view before viewable | HIGH | BUILD-28: add MRAID viewability listener to app boot |
| **Background composition** | Single background image, fills design area | WebGL scene with composition layers expected | Layered background with depth, optional animated elements, logo area | MEDIUM | BUILD-29: layered background config |
| **Formal solvability** | `NOT YET PROVEN` | Unknown | Formally proven solvable for the tutorial level presented | LOW | Future solver work |

---

## Critical Issue: Debug Flags in Production Config

The current `game.config.json` has ALL debug flags set to `true`:

```json
"debugOverlay": true,
"debugBlockedState": true,
"debugMatchReadyMarker": true,
"debugOutcomeLabel": true,
"debugTimerTutorialIdle": true,
"debugCtaEndCardStore": true,
"debugAudioEffects": true,
"timer": { "debugVisible": true }
```

These flags cause debug information to appear on the exported playable HTML in
production. This is a commercial-grade disqualifier. The partner file shows no
debug overlays — it is a clean commercial build.

**Immediate fix required in BUILD-28:** Create a commercial export profile that
sets all debug flags to `false`, separate from the development config.

---

## Commercial Priority Order

1. **Debug/review/commercial mode separation** — Must-fix before any commercial delivery
2. **Viewability-gated engine start** — MRAID lifecycle compliance
3. **`__PLAYABLE_PARAMETERS__` injection** — Required for template sale
4. **End card and effects richness** — Commercial visual standard
5. **Asset/theme replacement pipeline** — Required for multi-client sales
6. **Combo feedback + idle hint improvement** — Engagement quality
