# PROJECT_REQUIREMENTS.md

Project: TilePyramid_PL01
Status: LOCKED — do not change without explicit client approval.

---

## Gameplay

| Parameter | Value |
|---|---|
| Game type | 2D tile-pyramid matching |
| Initial level | Level_21 |
| Input | Player taps selectable (unblocked) tiles |
| Tray | Selected tiles move into a tray at the bottom |
| Match rule | Three identical tiles disappear from the tray |
| Tray capacity | 5 slots |
| Timer | 30 seconds |
| Timer trigger | Starts on first real player interaction (not tutorial taps) |
| Win condition | All tiles cleared from the board |
| Lose condition — timer | Timer reaches zero |
| Lose condition — tray | Tray is full (5/5) with no possible match |

## Tutorial

- Shown before the first game interaction.
- Dim all non-relevant screen areas (overlay mask).
- Highlight three matching selectable tiles.
- Show an animated hand pointer.
- Display text: `Tap to match!`
- After 5 seconds without player interaction, show an idle reminder (re-trigger animation / pulse).
- Tutorial ends when the player completes the first tap or after the guided interaction is finished.

## Call-to-Action (CTA)

- The CTA button is visible and clickable during active gameplay.
- On the end card, the entire screen is clickable (not just the button area).
- Store-opening logic must be isolated in an adapter layer; gameplay must not call store APIs directly.
- The CTA must work on both Unity Ads and AppLovin without changing gameplay code.

## Orientation

| Scenario | Behavior |
|---|---|
| Portrait (9:16) | Canonical layout; gameplay fills the viewport |
| Landscape | Portrait gameplay area is centered, letterboxed |
| Landscape background | Full-screen asset adapts to cover side bars |
| Landscape side areas | Must not receive tap events for gameplay |
| End-card landscape | Entire landscape screen is clickable |
| UI reflow in landscape | Forbidden — UI must not rearrange |

## Export targets

| Network | Status |
|---|---|
| Unity Ads | First export target |
| AppLovin | First export target |
| Batch export | A single command must export both in one operation |

## Architecture constraints

- All gameplay parameters are config-driven (JSON / config files).
- The same config files are later editable by the visual editor without rebuilding.
- Original client assets are stored separately from optimized runtime assets.
- Gameplay core is independent from ad-network adapters.
- Work proceeds in small, numbered, reviewable build phases.

## Asset source

| File | SHA-256 |
|---|---|
| `TilePyramid_PL01_assets.zip.zip` | `21132D324A2071298C32A8611AD23674F019F8992A82463F0D2DD0CA400D3BE1` |
