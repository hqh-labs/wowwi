# RUNTIME_OPTIONS.md

Project: TilePyramid_PL01
Decision required for: BUILD-01

This document compares three candidate runtimes and records the recommendation.
Measured facts are labelled **[FACT]**. Engineering judgements are labelled **[JUDGEMENT]**.

---

## Candidates

| # | Runtime |
|---|---|
| A | Phaser 3 |
| B | PixiJS v8 + Howler.js |
| C | Custom Canvas / WebGL |

---

## Comparison table

| Criterion | A: Phaser 3 | B: PixiJS + Howler | C: Custom |
|---|---|---|---|
| Bundle size (min+gz) | ~600–900 KB **[FACT]** | ~280 KB + 20 KB **[FACT]** | ~30–80 KB **[FACT]** |
| Development speed | Fast — all subsystems included **[JUDGEMENT]** | Medium — gameplay systems custom **[JUDGEMENT]** | Slow — everything from scratch **[JUDGEMENT]** |
| Touch input | Built-in, mobile-first **[FACT]** | EventSystem v8, good **[FACT]** | Pointer Events API, manual **[FACT]** |
| Scene graph | Game Objects + Groups + Cameras **[FACT]** | DisplayObject tree + Containers **[FACT]** | Manual, none provided **[FACT]** |
| Tweens / animation | Built-in Tween Manager **[FACT]** | gsap (external) or manual **[FACT]** | Manual **[FACT]** |
| Particle effects | Built-in ParticleEmitter **[FACT]** | @pixi/particle-emitter ~30 KB **[FACT]** | Manual shader or canvas **[FACT]** |
| Audio | Built-in WebAudio Manager, mobile unlock **[FACT]** | Howler.js, good mobile support **[FACT]** | Web Audio API, manual unlock **[FACT]** |
| Portrait viewport | Scale Manager (ENVELOP / FIT) built-in **[FACT]** | Manual CSS + canvas resize **[FACT]** | Manual **[FACT]** |
| Landscape background handling | Multiple Camera trick or CSS layer **[JUDGEMENT]** | Separate canvas layer or CSS **[JUDGEMENT]** | Manual compositing **[FACT]** |
| Visual editor compatibility | Phaser Editor 2D exists (separate product) **[FACT]** | No standard editor; custom JSON editor feasible **[JUDGEMENT]** | Full control, build your own **[JUDGEMENT]** |
| Unity Ads compatibility | JS injection works; documented examples **[FACT]** | JS injection works **[FACT]** | JS injection works **[FACT]** |
| AppLovin compatibility | Works; actual size limits verified at export phase **[JUDGEMENT]** | Works **[FACT]** | Works **[FACT]** |
| Maintainability | High — large community, long track record **[JUDGEMENT]** | Medium — good docs, smaller custom layer **[JUDGEMENT]** | Low — everything custom **[JUDGEMENT]** |
| Risk to schedule | Low **[JUDGEMENT]** | Medium **[JUDGEMENT]** | High **[JUDGEMENT]** |

---

## Detail: Bundle size and ad-network limits

> **Network size limits are not hardcoded here.** Actual limits depend on the specific ad format, placement type, and network policy version in force at export time. They belong in versioned network export profiles, not in the canonical architecture. Limits must be verified against current network documentation at the start of BUILD-07 (Unity Ads exporter) and BUILD-08 (AppLovin exporter). BUILD-01 has no exporter and no applicable size limit.

Asset payload after conversion (engineering estimate — not measured):
- 1 background WebP: ~150 KB
- 30 tile PNGs compressed: ~300 KB total
- UI PNGs (tray, logo, pointer): ~100 KB
- Font WOFF2: ~40 KB
- Audio (BGM loop 64 kbps, ~9 SFX): ~250 KB
- **Estimated total assets: ~840 KB** **[ESTIMATE]**

Phaser 3 framework size at BUILD-01 (before any gameplay code): ~600–900 KB gzipped **[FACT — measured from published Phaser 3 bundles]**.

Combined estimate (framework + assets, no gameplay code): ~1.4–1.7 MB **[ESTIMATE]**.

This estimate does not include gameplay code, effects, or audio system overhead. The production bundle size must be **measured at each export phase**, not assumed from pre-build estimates.

---

## Detail: Portrait / landscape handling

The requirement states:
- Portrait 9:16 is canonical.
- In landscape, the portrait area is centered (letterboxed).
- Only the background adapts to fill the landscape screen.

**Phaser approach:**
Use Phaser's Scale Manager in `FIT` mode for the gameplay canvas (keeps 9:16).
Render a separate full-screen DOM element (or second canvas) behind the gameplay canvas for the background image. CSS handles the layout. This is a well-documented pattern. **[JUDGEMENT: straightforward]**

**PixiJS approach:**
No built-in scale manager. CSS must size the canvas to 9:16. Background rendered to a separate element. More manual CSS work, but achievable. **[JUDGEMENT: slightly more work]**

**Custom approach:**
All viewport and orientation logic is hand-written. No proven helpers. **[JUDGEMENT: highest risk of edge cases]**

---

## Detail: Visual editor compatibility

Requirements state that a future visual editor must edit the same config files used by the playable.

The playable will be driven by a JSON config (asset paths, positions, colours, parameters). Any editor that reads/writes that JSON works regardless of runtime.

Phaser Editor 2D is a paid product and is tied to Phaser's specific scene format. Using it would couple the editor to Phaser's data model. **[FACT + JUDGEMENT: skip Phaser Editor, use custom JSON editor regardless of runtime]**

Visual editor compatibility is therefore **equal** across all three options, as long as the playable reads from a standalone config JSON. **[JUDGEMENT]**

---

## Recommendation

**Use Phaser 3.**

### Reasons

1. **All required subsystems are included** — touch input, scene graph, tweens, particles, audio manager (with mobile unlock), scale manager. No assembly required.
2. **Scale Manager directly solves the portrait/landscape problem** — built-in `FIT` + `CENTER_BOTH` mode produces a centered 9:16 gameplay canvas with one configuration call.
3. **Mobile audio unlock is handled automatically** — a known pain point in custom and PixiJS solutions that Phaser has already solved.
4. **Bundle size is within the estimated range** — the combined framework + asset estimate (~1.4–1.7 MB) is plausible for typical ad network limits, but this is an engineering estimate. Actual size must be measured at the exporter phases. **[ESTIMATE, not FACT]**
5. **Lowest schedule risk** — the playable needs to reach a working demo quickly. Phaser eliminates the sprint cost of building tile animation, input, and audio systems from scratch.
6. **Proven in playable ad contexts** — Unity Ads and AppLovin both support Phaser-based playables.

### Tradeoffs accepted

- Phaser 3 is larger than PixiJS alone (~300–600 KB difference). At the sizes involved this is likely acceptable, but bundle size must be measured rather than assumed.
- Phaser's built-in scene format is not used — the playable uses a custom config JSON so the visual editor remains independent.
- Actual network size limits must be confirmed against current network documentation at the start of each exporter build phase (BUILD-07, BUILD-08). Do not assume a specific MB threshold is correct.

### Version

Use **Phaser 3.87.0** (latest stable as of audit date).
Pin the version in `package.json` and do not auto-upgrade without a BUILD phase review.
