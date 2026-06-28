# Commercial Ready Criteria

**Date:** 2026-06-28
**Build:** BUILD-27
**Applies to:** TilePyramid_PL01 (and future wowwi playable templates)

This checklist defines the minimum conditions under which a playable ad may be
delivered to a client or submitted to a network as a commercial product.

---

## How to Use

Run this checklist before issuing a commercial delivery package.

- **PASS**: Criterion is fully met and verified.
- **FAIL**: Criterion is not met — delivery is blocked until resolved.
- **N/A**: Criterion does not apply to the specific project/network.
- **WARN**: Criterion is partially met — note the caveat; judge case-by-case.

---

## 1. Visual Quality

| # | Criterion | TilePyramid v1 Status |
|---|---|---|
| 1.1 | Board is visually clear and immediately readable | PASS |
| 1.2 | Background is intentional and brand-appropriate | WARN — generic background |
| 1.3 | Tile art is distinct, readable at rendered size | PASS |
| 1.4 | CTA button is prominent, high-contrast, legible | PASS |
| 1.5 | End card has clear visual hierarchy | WARN — functional but sparse |
| 1.6 | No obvious pixel artifacts, stretched images, or clipping | PASS |
| 1.7 | No debug text, overlay rectangles, or label markers visible | **FAIL** — debug flags active |
| 1.8 | Tray is visually distinct from the board | PASS |
| 1.9 | App icon and logo are displayed correctly on end card | PASS |

---

## 2. First-3-Second Clarity

| # | Criterion | TilePyramid v1 Status |
|---|---|---|
| 2.1 | Gameplay intent is obvious within 1 second | PASS |
| 2.2 | Tutorial highlight appears before first tap is required | PASS |
| 2.3 | Hand pointer or hint guides the first action | PASS |
| 2.4 | No loading screen visible for > 1 second | PASS |
| 2.5 | No blank canvas before game elements render | PASS |
| 2.6 | First interaction opportunity is reachable in ≤ 2 seconds | PASS |

---

## 3. Gameplay Feedback

| # | Criterion | TilePyramid v1 Status |
|---|---|---|
| 3.1 | Tile tap is acknowledged with immediate visual response | PASS (pop + lift glow) |
| 3.2 | Tile flight to tray is visible and smooth | PASS |
| 3.3 | Tray arrival is confirmed visually | WARN — no landing pop |
| 3.4 | Match-three event is celebrated with visible burst | PASS (sparkle) |
| 3.5 | Blocked tap is clearly rejected (not silently ignored) | PASS (shake + tint) |
| 3.6 | Timer warning is visible before expiry | PASS (continuous pulse) |
| 3.7 | Tray-full state is communicated | PASS (flash feedback) |
| 3.8 | Idle hint fires within 5 seconds of no interaction | PASS |
| 3.9 | Win state is clearly celebrated | PASS |
| 3.10 | Fail state is clearly communicated | PASS |

---

## 4. CTA Quality

| # | Criterion | TilePyramid v1 Status |
|---|---|---|
| 4.1 | CTA is visible during active gameplay | PASS |
| 4.2 | CTA pulses or animates to draw attention | PASS (1.05× pulse) |
| 4.3 | CTA text is brand-appropriate and localized | WARN — "PLAY NOW" is generic |
| 4.4 | CTA tap triggers correct store URL for platform | PASS |
| 4.5 | CTA tap uses `mraid.open()` in AppLovin context | PASS |
| 4.6 | CTA is hidden in review mode | **FAIL** — no review mode |
| 4.7 | CTA size meets tap-target minimum (44 px minimum) | PASS |
| 4.8 | No accidental CTA trigger during gameplay | PASS (positioned below tray) |

---

## 5. End Card Quality

| # | Criterion | TilePyramid v1 Status |
|---|---|---|
| 5.1 | End card covers full screen on trigger | PASS |
| 5.2 | End card tap triggers store open (full-screen click) | PASS |
| 5.3 | Win/fail states are visually different | PASS |
| 5.4 | End card entrance animation present | PASS |
| 5.5 | App icon visible on end card | PASS |
| 5.6 | Brand logo visible on end card | PASS |
| 5.7 | CTA on end card has same style as gameplay CTA | PASS |
| 5.8 | End card does not show debug information | **FAIL** — debug flags active |
| 5.9 | End card richness matches commercial standard | WARN — functional but basic |

---

## 6. Network Upload

