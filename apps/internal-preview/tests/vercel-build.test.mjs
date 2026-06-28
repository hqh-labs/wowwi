/**
 * BUILD-17 Vercel deployment tests — 15 tests
 *
 * Validates that:
 *   - vercel.json has no Playwright in installCommand
 *   - vercel-build.mjs does not call package:candidate, package:delivery,
 *     test:exports, test:smoke, or reference playwright
 *   - Vercel-safe build produces correct output (no browser required)
 *   - Local full QA workflows still pass independently
 *
 * Runner: node:test (no extra dependencies)
 */

import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import { test, before } from 'node:test';
import { fileURLToPath } from 'node:url';
import { validatePreviewDist, validateVercelConfig } from '../scripts/validate-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(HERE, '..');
const REPO_ROOT = path.join(APP_ROOT, '..', '..');
const DIST = path.join(APP_ROOT, 'dist');
const IS_WIN = process.platform === 'win32';

// ─── helpers ──────────────────────────────────────────────────────────────────

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

function runNode(scriptPath, timeoutMs = 600_000) {
  return new Promise(resolve => {
    execFile(
      process.execPath,
      [scriptPath],
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

// ─── run vercel:build-preview once before output-dependent tests ───────────────

before(async () => {
  const { code } = await runNpmScript('vercel:build-preview', REPO_ROOT, 600_000);
  if (code !== 0) throw new Error('vercel:build-preview failed in before() hook');
}, { timeout: 620_000 });

// ─────────────────────────────────────────────────────────────────────────────
// Tests 1–3: Vercel config structure
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
// Tests 4–8: Playwright-free assertions (static code inspection)
// ─────────────────────────────────────────────────────────────────────────────

test('4. vercel.json installCommand does not include playwright', async () => {
  const result = await validateVercelConfig(REPO_ROOT);
  const playwrightErrors = result.errors.filter(e => e.includes('playwright'));
  assert.strictEqual(
    playwrightErrors.length, 0,
    `vercel.json installCommand must not reference playwright: ${playwrightErrors.join(', ')}`
  );
  const installCmd = result.config?.installCommand ?? '';
  assert.ok(
    !installCmd.includes('playwright'),
    `installCommand must not include playwright, got: ${installCmd}`
  );
});

test('5. vercel-build.mjs does not call package:candidate', async () => {
  const src = await readFile(
    path.join(APP_ROOT, 'scripts/vercel-build.mjs'),
    'utf8'
  );
  // Check executable code lines only (skip comment lines starting with * or //)
  const codeLines = src.split('\n').filter(l => !l.trimStart().startsWith('*') && !l.trimStart().startsWith('//'));
  const codeOnly = codeLines.join('\n');
  assert.ok(
    !codeOnly.includes('package:candidate'),
    'vercel-build.mjs executable code must not call package:candidate'
  );
});

test('6. vercel-build.mjs does not call package:delivery', async () => {
  const src = await readFile(
    path.join(APP_ROOT, 'scripts/vercel-build.mjs'),
    'utf8'
  );
  const codeLines = src.split('\n').filter(l => !l.trimStart().startsWith('*') && !l.trimStart().startsWith('//'));
  const codeOnly = codeLines.join('\n');
  assert.ok(
    !codeOnly.includes('package:delivery'),
    'vercel-build.mjs executable code must not call package:delivery'
  );
});

test('7. vercel-build.mjs does not call test:exports or test:smoke', async () => {
  const src = await readFile(
    path.join(APP_ROOT, 'scripts/vercel-build.mjs'),
    'utf8'
  );
  const codeLines = src.split('\n').filter(l => !l.trimStart().startsWith('*') && !l.trimStart().startsWith('//'));
  const codeOnly = codeLines.join('\n');
  assert.ok(!codeOnly.includes('test:exports'), 'vercel-build.mjs executable code must not call test:exports');
  assert.ok(!codeOnly.includes('test:smoke'), 'vercel-build.mjs executable code must not call test:smoke');
});

test('8. vercel-build.mjs does not import or require playwright', async () => {
  const src = await readFile(
    path.join(APP_ROOT, 'scripts/vercel-build.mjs'),
    'utf8'
  );
  // Check for actual playwright import/require — the word "playwright" in comments is OK
  const hasImport = /import\s+.*from\s+['"].*playwright/.test(src);
  const hasRequire = /require\s*\(\s*['"].*playwright/.test(src);
  assert.ok(!hasImport, 'vercel-build.mjs must not import playwright');
  assert.ok(!hasRequire, 'vercel-build.mjs must not require playwright');
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests 9–12: Vercel build output (generated by before() hook)
// ─────────────────────────────────────────────────────────────────────────────

test('9. Vercel-safe build produces Unity preview HTML', async () => {
  const ok = await fileExists(path.join(DIST, 'projects/TilePyramid_PL01/unity.html'));
  assert.ok(ok, 'Unity preview HTML must exist after vercel:build-preview');
});

test('10. Vercel-safe build produces AppLovin preview HTML', async () => {
  const ok = await fileExists(path.join(DIST, 'projects/TilePyramid_PL01/applovin.html'));
  assert.ok(ok, 'AppLovin preview HTML must exist after vercel:build-preview');
});

test('11. Vercel output includes preview-data.json and home page', async () => {
  assert.ok(await fileExists(path.join(DIST, 'index.html')), 'index.html must exist');
  assert.ok(await fileExists(path.join(DIST, 'preview-data.json')), 'preview-data.json must exist');
});

test('12. Vercel-safe output contains no window.top', async () => {
  const result = await validatePreviewDist(DIST);
  const topErrors = result.errors.filter(e => e.includes('window.top'));
  assert.strictEqual(topErrors.length, 0, `window.top found in Vercel output: ${topErrors.join(', ')}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests 13–15: Regression — existing workflows still pass locally
// ─────────────────────────────────────────────────────────────────────────────

test('13. Existing preview tests still pass (16/16)', { timeout: 180_000 }, async () => {
  const { code } = await runNpmScript('preview:test', REPO_ROOT, 175_000);
  assert.strictEqual(code, 0, 'preview:test must pass (16 tests)');
});

test('14. Existing Wowwi registry tests still pass (15/15)', { timeout: 120_000 }, async () => {
  const { code } = await runNode(
    path.join(REPO_ROOT, 'tooling/tests/registry.test.mjs'),
    115_000
  );
  assert.strictEqual(code, 0, 'Registry test suite must pass (15 tests)');
});

test('15. Local full QA: validate:delivery still passes', { timeout: 30_000 }, async () => {
  const { code } = await runNpmScript(
    'validate:delivery',
    path.join(REPO_ROOT, 'projects/TilePyramid_PL01'),
    25_000
  );
  assert.strictEqual(code, 0, 'validate:delivery must pass (delivery package still intact)');
});
