# Playable Project Template

The reusable template lives at:

`tooling/templates/playable-project/`

It is rendered by:

```bash
npm run wowwi:create-project -- --id <ProjectID> --display-name "Display Name"
```

## Placeholders

Template files support these placeholders:

- `{{PROJECT_ID}}`
- `{{DISPLAY_NAME}}`
- `{{CLIENT_NAME}}`
- `{{GAME_NAME}}`
- `{{DATE}}`

BUILD-23 fills client name as `TBD` and game name from the display name. Later
builds can add optional CLI flags if more intake metadata should be captured at
creation time.

## Template Files

- `README.md` - skeleton status and boundaries.
- `PROJECT_BRIEF.md` - gameplay concept, audience, store URLs, target networks.
- `ASSET_INTAKE.md` - raw/extracted/reference asset log.
- `package.json` - private skeleton package with no fake workflows.
- `project.config.json` - development metadata.
- `input/README.md` - intake folder usage.
- `docs/BUILD_PLAN.md` - suggested build sequence.
- `docs/ASSET_AUDIT_TEMPLATE.md` - asset audit table.
- `docs/EXPORT_PLAN.md` - future export planning.
- `src/README.md` - source placeholder.
- `tests/README.md` - test placeholder.

## Boundaries

The template must stay lightweight. It should not include a game engine, runtime
implementation, export scripts, network SDK code, generated HTML, or delivery
artifacts. Those belong in later project-specific builds.

