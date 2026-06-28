/**
 * BUILD-16 Vercel deployment tests — 14 tests
 * Runner: node:test (no extra dependencies)
 */

import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { test, before } from 'node:test';
import { fileURLToPath } from 'node:url';
import { validatePreviewDist, validateVercelConfig } from '../scripts/validate-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(HERE, '..');
const REPO_ROOT = path.join(APP_ROOT, '..', '..');
const DIST = path.join(APP_ROOT, 'dist');
const SCRIPTS = path.join(APP_ROOT, 'scripts');
const IS_WIN = process.platform === 'win32';

// ── helpers ───────────────────────────────────────────────────────────────────

function runNpmScript(scriptName, cwd = REPO_ROOT, timeoutMs = 600_000) {
  return new Promise(resolve => {
    const cmd = IS_WIN ? 'cmd.exe' : 'npm';
    const argv = IS_WIN ? ['/d', '/s', '/c', `npm run ${scriptName}`] : ['run', scriptName];
    execFile(cmd, argv, { cwd, timeout: timeoutMs, maxBuffer: 50 * 1024 * 1024 }, (error, stdout, stderr) => {
      const code = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
      resolve({ code, stdout, stderr });
    });
  });
}

function runNode(scriptPath, args = [], timeoutMs = 600_000) {
  return new Promise(resolve => {
    execFile(
      process.execPath,
      [scriptPath, ...args],
      { cwd: REPO_ROOT, timeout: timeoutMs, maxBuffer: 50 * 1024 * 1024 },
      (error, stdout, stderr) => {
        const code = error ? (typeof error.code === 'number' ? error.code : 1) : 0;
        if (stdout) process.stdout.write(stdout);
        if (stderr) process.stderr.write(stderr);
        resolve({ code, stdout, stderr });
      }
    );
  });
}

async function fileExists(p) {
  try { await access(p); return true; } catch { return false; }
}

// ── run vercel:build-preview once before output-dependent tests ───────────────

before(async () => {
  // Run once; the vercel-build script runs wowwi:validate + package:delivery + preview:build + validate
  const { code } = await runNpmScript('vercel:build-preview', REPO_ROOT, 600_000);
  if (code !== 0) throw new Error('vercel:build-preview failed in before() hook');
}, { timeout: 620_000 });

// ─────────────────────────────────────────────────────────────────────────────
// Vercel config structure (tests 1–3)
// ─────────────────────────────────────────────────────────────────────────────

test('1. vercel.json exists at repo root', async () => {
  const ok = await fileExists(path.join(REPO_ROOT, 'vercel.json'));
  assert.ok(ok, 'vercel.json must exist at repo root');
});

test('2. vercel.json uses the correct build command', async () => {
  const result = await validateVercelConfig(REPO_ROOT);
  assert.ok(
    !result.errors.some(e => e.includes('buildCommand')),
    `vercel.json buildCommand error: ${result.errors.join(', ')}`
  );
  assert.ok(
    result.config?.buildCommand?.includes('vercel:build-preview'),
    `buildCommand must include vercel:build-preview, got: ${result.config?.buildCommand}`
  );
});

test('3. vercel.json uses apps/internal-preview/dist as output directory', async () => {
  const result = await validateVercelConfig(REPO_ROOT);
  assert.ok(
    !result.errors.some(e => e.includes('outputDirectory')),
    `vercel.json outputDirectory error: ${result.errors.join(', ')}`
  );
  assert.strictEqual(
    result.config?.outputDirectory,
    'apps/internal-preview/dist',
    'outputDirectory must be apps/internal-preview/dist'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Vercel build output (tests 4–11) — dist built by before()
// ─────────────────────────────────────────────────────────────────────────────

test('4. Vercel build command generates TilePyramid delivery first', async () => {
  // Delivery manifest must exist after vercel:build-preview runs
  const manifestPath = path.join(
    REPO_ROOT,
    'projects/TilePyramid_PL01/delivery/latest/delivery-manifest.json'
  );
  const ok = await fileExists(manifestPath);
  assert.ok(ok, 'delivery-manifest.json must exist after vercel:build-preview');

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert.ok(manifest.outputs?.unity, 'delivery manifest must have unity output');
  assert.ok(manifest.outputs?.applovin, 'delivery manifest must have applovin output');
});

test('5. Vercel build command generates preview dist', async () => {
  const ok = await fileExists(path.join(DIST, 'index.html'));
  assert.ok(ok, 'dist/index.html must exist after vercel:build-preview');
});

test('6. Vercel output includes Unity HTML', async () => {
  const ok = await fileExists(path.join(DIST, 'projects/TilePyramid_PL01/unity.html'));
  assert.ok(ok, 'Unity preview HTML must be in vercel output');
});

test('7. Vercel output includes AppLovin HTML', async () => {
  const ok = await fileExists(path.join(DIST, 'projects/TilePyramid_PL01/applovin.html'));
  assert.ok(ok, 'AppLovin preview HTML must be in vercel output');
});

test('8. Vercel output includes preview-data.json', async () => {
  const ok = await fileExists(path.join(DIST, 'preview-data.json'));
  assert.ok(ok, 'preview-data.json must be in vercel output');
});

test('9. Vercel output excludes project-input', async () => {
  const bad = await fileExists(path.join(DIST, 'project-input'));
  assert.ok(!bad, 'project-input must not appear in vercel output');
});

test('10. Vercel output excludes raw/extracted asset folders', async () => {
  const rawBad = await fileExists(path.join(DIST, 'project-input/raw-assets'));
  const extractBad = await fileExists(path.join(DIST, 'project-input/extracted-assets'));
  assert.ok(!rawBad, 'raw-assets must not appear in vercel output');
  assert.ok(!extractBad, 'extracted-assets must not appear in vercel output');
});

test('11. Vercel output contains no forbidden window.top', async () => {
  const result = await validatePreviewDist(DIST);
  const topErrors = result.errors.filter(e => e.includes('window.top'));
  assert.strictEqual(topErrors.length, 0, `window.top found: ${topErrors.join(', ')}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// Regression tests (tests 12–14)
// ─────────────────────────────────────────────────────────────────────────────

test('12. Existing preview tests still pass', { timeout: 180_000 }, async () => {
  const { code } = await runNpmScript('preview:test', REPO_ROOT, 175_000);
  assert.strictEqual(code, 0, 'preview:test must pass (16 tests)');
});

test('13. Existing Wowwi registry tests still pass', { timeout: 120_000 }, async () => {
  const { code } = await runNode(
    path.join(REPO_ROOT, 'tooling/tests/registry.test.mjs'),
    [],
    115_000
  );
  assert.strictEqual(code, 0, 'Registry test suite must pass (15 tests)');
});

test('14. Existing TilePyramid delivery workflow still passes', { timeout: 30_000 }, async () => {
  const { code } = await runNpmScript(
    'validate:delivery',
    path.join(REPO_ROOT, 'projects/TilePyramid_PL01'),
    25_000
  );
  assert.strictEqual(code, 0, 'validate:delivery must pass');
});
