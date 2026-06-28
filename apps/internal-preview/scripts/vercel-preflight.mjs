/**
 * BUILD-16 Vercel Preflight
 *
 * Runs the full pre-deploy verification sequence locally:
 *   1. wowwi:validate
 *   2. preview:test  (16 BUILD-15 tests)
 *   3. vercel:build-preview  (delivery → preview build → validate)
 *   4. preview:validate
 *
 * Usage: node apps/internal-preview/scripts/vercel-preflight.mjs
 * Root shortcut: npm run vercel:preflight
 */

import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(HERE, '..', '..', '..');
const IS_WIN = process.platform === 'win32';

function runNpm(args, label, timeoutMs = 600_000) {
  return new Promise((resolve, reject) => {
    const cmd = IS_WIN ? 'cmd.exe' : 'npm';
    const argv = IS_WIN ? ['/d', '/s', '/c', `npm ${args}`] : args.split(' ');
    const child = execFile(cmd, argv, { cwd: REPO_ROOT, timeout: timeoutMs, maxBuffer: 50 * 1024 * 1024 });

    child.stdout?.on('data', d => process.stdout.write(d));
    child.stderr?.on('data', d => process.stderr.write(d));

    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`${label} failed with exit code ${code}`));
    });
    child.on('error', reject);
  });
}

async function main() {
  const startMs = Date.now();
  const steps = [
    { args: 'run wowwi:validate', label: '1/4 Registry validation' },
    { args: 'run preview:test', label: '2/4 Preview site tests (BUILD-15)', timeout: 180_000 },
    { args: 'run vercel:build-preview', label: '3/4 Vercel build (delivery + preview)', timeout: 600_000 },
    { args: 'run preview:validate', label: '4/4 Preview site validation' },
  ];

  console.log('\nWowwi Vercel Preflight — BUILD-16');
  console.log('='.repeat(50));

  for (const { args, label, timeout } of steps) {
    console.log(`\n  → ${label}`);
    await runNpm(args, label, timeout ?? 60_000);
    console.log(`  ✓ ${label}`);
  }

  const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Preflight PASSED in ${elapsed}s. Ready for Vercel deployment.`);
  console.log('='.repeat(50));
  console.log('');
}

main().catch(err => {
  console.error(`\nPreflight FAILED: ${err.message}`);
  process.exit(1);
});
