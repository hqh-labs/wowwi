# TilePyramid_PL01 Commercial Upgrade Spec

**Date:** 2026-06-28
**Build:** BUILD-27
**Based on:** `docs/TILEPYRAMID_COMMERCIAL_GAP_ANALYSIS.md` and `docs/PARTNER_REFERENCE_AUDIT.md`

This document proposes the build sequence to bring TilePyramid_PL01 from its current
technical-v1 / polished-candidate state to commercial-sale-ready quality.

---

## Current State (Post BUILD-22)

- **Positive:** Passes Unity and AppLovin upload testing; correct MRAID bridge; clean
  single-file export; polished effects (BUILD-20); good effect system architecture.
- **Blocking:** Debug flags active in production export; no viewability gate; no
  parameter injection; no asset replacement; no export-mode separation.

---

## Proposed Build Sequence

### BUILD-28 — Commercial Visual Shell v2 + Export Mode Separation

**Objective:** Fix the critical production-export bugs and bring the visual shell to
commercial standard. No gameplay logic changes.

**Scope:**
- Add export-mode concept: `commercial`, `review`, `debug` profiles
- Create `commercial.config.json` (or config profile layer) that sets all `debug*`
  flags to `false` and `storeOpenMode` to `navigate`
- Add viewability-gated engine start: listen to `window.mraid.viewableChange` in the
  AppLovin adapter before starting Phaser; idle splash/loading before viewable
- Improve background visual composition: layered background (BG + optional logo strip)
  configurable via `backgroundLayers` in config
- Improve end-card visual hierarchy: add decorative frame/ribbon around message area,
  configurable via `endCard.frameStyle`
- Add CTA prominence improvements: size, contrast, review-mode toggle
  (`cta.reviewModeHidden` flag mapped to export bridge)

**Files likely touched:**
- `scripts/export/export-applovin.mjs` — viewability gate injection
- `scripts/export/profiles/profiles.mjs` — add `commercial` / `review` profile flags
- `scripts/export/bridge/store-open-bridge.mjs` — add viewability event listener
- `public/config/game.config.json` — add commercial config profile (or new file)
- `src/scenes/GameScene.ts` — background layer rendering, end-card frame
- `src/gameplay/cta/CtaSystem.ts` — review-mode CTA visibility

**Validation requirements:**
- Export with `--profile commercial` produces HTML with zero debug overlays
- `git grep -i "debugOverlay.*true"` must not appear in commercial HTML
- MRAID viewability listener present in exported AppLovin HTML
- All existing tests pass

**Visual QA requirements:**
- Open exported commercial HTML in browser — no debug labels visible
- Timer, tray, board, CTA all render without debug markers
- Background composition looks intentional (not accidental)

**Rollback risk:** Low — config-driven, no gameplay logic changes.

---

### BUILD-29 — Juice / Effects System v2

**Objective:** Upgrade animation quality and add missing feedback systems to reach
commercial visual standard. No network/export changes.

**BUILD-29 status:** Implemented as a config-driven commercial juice pass. See
`docs/BUILD_29_REPORT.md` and `docs/TILEPYRAMID_COMMERCIAL_JUICE_PASS.md`.

**Scope:**
- Combo feedback: add `combo` state when player matches 2+ sets consecutively;
  show combo counter + bonus burst
- Tile landing in tray: add soft elastic overshoot on tray arrival
- Idle hint: reduce default delay from 5 s to 3 s; add animated hand trajectory
  along the hint path
- End card: animated background (gentle moving particles or shimmer), reveal
  sequencing for icon → logo → message → CTA
- Timer warning: color transition on timer text (white → orange → red) in addition
  to scale pulse
- Tutorial callout: replace raw "Tap to match!" text with styled speech-bubble
  callout; animate in from below
- Board entrance: optional "zoom in from center" entrance variant in addition to
  stagger-fade
- `effects.intensity` global scalar (0.0–1.0) for all effects simultaneously

**Files likely touched:**
- `src/scenes/GameScene.ts` — all rendering changes
- `public/config/game.config.json` — new effect config fields
- `src/gameplay/effects/EffectSystem.ts` — combo state, intensity scalar
- `src/gameplay/tutorial/TutorialSystem.ts` — callout styling
- `src/gameplay/idle/IdleHintSystem.ts` — delay config, animation quality

**Validation requirements:**
- All 235 unit tests pass
- Smoke tests pass
- No regression in MRAID or store-open behavior

**Visual QA requirements:**
- Match 2+ sets consecutively — combo counter visible and animated
- Let idle timer fire — hand animates along tile path
- Win/lose — end card entrance has visible sequence
- Timer < 5 s — text turns orange/red

**Rollback risk:** Low — all config-driven and in GameScene only.

---

### BUILD-30 — Debug / Review / Export Mode Separation

**Objective:** Create a first-class separation between build modes so that the same
source always produces clean commercial exports, reviewable exports (CTA hidden),
and developer exports (debug overlays). Clean up legacy debug config flags.

**Scope:**
- Introduce `build-mode` concept: `development`, `review`, `commercial`
- `development` mode: all current debug flags active, `storeOpenMode: record-only`
- `review` mode: no debug overlays, CTA visible but store-open is `record-only`
- `commercial` mode: no debug overlays, CTA visible, MRAID store-open active
- Remove individual `debug*` fields from `game.config.json`; replace with single
  `buildMode` field consumed at render time
