import { access, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOOLING_ROOT = path.dirname(HERE);
const DEFAULT_TEMPLATE_ROOT = path.join(TOOLING_ROOT, 'templates/playable-project');

export const PROJECT_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;

export function parseCreateProjectArgs(argv) {
  const result = {
    id: null,
    displayName: null,
    dryRun: false,
  };

  const positional = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--id') {
      result.id = argv[++i] ?? '';
    } else if (arg === '--display-name') {
      result.displayName = argv[++i] ?? '';
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  if (!result.id && positional.length > 0) {
    result.id = positional[0];
  }
  if (!result.displayName && positional.length > 1) {
    result.displayName = positional.slice(1).join(' ');
  }

  return result;
}

export function validateProjectId(projectId) {
  const errors = [];
  if (!projectId) {
    errors.push('Project ID is required.');
    return errors;
  }
  if (/\s/.test(projectId)) {
    errors.push('Project ID must not contain spaces.');
  }
  if (/[\\/]/.test(projectId) || projectId.includes('..')) {
    errors.push('Project ID must not contain slashes or path traversal.');
  }
  if (!PROJECT_ID_PATTERN.test(projectId)) {
    errors.push('Project ID must start with a letter and use only letters, numbers, underscores, and hyphens.');
  }
  return errors;
}

export function buildRegistryEntry({ projectId, displayName }) {
  return {
    projectId,
    displayName,
    folder: `projects/${projectId}`,
    status: 'development',
    supportedNetworks: [],
    storeUrls: {
      androidUrl: '',
      iosUrl: '',
      fallbackUrl: '',
    },
    availableWorkflows: [],
    deliveryCandidateStatus: 'not-started',
    formalSolvability: 'NOT_APPLICABLE',
    notes: 'Created from the BUILD-23 playable project skeleton template. Intake and planning only; no playable implementation yet.',
  };
}

export function renderTemplate(text, values) {
  return text
    .replaceAll('{{PROJECT_ID}}', values.projectId)
    .replaceAll('{{DISPLAY_NAME}}', values.displayName)
    .replaceAll('{{CLIENT_NAME}}', values.clientName ?? 'TBD')
    .replaceAll('{{GAME_NAME}}', values.gameName ?? values.displayName)
    .replaceAll('{{DATE}}', values.date);
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyRenderedTemplateDir(srcDir, dstDir, values, plannedFiles) {
  await mkdir(dstDir, { recursive: true });
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const dstPath = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      await copyRenderedTemplateDir(srcPath, dstPath, values, plannedFiles);
    } else {
      const text = await readFile(srcPath, 'utf8');
      await writeFile(dstPath, renderTemplate(text, values), 'utf8');
      plannedFiles.push(path.relative(values.repoRoot, dstPath).replace(/\\/g, '/'));
    }
  }
}

export async function createPlayableProject({
  projectId,
  displayName,
  dryRun = false,
  repoRoot,
  registryPath,
  templateRoot = DEFAULT_TEMPLATE_ROOT,
  now = new Date(),
}) {
  const errors = validateProjectId(projectId);
  if (!displayName || !displayName.trim()) {
    errors.push('Display name is required.');
  }

  const projectsRoot = path.join(repoRoot, 'projects');
  const projectRoot = path.join(projectsRoot, projectId ?? '');
  const normalizedProjectsRoot = path.resolve(projectsRoot);
  const normalizedProjectRoot = path.resolve(projectRoot);
  if (!normalizedProjectRoot.startsWith(normalizedProjectsRoot + path.sep)) {
    errors.push('Project path must stay inside projects/.');
  }

  const registryText = await readFile(registryPath, 'utf8');
  const registry = JSON.parse(registryText);

  if (registry.projects?.some(p => p.projectId === projectId)) {
    errors.push(`Project ID is already registered: ${projectId}`);
  }
  if (await exists(projectRoot)) {
    errors.push(`Project folder already exists: projects/${projectId}`);
  }
  if (errors.length > 0) {
    const err = new Error(errors.join('\n'));
    err.errors = errors;
    throw err;
  }

  const values = {
    projectId,
    displayName: displayName.trim(),
    date: now.toISOString().slice(0, 10),
    repoRoot,
  };
  const plannedDirs = [
    `projects/${projectId}/input/raw-assets`,
    `projects/${projectId}/input/extracted-assets`,
    `projects/${projectId}/input/references`,
    `projects/${projectId}/input/brief`,
  ];
  const plannedFiles = [];

  const entry = buildRegistryEntry({ projectId, displayName: values.displayName });

  if (!dryRun) {
    await copyRenderedTemplateDir(templateRoot, projectRoot, values, plannedFiles);
    for (const rel of plannedDirs) {
      await mkdir(path.join(repoRoot, rel), { recursive: true });
    }
    registry.projects.push(entry);
    registry.lastUpdated = values.date;
    await writeFile(registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
  } else {
    await collectTemplatePlan(templateRoot, `projects/${projectId}`, plannedFiles);
  }

  return {
    dryRun,
    projectId,
    displayName: values.displayName,
    projectRoot,
    registryEntry: entry,
    plannedDirs,
    plannedFiles,
  };
}

async function collectTemplatePlan(srcDir, dstRel, plannedFiles) {
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const relPath = `${dstRel}/${entry.name}`;
    if (entry.isDirectory()) {
      await collectTemplatePlan(srcPath, relPath, plannedFiles);
    } else {
      plannedFiles.push(relPath);
    }
  }
}

export async function copyTemplateForTests(src, dst) {
  await cp(src, dst, { recursive: true });
}

