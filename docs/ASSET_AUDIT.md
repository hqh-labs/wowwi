# ASSET_AUDIT.md

Project: TilePyramid_PL01
Source ZIP: `TilePyramid_PL01_assets.zip.zip`
SHA-256: `21132D324A2071298C32A8611AD23674F019F8992A82463F0D2DD0CA400D3BE1`
Audit date: 2026-06-26

---

## Summary

| Metric | Value |
|---|---|
| Total files | 100 |
| Total uncompressed size | 33.87 MB |
| PNG images | 54 |
| MP3 audio | 39 |
| WAV audio | 3 |
| JSON level files | 2 |
| Unity package | 1 (.unitypackage.gz) |
| Font | 1 (.ttf) |

---

## Directory structure

```
TilePyramid_TrueGameplay/
├── App icon/          1 PNG
├── Background/        15 PNGs
├── Base Bar/          4 PNGs
├── CTA button/        1 PNG
├── Font/              1 TTF
├── Level Design/      2 JSONs
├── Logo/              1 PNG
├── Pointer/           1 PNG
├── SFX_BGM/
│   ├── BGM/           2 MP3
│   └── SFX/          37 audio files (37 MP3 + 3 WAV; one WAV is in SFX)
├── Tile Set/          30 PNGs
├── Timer/             1 PNG
└── VFX_TileBreak/     1 .unitypackage.gz
```

---

## Images

### App icon

| File | Dimensions | Alpha | Notes |
|---|---|---|---|
| `App icon/Icon_PyramidQuest.png` | 1024×1024 | No (RGB) | No transparency; standard app-store icon format |

### Background images

15 files. All `1024×1024 px`, `Format32bppArgb` (alpha channel present).

| File | Size |
|---|---|
| Background_1.png | 1,079 KB |
| Background_2.png | 990 KB |
| Background_3.png | 1,031 KB |
| Background_4.png | 1,156 KB |
| Background_5.png | 1,333 KB |
| Background_6.png | 1,406 KB |
| Background_7.png | 1,444 KB |
| Background_8.png | 1,361 KB |
| Background_9.png | 1,495 KB |
| Background_10.png | 1,584 KB |
| Background_11.png | 1,555 KB |
| Background_12.png | 1,321 KB |
| Background_13.png | 1,432 KB |
| Background_14.png | 1,455 KB |
| Background_15.png | 1,472 KB |

**Issues:**
- At 1024×1024 each, these are square. Portrait canvas is typically taller. Each background will need either cropping or cover-fit scaling in the renderer.
- Total raw size ~20 MB for 15 backgrounds. Playable ads typically ship one or two backgrounds. Conversion to WebP with compression is required.
- Alpha channel present but visually likely unused (photography/illustration backgrounds). Converting to JPEG or RGB-only WebP may save 20–30%.

### Tray / Base Bar

| File | Dimensions | Alpha | Notes |
|---|---|---|---|
| `base_bar_5.png` | 784×188 | Yes | Tray bar for 5-slot capacity |
| `base_bar_7.png` | 1084×187 | Yes | Tray bar for 7-slot capacity |
| `tile_base_bar.png` | 120×126 | Yes | Individual tray cell background |
| `tile_slot.png` | 134×135 | Yes | Individual tray slot frame |

**Notes:**
- Two bar sizes are provided (5-slot and 7-slot). Requirements specify 5-slot capacity; use `base_bar_5.png`.
- `base_bar_7.png` can be kept as a reference but is out of scope for BUILD-01 through BUILD-04.

### CTA Button

| File | Dimensions | Alpha | Notes |
|---|---|---|---|
| `CTA button/1768985619153.png` | 1536×1024 | Yes | Landscape-aspect image with baked-in text |

**Issues:**
- The supplied image has **baked-in text and styling**. It must be treated as a visual reference, not a direct runtime asset. The production CTA must be implemented as a configurable component with separately controlled properties: background, border/glow, text, font, colour, size, position, click area, and store-open behaviour.
- Filename is a Unix timestamp. If used as reference: rename to `cta_button_reference.png`.
- Landscape aspect (1536×1024 = 3:2). In a 9:16 portrait viewport this would need significant scaling. The component implementation is not constrained by this image's aspect ratio.
- Do not process or recreate the CTA yet. CTA implementation is a later build phase.

### Logo

| File | Dimensions | Alpha | Notes |
|---|---|---|---|
| `Logo/Logo (1).png` | 743×381 | Yes | Game logo |

**Issues:**
- Filename contains a space and parenthesis. Rename to `logo.png` before use in source.

### Hand pointer

| File | Dimensions | Alpha | Notes |
|---|---|---|---|
| `Pointer/1768988491461.png` | 503×496 | Yes | Tutorial hand pointer |

**Issues:**
- Timestamp filename. Rename to `pointer_hand.png`.
- Nearly square (503×496). Suitable for a cursor/hand sprite with alpha.

### Tile set

