# TilePyramid Commercial Juice Pass

BUILD-29 is a cosmetic/game-feel pass for TilePyramid_PL01. It does not change
gameplay rules, network adapters, store URLs, or raw client assets.

## End Card V2

The end card now uses a stronger hierarchy:

- Full-screen dark surface.
- Soft animated rays.
- Floating particle accents.
- App icon glow.
- Logo and title staging.
- Install/download message.
- Premium CTA emphasis.

The full-screen click behavior and end-card CTA both continue to use the existing
store-open abstraction.

## CTA V2

The gameplay CTA keeps its safe hit area and location, but adds:

- Glow.
- Rounded visual shell.
- Inner highlight stroke.
- Shine animation.
- Tap-scale feedback.
- Existing pulse behavior.

The clickable object remains in the same position and still records/opens through
the existing CTA state and store-open service.

## Match Reward

When a match resolves, BUILD-29 shows a short reward label such as `Nice!`,
`Great!`, or `Combo!`, plus a burst around the tray area. This is cosmetic only:
no score, combo multiplier, timer bonus, or gameplay rule was added.

## Tray And Tile Interaction

Tile arrival in the tray now has a landing pop and ripple. Match-ready tiles get a
commercial glow separate from the debug-only match-ready marker.

Tile selection adds a small lift before flying to the tray. Blocked-tile taps add a
clear denial ring in addition to the existing shake/tint feedback.

## Idle Hint And Timer

Idle hints now use a stronger pulse and guidance trail. Existing idle suppression,
tutorial behavior, and deterministic target selection are preserved.

Timer warning uses stronger warning/danger coloring without changing timer
duration, start rules, expiry, or tutorial timing.

## Background Depth

The scene adds subtle vignette, board glow, and tray glow using Phaser primitives.
No external images or new runtime assets are required.

## Commercial Status

BUILD-29 improves creative quality but does not make TilePyramid_PL01 fully
commercial-ready. Remaining blockers include runtime parameter injection, asset
replacement, formal solvability, and fresh network QA.
