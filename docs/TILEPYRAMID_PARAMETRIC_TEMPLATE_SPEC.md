# TilePyramid Parametric Template Spec

**Date:** 2026-06-28
**Build:** BUILD-27 (design only — no implementation)
**Status:** Specification — not implemented

This document defines the future parameter model for TilePyramid_PL01 as a
commercially licensable and reskinnable playable ad template. Implementation
begins in BUILD-31 (runtime injection) and BUILD-32 (asset replacement).

---

## Motivation

Commercial playable ad templates are sold to multiple clients. Each client supplies:

- Their own app store URLs
- Their own tile artwork
- Their own logo and icon
- Their own brand colors
- Potentially a custom game configuration (timer, level, tray size)

A parametric template delivers all of this without requiring code changes —
the template is configured, not forked.

---

## Current State

All configurable values live in a single `game.config.json`. There is no runtime
injection; store URLs are burned into the export HTML at build time. Debug flags
are mixed with gameplay parameters in the same file.

---

## Proposed Config File Structure

The config system is split into five logical files. The `ConfigLoader` merges them
at boot time in priority order, lowest to highest:

```
gameplay.config.json        (base gameplay rules — rarely changes)
theme.config.json           (visual assets — per-client skin)
creative.config.json        (CTA, end card, text, colors, build mode)
network.config.json         (store URLs, network profile, MRAID mode)
variant.config.json         (A/B override set — one file per variant)
```

At runtime, `window.__WOWWI_PARAMS__` overrides any value from any layer:

```js
window.__WOWWI_PARAMS__ = {
  "storeLink_android": "https://...",
  "storeLink_ios": "https://...",
  "ctaText": "DOWNLOAD FREE"
}
```

---

## `gameplay.config.json` — Gameplay Rules

Controls game behavior. Changes here affect gameplay only, not visuals.

```jsonc
{
  "levelId": "Level_21",
  "assignmentSeed": 21000,
  "tileTypeCount": 24,
  "trayCapacity": 5,
  "timer": {
    "durationSeconds": 30,
    "warningSeconds": 5,
    "startOnFirstValidTap": true
  },
  "tutorial": {
    "enabled": true,
    "text": "Tap to match!",
    "handPathMode": "loop-preview-tiles",
    "previewTileIds": ["L2:-1.5:2.5", "L2:-0.5:2.5", "L2:0.5:2.5"]
  },
  "idleHint": {
    "enabled": true,
    "delaySeconds": 3,
    "preferTrayPairCompletion": true
  },
  "boardLayout": {
    "centerX": 540, "centerY": 720,
    "spacingX": 110, "spacingY": 118,
    "layerOffsetX": 22, "layerOffsetY": -22
  }
}
```

**Replaceable per-client parameters:**
- `levelId` — swap level JSON for different difficulty
- `tileTypeCount` — adjust for simpler/harder tile matching
- `trayCapacity` — 3–7 slots
- `timer.durationSeconds` — 20–60 s range
- `tutorial.text` — localized tutorial callout text
- `tutorial.previewTileIds` — which tiles to spotlight first

---

## `theme.config.json` — Visual Assets

Maps logical asset IDs to file paths (relative to `assets/` or embedded data URIs).
Swapping this file changes the visual skin without touching code.

```jsonc
{
  "backgroundId": "Background_1",
  "tileAtlasId": "Tiles_v1",
  "tileFramePrefix": "tile_",
  "tileCount": 24,
  "iconAssetId": "App_Icon",
  "logoAssetId": "App_Logo",
  "handAssetId": "Pointer_Hand",
  "tileColors": {
    "matchSparkleColor": "#ffd447",
    "liftGlowColor": "#ffffff"
  },
  "background": {
    "fitMode": "cover",
    "layers": [
      { "assetId": "Background_1", "zIndex": 0 },
      { "assetId": "Background_Logo_Strip", "zIndex": 1, "optional": true }
    ]
  }
}
```

**Replaceable per-client parameters:**
- `backgroundId` / `background.layers` — full background swap
- `tileAtlasId` / `tileFramePrefix` — complete tile skin replacement
- `iconAssetId` — app icon (shown on end card)
- `logoAssetId` — brand logo (shown on end card and background)
- `handAssetId` — pointer hand style
- `tileColors.matchSparkleColor` — brand-colored match burst

---

## `creative.config.json` — CTA, End Card, Text, Modes

Controls all text, colors, and presentation. Includes the `buildMode` field that
replaces all legacy `debug*` flags.