30 files. All `132×144 px`, `Format32bppArgb`.
Numbered `1.png` through `30.png`.

**Notes:**
- Uniform dimensions — sprite sheet atlas is straightforward.
- All have alpha channel — suitable for layered rendering on any background.
- 30 distinct tile types available. With triplet matching, 10 types fill one complete round (30 tiles). See LEVEL_DATA_ANALYSIS.md for tile assignment strategy.

### Timer / UI chrome

| File | Dimensions | Alpha | Notes |
|---|---|---|---|
| `Timer/button_close_frame.png` | 176×176 | Yes | Close/dismiss button frame |

**Notes:**
- The `Timer/` folder contains only a close button frame — no timer bar, timer circle, or countdown graphic. The timer visual must be created programmatically or additional assets must be requested.

---

## Audio

### Background music

| File | Size | Notes |
|---|---|---|
| `BGM/BGM_GamePlay.mp3` | 5,116 KB (~5 MB) | In-game background music |
| `BGM/BGM_Home.mp3` | 3,314 KB (~3.2 MB) | Menu/home screen music |

**Issues:**
- BGM_GamePlay.mp3 alone is ~5 MB. Combined with other assets, the playable will exceed ad-network limits.
- Both BGM files are out of scope for a playable ad tightly constrained by size. Only `BGM_GamePlay.mp3` should be used, and it must be compressed or trimmed.
- Recommended: re-encode to Opus/WebM at 64 kbps (~30 seconds of loopable clip).

### Sound effects (SFX)

| File | Size | Used in playable |
|---|---|---|
| `SFX_Select_Tile_1.mp3` | 4.6 KB | Yes — tile tap |
| `SFX_Match_3.mp3` | 18.8 KB | Yes — match cleared |
| `SFX_Drop.wav` | 231.5 KB | Yes — tile drops to tray |
| `SFX_Drop2.wav` | 201.7 KB | Yes — alternative drop |
| `SFX_Match3_New.wav` | 350.7 KB | Yes — alternate match |
| `SFX_Cannot_Select.mp3` | 1.9 KB | Yes — blocked tile tap |
| `SFX_Level_Win.mp3` | 72.8 KB | Yes — win state |
| `SFX_Lose.mp3` | 19.8 KB | Yes — lose state |
| `SFX_ReachToBar.mp3` | 8.6 KB | Yes — tray fills up |
| `SFX_Tile_Appear.mp3` | 28.3 KB | Maybe — tile reveal |
| `SFX_Transition.mp3` | 41.6 KB | Maybe — screen transition |
| `SFX_Button_Play.mp3` | 4.8 KB | Maybe — UI button |
| `SFX_Click.mp3` | 3.3 KB | Maybe — generic click |
| `SFX_Combo_Amazing.mp3` | 13.5 KB | Out of scope (no combo system) |
| `SFX_Combo_Awesome.mp3` | 9.4 KB | Out of scope |
| `SFX_Combo_Clear.mp3` | 8.8 KB | Out of scope |
| `SFX_Combo_Excellent.mp3` | 8.6 KB | Out of scope |
| `SFX_Combo_Great.mp3` | 24.5 KB | Out of scope |
| `SFX_Combo_Perfect.mp3` | 10.2 KB | Out of scope |
| `SFX_booster_magnet.mp3` | 30.4 KB | Out of scope (no boosters) |
| `SFX_booster_shuffle.mp3` | 14.5 KB | Out of scope |
| `SFX_booster_undo.mp3` | 7 KB | Out of scope |
| `SFX_Coin_Collect.mp3` | 4.4 KB | Out of scope |
| `SFX_Coin_Spawn.mp3` | 31.1 KB | Out of scope |
| `SFX_Coin_Spend.mp3` | 19.2 KB | Out of scope |
| `SFX_Confetti_Combo.mp3` | 11.4 KB | Out of scope |
| `SFX_Confetti_Result.mp3` | 16.2 KB | Out of scope |
| `SFX_DailyReward_Booster_Appear.mp3` | 31.1 KB | Out of scope |
| `Sfx_Giftbox_Open.mp3` | 31.1 KB | Out of scope |
| `SFX_GiftBox_JumpOut.mp3` | 8.4 KB | Out of scope |
| `SFX_GiftBoxProgress_Full.mp3` | 21 KB | Out of scope |
| `SFX_Revive.mp3` | 25.1 KB | Out of scope |
| `SFX_Wheel_spin_increase.mp3` | 19 KB | Out of scope |
| `SFX_Wheel_spin_loop.mp3` | 71.7 KB | Out of scope |
| `SFX_Wheel_spin_reward.mp3` | 31.1 KB | Out of scope |
| `SFX_Button_Appear.mp3` | 32.1 KB | Maybe |
| `SFX_Button_Play_Appear.mp3` | 31.1 KB | Maybe |
| `SFX_Btn_On_Off.mp3` | 3.1 KB | Maybe |
| `SFX_ClickButton_Close_X.mp3` | 9.6 KB | Maybe |
| `SFX_ClickButton_Setting.mp3` | 3.6 KB | Maybe |

