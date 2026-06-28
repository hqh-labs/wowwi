# CLAUDE.md — Permanent Rules for AI Collaboration

This file governs all AI-assisted work in this repository.
These rules apply to every build phase, every session, every agent.

---

## 1. Asset integrity

- **Never overwrite, delete, recompress, or rename files under `project-input/`.**
- `project-input/raw-assets/` contains immutable client source material verified by SHA-256.
- `project-input/extracted-assets/` contains read-only extracted files. Do not modify them.
- Optimized runtime assets live in `projects/<project>/assets/` and are separate from the originals.

## 2. Scope

- **Never work outside this repository.** Do not touch any file, folder, registry key, or global config outside `C:\Users\HUY\Documents\GitHub\wowwi`.
- Do not install or upgrade global software (`npm install -g`, system PATH changes, etc.).
- Do not push to any remote. Do not commit unless explicitly requested.

## 3. Feature discipline

- **Never implement features not requested for the current build phase.**
- BUILD-00 = documentation only. No game code.
- BUILD-01 = shell only. No tile logic, no tutorial, no audio, no effects.
- Check `docs/BUILD_NN_PLAN.md` for the current phase's exact scope.
- When in doubt, stop and ask rather than extend scope.

## 4. Build phases

- Work in small, reviewable build phases as defined in `docs/BUILD_NN_PLAN.md`.
- Each phase has measurable acceptance criteria. Verify them before reporting completion.
- Mark each task done only after the acceptance criteria pass.

## 5. Validation before reporting

- Run the test suite before reporting a task complete.
- Check that every changed file is intentional and listed in your report.
- Do not claim "it works" for UI without observing actual browser behavior.

## 6. Reporting

- **Report every file you create, modify, or delete.**
- Report the reason for each change.
- If a file was not changed, do not include it in the changed-file list.

## 7. Gameplay independence

- **Gameplay core must remain independent from ad-network adapters.**
- No Unity Ads or AppLovin SDK calls inside `projects/<project>/src/gameplay/`.
- Network-specific code belongs in `projects/<project>/src/adapters/`.
- The store-opening action must be called via an abstraction, never directly.

## 8. Orientation

- **Portrait 9:16 is the canonical gameplay viewport.**
- In landscape, the complete portrait gameplay is centered inside the screen.
- Gameplay UI must not rearrange when orientation changes.
- Only the full-screen background adapts in landscape.
- Background side areas must not receive gameplay tap events.
- The full screen is clickable only on the end card.

## 9. Configuration

- Gameplay parameters, asset paths, UI styles, audio, effects, and tray capacity are driven by config files, not hardcoded constants.
- The future visual editor will read and write the same config files used by the playable.

## 10. Commit hygiene

- **Do not commit unless explicitly requested by the user.**
- Do not push unless explicitly requested.
- Do not amend published commits.
- Commit messages must describe what changed and why.

---

## Project: TilePyramid_PL01

- Initial level: `Level_21`
- Tray capacity: 5
- Timer: 30 seconds (starts on first real player interaction)
- Win: all tiles cleared
- Lose: timer expires OR tray full
- Tutorial: guides the player through their first three taps
- CTA: visible during gameplay; end card = full-screen clickable

## Current build phase

**BUILD-17** — Vercel build Playwright fix (Playwright-free Vercel pipeline).
BUILD-17 fixes the Vercel build failure caused by missing Playwright system
libraries (`libnspr4.so`). The new Vercel-safe export path (`export:all:static`,
`validate:exports:static`) runs Vite build + static HTML validation only — never
importing `export-visual-validator.mjs` or `@playwright/test`. The
`vercel:build-preview` pipeline no longer calls `package:candidate`,
`package:delivery`, `test:exports`, or `test:smoke`. The Vercel `installCommand`
no longer includes `playwright`. Preview delivery is written to `delivery/preview/`
(never touching `delivery/latest/`). 15 vercel tests. No actual Vercel deployment
is performed.

Login/auth, cloud database, user accounts, billing, upload automation, visual
editor, new gameplay, new project creation UI, level solver, network API
integrations, and the actual Vercel deployment remain out of scope.
