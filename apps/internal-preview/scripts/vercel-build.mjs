/**
 * BUILD-17 Vercel Build Script (Playwright-free)
 *
 * Orchestrates the Vercel build pipeline without any browser automation:
 *   1. Validate project registry (static JSON + schema)
 *   2. Export Unity + AppLovin HTML (Vite build + static validation — no Playwright)
 *   3. Generate preview delivery manifest (copy HTML + write delivery-manifest.json)
 *   4. Build internal preview site
 *   5. Validate preview site output (static checks only)
 *
 * This script does NOT call: package:candidate, package:delivery,
 * test:exports, test:smoke, or any Playwright command.
 *
 * Usage: node apps/internal-preview/scripts/vercel-build.mjs
 * Root shortcut: npm run vercel:build-preview
 */

import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(HERE, '..');
const REPO_ROOT = path.join(APP_ROOT, '..', '..');
const TP_ROOT = path.join(REPO_ROOT, 'projects/TilePyramid_PL01');

const IS_WIN = process.platform === 'win32';

// ─── helpers ──────────────────────────────────────────────────────────────────

function step(n, total, label) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  STEP ${n}/${total}: ${label}`);
  console.log('─'.repeat(50));
}

function runNpm(args, cwd, label, timeoutMs = 300_000) {
  return new Promise((resolve, reject) => {
    const cmd = IS_WIN ? 'cmd.exe' : 'npm';
    const argv = IS_WIN ? ['/d', '/s', '/c', `npm ${args}`] : args.split(' ');
    const child = execFile(cmd, argv, { cwd, timeout: timeoutMs, maxBuffer: 50 * 1024 * 1024 });

    child.stdout?.on('data', d => process.stdout.write(d));
    child.stderr?.on('data', d => process.stderr.write(d));

    child.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${label} failed with exit code ${code}`));
      }
    });
    child.on('error', reject);
  });
}

// ─── pipeline ─────────────────────────────────────────────────────────────────

async function main() {
  const startMs = Date.now();

  console.log('\nWowwi Vercel Build — BUILD-17 (Playwright-free)');
  console.log('='.repeat(50));
  console.log('Output directory: apps/internal-preview/dist');
  console.log('No Playwright. No Chromium. No browser.');

  // 1. Validate project registry (static)
  step(1, 5, 'Validate project registry');
  await runNpm('run wowwi:validate', REPO_ROOT, 'wowwi:validate');

  // 2. Export Unity + AppLovin HTML (Vite build + static validation only — no Playwright)
  step(2, 5, 'Export TilePyramid_PL01 HTML (Vite build + static checks, no Playwright)');
  console.log('Running: npm run export:all:static');
  await runNpm('run export:all:static', TP_ROOT, 'export:all:static', 300_000);

  // 3. Generate preview delivery manifest (copy HTML + write delivery-manifest.json)
  step(3, 5, 'Generate preview delivery manifest');
  await runNpm('run vercel:generate-delivery', REPO_ROOT, 'vercel:generate-delivery');

  // 4. Build preview site
  step(4, 5, 'Build internal preview site');
  await runNpm('run preview:build', REPO_ROOT, 'preview:build');

  // 5. Validate preview site (static checks only — no Playwright)
  step(5, 5, 'Validate internal preview site (static)');
  await runNpm('run preview:validate', REPO_ROOT, 'preview:validate');

  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Vercel build complete in ${elapsed}s`);
  console.log('Output: apps/internal-preview/dist/');
  console.log('No Playwright was used.');
  console.log('='.repeat(50));
  console.log('');
}

main().catch(err => {
  console.error(`\nVercel build FAILED: ${err.message}`);
  process.exit(1);
});
