import { loadRegistry } from '../utils/registry-loader.mjs';
import { runProjectWorkflow } from './run-project-workflow.mjs';

const [, , projectId, command] = process.argv;

if (!projectId || !command) {
  console.error('Usage: wowwi:project <projectId> <command>');
  console.error('Commands: status, test, export, package-candidate, package-delivery');
  process.exit(1);
}

const registry = await loadRegistry();
const project = registry.projects.find(p => p.projectId === projectId);

if (!project) {
  console.error(`Unknown project: ${projectId}`);
  console.error(`Registered projects: ${registry.projects.map(p => p.projectId).join(', ')}`);
  process.exit(1);
}

switch (command) {
  case 'status':
    printStatus(project);
    break;
  case 'test':
    await runProjectWorkflow(project, 'test').catch(err => {
      console.error(err.message);
      process.exit(1);
    });
    break;
  case 'export':
    await runProjectWorkflow(project, 'export:all').catch(err => {
      console.error(err.message);
      process.exit(1);
    });
    break;
  case 'package-candidate':
    await runProjectWorkflow(project, 'package:candidate').catch(err => {
      console.error(err.message);
      process.exit(1);
    });
    break;
  case 'package-delivery':
    await runProjectWorkflow(project, 'package:delivery').catch(err => {
      console.error(err.message);
      process.exit(1);
    });
    break;
  default:
    console.error(`Unknown command: ${command}`);
    console.error('Available commands: status, test, export, package-candidate, package-delivery');
    process.exit(1);
}

function printStatus(p) {
  const fmtBytes = n =>
    n != null ? `${n.toLocaleString()} bytes (${(n / 1024 / 1024).toFixed(2)} MB)` : 'unknown';

  console.log(`\nProject:      ${p.projectId}`);
  console.log(`Display name: ${p.displayName}`);
  console.log(`Status:       ${p.status}`);
  console.log(`Folder:       ${p.folder}`);
  console.log(`Networks:     ${p.supportedNetworks.join(', ')}`);

  if (p.storeUrls) {
    console.log('\nStore URLs:');
    console.log(`  Android: ${p.storeUrls.androidUrl}`);
    console.log(`  iOS:     ${p.storeUrls.iosUrl}`);
    console.log(`  Fallback: ${p.storeUrls.fallbackUrl}`);
  }

  if (p.lastKnownUnitySizeBytes != null || p.lastKnownAppLovinSizeBytes != null) {
    console.log('\nLast known output sizes:');
    if (p.lastKnownUnitySizeBytes != null) {
      console.log(`  Unity HTML:    ${fmtBytes(p.lastKnownUnitySizeBytes)}`);
    }
    if (p.lastKnownAppLovinSizeBytes != null) {
      console.log(`  AppLovin HTML: ${fmtBytes(p.lastKnownAppLovinSizeBytes)}`);
    }
  }

  if (p.networkQaEvidence) {
    console.log('\nNetwork QA evidence:');
    for (const [network, status] of Object.entries(p.networkQaEvidence)) {
      console.log(`  ${network}: ${status}`);
    }
  }

  console.log(`\nFormal solvability: ${p.formalSolvability}`);

  if (p.availableWorkflows?.length) {
    console.log('\nAvailable workflows:');
    for (const wf of p.availableWorkflows) {
      console.log(`  npm run ${wf}`);
    }
    console.log(
      '\n  Run via tool:  npm run wowwi:project -- ' + p.projectId + ' <test|export|package-candidate|package-delivery>'
    );
  }

  if (p.knownLimitations?.length) {
    console.log('\nKnown limitations:');
    for (const lim of p.knownLimitations) {
      console.log(`  - ${lim}`);
    }
  }

  if (p.notes) {
    console.log(`\nNotes: ${p.notes}`);
  }

  console.log('');
}
