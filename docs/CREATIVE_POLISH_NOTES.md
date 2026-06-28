# Creative Polish Notes — TilePyramid_PL01

**Build:** BUILD-20
**Date:** 2026-06-28

These notes document the design rationale for each visual polish area. Implementation details
live in `GameScene.ts`; parameter tuning is done entirely through `game.config.json`.

---

## 1. CTA Polish

**Goal:** Make the CTA pulse while the player is idle, signalling it is tappable.

**Changes:**
- Added `effects.ctaPulse` (EffectScaleConfig) — a looping scale pulse at 1.05× / 700 ms.
- Pulse applied to both the background rectangle and the label together so they move as one unit.
- Applied on the gameplay CTA and on the end-card CTA (shared tween logic, shared config).
- CTA width/height bumped slightly (460×116 → was 420×112) for better tap target.
- Font size increased 42 → 46 px.
- `cornerRadius` increased 28 → 32 for a more pill-like shape.

**Does not start the timer.** CTA click goes through `handleGameplayCtaClick()`, which
calls `openStore()` only — no `registerTimerInteraction()` call.

---

## 2. End Card Polish

**Goal:** Stronger visual hierarchy, memorable win/fail differentiation.

**Changes:**
- `endCard.winMessageColor` = `#ffd447` (warm gold) for win state.
- `endCard.failMessageColor` = `#ff7a5c` (warm orange-red) for fail state.
- Message font size bumped 70 → 74 px; stroke thickness 8 → 10.
- `endCard.entranceAnimation` (boolean): icon, logo, and message text fade in with 90 ms
  stagger between each element, 380 ms duration, Sine.easeOut.
- App icon display size 240 → 256 px (slightly larger, balanced).
- App logo y-position adjusted 705 → 720 for better spacing after icon resize.
- End card CTA size 500×128 → 520×132 and font 48 → 50 px.
- End card CTA also receives the `ctaPulse` looping tween (same config as gameplay CTA).

---

## 3. Tile Selection Polish

**Goal:** Stronger tactile feedback when a tile is chosen.

**Changes:**
- `effects.tileSelectPop.scale` increased 1.08 → 1.14. Scale is applied immediately when
  tile begins its flight to the tray.
- `effects.tileSelectPop.durationMs` tightened 90 → 80 ms.
- New **lift glow**: a white ellipse (32% alpha) appears at the tile position when it is
  lifted, then fades out while expanding to 1.5× over 3× the pop duration. Gives the
  impression of the tile "lifting off" the board.
- Fly easing changed from `Cubic.easeInOut` → `Cubic.easeOut` for a snappier initial
  movement that softly lands in the tray.

---

## 4. Match-Three Polish

**Goal:** Celebrate matches with a visible burst, not just a flash.

**Changes:**
- New `effects.matchSparkle` config: 6 dots, radius 54 px, 380 ms, color `#ffd447`.
- `showMatchSparkle()`: for each of the 3 matched tiles, 6 small circles (radius 5 px)
  radiate outward at evenly-spaced angles and fade to alpha 0 with Cubic.easeOut.
- Called immediately after `showMatchResolveFlash()` inside `startMatchResolution()`.
- Sparkle dots are self-cleaning (destroy in `onComplete`), no memory leak risk.

---

## 5. Blocked Tap Polish

**Goal:** Make blocked taps undeniably obvious without being jarring.

**Changes:**
- When `blockedTileFeedback === 'shake'`, the tile now also briefly tints (using the existing
  `blockedShake.tint` color `#ff5d73`) for the full duration of the shake, then clears.
  Previously shake and tint were mutually exclusive modes; now shake includes tint.
- Shake parameters tuned: distance 10 → 12 px, durationMs 48 → 44 ms, repeats 2 → 3.
  (More reps at slightly shorter time = faster, more frantic feeling.)

---

## 6. Timer Warning Polish

**Goal:** Continuous visual urgency once timer enters warning zone.

**Changes:**
- `effects.timerWarningContinuousPulse` (boolean, default `true`): when enabled, a looping
  scale tween replaces the single one-shot pulse that previously fired when warning activated.
- `effects.timerWarningPulse.scale` 1.06 → 1.12; `durationMs` 240 → 300 ms for a more
  pronounced beat.
- `timerWarningLoopTween` private field manages tween lifecycle. Tween is stopped when:
  - Timer expires (in `update()`).
  - Scene shuts down (in `shutdown()`).
- `renderTimer()` skips the manual `setScale()` call when the loop tween is active (avoids
  fighting the tween on each second tick).

---

## 7. Tutorial Polish

**Goal:** Clearer highlight rings that feel more polished and intentional.

**Changes:**
- Tutorial highlight rings changed from `Phaser.GameObjects.Rectangle` to
  `Phaser.GameObjects.Graphics` with `strokeRoundedRect()` (corner radius 12 px).
- A second, thinner outer glow ring is drawn 5 px outside the main ring at 50% alpha
  (`#fffbe6`) to create a soft halo effect.
- Tween parameters adjusted: alpha 0.72–1.0 → 0.68–1.0; scale 0.96–1.04 → 0.94–1.06;
  added explicit `Sine.easeInOut` easing.
- Tutorial `dimOpacity` increased 0.5 → 0.6 for a darker, more atmospheric backdrop.

---

## 8. Board/Tray Polish

**Goal:** Better visual framing for the tray; less abrupt board appearance on load.

**Board entrance animation:**
- `effects.boardEntrance` config: enabled, durationMs 260, staggerMs 12.
- Tiles are sorted by (layer, y, x) and each fades in from alpha=0 to alpha=1 with a
  12 ms per-tile stagger, Sine.easeOut. With ~60–72 tiles the full entrance spans < 1 second.

**Tray rounded frame:**
- Tray background changed from `Phaser.GameObjects.Rectangle` (flat corners) to
  `Phaser.GameObjects.Graphics` using `fillRoundedRect()` and `strokeRoundedRect()`
  (corner radius 18 px).
- Alpha slightly increased 0.74 → 0.76; stroke alpha adjusted 0.45 → 0.48 (normal) / 0.95
  (tray full) — unchanged semantics.
- `showTrayFullFeedback()` still works: Graphics inherits from GameObject so alpha tweening
  via Phaser.Tweens is identical to Rectangle.

---

## Config parameters added (game.config.json)

| Path | Type | Default | Purpose |
|---|---|---|---|
| `effects.ctaPulse` | EffectScaleConfig | scale:1.05, dur:700ms | CTA loop pulse |
| `effects.matchSparkle` | MatchSparkleConfig | count:6, r:54, dur:380ms | Match burst |
| `effects.timerWarningContinuousPulse` | boolean | true | Loop timer pulse |
| `effects.boardEntrance` | BoardEntranceConfig | dur:260ms, stagger:12ms | Board fade-in |
| `endCard.winMessageColor` | string | `#ffd447` | Win message color |
| `endCard.failMessageColor` | string | `#ff7a5c` | Fail message color |
| `endCard.entranceAnimation` | boolean | true | End card fade-in |

---

## Size impact

All changes are pure Phaser/JS code. No new asset types are added. The inline HTML export
will be marginally larger (extra JS) but well within the 5 MB limit.

---

## Export compatibility

- No `window.top` references added.
- No new external assets required.
- No ad-network SDK calls in `gameplay/` (sparkle and entrance effects live in `GameScene.ts`
  which is allowed to call Phaser APIs).
- Unity and AppLovin adapter wrappers are unchanged.

---

*Generated: 2026-06-28 — BUILD-20 creative polish pass*
