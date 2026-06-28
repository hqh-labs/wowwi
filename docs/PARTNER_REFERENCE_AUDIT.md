# Partner Reference Audit

**File:** `project-input/references/partner-playables/TilePyramid_PA_TrueGPHardLevel_AppLovin_240226.html`
**Audit date:** 2026-06-28
**Build:** BUILD-27
**Auditor:** Static analysis only — no partner code extracted or reused

---

## Legal and Safety Boundary

This document records observations derived from static inspection of a partner-made
playable ad. The partner file is a commercial reference supplied as competitive
context. It was **not reverse-engineered**. No partner source code, proprietary
algorithm, effect implementation, or asset-packing technique has been extracted
into or reproduced in this repository.

The following must never be copied from this file:

- Partner minified or obfuscated JavaScript
- Partner Cocos Creator runtime or engine code
- Partner proprietary class implementations
- Partner ZIP/asset-packing algorithm
- Partner effect/animation implementations
- Partner audio or visual assets

---

## File Identity

| Field | Value |
|---|---|
| File name | `TilePyramid_PA_TrueGPHardLevel_AppLovin_240226.html` |
| File size | ~3.8 MB (3,894,097 bytes) |
| HTML title | `Cocos Creator | CocosTilesPyramidPLA` |
| Export target | **AppLovin** (confirmed by bridge code patterns) |
| Engine | **Cocos Creator 3.10.1** |
| Engine type | 3D/2D WebGL game engine (industry standard in Chinese ad studios) |
| Obfuscated | Yes — identifier strings replaced with hex offsets; production build |

---

## Engine and Runtime

The partner playable is built with **Cocos Creator version 3.10.1**, a professional
game engine widely used in Asia-Pacific playable ad studios. It targets WebGL canvas
rendering. The `<canvas>` element covers 100% width and height via CSS
(`#Cocos3dGameContainer, #GameCanvas, #GameDiv { width:100%; height:100% }`).

The engine binary, game logic, and all assets are compiled into a single deliverable
HTML file. The JavaScript is minified and obfuscated (numeric string table with hex
index lookups), indicating a professional commercial build pipeline.

---

## Packaging

The partner file uses a **base64-encoded ZIP bundle** strategy:

```
window.__zip = "UEsDBAo...";  // ~3.785 million base64 chars
```

Decoded payload: approximately **2.77 MB** of game assets and engine bundles.

The ZIP is unpacked at runtime (in-browser) by the Cocos framework into named virtual
files (`application.js`, texture atlases, audio, etc.). This approach bundles
everything in one file and avoids any external resource requests.

**Implications:**
- Larger raw file size (~3.8 MB) but self-contained and verifiable
- Assets benefit from ZIP compression; actual uncompressed payload larger
- Runtime unzip adds a brief startup overhead before the game canvas appears
- All assets can be verified by inspecting the ZIP contents without modifying the HTML

Our current approach (Vite build + data-URI inliner, ~1.9 MB) is lighter and avoids
the startup unzip overhead, but cannot leverage ZIP compression for image assets.

---

## Network / MRAID Handling

The partner file implements a complete MRAID 2.x integration:

**Bridge object:** `window.super_html`
- `super_html.download(url)` — CTA/store-open action: calls `mraid.open(url)` if MRAID
  is available, otherwise falls back to `super_open(url)`
- `super_html.appstore_url` — iOS store URL (read by bridge on tap)
- `super_html.google_play_url` — Android store URL
- `super_html.is_hide_download` — flag to suppress download button (debug/review mode)

**Viewability-gated engine start:**
```
mraid.addEventListener("viewableChange", viewableChangeHandler)
mraid.isViewable() && viewable_start_ads()
```
The Cocos engine boots (`super_boot_engine()`) only after the ad becomes viewable.
If MRAID is absent (direct browser preview), `viewable_start_ads()` fires immediately.

**Engine start guard:**
```
window.b_start_ads = false
viewable_start_ads() → super_boot_engine() → b_start_ads = true (one-shot guard)
```

**AppLovin Max SDK integration:** `window.mainTheOneSdk` property is monitored
(via `Object.defineProperty` setter trap) to defer a parameter-injection callback
until the AppLovin SDK object is available.

---

## Parameter Injection System

The partner implements **runtime parameter injection** via `window.__PLAYABLE_PARAMETERS__`:

```js
Object.defineProperty(window, "__PLAYABLE_PARAMETERS__", {
  get: () => ({ ...I }),
  enumerable: false,
  configurable: false
})
```

Supported parameter keys observed:
- `storeLink_android` → injected into `super_html.google_play_url`
- `storeLink_ios` → injected into `super_html.appstore_url`

The `mainTheOneSdk.getParameterValue(key)` function is monkey-patched to return
values from `__PLAYABLE_PARAMETERS__`, enabling the AppLovin network to inject store
URLs or other parameters at ad-serve time without modifying the HTML.