- Add build-mode to export metadata and validate it in `validate-exports`
- Optional: add a QA review URL parameter (`?mode=review`) for browser preview

**Files likely touched:**
- `public/config/game.config.json` — replace `debug*` with `buildMode`
- `src/types.ts` — add `BuildMode` type
- `src/scenes/GameScene.ts` — render debug overlays only when `buildMode === 'development'`
- `scripts/export/export-runner.mjs` — accept `--mode` flag; inject `buildMode`
- `scripts/export/validators/export-validator.mjs` — check commercial export has no debug

**Validation requirements:**
- Commercial export: `grep -i debug commercial.html` returns zero matches for runtime labels
- Review export: CTA present, store-open not triggered by tap
- Development mode: all debug overlays visible (current behavior)

**Visual QA requirements:**
- All three modes render correctly in browser
- Commercial mode: no text debug labels, no overlay rectangles

**Rollback risk:** Medium — touches GameScene rendering; requires careful test coverage.

---

### BUILD-31 — Parametric Asset / Theme / Gameplay Config System

**Objective:** Implement runtime parameter injection and a structured config system
that allows store URLs, CTA text, timer, tray capacity, and level to be changed
without re-exporting. Design the `__PLAYABLE_PARAMETERS__` equivalent.

**Scope:**
- Implement `window.__PLAYABLE_PARAMETERS__` equivalent (e.g., `window.__WOWWI_PARAMS__`)
- Support at minimum: `storeLink_android`, `storeLink_ios`, `ctaText`, `buildMode`
- Hook AppLovin Max SDK integration: `mainTheOneSdk` setter trap if needed for the network
- Split `game.config.json` into layered configs:
  - `gameplay.config.json` — timer, tray, level, seed
  - `creative.config.json` — CTA, end card, colors, text
  - `network.config.json` — store URLs, network, MRAID mode
- Config loader merges layers at boot time; `__WOWWI_PARAMS__` overrides at run time
- Define `variant.config.json` for A/B override sets

**Files likely touched:**
- `src/config/ConfigLoader.ts` — multi-layer config merge + param injection
- `public/config/` — new layered JSON files
- `scripts/export/bridge/store-open-bridge.mjs` — inject `__WOWWI_PARAMS__` hook
- `scripts/export/adapters/network-adapters.mjs` — expose injection interface

**Validation requirements:**
- Pass `window.__WOWWI_PARAMS__ = { storeLink_android: "https://example.com" }` before
  game boot; tap CTA; verify correct URL used
- All existing store-open tests pass with new config layer

**Visual QA requirements:**
- CTA text changes when `ctaText` param is injected

**Rollback risk:** Medium — affects config loading path; full test coverage required.

---

### BUILD-32 — Variant Generator / Asset Replacement Workflow

**Objective:** Enable swapping tile images, background, logo, and app icon without
code changes. Implement an asset replacement pipeline and variant configuration.

**Scope:**
- Define `theme.config.json`: maps asset IDs to file paths; allows alternate tile sets
- Implement asset replacement in `AssetManifest.ts` and `PreloadScene.ts`
- Build CLI: `npm run wowwi:create-variant -- --project TilePyramid_PL01 --theme <theme>`
  copies base project and applies theme overrides
- Update export pipeline to accept `--theme <theme>` and embed alternate assets
- Add `ASSET_INTAKE.md` template for receiving new client tile sets

**Files likely touched:**
- `src/manifest/AssetManifest.ts` — theme-aware asset resolution
- `src/scenes/PreloadScene.ts` — load from theme-resolved paths
- `tooling/commands/create-variant.mjs` — new command
- `tooling/project-registry/schema.mjs` — add `variants` field
- `public/config/theme.config.json` — new file (default theme)

**Validation requirements:**
- Swap one tile image; export; smoke test; verify new image renders
- `wowwi:validate` still passes
- No gameplay code changes; all 235 tests pass

**Visual QA requirements:**
- Alternate tile set renders correctly on board and in tray
- Match effect sparkle uses tile-themed color

**Rollback risk:** Low-Medium — asset paths only; no gameplay changes.

---

### BUILD-33 — Commercial QA + Network Re-upload v2

**Objective:** Package and validate a commercial-grade export using all BUILD-28
through BUILD-32 improvements. Re-upload to Unity and AppLovin. Lock as commercial-v1.

**Scope:**
- Generate commercial-mode export (`--mode commercial`)
- Run full validation suite (typecheck, tests, smoke, export validation)
- Package commercial candidate
- Manual upload to Unity and AppLovin
- Lock SHA256, file size, and network QA evidence
- Update `POLISHED_NETWORK_QA_LOCK.md` → `COMMERCIAL_V1_QA_LOCK.md`
- Update `tooling/project-registry/projects.json` status to `commercial-ready`

**Validation requirements:**
- All previous tests pass
- Commercial HTML has no debug labels
- Export size ≤ 2.5 MB (stricter budget for commercial grade)
- Unity and AppLovin upload: PASS

**Visual QA requirements:**
- Full playthrough in both networks: CTA visible, tap CTA → store opens correctly
- End card displays correctly on win and fail
- No debug text or overlay visible in any state

**Rollback risk:** Low — packaging only; no code changes.
