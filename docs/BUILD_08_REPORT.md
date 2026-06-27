# BUILD-08 Report: Basic Audio and Visual Feedback Effects

Project: TilePyramid_PL01  
Branch: build-08-audio-effects

## Architecture implemented

- Added pure audio state management in `src/gameplay/audio/AudioSystem.ts`.
- Added pure effect diagnostics in `src/gameplay/effects/EffectSystem.ts`.
- Added config-driven audio/effect settings to `public/config/game.config.json`.
- Added SFX entries to `public/config/asset-manifest.json`.
- Updated `PreloadScene` to load configured audio assets through the manifest.
- Updated `GameScene` to publish `window.__TILEPYRAMID_BUILD08__` while preserving older snapshot globals.
- Added lightweight visual feedback for valid tile select, blocked tap, tray full, match resolve, timer warning, CTA click diagnostics, and win/fail outcome.
- Updated size measurement to report runtime audio bytes separately.

## Runtime audio assets

All runtime audio was copied unchanged from existing extracted client MP3 files into `projects/TilePyramid_PL01/public/assets/audio/`. No files under `project-input/` were modified.

| Runtime file | Source file | Bytes |
|---|---|---:|
| `blocked_tap.mp3` | `SFX_Cannot_Select.mp3` | 1,980 |
| `cta_click.mp3` | `SFX_Click.mp3` | 3,335 |
| `fail.mp3` | `SFX_Lose.mp3` | 20,260 |
| `match.mp3` | `SFX_Match_3.mp3` | 19,296 |
| `tile_select.mp3` | `SFX_Select_Tile_1.mp3` | 4,714 |
| `win.mp3` | `SFX_Level_Win.mp3` | 74,523 |

Total runtime audio: 124,108 bytes.

## Audio behavior

- Audio starts locked and unlocks after the first valid selectable gameplay tile tap.
- Blocked taps do not start the timer and do not unlock audio under the current config.
- SFX are requested for tile select, blocked tap, match, win, fail, gameplay CTA, and end-card CTA.
- BGM remains disabled to preserve production size.
- Audio diagnostics include enabled, unlocked, muted, BGM state, last SFX, and error count.

## Effect behavior

- Tile select applies a small scale pop before the fly-to-tray tween.
- Blocked tiles use the configured shake/tint feedback.
- Tray-full rejection pulses the tray background.
- Match resolve adds a brief tray flash and preserves the existing scale/fade removal.
- Timer warning remains visual-only and exposes `timerWarningVisualActive`.
- Outcome pulse applies after the end card is rendered.

## Build-size measurements

- Total production output: 1,890,296 bytes.
- JavaScript raw: 1,530,720 bytes.
- JavaScript gzip estimate: 352,567 bytes.
- CSS: 0 bytes.
- Runtime images: 207,198 bytes.
- Runtime audio: 124,108 bytes.
- Largest file remains `dist/assets/phaser-YAzv7auA.js` at 1,475,508 bytes.

## Test results

- `npm run typecheck`: passed.
- `npm run test`: passed, 11 files, 164 tests.
- `npm run build`: passed.
- `npm run test:smoke`: passed, Chromium ran 12 tests.
- `npm run measure:size`: passed.

Warnings:
- Vite reports the existing large Phaser chunk warning.
- Vitest reports the existing Vite CJS Node API deprecation warning.

## Explicit non-scope confirmations

- Raw and extracted client assets were not modified.
- BGM was not enabled.
- Unity Ads exporter was not implemented.
- AppLovin exporter was not implemented.
- MRAID integration was not implemented.
- Network packaging was not implemented.
- Visual editor was not implemented.
- Formal solvability remains NOT YET PROVEN.
