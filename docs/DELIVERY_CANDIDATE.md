# Delivery Candidate Workflow

Project: TilePyramid_PL01
Build: BUILD-13

## Overview

The delivery candidate workflow produces a final locked handoff package from the
validated upload candidate. It runs the full candidate pipeline, verifies checksums
across the copy, and writes all delivery documentation into a single portable folder.

## Output Location

```
projects/TilePyramid_PL01/delivery/latest/
```

This folder is gitignored by default. To archive the final delivery, copy the
folder or zip its contents externally.

## Output Structure

```
delivery/latest/
├── DELIVERY_README.md               — Recipient instructions and checksums
├── RELEASE_NOTES.md                 — Release notes and build history table
├── QA_EVIDENCE.md                   — Network QA evidence and validation commands
├── delivery-manifest.json           — Machine-readable delivery manifest
├── checksums.sha256                 — SHA256 of each HTML delivery file
├── delivery-validation-report.json  — Automated delivery validation result
├── unity/
│   ├── TilePyramid_PL01_unity.html  — Unity Ads single-file upload
│   └── UPLOAD_NOTES_UNITY.md        — Unity-specific upload instructions
└── applovin/
    ├── TilePyramid_PL01_applovin.html  — AppLovin single-file upload
    └── UPLOAD_NOTES_APPLOVIN.md        — AppLovin-specific upload instructions
```

## Commands

### Generate delivery package

From `projects/TilePyramid_PL01`:

```bash
npm run package:delivery
```

This command:
1. Runs `npm run package:candidate` (which runs `test:exports`, `validate:exports`,
   `build`), producing a validated upload candidate.
2. Clears the previous `delivery/latest/` folder.
3. Copies the validated HTML files from `upload-candidates/latest/` and verifies
   checksums bit-for-bit across the copy.
4. Writes all delivery documentation files.
5. Runs `validateDeliveryPackage` and writes
   `delivery-validation-report.json`.
6. Exits non-zero if validation fails.

### Validate existing delivery package

```bash
npm run validate:delivery
```

Re-runs `validateDeliveryPackage` on `delivery/latest/` and writes an updated
`delivery-validation-report.json`. Exits non-zero if validation fails.

## Delivery Manifest Fields

| Field | Description |
|-------|-------------|
| `projectId` | Always `TilePyramid_PL01` |
| `build` | Build phase that produced this delivery |
| `deliveryType` | Always `final-candidate-lock` |
| `generatedAt` | ISO 8601 timestamp |
| `gitBranch` | Branch at generation time |
| `storeUrls` | Android, iOS, and fallback store URLs |
| `outputs.unity` | Path, size, SHA256, profile for Unity HTML |
| `outputs.applovin` | Path, size, SHA256, profile for AppLovin HTML |
| `networkQaEvidence` | Unity and AppLovin upload testing status |
| `formalSolvability` | Always `NOT YET PROVEN` |
| `deliveryDisclaimer` | Network approval disclaimer |
| `knownLimitations` | Array of known limitation strings |
| `candidateSource` | Source candidate folder |
| `candidateValidationResult` | Result of upstream candidate validation |

## Validation Checks

`validateDeliveryPackage` enforces:

- `delivery-manifest.json` exists and parses
- `checksums.sha256` exists
- `QA_EVIDENCE.md` exists
- `RELEASE_NOTES.md` exists
- Unity HTML exists
- AppLovin HTML exists
- Both HTML files are under 5 MB
- Both HTML sizes match the manifest
- Both HTML SHA256 checksums match the manifest
- Both HTML SHA256 checksums appear in `checksums.sha256`
- No forbidden top-window access (`window.top`, `parent.top`, etc.)
- No external HTTP/HTTPS resource references
- No local `assets/`, `config/`, or `dist/` path references
- Both HTML files contain Android, iOS, and fallback store URL metadata
- Both HTML files contain the formal solvability marker
- `Unity upload notes exist
- AppLovin upload notes exist
- `formalSolvability` field equals `NOT YET PROVEN`
- `deliveryDisclaimer` field contains "not guarantee"
- `networkQaEvidence` field is present and non-null
- Android store URL in manifest is correct
- iOS store URL in manifest is correct

## Relationship to Candidate Package

The candidate package (`upload-candidates/latest/`) is the intermediate validated
artifact. The delivery package (`delivery/latest/`) is the final frozen artifact
for handoff. The delivery package:

- Sources its HTML files from the candidate package (bit-for-bit copy, verified)
- Adds richer delivery documentation
- Uses `delivery-manifest.json` (not `package-manifest.json`)
- Records `networkQaEvidence` and `deliveryDisclaimer`
- Is intended for archival and handoff; the candidate is for iteration

## Known Limitations

- Final Unity Ads and AppLovin approval is not guaranteed by delivery validation.
- Unity export expects network-provided `window.mraid`.
- Network webviews may differ from Chromium file:// QA behavior.
- Formal solvability remains `NOT YET PROVEN`.

Local BUILD-13 delivery packaging and validation do not guarantee final Unity Ads
or AppLovin approval.
