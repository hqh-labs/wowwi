import path from 'node:path';
import { parseAuditArgs, validateAssetAudit } from '../asset-audit/asset-audit.mjs';
import { loadRegistry, REPO_ROOT } from '../utils/registry-loader.mjs';

function usage() {
  console.error('Usage: npm run wowwi:validate-asset-audit -- --project <ProjectID>');
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

const result = await validateAssetAudit({ repoRoot: REPO_ROOT, project });

console.log(`\nAsset audit validation: ${result.pass ? 'PASS' : 'FAIL'}`);
console.log(`Project: ${project.projectId}`);
console.log(`Markdown: ${path.relative(REPO_ROOT, result.markdownPath).replace(/\\/g, '/')}`);
console.log(`JSON: ${path.relative(REPO_ROOT, result.jsonPath).replace(/\\/g, '/')}`);
if (!result.pass) {
  for (const error of result.errors) console.log(`  ERROR: ${error}`);
  process.exitCode = 1;
}
console.log('');

