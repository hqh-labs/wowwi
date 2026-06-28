// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  getExportProfile,
  listExportProfiles,
} from '../../scripts/export/profiles/profiles.mjs';
import {
  inlineSingleFileHtml,
} from '../../scripts/export/inliner/single-file-inliner.mjs';
import {
  hasExternalHttpAssetReference,
  hasLocalRuntimeAssetReference,
  hasSourceMapReference,
  hasUninlinedJsOrCssReference,
  hasUnresolvedPlaceholder,
  hasForbiddenTopWindowAccess,
  validateExportHtml,
} from '../../scripts/export/validators/export-validator.mjs';
import { createNetworkExportMetadata } from '../../scripts/export/adapters/network-adapters.mjs';
import { createStoreOpenBridgeScript } from '../../scripts/export/bridge/store-open-bridge.mjs';

const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.skl.pyramid.quest.match3.tile.puzzle.games';
const IOS_URL = 'https://apps.apple.com/us/app/tile-pyramid-match-quest/id6755671033';

describe('Build-09 export profiles', () => {
  it('loads Unity profile', () => {
    const profile = getExportProfile('unity-2026-06');
    expect(profile.network).toBe('unity');
    expect(profile.targetMaxBytes).toBe(5 * 1024 * 1024);
  });

  it('loads AppLovin profile', () => {
    const profile = getExportProfile('applovin-2026-06');
    expect(profile.network).toBe('applovin');
    expect(profile.externalHttpResourcesAllowed).toBe(false);
  });

  it('rejects an invalid profile', () => {
    expect(() => getExportProfile('missing-profile')).toThrow(/Unknown export profile/);
  });

  it('batch profile list includes both networks', () => {
    expect(listExportProfiles().map(profile => profile.network).sort()).toEqual(['applovin', 'unity']);
  });

  it('records BUILD-10 compliance metadata in profiles', () => {
    const profile = getExportProfile('unity-2026-06');
    expect(profile.requiresNoExternalResources).toBe(true);
    expect(profile.networkProvidedMraid).toBe(true);
    expect(profile.hostCloseButtonSafeZone.corner).toBe('top-right');
    expect(profile.finalApprovalDisclaimer).toMatch(/does not guarantee final Unity Ads approval/);
  });
});