This means the same HTML file can be deployed to different app store targets by the
network, without re-export.

---

## Debug and Review Mode

`super_html.is_hide_download` controls whether the download/CTA button is hidden.
When this flag is true, the CTA is suppressed, enabling review previews that do not
accidentally trigger store opens. The production file does not expose a visible debug
overlay — this is a clean commercial build.

`vConsole` is available in the package (identifier visible in string table), suggesting
a separate debug/QA build profile exists.

---

## Identified Commercial Systems (Category-Level)

These **categories** of systems are observable from identifier names in the static file.
No implementation details are extracted.

| Category | Evidence | Notes |
|---|---|---|
| Tutorial / hand system | `hand` identifier | Pointer/finger guide system present |
| Idle hint | `hint` identifier | Idle detection and hint animation |
| Download / CTA | `super_html.download()`, `is_hide_download` | Full CTA system with network bridge |
| Store URL routing | `appstore_url`, `google_play_url` | iOS/Android platform detection and routing |
| Viewability detection | `viewableChange`, `viewable_start_ads` | MRAID viewability lifecycle |
| Parameter injection | `__PLAYABLE_PARAMETERS__`, `storeLink_*` | Network-side store URL override |
| Engine lifecycle | `super_boot_engine`, `b_start_ads` | One-shot guarded engine boot |
| Animation | `anim`, `scale` identifiers | Scale and property animation system |
| Debug console | `vConsole` | Mobile debug overlay (build toggle) |
| AppLovin Max SDK | `mainTheOneSdk` | SDK property intercept pattern |

---

## Visual and Game-Feel Observations

These are observations from the file title, naming conventions, and packaging metadata.
The game is **not playable** from static analysis alone.

1. **"TrueGPHardLevel"** in the filename suggests this may be a "hard difficulty" or
   "full-game preview" variant — a more challenging level used to showcase gameplay depth.

2. **Cocos Creator rendering** implies GPU-accelerated WebGL, which typically achieves
   smoother particle systems, richer shader effects, and better-performing sprite atlases
   than a Canvas2D renderer.

3. The engine's scene system and node hierarchy suggest a structured separation between
   UI (overlay canvas/DOM) and gameplay (WebGL canvas), which is the commercial standard
   for playable ads with rich visual composition.

4. The clean separation between `viewable_start_ads()` (when to boot) and the game logic
   (what to do after boot) is a professional lifecycle pattern.

---

## Parametric / Config Observations

1. The `__PLAYABLE_PARAMETERS__` system allows store URLs to be changed at ad-serve time
   without re-exporting the HTML — a commercial requirement for template-style playables.

2. The `is_hide_download` flag implies a config-driven CTA visibility mode, enabling the
   same export to serve as a review file (CTA hidden) or production file (CTA visible).

3. The file does not reveal tile config, level config, timer, tray capacity, or tutorial
   text from static analysis — these are embedded in the compiled Cocos binary.

---

## What We Can Learn Without Copying Code

1. Viewability-gated engine boot is the commercial standard — adopt this pattern.
2. `window.__PLAYABLE_PARAMETERS__` is the industry convention for network-injectable
   store URLs — we should implement an equivalent injection interface.
3. `is_hide_download` (or equivalent) is the standard mechanism for debug/review mode
   toggling — we need a clean `commercialMode` / `reviewMode` export separation.
4. A debug console (like vConsole) should exist as an optional build-time inclusion.
5. Single-file packaging with a bundled asset store (ZIP or data-URI) is the correct
   commercial approach.

---

## What Must Not Be Copied

- Partner MRAID bootstrap code (`super_html`, `super_log`, `super_open`, `super_check_channel`)
- Partner obfuscation/string-table pattern
- Partner Cocos engine runtime (CC engine is Apache-licensed but the compiled bundle
  is the partner's proprietary build)
- Partner `__zip` packing/unpacking implementation
- Partner `mainTheOneSdk` intercept implementation

---

## Limitations of Static Analysis

1. **Visual quality cannot be assessed**: The playable was not executed. All visual
   quality observations are inferred from system naming and commercial context.
2. **Effect timings unknown**: Animation easing, particle counts, timing curves, and
   visual sequencing cannot be read from minified/obfuscated code.
3. **Level difficulty unknown**: "HardLevel" in the filename may indicate a specific
   variant — not the tutorial-first experience a player would see at ad-serve.
4. **Asset quality unknown**: Tile art, background, icon, and audio quality cannot be
   assessed from the ZIP payload without extraction.
5. **AppLovin Max parameter coverage unknown**: Only `storeLink_android` and
   `storeLink_ios` were confirmed from static analysis. Other injectable parameters
   may exist.
6. **Screen adaptation unknown**: Landscape and safe-area handling cannot be verified
   without running the playable.
