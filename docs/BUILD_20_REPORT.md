# BUILD-20 Report — Creative Polish Pass

**Build:** BUILD-20
**Date:** 2026-06-28
**Branch:** `build-20-creative-polish`
**Base:** BUILD-19 (live preview QA lock)

---

## Summary

BUILD-20 is a creative polish pass for TilePyramid_PL01. It improves the playable's visual
quality and ad-readiness across 8 areas while preserving the stable technical and export
foundation established in BUILD-13 through BUILD-19.

No core gameplay rules were changed. No new assets were added. Unity/AppLovin export
compatibility is maintained. The Vercel preview build pipeline is unchanged.

---

## Files created

| File | Purpose |
|---|---|
| `projects/TilePyramid_PL01/tests/unit/creativePolish.test.ts` | 15 new BUILD-20 config tests |
| `docs/BUILD_20_REPORT.md` | This report |
| `docs/CREATIVE_POLISH_NOTES.md` | Per-area design rationale |

---

## Files modified

| File | Change |
|---|---|
| `projects/TilePyramid_PL01/src/types.ts` | Added `MatchSparkleConfig`, `BoardEntranceConfig`; extended `EffectsConfig` with `ctaPulse`, `matchSparkle`, `timerWarningContinuousPulse`, `boardEntrance`; extended `EndCardConfig` with `winMessageColor`, `failMessageColor`, `entranceAnimation` |
| `projects/TilePyramid_PL01/src/config/ConfigLoader.ts` | Added `validateMatchSparkleConfig()`, `validateBoardEntranceConfig()`; added validation calls for all new fields in `validateEffectsConfig()` and `validateEndCardConfig()` |
| `projects/TilePyramid_PL01/public/config/game.config.json` | Added all 7 new config parameters; tuned existing effect values; increased CTA and end card sizing |
| `projects/TilePyramid_PL01/src/scenes/GameScene.ts` | Implemented 8 polish areas (see below) |
| `projects/TilePyramid_PL01/tests/unit/config.test.ts` | Updated VALID fixture with new required `effects` and `endCard` fields |
| `CLAUDE.md` | Updated current build phase to BUILD-20 |
| `README.md` | Added BUILD-20 to build list; updated test counts |

---

## Polish areas implemented

### 1. CTA Polish (renderGameplayCta, renderEndCard)
- Looping scale pulse tween on the CTA button (scale 1.05×, 700 ms, Sine.easeInOut, repeat -1).
- Applied to both gameplay CTA and end-card CTA.
- CTA width/fontSize/cornerRadius tuned upward for better ad presence.

### 2. End Card Polish (renderEndCard)
- Win message renders in `#ffd447` (gold); fail message in `#ff7a5c` (warm orange-red).
- `entranceAnimation`: icon, logo, message stagger-fade in (380 ms, 90 ms between each).
- App icon size 240 → 256 px; logo/CTA similarly sized up.
- End-card CTA also receives the `ctaPulse` looping tween.

### 3. Tile Selection Lift Effect (flyTileToTray)
- `tileSelectPop.scale` increased 1.08 → 1.14.
- White ellipse glow fades out at the pick-up position to simulate "lifting off".
- Fly easing changed from `Cubic.easeInOut` to `Cubic.easeOut`.

### 4. Match-Three Sparkle (startMatchResolution, showMatchSparkle)
- `showMatchSparkle()`: 6 filled circles radiate from each matched tile (54 px radius,
  380 ms, Cubic.easeOut, auto-destroy on complete).
- Configured via `effects.matchSparkle`.

### 5. Blocked Tap Tint+Shake (showBlockedFeedback)
- When `blockedTileFeedback === 'shake'`, the tile now also receives the `blockedShake.tint`
  color for the full shake duration. Tint and shake now both trigger together.
- Shake params tuned: distance 12 px, 44 ms, 3 repeats.

### 6. Timer Warning Continuous Pulse (update, startTimerWarningLoop, renderTimer)
- `timerWarningContinuousPulse: true`: starts a looping Sine tween when warning activates.
- `timerWarningPulse.scale` 1.06 → 1.12; `durationMs` 240 → 300 ms.
- Tween is stopped on timer expiry and scene shutdown.

### 7. Tutorial Rounded Rings (renderTutorial)
- Highlight rings switched from plain Rectangle to Graphics with `strokeRoundedRect()`
  (corner radius 12 px, 8 px stroke, gold `#ffd447`).
- Outer soft-glow halo drawn at 50% alpha, 5 px larger on all sides.
- Tween scale range widened (0.94–1.06) for more visible pulse.
- `dimOpacity` 0.5 → 0.6 for darker backdrop.

### 8. Tray Rounded Frame (renderTray)
- Tray background replaced from Rectangle to Graphics (`fillRoundedRect` + `strokeRoundedRect`,
  corner radius 18 px). Alpha tweening for `showTrayFullFeedback()` is unaffected.

---

## Config parameters added

| Parameter | Type | Value |
|---|---|---|
| `effects.ctaPulse` | EffectScaleConfig | scale:1.05, durationMs:700, enabled:true |
| `effects.matchSparkle` | MatchSparkleConfig | count:6, radius:54, durationMs:380, color:'#ffd447', enabled:true |
| `effects.timerWarningContinuousPulse` | boolean | true |
| `effects.boardEntrance` | BoardEntranceConfig | enabled:true, durationMs:260, staggerMs:12 |
| `endCard.winMessageColor` | string | '#ffd447' |
| `endCard.failMessageColor` | string | '#ff7a5c' |
| `endCard.entranceAnimation` | boolean | true |

---

## Test results

| Suite | Tests | Result |
|---|---|---|
| TilePyramid unit (all files including creativePolish) | 235 | PASS |
| Repo registry tests (`npm test`) | 15 | PASS |
| Live preview static tests (`live-preview:test`) | 8 | PASS |
| TypeScript typecheck | — | PASS (no errors) |

---

## What was NOT changed

- Core gameplay rules (win/fail conditions, tray capacity, timer, matching).
- Raw or extracted client assets (`project-input/`).
- Unity/AppLovin adapter code (`adapters/`).
- Export pipeline (`export-vercel.mjs`, `vercel-build.mjs`, etc.).
- Vercel configuration (`vercel.json`).
- Delivery package (`delivery/latest/`).
- Preview build/validate/test suite counts (preview:test 24, vercel:test 17).

---

## Hard constraints maintained

- No commit or push performed.
- No raw/extracted client assets modified.
- No global software installed.
- No core gameplay rules changed.
- No generated HTML hand-edited.
- Unity/AppLovin export compatibility maintained.
- Vercel preview deployment unbroken.
- No `window.top` references added.
- No authentication added.

---

*Generated: 2026-06-28 — BUILD-20 creative polish pass*
