/**
 * BUILD-27 static tests — partner reference commercial audit.
 * All tests are static (file existence + content checks). No network calls.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const execFileAsync = promisify(execFile);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = process.env.WOWWI_REPO_ROOT ?? path.join(HERE, '..', '..');
const REGISTRY_PATH = process.env.WOWWI_REGISTRY_PATH ?? path.join(REPO_ROOT, 'tooling/project-registry/projects.json');

async function readDoc(filename) {
  return readFile(path.join(REPO_ROOT, 'docs', filename), 'utf8');
}

// ─── 1. Document existence ────────────────────────────────────────────────────

test('1. BUILD_27_REPORT.md exists', async () => {
  const text = await readDoc('BUILD_27_REPORT.md');
  assert.ok(text.length > 100, 'BUILD_27_REPORT.md must have content');
});

test('2. PARTNER_REFERENCE_AUDIT.md exists', async () => {
  const text = await readDoc('PARTNER_REFERENCE_AUDIT.md');
  assert.ok(text.length > 100, 'PARTNER_REFERENCE_AUDIT.md must have content');
});

test('3. PARTNER_REFERENCE_AUDIT.md states AppLovin export', async () => {
  const text = await readDoc('PARTNER_REFERENCE_AUDIT.md');
  assert.ok(
    text.toLowerCase().includes('applovin'),
    'PARTNER_REFERENCE_AUDIT must mention AppLovin'
  );
  assert.ok(
    text.includes('AppLovin') || text.includes('applovin'),
    'PARTNER_REFERENCE_AUDIT must confirm AppLovin export target'
  );
});

test('4. PARTNER_REFERENCE_AUDIT.md contains do-not-copy / proprietary warning', async () => {
  const text = await readDoc('PARTNER_REFERENCE_AUDIT.md');
  const hasWarning =
    text.toLowerCase().includes('must not be copied') ||
    text.toLowerCase().includes('do not copy') ||
    text.toLowerCase().includes('must never be copied') ||
    text.toLowerCase().includes('proprietary');
  assert.ok(hasWarning, 'PARTNER_REFERENCE_AUDIT must include a do-not-copy / proprietary warning');
});

test('5. TILEPYRAMID_COMMERCIAL_GAP_ANALYSIS.md exists', async () => {
  const text = await readDoc('TILEPYRAMID_COMMERCIAL_GAP_ANALYSIS.md');
  assert.ok(text.length > 100, 'TILEPYRAMID_COMMERCIAL_GAP_ANALYSIS.md must have content');
});

test('6. TILEPYRAMID_COMMERCIAL_UPGRADE_SPEC.md exists', async () => {
  const text = await readDoc('TILEPYRAMID_COMMERCIAL_UPGRADE_SPEC.md');
  assert.ok(text.length > 100, 'TILEPYRAMID_COMMERCIAL_UPGRADE_SPEC.md must have content');
});

test('7. TILEPYRAMID_PARAMETRIC_TEMPLATE_SPEC.md exists', async () => {
  const text = await readDoc('TILEPYRAMID_PARAMETRIC_TEMPLATE_SPEC.md');
  assert.ok(text.length > 100, 'TILEPYRAMID_PARAMETRIC_TEMPLATE_SPEC.md must have content');
});

test('8. COMMERCIAL_READY_CRITERIA.md exists', async () => {
  const text = await readDoc('COMMERCIAL_READY_CRITERIA.md');
  assert.ok(text.length > 100, 'COMMERCIAL_READY_CRITERIA.md must have content');
});

// ─── 2. Content coverage ─────────────────────────────────────────────────────

test('9. Commercial gap analysis covers CTA, end card, match effect, param system, debug mode', async () => {
  const text = await readDoc('TILEPYRAMID_COMMERCIAL_GAP_ANALYSIS.md');
  const required = ['CTA', 'end card', 'match effect', 'param', 'debug'];
  for (const term of required) {
    assert.ok(
      text.toLowerCase().includes(term.toLowerCase()),
      `Gap analysis must cover "${term}"`
    );
  }
});

test('10. Parametric template spec covers asset replacement and network profile', async () => {
  const text = await readDoc('TILEPYRAMID_PARAMETRIC_TEMPLATE_SPEC.md');
  assert.ok(
    text.toLowerCase().includes('asset replacement') || text.toLowerCase().includes('theme'),
    'Parametric spec must cover asset replacement or theme config'
  );
  assert.ok(
    text.toLowerCase().includes('network') && text.toLowerCase().includes('profile'),
    'Parametric spec must cover network profile'
  );
  assert.ok(
    text.includes('storeLink_android') || text.includes('storeLink'),
    'Parametric spec must define store link injection'
  );
});

test('11. Commercial-ready criteria includes no debug overlay in commercial mode', async () => {
  const text = await readDoc('COMMERCIAL_READY_CRITERIA.md');
  assert.ok(
    text.toLowerCase().includes('debug') && text.toLowerCase().includes('commercial'),
    'Criteria must address debug overlay in commercial mode'
  );
  assert.ok(
    text.includes('debugOverlay') || text.includes('debug overlay') || text.includes('debug flags'),
    'Criteria must explicitly mention debug overlay or debug flags'
  );
});

// ─── 3. Regression: existing tests ───────────────────────────────────────────

test('12. Existing registry tests still pass', async () => {
  let out = '';
  try {
    const result = await execFileAsync(process.execPath, [
      '--test',
      path.join(REPO_ROOT, 'tooling/tests/registry.test.mjs'),
    ], { env: { ...process.env, WOWWI_REPO_ROOT: REPO_ROOT, WOWWI_REGISTRY_PATH: REGISTRY_PATH } });
    out = result.stdout + result.stderr;
  } catch (err) {
    out = (err.stdout ?? '') + (err.stderr ?? '');
    assert.fail(`Registry tests failed with exit ${err.code}. Output:\n${out.slice(0, 800)}`);
  }
  assert.ok(!out.includes('not ok'), 'registry tests must not have any TAP "not ok" failures');
});

test('13. wowwi:validate passes for all projects', async () => {
  const { stdout, stderr } = await execFileAsync(process.execPath, [
    path.join(REPO_ROOT, 'tooling/commands/validate-projects.mjs'),
  ], { env: { ...process.env, WOWWI_REPO_ROOT: REPO_ROOT, WOWWI_REGISTRY_PATH: REGISTRY_PATH } });
  const out = stdout + stderr;
  assert.ok(out.includes('PASS  TilePyramid_PL01'), 'TilePyramid_PL01 must pass validation');
  assert.ok(out.includes('Registry validation: PASS'), 'Registry validation must pass');
});

test('14. TilePyramid registry entry has commercial upgrade status metadata', async () => {
  const text = await readFile(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(text);
  const entry = registry.projects.find(p => p.projectId === 'TilePyramid_PL01');
  assert.ok(entry, 'TilePyramid_PL01 must be in registry');
  assert.ok(
    entry.technicalVersion === 'technical-v1',
    'TilePyramid_PL01 must have technicalVersion = technical-v1'
  );
  assert.ok(
    entry.commercialUpgradeStatus === 'commercial-upgrade-needed',
    'TilePyramid_PL01 must have commercialUpgradeStatus = commercial-upgrade-needed'
  );
  assert.ok(
    Array.isArray(entry.commercialUpgradeBlockers) && entry.commercialUpgradeBlockers.length > 0,
    'TilePyramid_PL01 must list commercial upgrade blockers'
  );
});
