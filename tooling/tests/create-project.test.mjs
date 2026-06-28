import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  createPlayableProject,
  validateProjectId,
} from '../project-creation/create-playable-project.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(HERE, '..', '..');
const CREATE_COMMAND = path.join(REPO_ROOT, 'tooling/commands/create-project.mjs');
const VALIDATE_COMMAND = path.join(REPO_ROOT, 'tooling/commands/validate-projects.mjs');
const PROJECT_COMMAND = path.join(REPO_ROOT, 'tooling/commands/project-command.mjs');

async function makeTempRepo() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wowwi-create-project-'));
  const registryPath = path.join(root, 'registry.json');
  await writeFile(
    registryPath,
    JSON.stringify(
      {
        registryVersion: '1',
        lastUpdated: '2026-06-28',
        projects: [],
      },
      null,
      2
    ),
    'utf8'
  );
  return { root, registryPath };
}

function runNode(script, args, env) {
  return new Promise(resolve => {
    execFile(
      process.execPath,
      [script, ...args],
      { env: { ...process.env, ...env }, timeout: 20_000 },
      (error, stdout, stderr) => {
        resolve({
          code: error ? (typeof error.code === 'number' ? error.code : 1) : 0,
          stdout,
          stderr,
        });
      }
    );
  });
}

test('create-project rejects empty ID', () => {
  assert.ok(validateProjectId('').some(error => error.includes('required')));
});

test('create-project rejects spaces', () => {
  assert.ok(validateProjectId('Bad Project').some(error => error.includes('spaces')));
});

test('create-project rejects path traversal', () => {
  assert.ok(validateProjectId('../BadProject').some(error => error.includes('path traversal')));
});

test('create-project rejects duplicate TilePyramid_PL01', async () => {
  const { root, registryPath } = await makeTempRepo();
  try {
    await writeFile(
      registryPath,
      JSON.stringify(
        {
          registryVersion: '1',
          lastUpdated: '2026-06-28',
          projects: [
            {
              projectId: 'TilePyramid_PL01',
              displayName: 'Tile Pyramid',
              folder: 'projects/TilePyramid_PL01',
              status: 'delivery-locked',
              supportedNetworks: ['unity'],
              storeUrls: {
                androidUrl: 'https://example.com/android',
                iosUrl: 'https://example.com/ios',
                fallbackUrl: 'https://example.com/android',
              },
              availableWorkflows: [],
              formalSolvability: 'NOT YET PROVEN',
            },
          ],
        },
        null,
        2
      ),
      'utf8'
    );

    await assert.rejects(
      () =>
        createPlayableProject({
          projectId: 'TilePyramid_PL01',
          displayName: 'Duplicate',
          repoRoot: root,
          registryPath,
        }),
      /already registered/
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('create-project dry-run writes nothing and leaves registry unchanged', async () => {
  const { root, registryPath } = await makeTempRepo();
  try {
    const before = await readFile(registryPath, 'utf8');
    const result = await createPlayableProject({
      projectId: 'SamplePlayable_PL01',
      displayName: 'Sample Playable',
      repoRoot: root,
      registryPath,
      dryRun: true,
    });
    const after = await readFile(registryPath, 'utf8');
    assert.equal(after, before);
    assert.equal(result.dryRun, true);
    assert.ok(result.plannedFiles.includes('projects/SamplePlayable_PL01/README.md'));
    await assert.rejects(readFile(path.join(root, 'projects/SamplePlayable_PL01/README.md'), 'utf8'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('create-project creates skeleton files and registry entry in a temp repo', async () => {
  const { root, registryPath } = await makeTempRepo();
  try {
    await createPlayableProject({
      projectId: 'SamplePlayable_PL01',
      displayName: 'Sample Playable',
      repoRoot: root,
      registryPath,
      now: new Date('2026-06-28T00:00:00.000Z'),
    });

    const projectRoot = path.join(root, 'projects/SamplePlayable_PL01');
    assert.ok((await readFile(path.join(projectRoot, 'README.md'), 'utf8')).includes('Sample Playable'));
    assert.ok((await readFile(path.join(projectRoot, 'PROJECT_BRIEF.md'), 'utf8')).includes('SamplePlayable_PL01'));
    assert.ok((await readFile(path.join(projectRoot, 'ASSET_INTAKE.md'), 'utf8')).includes('input/raw-assets'));
    assert.equal(
      JSON.parse(await readFile(path.join(projectRoot, 'project.config.json'), 'utf8')).status,
      'development'
    );
    await readFile(path.join(projectRoot, 'input/README.md'), 'utf8');
    await readFile(path.join(projectRoot, 'docs/BUILD_PLAN.md'), 'utf8');
    await readFile(path.join(projectRoot, 'src/README.md'), 'utf8');
    await readFile(path.join(projectRoot, 'tests/README.md'), 'utf8');

    const registry = JSON.parse(await readFile(registryPath, 'utf8'));
    const entry = registry.projects.find(project => project.projectId === 'SamplePlayable_PL01');
    assert.ok(entry, 'registry entry must be added');
    assert.equal(entry.status, 'development');
    assert.notEqual(entry.status, 'delivery-locked');
    assert.equal(entry.deliveryCandidateStatus, 'not-started');
    assert.equal(entry.formalSolvability, 'NOT_APPLICABLE');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('wowwi:validate accepts development skeleton projects', async () => {
  const { root, registryPath } = await makeTempRepo();
  try {
    await createPlayableProject({
      projectId: 'SamplePlayable_PL01',
      displayName: 'Sample Playable',
      repoRoot: root,
      registryPath,
    });
    const result = await runNode(VALIDATE_COMMAND, [], {
      WOWWI_REPO_ROOT: root,
      WOWWI_REGISTRY_PATH: registryPath,
    });
    assert.equal(result.code, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /PASS\s+SamplePlayable_PL01/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('wowwi:project status works for development skeleton projects', async () => {
  const { root, registryPath } = await makeTempRepo();
  try {
    await createPlayableProject({
      projectId: 'SamplePlayable_PL01',
      displayName: 'Sample Playable',
      repoRoot: root,
      registryPath,
    });
    const result = await runNode(PROJECT_COMMAND, ['SamplePlayable_PL01', 'status'], {
      WOWWI_REPO_ROOT: root,
      WOWWI_REGISTRY_PATH: registryPath,
    });
    assert.equal(result.code, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /Status:\s+development/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('unsupported workflow gives clear message for skeleton projects', async () => {
  const { root, registryPath } = await makeTempRepo();
  try {
    await createPlayableProject({
      projectId: 'SamplePlayable_PL01',
      displayName: 'Sample Playable',
      repoRoot: root,
      registryPath,
    });
    const result = await runNode(PROJECT_COMMAND, ['SamplePlayable_PL01', 'test'], {
      WOWWI_REPO_ROOT: root,
      WOWWI_REGISTRY_PATH: registryPath,
    });
    assert.notEqual(result.code, 0);
    assert.match(
      result.stderr,
      /Project SamplePlayable_PL01 is in development status and does not yet implement workflow test/
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('create-project CLI dry-run validates and does not mutate registry', async () => {
  const { root, registryPath } = await makeTempRepo();
  try {
    const before = await readFile(registryPath, 'utf8');
    const result = await runNode(
      CREATE_COMMAND,
      ['--id', 'SamplePlayable_PL01', '--display-name', 'Sample Playable', '--dry-run'],
      {
        WOWWI_REPO_ROOT: root,
        WOWWI_REGISTRY_PATH: registryPath,
      }
    );
    assert.equal(result.code, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /Dry run only/);
    assert.equal(await readFile(registryPath, 'utf8'), before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

