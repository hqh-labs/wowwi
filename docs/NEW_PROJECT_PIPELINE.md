# New Project Pipeline

BUILD-23 introduces a safe command for starting a new playable project without
copying an existing implementation.

## Create A Project

From the repo root:

```bash
npm run wowwi:create-project -- --id SamplePlayable_PL01 --display-name "Sample Playable"
```

Dry-run first:

```bash
npm run wowwi:create-project -- --id SamplePlayable_PL01 --display-name "Sample Playable" --dry-run
```

Dry-run validates the inputs and prints planned files/folders without writing files
or mutating the registry.

## Project ID Rules

Project IDs must:

- Start with a letter.
- Use only letters, numbers, underscores, and hyphens.
- Not contain spaces.
- Not contain slashes or `..`.
- Not already exist under `projects/`.
- Not already exist in `tooling/project-registry/projects.json`.

`GameName_PL01` is recommended but not required.

## Generated Files

The command renders files from `tooling/templates/playable-project/` into:

```text
projects/<ProjectID>/
  README.md
  PROJECT_BRIEF.md
  ASSET_INTAKE.md
  package.json
  project.config.json
  input/
    README.md
    raw-assets/
    extracted-assets/
    references/
    brief/
  docs/
    BUILD_PLAN.md
    ASSET_AUDIT_TEMPLATE.md
    EXPORT_PLAN.md
  src/
    README.md
  tests/
    README.md
```

The `input/raw-assets`, `input/extracted-assets`, and `input/references` folders
are ignored by Git. Record source material and checksums in `ASSET_INTAKE.md`
before using assets in runtime code.

## Registry Entry

New projects are added with development metadata:

```json
{
  "status": "development",
  "supportedNetworks": [],
  "storeUrls": {
    "androidUrl": "",
    "iosUrl": "",
    "fallbackUrl": ""
  },
  "availableWorkflows": [],
  "deliveryCandidateStatus": "not-started",
  "formalSolvability": "NOT_APPLICABLE"
}
```

This intentionally does not imply that the project builds, exports, uploads, or is
delivery-ready.

## Development Status

A development project is an intake/planning skeleton. `wowwi:validate` checks that
required docs, config, and intake folders exist. It does not require delivery docs,
store URLs, supported networks, package workflows, sizes, or checksums.

The internal preview build skips development projects until they become
delivery-locked with delivery HTML artifacts.

## Moving Toward A Playable

Use the generated docs to plan:

1. Client/game brief.
2. Asset inventory and ownership.
3. Gameplay concept.
4. Runtime architecture.
5. Store URLs and target networks.
6. Export and validation plan.
7. Candidate package plan.
8. Manual network QA plan.

Add real npm workflows only when the implementation exists. Do not add fake export
or package scripts.

## Difference From Copying TilePyramid

This pipeline starts with blank intake/planning files. It does not copy
TilePyramid source, assets, gameplay rules, export adapters, or tests. That keeps
new project scope explicit and prevents accidental carryover from a completed
playable.

