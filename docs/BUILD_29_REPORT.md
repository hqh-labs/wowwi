# BUILD-29 Report - Commercial Juice + End Card + Reward Feedback

**Branch:** `build-29-commercial-juice-endcard`
**Date:** 2026-06-28
**Status:** Implemented locally

## Objective

Raise TilePyramid_PL01 from a technically valid playable toward a more commercial
creative presentation without changing gameplay rules, store URLs, partner code,
raw assets, or BUILD-28 commercial export hygiene.

## Systems Upgraded

- Commercial end card v2: richer full-screen composition, animated rays,
  particles, app icon glow, title hierarchy, install copy, and staged entrance.
- CTA polish v2: glow, rounded premium shell, inner highlight, shine pass, pulse,
  and tap feedback while keeping the existing click/store-open path.
- Match reward feedback: short reward text and burst accents when a match resolves.
- Tray landing polish: landing pop, tray glow, ripple, and commercial match-ready
  glow separate from debug markers.
- Tile tap/lift polish: selected tile lift and clearer blocked-tile denial ring.
- Idle hint v2: stronger target pulse and guidance trail.
- Timer warning polish: warning/danger colors and stronger warning stroke.
- Background/board depth: subtle board glow, tray glow, and vignette using Phaser
  primitives only.

## Architecture

BUILD-29 adds a single optional `commercialJuice` config block in
`public/config/game.config.json`. The block groups:

- `endCardV2`
- `ctaPolish`
- `matchReward`
- `trayLanding`
- `tileTapPolish`
- `idleHintV2`
- `timerWarningPolish`
- `boardDepth`

`ConfigLoader` validates this block when present. `GameScene` consumes it as a
cosmetic layer only.

## Export Safety

BUILD-28 commercial mode remains preserved:

- Export/candidate/delivery still force `buildMode: "commercial"`.
- Commercial export validation still rejects debug flag leakage.
- Unity export remains non-MRAID-boot-policy dependent.
- AppLovin boot policy remains viewability-gated with safe fallback.
- Store URLs are unchanged.
- No `window.top` behavior is introduced.

## Not In Scope

- Parametric store URL or asset replacement.
- Partner code reuse.
- New gameplay rules or scoring.
- Commercial-ready claim.
- Vercel deployment.

## Remaining Commercial Blockers

- Runtime parameter injection is still missing and remains BUILD-31 scope.
- Asset/theme replacement is still missing and remains BUILD-32 scope.
- Formal solvability remains `NOT YET PROVEN`.
- Network re-upload and commercial QA lock remain future work.
