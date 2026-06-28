// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  ANDROID_STORE_URL,
  DELIVERY_DISCLAIMER,
  FORMAL_SOLVABILITY,
  IOS_STORE_URL,
  sha256File,
  validateDeliveryPackage,
} from '../../scripts/package/delivery-utils.mjs';

describe('Build-13 delivery package utilities', () => {
  it('delivery package manifest includes Unity HTML path', async () => {
    const fixture = await createDeliveryFixture();
    const manifest = JSON.parse(
      await readFile(path.join(fixture.root, 'delivery-manifest.json'), 'utf8')
    );
    expect(manifest.outputs.unity.path).toMatch(/unity\/.*\.html$/);
    await fixture.dispose();
  });

  it('delivery package manifest includes AppLovin HTML path', async () => {
    const fixture = await createDeliveryFixture();
    const manifest = JSON.parse(
      await readFile(path.join(fixture.root, 'delivery-manifest.json'), 'utf8')
    );
    expect(manifest.outputs.applovin.path).toMatch(/applovin\/.*\.html$/);
    await fixture.dispose();
  });

  it('delivery package manifest includes SHA256 checksums', async () => {
    const fixture = await createDeliveryFixture();
    const manifest = JSON.parse(
      await readFile(path.join(fixture.root, 'delivery-manifest.json'), 'utf8')
    );
    expect(manifest.outputs.unity.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(manifest.outputs.applovin.sha256).toMatch(/^[0-9a-f]{64}$/);
    await fixture.dispose();
  });

  it('validates a complete delivery package', async () => {
    const fixture = await createDeliveryFixture();
    const validation = await validateDeliveryPackage(fixture.root);
    expect(validation.status).toBe('PASS');
    await fixture.dispose();
  });

  it('delivery package validation rejects missing Unity HTML', async () => {
    const fixture = await createDeliveryFixture({ unityHtml: false });
    const validation = await validateDeliveryPackage(fixture.root);
    expect(validation.status).toBe('FAIL');
    expect(validation.errors.join('\n')).toMatch(/Unity HTML is missing/);
    await fixture.dispose();
  });

  it('delivery package validation rejects missing AppLovin HTML', async () => {
    const fixture = await createDeliveryFixture({ applovinHtml: false });
    const validation = await validateDeliveryPackage(fixture.root);
    expect(validation.status).toBe('FAIL');
    expect(validation.errors.join('\n')).toMatch(/AppLovin HTML is missing/);
    await fixture.dispose();
  });

  it('delivery package validation rejects checksum mismatch', async () => {
    const fixture = await createDeliveryFixture({ tamperManifestSha: true });
    const validation = await validateDeliveryPackage(fixture.root);
    expect(validation.status).toBe('FAIL');
    expect(validation.errors.join('\n')).toMatch(/SHA256/);
    await fixture.dispose();
  });

  it('delivery package validation rejects forbidden window.top', async () => {
    const fixture = await createDeliveryFixture({
      html: createDeliveryHtml({
        androidUrl: ANDROID_STORE_URL,
        iosUrl: IOS_STORE_URL,
        fallbackUrl: ANDROID_STORE_URL,
      }).replace('</body>', '<script>window.top.location.href="about:blank";</script></body>'),
    });
    const validation = await validateDeliveryPackage(fixture.root);
    expect(validation.status).toBe('FAIL');
    expect(validation.errors.join('\n')).toMatch(/Forbidden top-window access detected: window\.top/);
    await fixture.dispose();
  });

  it('delivery package validation verifies store URL metadata', async () => {
    const fixture = await createDeliveryFixture({
      html: createDeliveryHtml({
        iosUrl: IOS_STORE_URL,
        fallbackUrl: ANDROID_STORE_URL,
      }),
    });
    const validation = await validateDeliveryPackage(fixture.root);
    expect(validation.status).toBe('FAIL');
    expect(validation.errors.join('\n')).toMatch(/Android store URL metadata/);
    await fixture.dispose();
  });

  it('delivery package validation records network QA evidence', async () => {
    const fixture = await createDeliveryFixture({ networkQaEvidence: null });
    const validation = await validateDeliveryPackage(fixture.root);
    expect(validation.status).toBe('FAIL');
    expect(validation.errors.join('\n')).toMatch(/Network QA evidence is missing/);
    await fixture.dispose();
  });

  it('delivery package validation records formal solvability as NOT YET PROVEN', async () => {
    const fixture = await createDeliveryFixture({ formalSolvability: 'PROVEN' });
    const validation = await validateDeliveryPackage(fixture.root);
    expect(validation.status).toBe('FAIL');
    expect(validation.errors.join('\n')).toMatch(/Formal solvability/);
    await fixture.dispose();
  });
});

async function createDeliveryFixture(options = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tilepyramid-delivery-'));
  await mkdir(path.join(root, 'unity'), { recursive: true });
  await mkdir(path.join(root, 'applovin'), { recursive: true });

  const html =
    options.html ??
    createDeliveryHtml({
      androidUrl: ANDROID_STORE_URL,
      iosUrl: IOS_STORE_URL,
      fallbackUrl: ANDROID_STORE_URL,
    });

  const unityPath = path.join(root, 'unity/TilePyramid_PL01_unity.html');
  const applovinPath = path.join(root, 'applovin/TilePyramid_PL01_applovin.html');
  if (options.unityHtml !== false) await writeFile(unityPath, html);
  if (options.applovinHtml !== false) await writeFile(applovinPath, html);

  const unitySha = options.unityHtml === false ? 'missing' : await sha256File(unityPath);
  const applovinSha = options.applovinHtml === false ? 'missing' : await sha256File(applovinPath);

  const unityShaInManifest = options.tamperManifestSha
    ? unitySha.replace(/^.{8}/, 'aaaaaaaa')
    : unitySha;

  const defaultNetworkQaEvidence = {
    unity: {
      status: 'PASSED_UPLOAD_TESTING',
      disclaimer:
        'Passed current Unity upload/testing after BUILD-12 window.top fix. Not guaranteed forever.',
    },
    applovin: {
      status: 'PASSED_UPLOAD_TESTING',
      disclaimer:
        'Passed current AppLovin upload/testing after BUILD-12 window.top fix. Not guaranteed forever.',
    },
  };

  const manifest = {
    projectId: 'TilePyramid_PL01',
    build: 'BUILD-13',
    deliveryType: 'final-candidate-lock',
    storeUrls: {
      androidUrl: ANDROID_STORE_URL,
      iosUrl: IOS_STORE_URL,
      fallbackUrl: ANDROID_STORE_URL,
    },
    outputs: {
      unity: {
        path: 'unity/TilePyramid_PL01_unity.html',
        sizeBytes: Buffer.byteLength(html),
        sha256: unityShaInManifest,
      },
      applovin: {
        path: 'applovin/TilePyramid_PL01_applovin.html',
        sizeBytes: Buffer.byteLength(html),
        sha256: applovinSha,
      },
    },
    networkQaEvidence:
      options.networkQaEvidence !== undefined
        ? options.networkQaEvidence
        : defaultNetworkQaEvidence,
    formalSolvability: options.formalSolvability ?? FORMAL_SOLVABILITY,
    deliveryDisclaimer: options.deliveryDisclaimer ?? DELIVERY_DISCLAIMER,
  };

  await writeFile(path.join(root, 'delivery-manifest.json'), JSON.stringify(manifest, null, 2));
  await writeFile(
    path.join(root, 'checksums.sha256'),
    `${unitySha}  unity/TilePyramid_PL01_unity.html\n${applovinSha}  applovin/TilePyramid_PL01_applovin.html\n`
  );
  await writeFile(path.join(root, 'QA_EVIDENCE.md'), 'QA evidence content');
  await writeFile(path.join(root, 'RELEASE_NOTES.md'), 'Release notes content');
  await writeFile(path.join(root, 'DELIVERY_README.md'), 'Delivery readme content');
  await writeFile(path.join(root, 'unity/UPLOAD_NOTES_UNITY.md'), 'Unity notes');
  await writeFile(path.join(root, 'applovin/UPLOAD_NOTES_APPLOVIN.md'), 'AppLovin notes');

  return {
    root,
    dispose: () => rm(root, { recursive: true, force: true }),
  };
}

function createDeliveryHtml(storeUrls) {
  const metadata = {
    androidStoreUrl: storeUrls.androidUrl,
    iosStoreUrl: storeUrls.iosUrl,
    fallbackStoreUrl: storeUrls.fallbackUrl,
    storeUrls: {
      androidUrl: storeUrls.androidUrl,
      iosUrl: storeUrls.iosUrl,
      fallbackUrl: storeUrls.fallbackUrl,
    },
    formalSolvability: FORMAL_SOLVABILITY,
  };
  return `<html><head><script>window.__PLAYABLE_NETWORK__=${JSON.stringify(metadata)};</script></head><body>${FORMAL_SOLVABILITY}</body></html>`;
}
