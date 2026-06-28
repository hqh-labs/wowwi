# Project Registry

The project registry lives at `tooling/project-registry/projects.json`.
It is the single source of truth for every playable project in the repository.

## Schema

```jsonc
{
  "registryVersion": "1",
  "lastUpdated": "YYYY-MM-DD",
  "projects": [
    {
      // Required fields
      "projectId": "string — unique snake_case + suffix identifier",
      "displayName": "string — human-readable name",
      "folder": "string — repo-relative path, e.g. projects/TilePyramid_PL01",
      "status": "development | candidate | delivery-locked | archived",
      "supportedNetworks": ["unity", "applovin"],
      "storeUrls": {
        "androidUrl": "https://...",
        "iosUrl": "https://...",
        "fallbackUrl": "https://..."
      },
      "formalSolvability": "NOT YET PROVEN | PROVEN",

      // Optional but recommended
      "client": "string",
      "gameName": "string",
      "defaultNetworkProfiles": { "unity": "profile-id", "applovin": "profile-id" },
      "availableWorkflows": ["typecheck", "test", "build", ...],
      "deliveryCandidateStatus": "locked | pending | none",
      "lastKnownUnitySizeBytes": 0,
      "lastKnownAppLovinSizeBytes": 0,
      "networkQaEvidence": { "unity": "PASSED_UPLOAD_TESTING", "applovin": "..." },
      "knownLimitations": ["string"],
      "notes": "string"
    }
  ]
}
```

## Valid status values

| Status | Meaning |
|---|---|
| `development` | Active development; may not export cleanly |
| `candidate` | Export-ready; under QA review |
| `delivery-locked` | Frozen for delivery; package:delivery workflow present |
| `archived` | No longer actively maintained |

## Delivery-locked requirements

A project with `status: "delivery-locked"` must satisfy all of:

- `formalSolvability` must be `"NOT YET PROVEN"` (or proven, if verified)
- `availableWorkflows` must include `package:delivery` and `validate:delivery`
- `docs/NETWORK_QA_EVIDENCE.md` must exist in the repo
- `docs/DELIVERY_CANDIDATE.md` must exist in the repo

## Adding a new project

1. Create the project folder under `projects/<ProjectId>/`
2. Add a `package.json` with the workflows the project supports
3. Add a JSON entry to `tooling/project-registry/projects.json`
4. Run `npm run wowwi:validate` to confirm the entry passes schema validation
5. Run `npm test` to confirm the registry test suite still passes

## Current registry

### TilePyramid_PL01

| Field | Value |
|---|---|
| Display name | Tile Pyramid — Match Quest |
| Status | `delivery-locked` |
| Networks | unity, applovin |
| Unity output | 1,993,760 bytes (1.90 MB) |
| AppLovin output | 1,993,779 bytes (1.90 MB) |
| Unity SHA256 | `6f3d824f5a4caebde44f2693a86ed9b44b4635acd08628c814e6b4f2227560b8` |
| AppLovin SHA256 | `caff0e0fa85f6da6d41478c75561b6759e9a50ac10247c7d7e292bf001f1a4c3` |
| QA evidence (Unity) | PASSED_UPLOAD_TESTING |
| QA evidence (AppLovin) | PASSED_UPLOAD_TESTING |
| Formal solvability | NOT YET PROVEN |
| Android store URL | `https://play.google.com/store/apps/details?id=com.skl.pyramid.quest.match3.tile.puzzle.games` |
| iOS store URL | `https://apps.apple.com/us/app/tile-pyramid-match-quest/id6755671033` |

Available workflows:
`typecheck`, `test`, `build`, `export:all`, `validate:exports`, `test:exports`,
`test:smoke`, `measure:size`, `package:candidate`, `validate:candidate`,
`package:delivery`, `validate:delivery`
