import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  DELIVERY_LOCKED_REQUIRED_REPO_DOCS,
  DELIVERY_LOCKED_REQUIRED_WORKFLOWS,
  validateProjectFolderExists,
  validateRegistryEntry,
} from '../project-registry/schema.mjs';
import { loadRegistry, REPO_ROOT } from '../utils/registry-loader.mjs';

const registry = await loadRegistry();
const { projects } = registry;

let overallPass = true;

console.log(`\nValidating ${projects.length} project${projects.length === 1 ? '' : 's'}...\n`);

for (const project of projects) {
  const errors = [];

  // Structural schema validation
  const structural = validateRegistryEntry(project);
  errors.push(...structural.errors);

  // Folder exists
  const folderResult = await validateProjectFolderExists(project, REPO_ROOT);
  errors.push(...folderResult.errors);

  const folderPath = path.join(REPO_ROOT, project.folder);

  // package.json exists and required scripts are present
  const pkgPath = path.join(folderPath, 'package.json');
  const pkgText = await readFile(pkgPath, 'utf8').catch(() => null);
  if (!pkgText) {
    errors.push('package.json not found');
  } else {
    const pkg = JSON.parse(pkgText);
    for (const workflow of project.availableWorkflows ?? []) {
      if (!pkg.scripts?.[workflow]) {
        errors.push(`Required script missing from package.json: ${workflow}`);
      }
    }
  }

  // Delivery-locked: extra checks
  if (project.status === 'delivery-locked') {
    for (const docRelPath of DELIVERY_LOCKED_REQUIRED_REPO_DOCS) {
      try {
        await access(path.join(REPO_ROOT, docRelPath));
      } catch {
        errors.push(`Required delivery doc missing: ${docRelPath}`);
      }
    }
    for (const wf of DELIVERY_LOCKED_REQUIRED_WORKFLOWS) {
      if (!project.availableWorkflows?.includes(wf)) {
        errors.push(`Delivery-locked project must have workflow: ${wf}`);
      }
    }
    if (project.formalSolvability !== 'NOT YET PROVEN') {
      errors.push('Formal solvability must be recorded as NOT YET PROVEN for delivery-locked projects');
    }
  }

  // Store URLs are present and non-empty
  if (project.storeUrls) {
    if (!project.storeUrls.androidUrl) errors.push('storeUrls.androidUrl is empty');
    if (!project.storeUrls.iosUrl) errors.push('storeUrls.iosUrl is empty');
  }

  // Supported networks non-empty
  if (Array.isArray(project.supportedNetworks) && project.supportedNetworks.length === 0) {
    errors.push('supportedNetworks must not be empty');
  }

  if (errors.length === 0) {
    console.log(`  PASS  ${project.projectId}`);
  } else {
    overallPass = false;
    console.log(`  FAIL  ${project.projectId}`);
    for (const err of errors) console.log(`          ERROR: ${err}`);
  }
}

console.log(`\nRegistry validation: ${overallPass ? 'PASS' : 'FAIL'}\n`);
if (!overallPass) process.exitCode = 1;