**Notes:**
- Three WAV files (`SFX_Drop.wav`, `SFX_Drop2.wav`, `SFX_Match3_New.wav`) total ~784 KB. WAV is not suitable for web delivery; convert to MP3 or Opus.
- Out-of-scope SFX (combo, booster, coin, gift box, wheel) are from the full game and should not be bundled in the playable ad.
- Recommended in-playable audio set (~200 KB compressed): tile tap, match clear, drop to tray, cannot select, win, lose, tray full, BGM loop.

---

## Level data

| File | Layers | Total stones | Count ÷ 3 | Solvability |
|---|---|---|---|---|
| `Level Design/Level_19.json` | 4 | 75 | 25 triplets (exact) | Not yet proven — requires implemented solver |
| `Level Design/Level_21.json` | 3 | 72 | 24 triplets (exact) | Not yet proven — requires implemented solver |

See `docs/LEVEL_DATA_ANALYSIS.md` for detailed coordinate and blocking analysis.

---

## Font

| File | Size | Notes |
|---|---|---|
| `Font/PaytoneOne-Regular.ttf` | 111 KB | Display font; bold rounded style |

**Notes:**
- TTF is web-compatible via `@font-face`. A WOFF2 conversion (~40 KB) is recommended for production to reduce download size.
- License: PaytoneOne is an open-source Google Font (OFL). No licensing issues.

---

## VFX / Unity assets

| File | Size | Format | Notes |
|---|---|---|---|
| `VFX_TileBreak/ShatterFallEffect_TilePyramid.unitypackage.gz` | 402 KB | Unity package | Cannot run in a web playable |

**Issues:**
- `.unitypackage.gz` is a Unity editor asset. It is not usable in a JavaScript/HTML5 playable without re-implementation.
- The shatter-fall effect must be re-implemented using CSS animation, canvas particles, or Phaser particle emitter in BUILD-05 (effects phase).
- Keep the original as reference but do not attempt to parse or use it directly.

---

## Duplicate and suspicious files

| Issue | Detail |
|---|---|
| Timestamp filenames | `CTA button/1768985619153.png` and `Pointer/1768988491461.png` — fragile names, must be aliased |
| Filename with space | `Logo/Logo (1).png` — parenthesis and space in filename; must be renamed |
| Two bar sizes | `base_bar_5.png` and `base_bar_7.png` — requirements say capacity 5; `base_bar_7` is extra |
| BGM_Home.mp3 | Home screen music; not relevant to the gameplay-only playable ad |

---

## Missing assets

None of the items below are BUILD-01 blockers. Each is deferred to the build phase that first requires it.

| Asset needed | Status | Planned approach |
|---|---|---|
| Timer graphic | Not provided | Use the supplied `button_close_frame.png` as a UI frame; render countdown numerically via code. No graphical timer asset is required. Deferred to tile-gameplay phase. |
| Win overlay / screen | Not provided | Implement programmatically (coloured overlay + text). May be supplemented by client assets in a later phase. Not required until win/lose phase. |
| Lose overlay / screen | Not provided | Same as win overlay approach. |
| Tray full warning indicator | Not provided | Implement as a tint/shake animation on the tray bar. Not required until tray-logic phase. |
| Tile locked/dimmed state | Not provided | Generate via tint or reduced opacity on the tile sprite in code. No separate locked-state asset needed. |
| Tile selected state | Not provided | Generate via scale-up tween, outline, or highlight tint in code. No separate selected-state asset needed. |
| Background for portrait (9:16 crop) | Backgrounds are 1024×1024 (square) | Use cover-fit scaling in the renderer. No cropped variant is required for BUILD-01; the cover-fit logic handles orientation. |

---

## Assets requiring conversion before use

| Asset | Conversion needed |
|---|---|
| All background PNGs | WebP compression + cover-fit crop for 9:16 |
| `SFX_Drop.wav`, `SFX_Drop2.wav`, `SFX_Match3_New.wav` | Convert to MP3 or Opus |
| `BGM_GamePlay.mp3` | Re-encode to 64 kbps, trim to ~30s loop |
| `Font/PaytoneOne-Regular.ttf` | Convert to WOFF2 |
| CTA button | Rename `1768985619153.png` → `cta_button.png` |
| Pointer | Rename `1768988491461.png` → `pointer_hand.png` |
| Logo | Rename `Logo (1).png` → `logo.png` |
| Unity VFX package | Re-implement as canvas/particle effect |

---

## Assets that cannot run directly in a web playable

| Asset | Reason |
|---|---|
| `ShatterFallEffect_TilePyramid.unitypackage.gz` | Unity editor binary; no web runtime |
| `BGM_Home.mp3` | Only needed for a home screen that does not exist in the playable |
| WAV files | Too large for web; no streaming support in all ad contexts |
| Raw background PNGs (~1 MB each) | Exceed reasonable per-asset size budget |
