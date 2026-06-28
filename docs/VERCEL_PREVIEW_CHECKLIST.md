# Vercel Preview Deployment Checklist

Use this checklist before connecting the repo to Vercel and after each deploy.

---

## Pre-deployment checklist (run locally)

- [ ] `npm run wowwi:validate` — PASS
- [ ] `npm run preview:test` — 16/16 PASS
- [ ] `npm run vercel:build-preview` — all 5 steps PASS
- [ ] `npm run preview:validate` — 13/13 PASS
- [ ] `npm run vercel:validate-preview` — PASS
- [ ] `npm run vercel:test` — 14/14 PASS
- [ ] `npm run preview:serve` confirms `http://localhost:4174` is accessible
- [ ] Home page shows TilePyramid_PL01 project card
- [ ] Project detail page shows:
  - [ ] Status: `delivery-locked`
  - [ ] Formal solvability: `NOT YET PROVEN`
  - [ ] Android and iOS store URLs
  - [ ] Unity SHA256 checksum
  - [ ] AppLovin SHA256 checksum
  - [ ] Network QA evidence (PASSED_UPLOAD_TESTING)
  - [ ] Known limitations list
- [ ] Unity preview link opens the playable game
- [ ] AppLovin preview link opens the playable game
- [ ] `git status --short` shows no uncommitted changes (nothing to commit)
- [ ] No raw assets in `apps/internal-preview/dist/`

---

## Vercel configuration checklist

- [ ] `vercel.json` exists at repo root
- [ ] `buildCommand` is `npm run vercel:build-preview`
- [ ] `outputDirectory` is `apps/internal-preview/dist`
- [ ] `installCommand` installs TilePyramid deps — does NOT include playwright
- [ ] `apps/internal-preview/dist/` is in `.gitignore`
- [ ] No secrets are committed to the repo

---

## Vercel UI setup checklist

- [ ] GitHub repo `hqh-labs/wowwi` imported in Vercel
- [ ] Framework Preset set to **Other**
- [ ] Build/output/install settings inherited from `vercel.json` (leave blank)
- [ ] No environment variables added (none required)
- [ ] Deployment triggered

---

## Post-deployment verification checklist

After Vercel deploy completes:

- [ ] Vercel build log shows all 5 steps completed without error (no Playwright output)
- [ ] Deployed URL accessible
- [ ] `<deployed-url>/index.html` — home page renders with project list
- [ ] `<deployed-url>/projects/TilePyramid_PL01/index.html` — detail page renders
- [ ] "Open Unity Preview" link opens and game boots
- [ ] "Open AppLovin Preview" link opens and game boots
- [ ] No `window.top` JavaScript errors in browser console
- [ ] No 404 errors for expected pages
- [ ] No raw asset paths appear in page source
- [ ] Footer shows "BUILD-15" and "local only" disclaimer

---

## Known limitations to document in any internal share

- This is a local/internal preview. Final Unity Ads and AppLovin approval is not
  guaranteed.
- Delivery HTML is generated from source on each deploy and may differ from the
  delivery-locked candidate if source changes.
- Formal solvability is NOT YET PROVEN.
- The preview site has no authentication by default.