describe('Build-09 single-file inliner', () => {
  it('removes Vite JS file references', async () => {
    const fixture = await createInlinerFixture();
    const profile = getExportProfile('unity-2026-06');
    const result = await inlineSingleFileHtml({ ...fixture, profile, generatedAt: '2026-06-27T00:00:00.000Z' });
    expect(result.html).not.toContain('./assets/index-test.js');
    expect(result.html).toContain('console.log("inline app");');
    await fixture.dispose();
  });

  it('inlines runtime images', async () => {
    const fixture = await createInlinerFixture();
    const profile = getExportProfile('unity-2026-06');
    const result = await inlineSingleFileHtml({ ...fixture, profile, generatedAt: '2026-06-27T00:00:00.000Z' });
    expect(result.html).toContain('data:image/webp;base64,');
    expect(result.inlinedAssets.some(asset => asset.type === 'image')).toBe(true);
    await fixture.dispose();
  });

  it('inlines runtime audio', async () => {
    const fixture = await createInlinerFixture();
    const profile = getExportProfile('applovin-2026-06');
    const result = await inlineSingleFileHtml({ ...fixture, profile, generatedAt: '2026-06-27T00:00:00.000Z' });
    expect(result.html).toContain('data:audio/mpeg;base64,');
    expect(result.inlinedAssets.some(asset => asset.type === 'audio')).toBe(true);
    await fixture.dispose();
  });

  it('injects the store-open bridge', async () => {
    const fixture = await createInlinerFixture();
    const profile = getExportProfile('unity-2026-06');
    const result = await inlineSingleFileHtml({ ...fixture, profile, generatedAt: '2026-06-27T00:00:00.000Z' });
    expect(result.html).toContain('__PLAYABLE_STORE_OPEN__');
    expect(result.html).toContain('__PLAYABLE_NETWORK__');
    await fixture.dispose();
  });

  it('injects hardened bridge diagnostics and QA mode handling', () => {
    const script = createStoreOpenBridgeScript(getExportProfile('unity-2026-06'), '2026-06-28T00:00:00.000Z');
    expect(script).toContain('__PLAYABLE_STORE_OPEN_DIAGNOSTICS__');
    expect(script).toContain('__PLAYABLE_QA_MODE__');
    expect(script).toContain('getState');
    expect(script).toContain("addEventListener('ready'");
    expect(script).toContain('mraid.open');
    expect(script).toContain('record-only');
    expect(script).not.toContain('window.top');
    expect(script).not.toContain('top.location');
  });

  it('store-open bridge fallback stays on the current window', () => {
    const script = createStoreOpenBridgeScript(getExportProfile('applovin-2026-06'), '2026-06-28T00:00:00.000Z');
    expect(script).toContain("window.open(url, '_blank', 'noopener')");
    expect(script).toContain('window.location.href=url');
    expect(hasForbiddenTopWindowAccess(script)).toBe(false);
  });

  it('injects configured store URLs into export metadata', async () => {
    const fixture = await createInlinerFixture();
    const profile = getExportProfile('applovin-2026-06');
    const result = await inlineSingleFileHtml({ ...fixture, profile, generatedAt: '2026-06-28T00:00:00.000Z' });
    expect(result.html).toContain(ANDROID_URL);
    expect(result.html).toContain(IOS_URL);
    expect(result.exportConfig.app.androidUrl).toBe(ANDROID_URL);
    await fixture.dispose();
  });

  it('Unity exported metadata contains Android and iOS store URLs', async () => {
    const fixture = await createInlinerFixture();
    const profile = getExportProfile('unity-2026-06');
    const result = await inlineSingleFileHtml({ ...fixture, profile, generatedAt: '2026-06-28T00:00:00.000Z' });
    const metadata = extractPlayableNetworkMetadata(result.html);
    expect(metadata.androidStoreUrl).toBe(ANDROID_URL);
    expect(metadata.iosStoreUrl).toBe(IOS_URL);
    expect(metadata.fallbackStoreUrl).toBe(ANDROID_URL);
    expect(metadata.storeUrls.androidUrl).toBe(ANDROID_URL);
    expect(metadata.storeUrls.iosUrl).toBe(IOS_URL);
    await fixture.dispose();
  });

  it('AppLovin exported metadata contains Android and iOS store URLs', async () => {
    const fixture = await createInlinerFixture();
    const profile = getExportProfile('applovin-2026-06');
    const result = await inlineSingleFileHtml({ ...fixture, profile, generatedAt: '2026-06-28T00:00:00.000Z' });
    const metadata = extractPlayableNetworkMetadata(result.html);
    expect(metadata.androidStoreUrl).toBe(ANDROID_URL);
    expect(metadata.iosStoreUrl).toBe(IOS_URL);
    expect(metadata.fallbackStoreUrl).toBe(ANDROID_URL);
    expect(metadata.storeUrls.androidUrl).toBe(ANDROID_URL);
    expect(metadata.storeUrls.iosUrl).toBe(IOS_URL);
    await fixture.dispose();
  });
});

