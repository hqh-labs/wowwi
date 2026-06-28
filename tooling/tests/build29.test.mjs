/**
 * BUILD-29 tests - commercial juice/end-card/reward feedback.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = process.env.WOWWI_REPO_ROOT ?? path.join(HERE, '..', '..');
const PROJECT_ROOT = path.join(REPO_ROOT, 'projects/TilePyramid_PL01');
const REGISTRY_PATH = process.env.WOWWI_REGISTRY_PATH ?? path.join(REPO_ROOT, 'tooling/project-registry/projects.json');
const UNITY_EXPORT = path.join(PROJECT_ROOT, 'exports/latest/unity/TilePyramid_PL01_unity.html');
const APPLOVIN_EXPORT = path.join(PROJECT_ROOT, 'exports/latest/applovin/TilePyramid_PL01_applovin.html');

async function readProjectConfig() {
  return JSON.parse(await readFile(path.join(PROJECT_ROOT, 'public/config/game.config.json'), 'utf8'));
}

async function readDoc(name) {
  return readFile(path.join(REPO_ROOT, 'docs', name), 'utf8');
}

function toFileUrl(absPath) {
  return pathToFileURL(absPath).href;
}

test('1. BUILD-29 commercial juice config enables all required polish systems', async () => {
  const config = await readProjectConfig();
  assert.equal(config.commercialJuice.enabled, true);
  assert.equal(config.commercialJuice.endCardV2.enabled, true);
  assert.equal(config.commercialJuice.ctaPolish.enabled, true);
  assert.equal(config.commercialJuice.matchReward.enabled, true);
  assert.equal(config.commercialJuice.trayLanding.enabled, true);
  assert.equal(config.commercialJuice.tileTapPolish.enabled, true);
  assert.equal(config.commercialJuice.idleHintV2.enabled, true);
  assert.equal(config.commercialJuice.timerWarningPolish.enabled, true);
  assert.equal(config.commercialJuice.boardDepth.enabled, true);
});

test('2. Candidate and delivery exports still use commercial mode', async () => {
  const unity = await readFile(UNITY_EXPORT, 'utf8');
  const applovin = await readFile(APPLOVIN_EXPORT, 'utf8');
  assert.ok(unity.includes('"buildMode":"commercial"'));
  assert.ok(applovin.includes('"buildMode":"commercial"'));
});

test('3. Commercial export validation still fails on debug leakage', async () => {
  const { validateCommercialMode } = await import(toFileUrl(
    path.join(PROJECT_ROOT, 'scripts/export/validators/export-validator.mjs')
  ));
  const errors = validateCommercialMode(
    'window.__GAME_CONFIG__={"buildMode":"commercial","debugOverlay":true}',
    { buildMode: 'commercial', network: 'unity' }
  );
  assert.ok(errors.some(error => error.includes('debugOverlay')));
});

test('4. Unity commercial export validation passes', async () => {
  const { validateCommercialMode } = await import(toFileUrl(
    path.join(PROJECT_ROOT, 'scripts/export/validators/export-validator.mjs')
  ));
  const { getExportProfile } = await import(toFileUrl(
    path.join(PROJECT_ROOT, 'scripts/export/profiles/profiles.mjs')
  ));
  const html = await readFile(UNITY_EXPORT, 'utf8');
  assert.deepEqual(validateCommercialMode(html, getExportProfile('unity-2026-06')), []);
});

test('5. AppLovin commercial export validation passes', async () => {
  const { validateCommercialMode } = await import(toFileUrl(
    path.join(PROJECT_ROOT, 'scripts/export/validators/export-validator.mjs')
  ));
  const { getExportProfile } = await import(toFileUrl(
    path.join(PROJECT_ROOT, 'scripts/export/profiles/profiles.mjs')
  ));
  const html = await readFile(APPLOVIN_EXPORT, 'utf8');
  assert.deepEqual(validateCommercialMode(html, getExportProfile('applovin-2026-06')), []);
});

test('6. No forbidden window.top patterns are introduced', async () => {
  const { hasForbiddenTopWindowAccess } = await import(toFileUrl(
    path.join(PROJECT_ROOT, 'scripts/export/validators/export-validator.mjs')
  ));
  assert.equal(hasForbiddenTopWindowAccess(await readFile(UNITY_EXPORT, 'utf8')), false);
  assert.equal(hasForbiddenTopWindowAccess(await readFile(APPLOVIN_EXPORT, 'utf8')), false);
});

test('7. AppLovin boot policy still exists and stays MRAID-safe', async () => {
  const html = await readFile(APPLOVIN_EXPORT, 'utf8');
  assert.ok(html.includes('__PLAYABLE_BOOT_POLICY__'));
  assert.ok(html.includes('viewabilityGate'));
  assert.ok(!html.includes('window.top'));
});

test('8. BUILD_29_REPORT exists', async () => {
  const text = await readDoc('BUILD_29_REPORT.md');
  assert.ok(text.includes('BUILD-29'));
  assert.ok(text.includes('Commercial Juice'));
});

test('9. TILEPYRAMID_COMMERCIAL_JUICE_PASS exists', async () => {
  const text = await readDoc('TILEPYRAMID_COMMERCIAL_JUICE_PASS.md');
  assert.ok(text.includes('end card'));
  assert.ok(text.includes('CTA'));
  assert.ok(text.includes('reward'));
});

test('10. Commercial-ready criteria still does not mark TilePyramid as fully commercial-ready', async () => {
  const criteria = await readDoc('COMMERCIAL_READY_CRITERIA.md');
  const registry = JSON.parse(await readFile(REGISTRY_PATH, 'utf8'));
  const entry = registry.projects.find(project => project.projectId === 'TilePyramid_PL01');
  assert.ok(criteria.includes('NOT YET PROVEN'));
  assert.equal(entry.formalSolvability, 'NOT YET PROVEN');
  assert.notEqual(entry.commercialUpgradeStatus, 'commercial-ready');
});
