/**
 * BUILD-15 preview site tests — 16 tests total
 * Runner: node:test (no extra dependencies)
 */

import { execFile } from 'node:child_process';
import { access, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { test, before, after } from 'node:test';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(HERE, '..');
const REPO_ROOT = path.join(APP_ROOT, '..', '..');
const DIST = path.join(APP_ROOT, 'dist');
const SCRIPTS = path.join(APP_ROOT, 'scripts');
const REGISTRY_PATH = path.join(REPO_ROOT, 'tooling/project-registry/projects.json');

// ── helpers ───────────────────────────────────────────────────────────────────

function runScript(scriptName, args = []) {
  return new Promise(resolve => {
    execFile(
      process.execPath,
      [path.join(SCRIPTS, scriptName), ...args],
      { timeout: 30_000, cwd: REPO_ROOT },
      (error, stdout, stderr) => {
        const code = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
        resolve({ code, stdout, stderr });
      }
    );
  });
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

// ── ensure dist is built before tests run ────────────────────────────────────

before(async () => {
  if (!existsSync(DIST)) {
    const { code, stderr } = await runScript('build-preview.mjs');
    if (code !== 0) throw new Error(`Preview build failed:\n${stderr}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Registry loading (tests 1–3)
// ─────────────────────────────────────────────────────────────────────────────

test('1. Preview build can load the registry', async () => {
  const text = await readFile(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(text);
  assert.ok(Array.isArray(registry.projects), 'registry.projects must be an array');
  assert.ok(registry.projects.length > 0, 'registry must have at least one project');
});

test('2. Preview build includes TilePyramid_PL01', async () => {
  const text = await readFile(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(text);
  const project = registry.projects.find(p => p.projectId === 'TilePyramid_PL01');
  assert.ok(project, 'TilePyramid_PL01 must be in the registry');
});

test('3. Preview build reads delivery manifest', async () => {
  const manifestPath = path.join(
    REPO_ROOT,
    'projects/TilePyramid_PL01/delivery/latest/delivery-manifest.json'
  );
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert.ok(manifest.outputs?.unity, 'manifest must have unity output');
  assert.ok(manifest.outputs?.applovin, 'manifest must have applovin output');
});

// ─────────────────────────────────────────────────────────────────────────────
// Output files (tests 4–7)
// ─────────────────────────────────────────────────────────────────────────────

test('4. Preview output home page exists', async () => {
  const ok = await exists(path.join(DIST, 'index.html'));
  assert.ok(ok, 'dist/index.html must exist');
});

test('5. Preview output TilePyramid page exists', async () => {
  const ok = await exists(path.join(DIST, 'projects/TilePyramid_PL01/index.html'));
  assert.ok(ok, 'dist/projects/TilePyramid_PL01/index.html must exist');
});

test('6. Preview output Unity HTML exists', async () => {
  const ok = await exists(path.join(DIST, 'projects/TilePyramid_PL01/unity.html'));
  assert.ok(ok, 'dist/projects/TilePyramid_PL01/unity.html must exist');
});

test('7. Preview output AppLovin HTML exists', async () => {
  const ok = await exists(path.join(DIST, 'projects/TilePyramid_PL01/applovin.html'));
  assert.ok(ok, 'dist/projects/TilePyramid_PL01/applovin.html must exist');
});

// ─────────────────────────────────────────────────────────────────────────────
// Preview data content (tests 8–10)
// ─────────────────────────────────────────────────────────────────────────────

test('8. Preview data contains Android store URL', async () => {
  const data = JSON.parse(await readFile(path.join(DIST, 'preview-data.json'), 'utf8'));
  const tp = data.projects.find(p => p.projectId === 'TilePyramid_PL01');
  assert.ok(tp?.storeUrls?.androidUrl, 'androidUrl must be present in preview-data');
});

test('9. Preview data contains iOS store URL', async () => {
  const data = JSON.parse(await readFile(path.join(DIST, 'preview-data.json'), 'utf8'));
  const tp = data.projects.find(p => p.projectId === 'TilePyramid_PL01');
  assert.ok(tp?.storeUrls?.iosUrl, 'iosUrl must be present in preview-data');
});

test('10. Preview data contains formal solvability NOT YET PROVEN', async () => {
  const data = JSON.parse(await readFile(path.join(DIST, 'preview-data.json'), 'utf8'));
  const tp = data.projects.find(p => p.projectId === 'TilePyramid_PL01');
  assert.strictEqual(
    tp?.formalSolvability,
    'NOT YET PROVEN',
    'formalSolvability must be NOT YET PROVEN'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Safety checks (test 11)
// ─────────────────────────────────────────────────────────────────────────────

test('11. Preview output does not include project-input', async () => {
  const bad = await exists(path.join(DIST, 'project-input'));
  assert.ok(!bad, 'project-input must not be copied into preview dist');
});

// ─────────────────────────────────────────────────────────────────────────────
// Validator checks (tests 12–14)
// ─────────────────────────────────────────────────────────────────────────────

test('12. Preview validator rejects missing Unity preview HTML', async () => {
  // Create a temp dist with only applovin but no unity
  const tmpDist = path.join(APP_ROOT, 'dist-test-12');
  await mkdir(path.join(tmpDist, 'projects/TilePyramid_PL01'), { recursive: true });
  await writeFile(path.join(tmpDist, 'index.html'), '<html>ok</html>', 'utf8');
  await writeFile(path.join(tmpDist, 'preview-data.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    projects: [{
      projectId: 'TilePyramid_PL01',
      displayName: 'Test',
      status: 'delivery-locked',
      formalSolvability: 'NOT YET PROVEN',
      storeUrls: { androidUrl: 'https://example.com', iosUrl: 'https://example.com' },
      deliveryChecksums: { unity: 'abc123', applovin: 'def456' },
    }],
  }), 'utf8');
  await writeFile(path.join(tmpDist, 'projects/TilePyramid_PL01/index.html'), '<html>ok</html>', 'utf8');
  await writeFile(path.join(tmpDist, 'projects/TilePyramid_PL01/applovin.html'), '<html>ok</html>', 'utf8');
  // Intentionally missing: unity.html

  const { validatePreviewDist } = await import('../scripts/validate-lib.mjs');
  const result = await validatePreviewDist(tmpDist);
  await rm(tmpDist, { recursive: true, force: true });

  assert.ok(
    result.errors.some(e => e.toLowerCase().includes('unity')),
    `Expected Unity-missing error. Got: ${result.errors.join(', ')}`
  );
});

test('13. Preview validator rejects missing AppLovin preview HTML', async () => {
  const tmpDist = path.join(APP_ROOT, 'dist-test-13');
  await mkdir(path.join(tmpDist, 'projects/TilePyramid_PL01'), { recursive: true });
  await writeFile(path.join(tmpDist, 'index.html'), '<html>ok</html>', 'utf8');
  await writeFile(path.join(tmpDist, 'preview-data.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    projects: [{
      projectId: 'TilePyramid_PL01',
      displayName: 'Test',
      status: 'delivery-locked',
      formalSolvability: 'NOT YET PROVEN',
      storeUrls: { androidUrl: 'https://example.com', iosUrl: 'https://example.com' },
      deliveryChecksums: { unity: 'abc123', applovin: 'def456' },
    }],
  }), 'utf8');
  await writeFile(path.join(tmpDist, 'projects/TilePyramid_PL01/index.html'), '<html>ok</html>', 'utf8');
  await writeFile(path.join(tmpDist, 'projects/TilePyramid_PL01/unity.html'), '<html>ok</html>', 'utf8');
  // Intentionally missing: applovin.html

  const { validatePreviewDist } = await import('../scripts/validate-lib.mjs');
  const result = await validatePreviewDist(tmpDist);
  await rm(tmpDist, { recursive: true, force: true });

  assert.ok(
    result.errors.some(e => e.toLowerCase().includes('applovin')),
    `Expected AppLovin-missing error. Got: ${result.errors.join(', ')}`
  );
});

test('14. Preview validator rejects forbidden window.top', async () => {
  const tmpDist = path.join(APP_ROOT, 'dist-test-14');
  await mkdir(path.join(tmpDist, 'projects/TilePyramid_PL01'), { recursive: true });
  await writeFile(path.join(tmpDist, 'index.html'), '<html>ok</html>', 'utf8');
  await writeFile(path.join(tmpDist, 'preview-data.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    projects: [{
      projectId: 'TilePyramid_PL01',
      displayName: 'Test',
      status: 'delivery-locked',
      formalSolvability: 'NOT YET PROVEN',
      storeUrls: { androidUrl: 'https://example.com', iosUrl: 'https://example.com' },
      deliveryChecksums: { unity: 'abc123', applovin: 'def456' },
    }],
  }), 'utf8');
  await writeFile(path.join(tmpDist, 'projects/TilePyramid_PL01/index.html'), '<html>ok</html>', 'utf8');
  await writeFile(
    path.join(tmpDist, 'projects/TilePyramid_PL01/unity.html'),
    '<html><script>window.top.location.href="about:blank";</script></html>',
    'utf8'
  );
  await writeFile(path.join(tmpDist, 'projects/TilePyramid_PL01/applovin.html'), '<html>ok</html>', 'utf8');

  const { validatePreviewDist } = await import('../scripts/validate-lib.mjs');
  const result = await validatePreviewDist(tmpDist);
  await rm(tmpDist, { recursive: true, force: true });

  assert.ok(
    result.errors.some(e => e.toLowerCase().includes('window.top')),
    `Expected window.top error. Got: ${result.errors.join(', ')}`
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Regression (tests 15–16)
// ─────────────────────────────────────────────────────────────────────────────

test('15. Existing Wowwi registry tests still pass', { timeout: 60_000 }, async () => {
  const { code } = await new Promise(resolve => {
    execFile(
      process.execPath,
      ['--test', path.join(REPO_ROOT, 'tooling/tests/registry.test.mjs')],
      { timeout: 55_000, cwd: REPO_ROOT },
      (error, stdout, stderr) => {
        const code = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
        if (stdout) process.stdout.write(stdout);
        if (stderr) process.stderr.write(stderr);
        resolve({ code });
      }
    );
  });
  assert.strictEqual(code, 0, 'Registry test suite must pass');
});

test('16. Existing TilePyramid delivery workflow still passes', { timeout: 120_000 }, async () => {
  const isWin = process.platform === 'win32';
  const { code } = await new Promise(resolve => {
    execFile(
      isWin ? 'cmd.exe' : 'npm',
      isWin ? ['/d', '/s', '/c', 'npm run validate:delivery'] : ['run', 'validate:delivery'],
      {
        cwd: path.join(REPO_ROOT, 'projects/TilePyramid_PL01'),
        timeout: 115_000,
      },
      (error, stdout, stderr) => {
        const code = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
        if (stdout) process.stdout.write(stdout);
        if (stderr) process.stderr.write(stderr);
        resolve({ code });
      }
    );
  });
  assert.strictEqual(code, 0, 'TilePyramid validate:delivery must pass');
});
