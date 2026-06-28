import { execFile, execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  validateProjectFolderExists,
  validateRegistryEntry,
} from '../project-registry/schema.mjs';
import { loadRegistry, REGISTRY_PATH, REPO_ROOT } from '../utils/registry-loader.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = path.join(HERE, '../commands');

// ── helpers ──────────────────────────────────────────────────────────────────

function runScript(scriptName, args = []) {
  return new Promise(resolve => {
    execFile(
      process.execPath,
      [path.join(COMMANDS_DIR, scriptName), ...args],
      { timeout: 10_000 },
      (error, stdout, stderr) => {
        const code = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
        resolve({ code, stdout, stderr });
      }
    );
  });
}

// ── registry structure ────────────────────────────────────────────────────────

test('registry file is valid JSON', async () => {
  const text = await readFile(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(text);
  assert.ok(Array.isArray(registry.projects), 'registry.projects must be an array');
  assert.ok(registry.projects.length > 0, 'registry must have at least one project');
});

test('TilePyramid_PL01 is registered', async () => {
  const registry = await loadRegistry();
  const project = registry.projects.find(p => p.projectId === 'TilePyramid_PL01');
  assert.ok(project, 'TilePyramid_PL01 must appear in the registry');
});

test('TilePyramid_PL01 folder exists on disk', async () => {
  const registry = await loadRegistry();
  const project = registry.projects.find(p => p.projectId === 'TilePyramid_PL01');
  const result = await validateProjectFolderExists(project, REPO_ROOT);
  assert.ok(result.valid, `Expected folder to exist. Errors: ${result.errors.join(', ')}`);
});

test('TilePyramid_PL01 required npm scripts exist in package.json', async () => {
  const registry = await loadRegistry();
  const project = registry.projects.find(p => p.projectId === 'TilePyramid_PL01');
  const pkgPath = path.join(REPO_ROOT, project.folder, 'package.json');
  const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
  for (const workflow of project.availableWorkflows) {
    assert.ok(
      pkg.scripts?.[workflow],
      `Script '${workflow}' must be present in package.json`
    );
  }
});

test('TilePyramid_PL01 store URLs are present', async () => {
  const registry = await loadRegistry();
  const project = registry.projects.find(p => p.projectId === 'TilePyramid_PL01');
  assert.ok(project.storeUrls, 'storeUrls must be present');
  assert.ok(project.storeUrls.androidUrl, 'androidUrl must be present');
  assert.ok(project.storeUrls.iosUrl, 'iosUrl must be present');
});

test('TilePyramid_PL01 supported networks include unity and applovin', async () => {
  const registry = await loadRegistry();
  const project = registry.projects.find(p => p.projectId === 'TilePyramid_PL01');
  assert.ok(project.supportedNetworks.includes('unity'), 'must include unity');
  assert.ok(project.supportedNetworks.includes('applovin'), 'must include applovin');
});

test('TilePyramid_PL01 status is delivery-locked', async () => {
  const registry = await loadRegistry();
  const project = registry.projects.find(p => p.projectId === 'TilePyramid_PL01');
  assert.strictEqual(project.status, 'delivery-locked');
});

test('TilePyramid_PL01 formal solvability is NOT YET PROVEN', async () => {
  const registry = await loadRegistry();
  const project = registry.projects.find(p => p.projectId === 'TilePyramid_PL01');
  assert.strictEqual(project.formalSolvability, 'NOT YET PROVEN');
});

test('BUILD-21 report doc exists', async () => {
  const text = await readFile(path.join(REPO_ROOT, 'docs/BUILD_21_REPORT.md'), 'utf8');
  assert.ok(text.includes('BUILD-21'), 'BUILD_21_REPORT must identify BUILD-21');
});

test('polished candidate re-upload doc exists', async () => {
  const text = await readFile(path.join(REPO_ROOT, 'docs/POLISHED_CANDIDATE_REUPLOAD.md'), 'utf8');
  assert.ok(text.includes('Polished Candidate Re-upload'));
});

test('creative QA checklist doc exists', async () => {
  const text = await readFile(path.join(REPO_ROOT, 'docs/CREATIVE_QA_CHECKLIST.md'), 'utf8');
  assert.ok(text.includes('Creative QA Checklist'));
});

test('re-upload doc contains Unity candidate path', async () => {
  const text = await readFile(path.join(REPO_ROOT, 'docs/POLISHED_CANDIDATE_REUPLOAD.md'), 'utf8');
  assert.ok(
    text.includes('upload-candidates/latest/unity/TilePyramid_PL01_unity.html'),
    're-upload doc must contain Unity candidate path'
  );
});

test('re-upload doc contains AppLovin candidate path', async () => {
  const text = await readFile(path.join(REPO_ROOT, 'docs/POLISHED_CANDIDATE_REUPLOAD.md'), 'utf8');
  assert.ok(
    text.includes('upload-candidates/latest/applovin/TilePyramid_PL01_applovin.html'),
    're-upload doc must contain AppLovin candidate path'
  );
});

test('re-upload doc records formal solvability as NOT YET PROVEN', async () => {
  const text = await readFile(path.join(REPO_ROOT, 'docs/POLISHED_CANDIDATE_REUPLOAD.md'), 'utf8');
  assert.ok(text.includes('NOT YET PROVEN'));
});

test('creative checklist contains BUILD-20 debug label check', async () => {
  const text = await readFile(path.join(REPO_ROOT, 'docs/CREATIVE_QA_CHECKLIST.md'), 'utf8');
  assert.ok(text.includes('BUILD-20 creative-polish'));
});

test('creative checklist contains Unity and AppLovin exported HTML checks', async () => {
  const text = await readFile(path.join(REPO_ROOT, 'docs/CREATIVE_QA_CHECKLIST.md'), 'utf8');
  assert.ok(text.includes('exports/latest/unity/TilePyramid_PL01_unity.html'));
  assert.ok(text.includes('exports/latest/applovin/TilePyramid_PL01_applovin.html'));
});

test('TilePyramid polished candidate registry metadata is valid', async () => {
  const registry = await loadRegistry();
  const project = registry.projects.find(p => p.projectId === 'TilePyramid_PL01');
  assert.strictEqual(project.creativePolishStatus, 'polished-candidate');
  assert.strictEqual(project.polishedCandidateBuild, 'BUILD-20');
  assert.strictEqual(project.polishedCandidateReuploadStatus, 'pending-manual-upload');
});

// ── schema validator unit tests ───────────────────────────────────────────────

test('registry validator rejects missing project folder', async () => {
  const fakeEntry = {
    projectId: 'DoesNotExist_PL99',
    displayName: 'Does Not Exist',
    folder: 'projects/DoesNotExist_PL99',
    status: 'development',
    supportedNetworks: ['unity'],
    storeUrls: {
      androidUrl: 'https://example.com/android',
      iosUrl: 'https://example.com/ios',
      fallbackUrl: 'https://example.com/android',
    },
    availableWorkflows: ['test'],
    formalSolvability: 'NOT YET PROVEN',
  };
  const result = await validateProjectFolderExists(fakeEntry, REPO_ROOT);
  assert.strictEqual(result.valid, false);
  assert.ok(
    result.errors.some(e => e.includes('does not exist')),
    `Expected folder-not-found error. Got: ${result.errors.join(', ')}`
  );
});

test('registry validator rejects missing store URLs', () => {
  const entryWithoutStoreUrls = {
    projectId: 'TestProject',
    displayName: 'Test',
    folder: 'projects/TestProject',
    status: 'development',
    supportedNetworks: ['unity'],
    availableWorkflows: [],
    formalSolvability: 'NOT YET PROVEN',
    // storeUrls intentionally omitted
  };
  const result = validateRegistryEntry(entryWithoutStoreUrls);
  assert.strictEqual(result.valid, false);
  assert.ok(
    result.errors.some(e => e.includes('storeUrls')),
    `Expected storeUrls error. Got: ${result.errors.join(', ')}`
  );
});

test('registry validator rejects missing supported networks', () => {
  const entryWithoutNetworks = {
    projectId: 'TestProject',
    displayName: 'Test',
    folder: 'projects/TestProject',
    status: 'development',
    storeUrls: {
      androidUrl: 'https://example.com',
      iosUrl: 'https://example.com',
      fallbackUrl: 'https://example.com',
    },
    availableWorkflows: [],
    formalSolvability: 'NOT YET PROVEN',
    // supportedNetworks intentionally omitted
  };
  const result = validateRegistryEntry(entryWithoutNetworks);
  assert.strictEqual(result.valid, false);
  assert.ok(
    result.errors.some(e => e.includes('supportedNetworks')),
    `Expected supportedNetworks error. Got: ${result.errors.join(', ')}`
  );
});

// ── CLI integration tests ─────────────────────────────────────────────────────

test('CLI list command runs and exits 0', async () => {
  const { code, stdout } = await runScript('list-projects.mjs');
  assert.strictEqual(code, 0, `Expected exit 0, got ${code}`);
  assert.ok(stdout.includes('TilePyramid_PL01'), 'list output must mention TilePyramid_PL01');
});

test('CLI project status command runs and exits 0', async () => {
  const { code, stdout } = await runScript('project-command.mjs', [
    'TilePyramid_PL01',
    'status',
  ]);
  assert.strictEqual(code, 0, `Expected exit 0, got ${code}`);
  assert.ok(stdout.includes('delivery-locked'), 'status output must show delivery-locked');
});

test('CLI rejects unknown project ID with non-zero exit', async () => {
  const { code } = await runScript('project-command.mjs', ['UnknownProject_XX', 'status']);
  assert.notStrictEqual(code, 0, 'Expected non-zero exit for unknown project');
});

// ── existing project tests ────────────────────────────────────────────────────

test('TilePyramid_PL01 existing unit tests still pass', { timeout: 60_000 }, async () => {
  const registry = await loadRegistry();
  const project = registry.projects.find(p => p.projectId === 'TilePyramid_PL01');
  const folderPath = path.join(REPO_ROOT, project.folder);
  const isWin = process.platform === 'win32';
  const { code } = await new Promise(resolve => {
    execFile(
      isWin ? 'cmd.exe' : 'npm',
      isWin ? ['/d', '/s', '/c', 'npm run test'] : ['run', 'test'],
      { cwd: folderPath, timeout: 55_000 },
      (error, stdout, stderr) => {
        const code = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
        if (stdout) process.stdout.write(stdout);
        if (stderr) process.stderr.write(stderr);
        resolve({ code });
      }
    );
  });
  assert.strictEqual(code, 0, 'TilePyramid_PL01 unit tests must pass');
});