describe('Build-09 export validation', () => {
  it('rejects external HTTP/HTTPS asset references', () => {
    const html = '<html><head><script src="https://cdn.example.com/app.js"></script></head></html>';
    expect(hasExternalHttpAssetReference(html)).toBe(true);
    const result = validateExportHtml({ html, profile: getExportProfile('unity-2026-06'), filePath: 'x.html' });
    expect(result.status).toBe('FAIL');
  });

  it('rejects local asset references in exported HTML', () => {
    const html = '<html><head><script src="./assets/index.js"></script></head></html>';
    expect(hasLocalRuntimeAssetReference(html)).toBe(true);
    const result = validateExportHtml({ html, profile: getExportProfile('applovin-2026-06'), filePath: 'x.html' });
    expect(result.errors.join('\n')).toMatch(/local runtime/);
  });

  it('accepts permitted MRAID bootstrap only when profile allows it', () => {
    const html = validHtmlForProfile('unity-2026-06').replace('</head>', '<script src="mraid.js"></script></head>');
    expect(validateExportHtml({ html, profile: getExportProfile('unity-2026-06'), filePath: 'x.html' }).status).toBe('FAIL');
    expect(validateExportHtml({ html, profile: getExportProfile('applovin-2026-06'), filePath: 'x.html' }).status).toBe('FAIL');
  });

  it('rejects source map references', () => {
    const html = `${validHtmlForProfile('unity-2026-06')}<!--# sourceMappingURL=app.js.map -->`;
    expect(hasSourceMapReference(html)).toBe(true);
    expect(validateExportHtml({ html, profile: getExportProfile('unity-2026-06'), filePath: 'x.html' }).status).toBe('FAIL');
  });

  it('rejects un-inlined JS and CSS references', () => {
    const html = validHtmlForProfile('unity-2026-06').replace('</head>', '<link rel="stylesheet" href="style.css"></head>');
    expect(hasUninlinedJsOrCssReference(html)).toBe(true);
    expect(validateExportHtml({ html, profile: getExportProfile('unity-2026-06'), filePath: 'x.html' }).status).toBe('FAIL');
  });

  it('rejects unresolved export placeholders', () => {
    const html = `${validHtmlForProfile('applovin-2026-06')}{{STORE_URL}}`;
    expect(hasUnresolvedPlaceholder(html)).toBe(true);
    expect(validateExportHtml({ html, profile: getExportProfile('applovin-2026-06'), filePath: 'x.html' }).status).toBe('FAIL');
  });

  it('rejects forbidden top-window access', () => {
    const html = validHtmlForProfile('unity-2026-06').replace(
      '</head>',
      '<script>window.top.addEventListener("click", function(){});</script></head>'
    );
    expect(hasForbiddenTopWindowAccess(html)).toBe(true);
    const result = validateExportHtml({ html, profile: getExportProfile('unity-2026-06'), filePath: 'x.html' });
    expect(result.status).toBe('FAIL');
    expect(result.errors.join('\n')).toMatch(/Forbidden top-window access detected: window\.top/);
  });

  it('Unity export report includes target max bytes and actual bytes', () => {
    const profile = getExportProfile('unity-2026-06');
    const validation = validateExportHtml({ html: validHtmlForProfile(profile.id), profile, filePath: 'unity.html' });
    const report = createNetworkExportMetadata(profile, validation, []);
    expect(report.targetMaxBytes).toBe(profile.targetMaxBytes);
    expect(report.actualBytes).toBeGreaterThan(0);
  });

  it('AppLovin export report includes target max bytes and actual bytes', () => {
    const profile = getExportProfile('applovin-2026-06');
    const validation = validateExportHtml({ html: validHtmlForProfile(profile.id), profile, filePath: 'applovin.html' });
    const report = createNetworkExportMetadata(profile, validation, []);
    expect(report.targetMaxBytes).toBe(profile.targetMaxBytes);
    expect(report.actualBytes).toBeGreaterThan(0);
  });

  it('accepts output under the profile target size', () => {
    const profile = getExportProfile('applovin-2026-06');
    const result = validateExportHtml({ html: validHtmlForProfile(profile.id), profile, filePath: 'x.html' });
    expect(result.checks.underTargetMaxBytes).toBe(true);
  });

  it('keeps formal solvability NOT YET PROVEN in report', () => {
    const profile = getExportProfile('unity-2026-06');
    const validation = validateExportHtml({ html: validHtmlForProfile(profile.id), profile, filePath: 'unity.html' });
    const report = createNetworkExportMetadata(profile, validation, []);
    expect(report.formalSolvability).toBe('NOT YET PROVEN');
  });

  it('export metadata includes both store URLs', () => {
    const profile = getExportProfile('unity-2026-06');
    const validation = validateExportHtml({ html: validHtmlForProfile(profile.id), profile, filePath: 'unity.html' });
    const report = createNetworkExportMetadata(profile, validation, [], {
      androidUrl: ANDROID_URL,
      iosUrl: IOS_URL,
      fallbackUrl: ANDROID_URL,
    });
    expect(report.storeUrls.androidUrl).toBe(ANDROID_URL);
    expect(report.storeUrls.iosUrl).toBe(IOS_URL);
    expect(report.androidStoreUrl).toBe(ANDROID_URL);
    expect(report.iosStoreUrl).toBe(IOS_URL);
  });
});