```jsonc
{
  "buildMode": "commercial",

  "cta": {
    "text": "PLAY NOW",
    "backgroundColor": "#ff3f6e",
    "textColor": "#ffffff",
    "borderColor": "#fff4a8",
    "position": { "x": 540, "y": 1775 },
    "size": { "width": 460, "height": 116 },
    "fontSize": 46,
    "cornerRadius": 32,
    "visibleDuringGameplay": true,
    "reviewModeHidden": false
  },

  "endCard": {
    "titleText": "Pyramid Quest",
    "winMessage": "Level Complete!",
    "failMessage": "Try Again!",
    "winMessageColor": "#ffd447",
    "failMessageColor": "#ff7a5c",
    "ctaText": "PLAY NOW",
    "frameStyle": "ribbon",
    "backgroundStyle": "shimmer",
    "entranceAnimation": true
  },

  "tutorial": {
    "calloutStyle": "speech-bubble",
    "calloutText": "Tap to match!"
  },

  "effects": {
    "intensity": 1.0
  }
}
```

**`buildMode` values:**
| Mode | Debug overlays | Store open | CTA visible | Review toggle |
|---|---|---|---|---|
| `development` | Yes | record-only | Yes | N/A |
| `review` | No | record-only | Yes | via `reviewModeHidden` |
| `commercial` | No | navigate | Yes | N/A |

**Replaceable per-client parameters:**
- `cta.text` / `endCard.ctaText` — localized CTA text
- `cta.backgroundColor` / `textColor` — brand colors
- `endCard.titleText` / `winMessage` / `failMessage` — copy
- `endCard.frameStyle` — decorative frame variant
- `buildMode` — set by export pipeline, not by client

---

## `network.config.json` — Store URLs, Network Profile, MRAID

```jsonc
{
  "network": "applovin",
  "profileId": "applovin-2026-06",
  "storeUrls": {
    "androidUrl": "https://play.google.com/store/apps/details?id=com.example.app",
    "iosUrl": "https://apps.apple.com/app/id123456789",
    "fallbackUrl": "https://play.google.com/store/apps/details?id=com.example.app"
  },
  "mraidMode": "mraid2",
  "viewabilityGate": true,
  "parametersKey": "__WOWWI_PARAMS__",
  "injectableParams": ["storeLink_android", "storeLink_ios", "ctaText"]
}
```

**Replaceable per-client / per-network parameters:**
- `storeUrls.*` — fully swappable; also injectable via `__WOWWI_PARAMS__`
- `network` / `profileId` — selects export profile (Unity vs AppLovin)
- `viewabilityGate` — toggle viewability-gated boot per network need
- `injectableParams` — which params the network may override at ad-serve time

---

## `variant.config.json` — A/B Override Set

A sparse override file. Any field present overrides the merged base config.

```jsonc
{
  "variantId": "A",
  "creative.cta.text": "GET IT FREE",
  "creative.cta.backgroundColor": "#2563eb",
  "network.storeUrls.fallbackUrl": "https://example.com/variant-a"
}
```

Dot-notation keys are expanded by the config loader before merge.

---

## Runtime Injection Interface (`window.__WOWWI_PARAMS__`)

The export bridge injects the following snippet before the game boots:

```js
if (typeof window.__WOWWI_PARAMS__ !== 'object') {
  window.__WOWWI_PARAMS__ = {};
}
```

The `ConfigLoader` reads `__WOWWI_PARAMS__` at startup (after DOMContentLoaded) and
applies its values as the highest-priority layer. AppLovin may inject additional
values via `mainTheOneSdk.getParameterValue()` — the loader also checks that path.

**Injection behavior:**
| Param key | Affects | Override target |
|---|---|---|
| `storeLink_android` | Android store open URL | `network.storeUrls.androidUrl` |
| `storeLink_ios` | iOS store open URL | `network.storeUrls.iosUrl` |
| `ctaText` | CTA button label | `creative.cta.text` and `creative.endCard.ctaText` |
| `buildMode` | Debug/commercial toggle | `creative.buildMode` |
| `timerDuration` | Game timer seconds | `gameplay.timer.durationSeconds` |

---

## Export Modes

| Export command | `buildMode` | Store open | Debug overlays | File suffix |
|---|---|---|---|---|
| `npm run export:applovin` | `commercial` | `mraid.open()` | hidden | `_applovin.html` |
| `npm run export:applovin -- --mode review` | `review` | `record-only` | hidden | `_applovin_review.html` |
| `npm run export:applovin -- --mode development` | `development` | `record-only` | visible | `_applovin_dev.html` |

---

## Config Loader Contract

`ConfigLoader.load()` returns a merged `GameConfig` object following this priority
(highest wins):

```
window.__WOWWI_PARAMS__
  > variant.config.json
    > network.config.json
      > creative.config.json
        > theme.config.json
          > gameplay.config.json
```

Hot-reloading in development mode is not required. The config is loaded once at boot.

---

## What This Spec Does Not Cover

- Visual editor for non-technical config editing (future)
- Automated variant upload to Unity/AppLovin (future)
- Dynamic level generation (future)
- Multi-language localization pipeline (future)
