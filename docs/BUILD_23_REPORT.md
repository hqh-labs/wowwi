# BUILD-23 Report: New Project Creation Pipeline

Date: 2026-06-28
Branch: `build-23-new-project-pipeline`

## Summary

BUILD-23 adds the first reusable Wowwi project-creation pipeline. The new command
creates a development skeleton from templates, registers it in the project
registry, and prepares intake/planning folders without copying `TilePyramid_PL01`.

No TilePyramid gameplay, visual behavior, raw assets, extracted assets, generated
HTML, upload automation, or Vercel deployment behavior was changed.

## New Command

```bash
npm run wowwi:create-project -- --id SamplePlayable_PL01 --display-name "Sample Playable"
npm run wowwi:create-project -- --id SamplePlayable_PL01 --display-name "Sample Playable" --dry-run
```

The command validates the project ID, checks for duplicate registry entries and
existing project folders, renders templates, creates intake folders, appends a
development registry entry, and prints next steps.

## Template Structure

Templates live in:

`tooling/templates/playable-project/`

Generated skeleton files include:

- `README.md`
- `PROJECT_BRIEF.md`
- `ASSET_INTAKE.md`
- `package.json`
- `project.config.json`
- `input/README.md`
- `docs/BUILD_PLAN.md`
- `docs/ASSET_AUDIT_TEMPLATE.md`
- `docs/EXPORT_PLAN.md`
- `src/README.md`
- `tests/README.md`

The generator also creates ignored intake folders:

- `input/raw-assets/`
- `input/extracted-assets/`
- `input/references/`
- `input/brief/`

## Registry Behavior

New projects are registered as:

- `status`: `development`
- `supportedNetworks`: `[]`
- `storeUrls`: empty string placeholders
- `availableWorkflows`: `[]`
- `deliveryCandidateStatus`: `not-started`
- `formalSolvability`: `NOT_APPLICABLE`

Development projects are not delivery-locked, do not include fake sizes or
checksums, and are skipped by the internal preview build until they have delivery
artifacts.

## Validation Behavior

`npm run wowwi:validate` now supports both delivery-locked projects and development
skeletons. Development validation checks the intake/planning skeleton instead of
requiring delivery docs, non-empty networks, or store URLs.

`npm run wowwi:project -- <ProjectID> status` works for development skeletons.
Unsupported workflows return a clear development-status message.

## Tests Added

The new `tooling/tests/create-project.test.mjs` covers invalid IDs, duplicate IDs,
dry-run safety, temp-repo skeleton creation, registry mutation, development
validation, development status output, and unsupported workflow messaging.

## Known Limitations

- The skeleton is intake and planning only.
- No playable runtime is generated.
- No export, candidate, delivery, or upload workflow is generated.
- No visual editor, cloud dashboard, auth, billing, level solver, or network API
  integration is included.
- Formal solvability remains `NOT YET PROVEN` for TilePyramid and `NOT_APPLICABLE`
  for new skeleton projects until gameplay exists.

