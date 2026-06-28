# Internal Preview Access Notes

**Preview URL:** `https://wowwi.vercel.app`
**Status:** Live — no authentication implemented
**Build:** BUILD-19

---

## Current access status

**No login, no auth, and no password protection is currently implemented.**

The Vercel deployment is publicly accessible to anyone with the URL. This is
intentional for the current internal-review phase, but access should be
controlled before the URL is shared more broadly.

---

## What the preview contains

The following is safe to view in the live preview:

| Content | Included | Notes |
|---|---|---|
| Home page (project list) | YES | Registry metadata only |
| TilePyramid_PL01 detail page | YES | Metadata + QA evidence |
| Unity delivery HTML copy | YES | Locked delivery export |
| AppLovin delivery HTML copy | YES | Locked delivery export |
| Store URLs (Android + iOS) | YES | Public app store links |
| SHA256 checksums | YES | For verification purposes |
| Network QA evidence | YES | PASSED_UPLOAD_TESTING |

The following is NOT included in the deployed preview:

| Content | Included | Notes |
|---|---|---|
| Raw client assets (`project-input/raw-assets/`) | NO | Never copied to dist |
| Extracted client assets (`project-input/extracted-assets/`) | NO | Never copied to dist |
| Source asset ZIP (`TilePyramid_PL01_assets.zip.zip`) | NO | Gitignored, never deployed |
| Node modules (`node_modules/`) | NO | Not in Vercel output |
| TypeScript / Vite source (`src/`) | NO | Not in Vercel output |
| Game scripts / gameplay source | NO | Not in Vercel output |
| Export reports or candidate packages | NO | Not in Vercel output |

---

## Security limitations

1. **No authentication.** Anyone who discovers the URL can view the preview.
2. **No rate limiting.** Vercel's free tier provides basic DDoS protection.
3. **Delivery HTML is public.** The preview includes the delivery-locked
   playable HTML, which contains the full game. This is intentional for
   client review, but should not be distributed as the "upload file" — the
   actual upload files are in `delivery/latest/`.
4. **Private repository.** The GitHub repo `hqh-labs/wowwi` is private.
   Vercel's deployment pulls from the connected private repo. The source
   code is not exposed through the preview.

---

## Recommended access controls

To restrict access before sharing the URL with external parties, enable one or
more of the following:

### Option 1 — Vercel Deployment Protection (recommended)

Vercel's built-in protection options (available on paid plans):

- **Password protection:** Set a site-wide password.
- **Vercel Authentication:** Restrict to Vercel account members.
- **Vercel Teams:** Restrict to team members only.

To enable: `vercel.com → Project → Settings → Deployment Protection`

### Option 2 — Preview URL on demand

Instead of using the persistent `wowwi.vercel.app` URL, use Vercel's
per-deployment preview URLs (format: `wowwi-<hash>.vercel.app`). These
are less guessable but still not authenticated.

### Option 3 — Private repo + environment variable gating (not implemented)

Add a simple server-side check or middleware (would require a Vercel
serverless function). Not recommended for static preview — adds complexity.

---

## What is safe to share

| Audience | Guidance |
|---|---|
| Internal team | Share URL freely. Confirm they understand it's a preview copy, not the upload artifact. |
| Client review | Share URL with the client for playable preview. Explain that this is review-only. |
| General public | Do NOT share. Enable Vercel password protection first. |
| Ad network submission | Do NOT use these URLs. Use `delivery/latest/` HTML files directly. |

---

## Future build recommendation

**Next recommended build:** Enable Vercel Deployment Protection before sharing
the preview URL with external parties. This is a Vercel account/billing action
and does not require code changes in this repository.

Document the protection status in this file once enabled:

- [ ] Vercel password protection enabled
- [ ] Access restricted to team members
- [ ] URL shared only with internal team

---

*Updated: 2026-06-28 — BUILD-19 live preview QA lock*
