/**
 * BUILD-28 tests — commercial mode export lock.
 * Verifies: build mode enum, debug gating, commercial export defaults,
 * commercial export validation, boot policy, and regression.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const execFileAsync = promisify(execFile);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = process.env.WOWWI_REPO_ROOT ?? path.join(HERE, '..', '..');
const REGISTRY_PATH = process.env.WOWWI_REGISTRY_PATH ?? path.join(REPO_ROOT, 'tooling/project-registry/projects.json');
const PROJECT_ROOT = path.join(REPO_ROOT, 'projects/TilePyramid_PL01');
const EXPORT_UNITY = path.join(PROJECT_ROOT, 'exports/latest/unity/TilePyramid_PL01_unity.html');
const EXPORT_APPLOVIN = path.join(PROJECT_ROOT, 'exports/latest/applovin/TilePyramid_PL01_applovin.html');

async function readDoc(filename) {
  return readFile(path.join(REPO_ROOT, 'docs', filename), 'utf8');
}

async function readExport(filePath) {
  return readFile(filePath, 'utf8');
}

function toFileUrl(absPath) {
  return pathToFileURL(absPath).href;
}

// ─── 1. Build mode enum ───────────────────────────────────────────────────────

test('1. Build mode enum supports development, review, and commercial', async () => {
  const profilesPath = path.join(PROJECT_ROOT, 'scripts/export/profiles/profiles.mjs');
  const text = await readFile(profilesPath, 'utf8');
  assert.ok(text.includes('buildMode'), 'profiles.mjs must define buildMode on profiles');

  const inlinerPath = path.join(PROJECT_ROOT, 'scripts/export/inliner/single-file-inliner.mjs');
  const inliner = await readFile(inlinerPath, 'utf8');
  assert.ok(inliner.includes("'commercial'"), 'inliner must set commercial buildMode');
  assert.ok(inliner.includes('debugOverlay: false'), 'inliner must disable debugOverlay');

  const configPath = path.join(PROJECT_ROOT, 'public/config/game.config.json');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  assert.equal(config.buildMode, 'development', 'game.config.json must use development mode');
  assert.ok(['development', 'review', 'commercial'].includes(config.buildMode), 'buildMode must be a valid value');
});

// ─── 2. Commercial mode forcibly disables debug UI ────────────────────────────

test('2. Commercial mode disables debugOverlay in exported config', async () => {
  const html = await readExport(EXPORT_UNITY);
  assert.ok(html.includes('"buildMode":"commercial"'), 'Unity export must have buildMode commercial');
  assert.ok(!/"debugOverlay"\s*:\s*true/.test(html), 'Unity export must not have debugOverlay:true');
});

test('3. Commercial mode disables all 8 debug flags in Unity export', async () => {
  const html = await readExport(EXPORT_UNITY);
  const flags = [
    'debugOverlay', 'debugBlockedState', 'debugMatchReadyMarker', 'debugOutcomeLabel',
    'debugTimerTutorialIdle', 'debugCtaEndCardStore', 'debugAudioEffects',
  ];
  for (const flag of flags) {
    assert.ok(
      !new RegExp(`"${flag}"\\s*:\\s*true`).test(html),
      `Unity export must not have ${flag}:true`
    );
  }
  assert.ok(!/"debugVisible"\s*:\s*true/.test(html), 'Unity export must not have timer.debugVisible:true');
});

test('4. Commercial mode disables all 8 debug flags in AppLovin export', async () => {
  const html = await readExport(EXPORT_APPLOVIN);
  const flags = [
    'debugOverlay', 'debugBlockedState', 'debugMatchReadyMarker', 'debugOutcomeLabel',
    'debugTimerTutorialIdle', 'debugCtaEndCardStore', 'debugAudioEffects',
  ];
  for (const flag of flags) {
    assert.ok(
      !new RegExp(`"${flag}"\\s*:\\s*true`).test(html),
      `AppLovin export must not have ${flag}:true`
    );
  }
  assert.ok(!/"debugVisible"\s*:\s*true/.test(html), 'AppLovin export must not have timer.debugVisible:true');
});

// ─── 3. Candidate/delivery uses commercial mode by default ────────────────────

test('5. export:all produces commercial mode exports by default', async () => {
  const unityHtml = await readExport(EXPORT_UNITY);
  const appLovinHtml = await readExport(EXPORT_APPLOVIN);
  assert.ok(unityHtml.includes('"buildMode":"commercial"'), 'Unity export must use commercial buildMode');
  assert.ok(appLovinHtml.includes('"buildMode":"commercial"'), 'AppLovin export must use commercial buildMode');
});

test('6. Development buildMode in game.config.json does not affect commercial export', async () => {
  const configPath = path.join(PROJECT_ROOT, 'public/config/game.config.json');
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  assert.equal(config.buildMode, 'development', 'source config must be development mode');

  const html = await readExport(EXPORT_UNITY);
  assert.ok(html.includes('"buildMode":"commercial"'), 'export must override to commercial regardless of source config');
  assert.ok(!html.includes('"buildMode":"development"'), 'development mode must not appear in commercial export');
});

// ─── 4. Export config transformation ─────────────────────────────────────────

test('7. createExportConfig sets buildMode to commercial', async () => {
  const { createExportConfig } = await import(toFileUrl(
    path.join(PROJECT_ROOT, 'scripts/export/inliner/single-file-inliner.mjs')
  ));
  const base = {
    buildMode: 'development',
    debugOverlay: true,
    debugBlockedState: true,
    debugMatchReadyMarker: true,
    debugOutcomeLabel: true,
    debugTimerTutorialIdle: true,
    debugCtaEndCardStore: true,
    debugAudioEffects: true,
    timer: { debugVisible: true, durationSeconds: 30, warningSeconds: 5, startOnFirstValidTap: true },
    app: { storeOpenMode: 'record-only', safeDevelopmentNavigation: true },
  };
  const result = createExportConfig(base);
  assert.equal(result.buildMode, 'commercial', 'createExportConfig must set buildMode to commercial');
  assert.equal(result.debugOverlay, false, 'createExportConfig must disable debugOverlay');
  assert.equal(result.debugBlockedState, false, 'createExportConfig must disable debugBlockedState');
  assert.equal(result.debugMatchReadyMarker, false, 'createExportConfig must disable debugMatchReadyMarker');
  assert.equal(result.debugOutcomeLabel, false, 'createExportConfig must disable debugOutcomeLabel');
  assert.equal(result.debugTimerTutorialIdle, false, 'createExportConfig must disable debugTimerTutorialIdle');
  assert.equal(result.debugCtaEndCardStore, false, 'createExportConfig must disable debugCtaEndCardStore');
  assert.equal(result.debugAudioEffects, false, 'createExportConfig must disable debugAudioEffects');
  assert.equal(result.timer.debugVisible, false, 'createExportConfig must disable timer.debugVisible');
  assert.equal(result.app.storeOpenMode, 'navigate', 'createExportConfig must set storeOpenMode to navigate');
});

test('8. Debug flags do not need to be manually set to false for commercial safety', async () => {
  const { createExportConfig } = await import(toFileUrl(
    path.join(PROJECT_ROOT, 'scripts/export/inliner/single-file-inliner.mjs')
  ));
  const base = {
    buildMode: 'development',
    debugOverlay: true,
    debugBlockedState: true,
    debugMatchReadyMarker: true,
    debugOutcomeLabel: true,
    debugTimerTutorialIdle: true,
    debugCtaEndCardStore: true,
    debugAudioEffects: true,
    timer: { debugVisible: true, durationSeconds: 30, warningSeconds: 5, startOnFirstValidTap: true },
    app: { storeOpenMode: 'record-only', safeDevelopmentNavigation: true },
  };
  const result = createExportConfig(base);
  const allFlagsOff = !result.debugOverlay && !result.debugBlockedState && !result.debugMatchReadyMarker
    && !result.debugOutcomeLabel && !result.debugTimerTutorialIdle && !result.debugCtaEndCardStore
    && !result.debugAudioEffects && !result.timer.debugVisible;
  assert.ok(allFlagsOff, 'All debug flags must be off in commercial export regardless of source values');
});

// ─── 5. Commercial export validation ─────────────────────────────────────────

test('9. Commercial export validation fails if debugOverlay is true', async () => {
  const { validateCommercialMode } = await import(toFileUrl(
    path.join(PROJECT_ROOT, 'scripts/export/validators/export-validator.mjs')
  ));
  const fakeProfile = { buildMode: 'commercial', network: 'unity' };
  const fakeHtml = 'window.__GAME_CONFIG__={"buildMode":"commercial","debugOverlay":true}';
  const errors = validateCommercialMode(fakeHtml, fakeProfile);
  assert.ok(errors.some(e => e.includes('debugOverlay')), 'Must reject debugOverlay:true in commercial export');
});

test('10. Commercial export validation fails if buildMode is development', async () => {
  const { validateCommercialMode } = await import(toFileUrl(
    path.join(PROJECT_ROOT, 'scripts/export/validators/export-validator.mjs')
  ));
  const fakeProfile = { buildMode: 'commercial', network: 'unity' };
  const fakeHtml = 'window.__GAME_CONFIG__={"buildMode":"development","debugOverlay":false}';
  const errors = validateCommercialMode(fakeHtml, fakeProfile);
  assert.ok(
    errors.some(e => e.includes('development') || e.includes('buildMode')),
    'Must reject development buildMode in commercial export'
  );
});

test('11. Commercial export validation passes for Unity commercial output', async () => {
  const { validateCommercialMode } = await import(toFileUrl(
    path.join(PROJECT_ROOT, 'scripts/export/validators/export-validator.mjs')
  ));
  const { getExportProfile } = await import(toFileUrl(
    path.join(PROJECT_ROOT, 'scripts/export/profiles/profiles.mjs')
  ));
  const profile = getExportProfile('unity-2026-06');
  const html = await readExport(EXPORT_UNITY);
  const errors = validateCommercialMode(html, profile);
  assert.deepEqual(errors, [], `Unity commercial export must pass validation. Errors: ${errors.join('; ')}`);
});

test('12. Commercial export validation passes for AppLovin commercial output', async () => {
  const { validateCommercialMode } = await import(toFileUrl(
    path.join(PROJECT_ROOT, 'scripts/export/validators/export-validator.mjs')
  ));
  const { getExportProfile } = await import(toFileUrl(
    path.join(PROJECT_ROOT, 'scripts/export/profiles/profiles.mjs')
  ));
  const profile = getExportProfile('applovin-2026-06');
  const html = await readExport(EXPORT_APPLOVIN);
  const errors = validateCommercialMode(html, profile);
  assert.deepEqual(errors, [], `AppLovin commercial export must pass validation. Errors: ${errors.join('; ')}`);
});

// ─── 6. Boot policy ───────────────────────────────────────────────────────────

test('13. AppLovin boot policy has safe no-MRAID fallback', async () => {
  const { createBootPolicyScript } = await import(toFileUrl(
    path.join(PROJECT_ROOT, 'scripts/export/bridge/boot-policy-bridge.mjs')
  ));
  const profile = { network: 'applovin', viewabilityGate: true };
  const script = createBootPolicyScript(profile);
  assert.ok(script.includes('__PLAYABLE_BOOT_POLICY__'), 'Boot policy script must define __PLAYABLE_BOOT_POLICY__');
  assert.ok(script.includes('onReady'), 'Boot policy must expose onReady callback');
  const hasImmediateFallback = script.includes('boot()');
  assert.ok(hasImmediateFallback, 'Boot policy must call boot() as fallback path');
  const handlesMissingMraid = script.includes('typeof window.mraid') || script.includes('!mraid');
  assert.ok(handlesMissingMraid, 'Boot policy must handle missing MRAID');
});

test('14. AppLovin boot policy prevents double boot', async () => {
  const { createBootPolicyScript } = await import(toFileUrl(
    path.join(PROJECT_ROOT, 'scripts/export/bridge/boot-policy-bridge.mjs')
  ));
  const profile = { network: 'applovin', viewabilityGate: true };
  const script = createBootPolicyScript(profile);
  assert.ok(
    script.includes('booted') && (script.includes('if(booted)') || script.includes('if (booted)')),
    'Boot policy must use a one-shot guard to prevent double boot'
  );
});

test('15. Unity export is not forced to depend on MRAID boot policy', async () => {
  const { createBootPolicyScript } = await import(toFileUrl(
    path.join(PROJECT_ROOT, 'scripts/export/bridge/boot-policy-bridge.mjs')
  ));
  const { getExportProfile } = await import(toFileUrl(
    path.join(PROJECT_ROOT, 'scripts/export/profiles/profiles.mjs')
  ));
  const unityProfile = getExportProfile('unity-2026-06');
  assert.equal(unityProfile.viewabilityGate, false, 'Unity profile must not have viewabilityGate: true');
  const script = createBootPolicyScript(unityProfile);
  assert.equal(script, '', 'Unity profile must produce empty boot policy script');
});

// ─── 7. Regression ───────────────────────────────────────────────────────────

test('16. Existing no-window-top / network sanitizer tests still pass', async () => {
  const { hasForbiddenTopWindowAccess } = await import(toFileUrl(
    path.join(PROJECT_ROOT, 'scripts/export/validators/export-validator.mjs')
  ));
  const unityHtml = await readExport(EXPORT_UNITY);
  const appLovinHtml = await readExport(EXPORT_APPLOVIN);
  assert.ok(!hasForbiddenTopWindowAccess(unityHtml), 'Unity export must not have forbidden window.top access');
  assert.ok(!hasForbiddenTopWindowAccess(appLovinHtml), 'AppLovin export must not have forbidden window.top access');
});

test('17. Existing TilePyramid gameplay tests still pass', async () => {
  const registryTestPath = path.join(REPO_ROOT, 'tooling/tests/registry.test.mjs');
  let out = '';
  try {
    const result = await execFileAsync(process.execPath, [
      '--test', registryTestPath,
    ], { env: { ...process.env, WOWWI_REPO_ROOT: REPO_ROOT, WOWWI_REGISTRY_PATH: REGISTRY_PATH } });
    out = result.stdout + result.stderr;
  } catch (err) {
    out = (err.stdout ?? '') + (err.stderr ?? '');
    assert.fail(`Registry tests failed with exit ${err.code}. Output:\n${out.slice(0, 800)}`);
  }
  assert.ok(!out.includes('not ok'), 'Registry tests must not have any TAP "not ok" failures');
});

test('18. BUILD_28_REPORT exists', async () => {
  const text = await readDoc('BUILD_28_REPORT.md');
  assert.ok(text.length > 100, 'BUILD_28_REPORT.md must have content');
  assert.ok(text.includes('BUILD-28'), 'BUILD_28_REPORT must mention BUILD-28');
});

test('19. TILEPYRAMID_COMMERCIAL_MODE_LOCK exists', async () => {
  const text = await readDoc('TILEPYRAMID_COMMERCIAL_MODE_LOCK.md');
  assert.ok(text.length > 100, 'TILEPYRAMID_COMMERCIAL_MODE_LOCK.md must have content');
  assert.ok(
    text.toLowerCase().includes('commercial') && text.toLowerCase().includes('debug'),
    'Commercial mode lock doc must cover commercial and debug modes'
  );
});

test('20. Commercial-ready criteria does not mark TilePyramid as fully commercial-ready', async () => {
  const text = await readDoc('COMMERCIAL_READY_CRITERIA.md');
  assert.ok(text.includes('NOT YET PROVEN'), 'Formal solvability must remain NOT YET PROVEN');
  const registryText = await readFile(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(registryText);
  const entry = registry.projects.find(p => p.projectId === 'TilePyramid_PL01');
  assert.equal(entry.formalSolvability, 'NOT YET PROVEN', 'Registry formal solvability must remain NOT YET PROVEN');
  assert.ok(
    entry.commercialUpgradeStatus !== 'commercial-ready',
    'Registry must not mark TilePyramid as commercial-ready after BUILD-28'
  );
});
