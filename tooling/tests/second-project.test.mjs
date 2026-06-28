/**
 * BUILD-25 tests — SecondPlayable_PL01 intake and registry.
 * 14 tests verifying the second project lifecycle.
 * Runner: node:test (no extra dependencies)
 */

import { execFile } from 'node:child_process';
import { access, readdir, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { buildAssetAudit } from '../asset-audit/asset-audit.mjs';
import { loadRegistry, REPO_ROOT } from '../utils/registry-loader.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = path.join(HERE, '../commands');

const PROJECT_ID = 'SecondPlayable_PL01';
const PROJECT_FOLDER = `projects/${PROJECT_ID}`;

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function runScript(scriptName, args = []) {
  return new Promise(resolve => {
    execFile(
      process.execPath,
      [path.join(COMMANDS_DIR, scriptName), ...args],
      { timeout: 20_000 },
      (error, stdout, stderr) => {
        const code = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
        resolve({ code, stdout, stderr });
      }
    );
  });
}

// ── 1. SecondPlayable_PL01 folder exists on disk ──────────────────────────────

test('1. SecondPlayable_PL01 project folder exists on disk', async () => {
  const ok = await exists(path.join(REPO_ROOT, PROJECT_FOLDER));
  assert.ok(ok, `${PROJECT_FOLDER} must exist`);
});

// ── 2. SecondPlayable_PL01 is registered ─────────────────────────────────────

test('2. SecondPlayable_PL01 is in the project registry', async () => {
  const registry = await loadRegistry();
  const project = registry.projects.find(p => p.projectId === PROJECT_ID);
  assert.ok(project, `${PROJECT_ID} must appear in the registry`);
});

// ── 3. Status is development ──────────────────────────────────────────────────

test('3. SecondPlayable_PL01 status is development', async () => {
  const registry = await loadRegistry();
  const project = registry.projects.find(p => p.projectId === PROJECT_ID);
  assert.strictEqual(project.status, 'development');
});

// ── 4. Not delivery-locked ────────────────────────────────────────────────────

test('4. SecondPlayable_PL01 is not delivery-locked', async () => {
  const registry = await loadRegistry();
  const project = registry.projects.find(p => p.projectId === PROJECT_ID);
  assert.notStrictEqual(project.status, 'delivery-locked');
  assert.notStrictEqual(project.deliveryCandidateStatus, 'locked');
});

// ── 5. No fake Unity/AppLovin sizes ──────────────────────────────────────────

test('5. SecondPlayable_PL01 has no fake Unity or AppLovin size bytes', async () => {
  const registry = await loadRegistry();
  const project = registry.projects.find(p => p.projectId === PROJECT_ID);
  assert.ok(
    project.lastKnownUnitySizeBytes == null,
    'lastKnownUnitySizeBytes must be absent for a development project'
  );
  assert.ok(
    project.lastKnownAppLovinSizeBytes == null,
    'lastKnownAppLovinSizeBytes must be absent for a development project'
  );
});

// ── 6. Intake folders exist ───────────────────────────────────────────────────

test('6. SecondPlayable_PL01 intake folders all exist', async () => {
  const intakeDirs = [
    'input/raw-assets',
    'input/extracted-assets',
    'input/references',
    'input/brief',
  ];
  for (const rel of intakeDirs) {
    const ok = await exists(path.join(REPO_ROOT, PROJECT_FOLDER, rel));
    assert.ok(ok, `${PROJECT_FOLDER}/${rel} must exist`);
  }
});

// ── 7. Asset audit dry-run passes with no assets ─────────────────────────────

test('7. SecondPlayable_PL01 asset audit dry-run passes with no assets', async () => {
  const registry = await loadRegistry();
  const project = registry.projects.find(p => p.projectId === PROJECT_ID);
  const audit = await buildAssetAudit({ repoRoot: REPO_ROOT, project });
  assert.strictEqual(audit.totals.fileCount, 0, 'no files should be found in empty intake');
  assert.strictEqual(audit.rawAssetsModified, false, 'rawAssetsModified must be false');
  assert.ok(Array.isArray(audit.warnings), 'warnings must be an array');
  assert.ok(audit.warnings.length > 0, 'warnings must include empty-folder notices');
  assert.ok(
    audit.warnings.some(w => w.includes('No intake assets found')),
    'warnings must include no-assets message'
  );
});

// ── 8. wowwi:validate accepts both projects ───────────────────────────────────

test('8. wowwi:validate accepts both TilePyramid_PL01 and SecondPlayable_PL01', async () => {
  const { code, stdout } = await runScript('validate-projects.mjs');
  assert.strictEqual(code, 0, `wowwi:validate must exit 0. Output:\n${stdout}`);
  assert.ok(stdout.includes('PASS  TilePyramid_PL01'), 'TilePyramid_PL01 must PASS');
  assert.ok(stdout.includes('PASS  SecondPlayable_PL01'), 'SecondPlayable_PL01 must PASS');
});

// ── 9. wowwi:project status works ────────────────────────────────────────────

test('9. wowwi:project status works for SecondPlayable_PL01', async () => {
  const { code, stdout } = await runScript('project-command.mjs', [PROJECT_ID, 'status']);
  assert.strictEqual(code, 0, `project status must exit 0. Output:\n${stdout}`);
  assert.ok(stdout.includes('development'), 'status output must show development');
  assert.ok(stdout.includes(PROJECT_ID), 'output must include project ID');
});

// ── 10. Unsupported workflow gives clear message ──────────────────────────────

test('10. Unsupported export workflow for SecondPlayable_PL01 gives clear message', async () => {
  const { code, stderr } = await runScript('project-command.mjs', [PROJECT_ID, 'export']);
  assert.notStrictEqual(code, 0, 'export command must fail for development project');
  assert.ok(
    stderr.includes(PROJECT_ID) && stderr.toLowerCase().includes('development'),
    `stderr must mention project and development status. Got: ${stderr}`
  );
});

// ── 11. Preview build does not fail with development project ─────────────────

test('11. Preview build does not fail with SecondPlayable_PL01 in registry', async () => {
  return new Promise(resolve => {
    execFile(
      process.execPath,
      [path.join(REPO_ROOT, 'apps/internal-preview/scripts/build-preview.mjs')],
      { timeout: 15_000, cwd: REPO_ROOT },
      (error, stdout, stderr) => {
        const code = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
        assert.strictEqual(code, 0, `Preview build must exit 0.\nstdout:${stdout}\nstderr:${stderr}`);
        resolve();
      }
    );
  });
});

// ── 12. Preview page clearly marks SecondPlayable_PL01 as not playable yet ───

test('12. Preview page for SecondPlayable_PL01 clearly marks it as not playable yet', async () => {
  const distPage = path.join(
    REPO_ROOT,
    'apps/internal-preview/dist/projects',
    PROJECT_ID,
    'index.html'
  );
  const html = await readFile(distPage, 'utf8');
  assert.ok(
    html.toLowerCase().includes('not playable yet') || html.toLowerCase().includes('not available'),
    'Development project page must say "not playable yet" or "not available"'
  );
  assert.ok(
    !html.includes('Open Unity Preview') && !html.includes('Open AppLovin Preview'),
    'Development project page must not contain Unity/AppLovin preview links'
  );
  assert.ok(html.includes('development'), 'Development project page must mention development status');
});

// ── 13. TilePyramid_PL01 delivery/export workflows still pass ────────────────

test('13. TilePyramid_PL01 validate:delivery still passes', { timeout: 30_000 }, () => {
  const isWin = process.platform === 'win32';
  return new Promise(resolve => {
    execFile(
      isWin ? 'cmd.exe' : 'npm',
      isWin ? ['/d', '/s', '/c', 'npm run validate:delivery'] : ['run', 'validate:delivery'],
      {
        cwd: path.join(REPO_ROOT, 'projects/TilePyramid_PL01'),
        timeout: 25_000,
      },
      (error, stdout, stderr) => {
        const code = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
        assert.strictEqual(code, 0, `validate:delivery must pass. stderr: ${stderr}`);
        resolve();
      }
    );
  });
});

// ── 14. TilePyramid_PL01 asset audit validation still passes ─────────────────

test('14. TilePyramid_PL01 asset audit validation still passes', async () => {
  const { validateAssetAudit } = await import('../asset-audit/asset-audit.mjs');
  const registry = await loadRegistry();
  const project = registry.projects.find(p => p.projectId === 'TilePyramid_PL01');
  const result = await validateAssetAudit({ repoRoot: REPO_ROOT, project });
  assert.ok(result.pass, `TilePyramid_PL01 asset audit validation must pass. Errors: ${result.errors.join(', ')}`);
  assert.strictEqual(result.audit.rawAssetsModified, false);
});
