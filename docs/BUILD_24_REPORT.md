# BUILD-24 Report - Asset Intake Analyzer Foundation

## Summary

BUILD-24 adds a root-level asset intake analyzer for registered playable
projects. The analyzer scans source intake folders, classifies files, reports
warnings, writes Markdown and JSON reports, and validates the generated audit
format.

## Commands Added

```bash
npm run wowwi:audit-assets -- --project <ProjectID> [--dry-run]
npm run wowwi:validate-asset-audit -- --project <ProjectID>
```

## Implementation

- Added `tooling/asset-audit/asset-audit.mjs` for scanning, classification,
  report rendering, report writing, and validation.
- Added `tooling/commands/audit-assets.mjs` for the CLI scanner.
- Added `tooling/commands/validate-asset-audit.mjs` for report validation.
- Added `tooling/tests/asset-audit.test.mjs` for classifier, scanner, dry-run,
  write, validation, and CLI coverage.
- Added documentation for command usage and report format.

## TilePyramid Compatibility

TilePyramid_PL01 uses the older repo-level `project-input/` asset intake layout.
The analyzer keeps that project compatible by scanning:

```text
project-input/raw-assets/
project-input/extracted-assets/
project-input/references/
```

It also checks the newer per-project intake folders:

```text
projects/TilePyramid_PL01/input/raw-assets/
projects/TilePyramid_PL01/input/extracted-assets/
projects/TilePyramid_PL01/input/references/
projects/TilePyramid_PL01/input/brief/
```

Missing newer folders are reported as warnings for TilePyramid_PL01, not as
validation failures.

## Safety

The analyzer does not modify raw or extracted client assets. Non-dry-run mode only
writes:

```text
projects/<ProjectID>/docs/ASSET_AUDIT.md
projects/<ProjectID>/docs/asset-audit.json
```

No gameplay code, export adapters, generated HTML, registry entries, or runtime
assets are modified by the analyzer.

## Known Limitations

- The analyzer classifies by extension and lightweight metadata only.
- It does not validate licensing, ownership, or visual quality.
- It does not optimize or convert assets.
- It does not mutate project registry metadata.
- It does not decide which assets should be copied into runtime bundles.

## Recommended Next Build

BUILD-25 should use the audit output as input for a project planning workflow:
source ownership notes, required runtime asset decisions, target-network needs,
store URL intake, and project brief readiness checks.
