# EXPORT_PROFILES.md

Project: TilePyramid_PL01

BUILD-09 introduces versioned export profiles. These profiles encode current
working assumptions for local export generation and validation. They are not a
claim of final ad-network approval and must be re-verified before real client
delivery.

## Profiles

| Profile | Network | Output | Target max bytes | MRAID | External HTTP assets |
|---|---|---|---:|---|---|
| `unity-2026-06` | Unity Ads | Single HTML | 5,242,880 | Required, network-provided `window.mraid` expected | Forbidden |
| `applovin-2026-06` | AppLovin | Single HTML | 5,242,880 | Optional bridge fallback | Forbidden |

## Shared assumptions

- Assets and code are inlined into one HTML file.
- Optimized WebP runtime images are preserved as data URLs.
- MP3 runtime audio from BUILD-08 is preserved as data URLs.
- Portrait gameplay remains centered in landscape.
- Timer starts only after the first valid selectable tile interaction.
- Store-open behavior uses an injected bridge that checks `window.mraid.open`
  first and falls back to browser navigation behavior.
- Formal solvability remains `NOT YET PROVEN`.

## Commands

From `projects/TilePyramid_PL01/`:

```bash
npm run export
npm run export:unity
npm run export:applovin
npm run validate:exports
```

Generated outputs live under `exports/latest/` and are ignored by git.
