# EXPORT_PROFILES.md

Project: TilePyramid_PL01

BUILD-09 introduced versioned export profiles. BUILD-10 extends them with
network-compliance metadata used by validation and generated reports. These
profiles encode current working assumptions for local export generation and
validation. They are not a claim of final ad-network approval and must be
re-verified before real client delivery.

## Profiles

| Profile | Network | Output | Target max bytes | MRAID | External HTTP assets |
|---|---|---|---:|---|---|
| `unity-2026-06` | Unity Ads | Single HTML | 5,242,880 | Required, network-provided `window.mraid` expected | Forbidden |
| `applovin-2026-06` | AppLovin | Single HTML | 5,242,880 | Optional bridge fallback | Forbidden |

## BUILD-10 metadata

Each profile records:

- Whether MRAID is required and whether `window.mraid` is expected from the
  network container.
- That all runtime resources must be embedded and no external HTTP resources are
  allowed.
- The portrait gameplay / centered landscape orientation policy.
- The timer-first-valid-interaction policy.
- The host close-button safe-zone assumption: a 160 x 160 px top-right area.
- A policy that CTA/end-card button placement must stay outside that top-right
  host close-button zone.
- A DOM overlay policy: background and game container layers must not intercept
  side-area pointer input outside the centered canvas.
- A final approval disclaimer specific to the network.

## Shared assumptions

- Assets and code are inlined into one HTML file.
- Optimized WebP runtime images are preserved as data URLs.
- MP3 runtime audio from BUILD-08 is preserved as data URLs.
- Portrait gameplay remains centered in landscape.
- Timer starts only after the first valid selectable tile interaction.
- Store-open behavior uses an injected bridge that safely checks MRAID state,
  listens for `ready` when needed, records diagnostics, and falls back to
  browser navigation behavior.
- Formal solvability remains `NOT YET PROVEN`.

## Commands

From `projects/TilePyramid_PL01/`:

```bash
npm run export
npm run export:unity
npm run export:applovin
npm run validate:exports
npm run test:exports
```

Generated outputs live under `exports/latest/` and are ignored by git.
