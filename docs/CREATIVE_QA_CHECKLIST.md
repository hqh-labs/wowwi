# Creative QA Checklist

Project: `TilePyramid_PL01`
Polished runtime: `BUILD-20 creative-polish`
Candidate package: `BUILD-21`

Use this checklist during manual QA of the refreshed Unity/AppLovin candidate and the
internal preview.

## Gameplay And Creative Checks

- [ ] Initial tutorial screen appears with rounded highlight rings and hand indicator.
- [ ] CTA style is stronger and the gameplay CTA pulse is visible.
- [ ] Valid tile tap feedback includes tile lift/glow and fly-to-tray motion.
- [ ] Blocked tile feedback includes blocked tint and shake.
- [ ] Match sparkle appears when a set of three clears.
- [ ] Timer warning loop pulses visibly in the warning window.
- [ ] Fail path reaches the polished end card.
- [ ] End-card CTA click records/opens the configured store URL path.
- [ ] Landscape layout keeps portrait gameplay centered and side areas inert.

## Export And Preview Checks

- [ ] Unity exported HTML visual check: `exports/latest/unity/TilePyramid_PL01_unity.html`.
- [ ] AppLovin exported HTML visual check: `exports/latest/applovin/TilePyramid_PL01_applovin.html`.
- [ ] Vercel preview visual check: `https://wowwi.vercel.app/projects/TilePyramid_PL01`.
- [ ] Debug overlay label reads `BUILD-20 creative-polish` when debug overlay is enabled.
- [ ] Debug overlay is not present in final upload files if export mode disables it.
- [ ] Formal solvability remains `NOT YET PROVEN`.
- [ ] Generated export/candidate/delivery HTML contains no `window.top`.

## Network Upload Checks

- [ ] Upload Unity candidate HTML manually.
- [ ] Upload AppLovin candidate HTML manually.
- [ ] Confirm Android user agents route to Google Play URL.
- [ ] Confirm iOS user agents route to App Store URL.
- [ ] Confirm unknown/fallback behavior routes deterministically to Google Play URL.

## Known Remaining Polish Ideas

- Tune CTA pulse amplitude against network preview recordings if it feels too strong.
- Review end-card spacing on very small device previews.
- Consider additional win-path celebration only after upload acceptance is confirmed.
- Consider more detailed manual QA screenshots after Unity/AppLovin previews are available.
