/**
 * BUILD-16 Vercel Build Script
 *
 * Orchestrates the full Vercel/CI build pipeline:
 *   1. Validate project registry
 *   2. Generate TilePyramid_PL01 delivery package (runs package:delivery)
 *   3. Validate delivery package
 *   4. Build internal preview site (runs preview:build)
 *   5. Validate preview site output
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

function step(label) {
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  STEP: ${label}`);
  console.log('─'.repeat(50));
}

function runNpm(args, cwd, label, timeoutMs = 600_000) {
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

  console.log('\nWowwi Vercel Build — BUILD-16');
  console.log('='.repeat(50));
  console.log('Output directory: apps/internal-preview/dist');

  // 1. Validate project registry
  step('1/5 — Validate project registry');
  await runNpm('run wowwi:validate', REPO_ROOT, 'wowwi:validate');

  // 2. Generate delivery package (includes test:exports Playwright smoke tests)
  step('2/5 — Generate TilePyramid_PL01 delivery package');
  console.log('Running: npm run package:delivery (includes Playwright export tests)');
  await runNpm('run package:delivery', TP_ROOT, 'package:delivery', 600_000);

  // 3. Validate delivery package
  step('3/5 — Validate delivery package');
  await runNpm('run validate:delivery', TP_ROOT, 'validate:delivery');

  // 4. Build preview site
  step('4/5 — Build internal preview site');
  await runNpm('run preview:build', REPO_ROOT, 'preview:build');

  // 5. Validate preview site
  step('5/5 — Validate internal preview site');
  await runNpm('run preview:validate', REPO_ROOT, 'preview:validate');

  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Vercel build complete in ${elapsed}s`);
  console.log('Output: apps/internal-preview/dist/');
  console.log('='.repeat(50));
  console.log('');
}

main().catch(err => {
  console.error(`\nVercel build FAILED: ${err.message}`);
  process.exit(1);
});
