import path from 'node:path';
import {
  createPlayableProject,
  parseCreateProjectArgs,
} from '../project-creation/create-playable-project.mjs';
import { REGISTRY_PATH, REPO_ROOT } from '../utils/registry-loader.mjs';

function usage() {
  console.error('Usage: npm run wowwi:create-project -- --id <ProjectID> --display-name "Display Name" [--dry-run]');
  console.error('Example: npm run wowwi:create-project -- --id SamplePlayable_PL01 --display-name "Sample Playable" --dry-run');
}

let args;
try {
  args = parseCreateProjectArgs(process.argv.slice(2));
} catch (err) {
  console.error(err.message);
  usage();
  process.exit(1);
}

try {
  const result = await createPlayableProject({
    projectId: args.id,
    displayName: args.displayName,
    dryRun: args.dryRun,
    repoRoot: REPO_ROOT,
    registryPath: REGISTRY_PATH,
  });

  console.log(`\nWowwi project creation ${result.dryRun ? 'dry run' : 'complete'}: ${result.projectId}`);
  console.log(`Display name: ${result.displayName}`);
  console.log(`Project folder: ${path.relative(REPO_ROOT, result.projectRoot).replace(/\\/g, '/')}`);
  console.log(`Registry status: ${result.registryEntry.status}`);
  console.log('\nPlanned files:');
  for (const file of result.plannedFiles) console.log(`  - ${file}`);
  console.log('\nPlanned intake folders:');
  for (const dir of result.plannedDirs) console.log(`  - ${dir}`);

  if (result.dryRun) {
    console.log('\nDry run only. No files were written and the registry was not changed.');
  } else {
    console.log('\nNext steps:');
    console.log(`  1. Fill projects/${result.projectId}/PROJECT_BRIEF.md`);
    console.log(`  2. Add source asset notes to projects/${result.projectId}/ASSET_INTAKE.md`);
    console.log('  3. Run npm run wowwi:validate from the repo root');
    console.log('  4. Implement real playable workflows in a later build');
  }
  console.log('');
} catch (err) {
  console.error('\nProject creation failed:');
  const messages = err.errors ?? [err.message];
  for (const msg of messages) console.error(`  ERROR: ${msg}`);
  usage();
  process.exit(1);
}