async function createInlinerFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tilepyramid-export-'));
  const distDir = path.join(root, 'dist');
  const publicDir = path.join(root, 'public');
  await mkdir(path.join(distDir, 'assets'), { recursive: true });
  await mkdir(path.join(publicDir, 'config'), { recursive: true });
  await mkdir(path.join(publicDir, 'assets/images'), { recursive: true });
  await mkdir(path.join(publicDir, 'assets/audio'), { recursive: true });
  await mkdir(path.join(publicDir, 'assets/levels'), { recursive: true });

  await writeFile(
    path.join(distDir, 'index.html'),
    '<html><head><script type="module" src="./assets/index-test.js"></script><script>window.__GAME_CONFIG__={};window.__ASSET_MANIFEST__={};</script></head><body></body></html>'
  );
  await writeFile(path.join(distDir, 'assets/index-test.js'), 'console.log("inline app");');
  await writeFile(path.join(publicDir, 'config/game.config.json'), JSON.stringify({
    app: {
      storeOpenMode: 'record-only',
      safeDevelopmentNavigation: true,
      fallbackUrl: ANDROID_URL,
      androidUrl: ANDROID_URL,
      iosUrl: IOS_URL,
    },
  }));
  await writeFile(path.join(publicDir, 'config/asset-manifest.json'), JSON.stringify({
    version: '1',
    assets: [
      { id: 'Background_1', type: 'image', path: './assets/images/bg.webp', source: 'fixture' },
      { id: 'Sfx_Click', type: 'audio', path: './assets/audio/click.mp3', source: 'fixture' },
      { id: 'Level_21', type: 'json', path: './assets/levels/Level_21.json', source: 'fixture' },
    ],
  }));
  await writeFile(path.join(publicDir, 'assets/images/bg.webp'), Buffer.from([1, 2, 3]));
  await writeFile(path.join(publicDir, 'assets/audio/click.mp3'), Buffer.from([4, 5, 6]));
  await writeFile(path.join(publicDir, 'assets/levels/Level_21.json'), '{"layers":[]}');

  return {
    distDir,
    publicDir,
    dispose: () => rm(root, { recursive: true, force: true }),
  };
}

function validHtmlForProfile(profileId: string) {
  const profile = getExportProfile(profileId);
  return `<html><head>
    <meta name="playable-orientation-policy" content="portrait-gameplay-centered-in-landscape">
    <meta name="playable-timer-first-interaction" content="true">
    <script>window.__PLAYABLE_NETWORK__={profileId:"${profileId}",formalSolvability:"NOT YET PROVEN",networkProvidedMraid:${profile.networkProvidedMraid},hostCloseButtonSafeZone:{corner:"top-right"},safeAreaPolicy:"${profile.safeAreaPolicy}",domOverlayPolicy:"${profile.domOverlayPolicy}",finalApprovalDisclaimer:"${profile.finalApprovalDisclaimer}"};window.__PLAYABLE_STORE_OPEN_DIAGNOSTICS__={};window.__PLAYABLE_STORE_OPEN__=function(){return {handled:true,method:"mraid.open"};};</script>
  </head><body>NOT YET PROVEN</body></html>`;
}

function extractPlayableNetworkMetadata(html: string) {
  const match = html.match(/window\.__PLAYABLE_NETWORK__\s*=\s*({[\s\S]*?})\s*;/);
  if (!match) throw new Error('Missing playable network metadata');
  return JSON.parse(match[1]);
}