| # | Criterion | TilePyramid v1 Status |
|---|---|---|
| 6.1 | Unity Ads: parser acceptance | PASS (BUILD-22) |
| 6.2 | Unity Ads: preview renders correctly | PASS (BUILD-22) |
| 6.3 | Unity Ads: close button accessible | PASS (BUILD-22) |
| 6.4 | Unity Ads: store-open triggers on CTA tap | PASS (BUILD-22) |
| 6.5 | AppLovin: parser acceptance | PASS (BUILD-22) |
| 6.6 | AppLovin: preview renders correctly | PASS (BUILD-22) |
| 6.7 | AppLovin: close button accessible | PASS (BUILD-22) |
| 6.8 | AppLovin: store-open triggers on CTA tap | PASS (BUILD-22) |
| 6.9 | `window.top` / `window.parent.top` absent from export | PASS |

---

## 7. Size Budget

| # | Criterion | TilePyramid v1 Status |
|---|---|---|
| 7.1 | Export size ≤ 2 MB (preferred for AppLovin) | PASS (~1.99 MB) |
| 7.2 | Export size ≤ 5 MB (Unity Ads absolute limit) | PASS |
| 7.3 | No external network requests at runtime | PASS |
| 7.4 | All assets self-contained in single HTML | PASS |

---

## 8. No Debug Overlay in Commercial Mode

| # | Criterion | TilePyramid v1 Status |
|---|---|---|
| 8.1 | `debugOverlay` is `false` in commercial export | **FAIL** |
| 8.2 | `debugBlockedState` is `false` in commercial export | **FAIL** |
| 8.3 | `debugMatchReadyMarker` is `false` in commercial export | **FAIL** |
| 8.4 | `debugOutcomeLabel` is `false` in commercial export | **FAIL** |
| 8.5 | `debugTimerTutorialIdle` is `false` in commercial export | **FAIL** |
| 8.6 | `debugCtaEndCardStore` is `false` in commercial export | **FAIL** |
| 8.7 | `debugAudioEffects` is `false` in commercial export | **FAIL** |
| 8.8 | `timer.debugVisible` is `false` in commercial export | **FAIL** |
| 8.9 | Export validator checks for absence of debug markers | **FAIL** — not yet implemented |

**These 9 failures in section 8 are the single most important blocker for commercial delivery.**

---

## 9. Parameter Replacement Readiness

| # | Criterion | TilePyramid v1 Status |
|---|---|---|
| 9.1 | Store URLs are injectable at runtime without re-export | **FAIL** — hardcoded at build |
| 9.2 | CTA text is injectable without re-export | **FAIL** |
| 9.3 | Tile asset set is replaceable via config | **FAIL** — not implemented |
| 9.4 | Background is replaceable via config | WARN — `backgroundId` config exists but not theme-layered |
| 9.5 | Timer/tray/level are configurable per-client | WARN — config exists but no injection layer |
| 9.6 | Network profile is selectable at export time | PASS (export profiles) |
| 9.7 | AppLovin Max `__PLAYABLE_PARAMETERS__` or equivalent is supported | **FAIL** |

---

## 10. Asset Audit Readiness

| # | Criterion | TilePyramid v1 Status |
|---|---|---|
| 10.1 | All source assets catalogued in asset audit report | WARN — TilePyramid uses legacy intake |
| 10.2 | Raw assets unchanged from intake (SHA-256 verified) | PASS |
| 10.3 | Client assets not committed to git | PASS |
| 10.4 | Asset ownership notes documented | WARN — not formal |

---

## 11. QA Evidence

| # | Criterion | TilePyramid v1 Status |
|---|---|---|
| 11.1 | All unit tests pass | PASS (235 tests) |
| 11.2 | Smoke tests pass (Playwright) | PASS |
| 11.3 | Export validation passes | PASS |
| 11.4 | Commercial export validated (zero debug markers) | **FAIL** — mode not yet implemented |
| 11.5 | Network QA evidence locked (SHA256 + upload result) | PASS (BUILD-22) |
| 11.6 | Formal solvability proven | FAIL (`NOT YET PROVEN`) |

---

## 12. Limitations and Disclaimers

Any commercial delivery must include a written disclaimer covering:

- Upload acceptance by networks is not guaranteed to persist after policy changes.
- Formal solvability of Level_21 is `NOT YET PROVEN`.
- Network webview behavior may differ from local Chromium QA results.
- File size is within limits at time of delivery; future network updates may tighten limits.
- Store URLs must be current at time of delivery.

---

## Commercial Gate Summary (TilePyramid v1 — BUILD-22 baseline)

| Gate | Status | Blocking? |
|---|---|---|
| Debug flags cleared | **8 FAILs** | YES — BUILD-28 required |
| Network upload passed | PASS | — |
| Size within budget | PASS | — |
| Parameter injection | **7 FAILs** | YES — BUILD-31 required |
| End card quality | WARN | No (acceptable for v1) |
| QA evidence locked | PASS | — |
| Review mode | **FAIL** | YES — BUILD-28 required |

**TilePyramid_PL01 is NOT commercially deliverable at BUILD-22. BUILD-28 is required
at minimum before any commercial delivery.**
