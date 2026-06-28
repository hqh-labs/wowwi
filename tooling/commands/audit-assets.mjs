import path from 'node:path';
import { parseAuditArgs, runAssetAudit } from '../asset-audit/asset-audit.mjs';
import { loadRegistry, REPO_ROOT } from '../utils/registry-loader.mjs';

function usage() {
  console.error('Usage: npm run wowwi:audit-assets -- --project <ProjectID> [--dry-run]');
}

let args;
try {
  args = parseAuditArgs(process.argv.slice(2));
} catch (err) {
  console.error(err.message);
  usage();
  process.exit(1);
}

if (!args.projectId) {
  console.error('Missing --project <ProjectID>');
  usage();
  process.exit(1);
}

const registry = await loadRegistry();
const project = registry.projects.find(p => p.projectId === args.projectId);
if (!project) {
  console.error(`Unknown project: ${args.projectId}`);
  process.exit(1);
}

const result = await runAssetAudit({
  repoRoot: REPO_ROOT,
  project,
  dryRun: args.dryRun,
});

const { audit } = result;
console.log(`\nAsset audit ${args.dryRun ? 'dry run' : 'complete'}: ${audit.projectId}`);
console.log(`Display name: ${audit.displayName}`);
console.log(`Total files: ${audit.totals.fileCount}`);
console.log(`Total bytes: ${audit.totals.totalBytes}`);
console.log(`Warnings: ${audit.warnings.length}`);
console.log('\nScanned folders:');
for (const folder of audit.scannedFolders) {
  console.log(`  - ${folder.path} (${folder.exists ? `${folder.fileCount} files` : 'missing'})`);
}

if (result.written) {
  console.log('\nReports written:');
  console.log(`  - ${path.relative(REPO_ROOT, result.paths.markdownPath).replace(/\\/g, '/')}`);
  console.log(`  - ${path.relative(REPO_ROOT, result.paths.jsonPath).replace(/\\/g, '/')}`);
} else {
  console.log('\nDry run only. No report files were written.');
}
console.log('\nRaw assets modified: false\n');

