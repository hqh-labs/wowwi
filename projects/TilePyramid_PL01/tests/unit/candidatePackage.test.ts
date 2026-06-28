// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  ANDROID_STORE_URL,
  FINAL_APPROVAL_DISCLAIMER,
  FORMAL_SOLVABILITY,
  IOS_STORE_URL,
  sha256Buffer,
  sha256File,
  validateCandidatePackage,
} from '../../scripts/package/candidate-utils.mjs';

describe('Build-11 candidate package utilities', () => {
  it('generates deterministic SHA256 checksums', () => {
    expect(sha256Buffer(Buffer.from('tile-pyramid'))).toBe(sha256Buffer(Buffer.from('tile-pyramid')));
  });

  it('validates a complete candidate package manifest with store URLs', async () => {
    const fixture = await createCandidateFixture();
    const validation = await validateCandidatePackage(fixture.root);
    expect(validation.status).toBe('PASS');
    await fixture.dispose();
  });

  it('passes when store URLs exist in export metadata', async () => {
    const fixture = await createCandidateFixture({
      html: createCandidateHtml({
        androidUrl: ANDROID_STORE_URL,
        iosUrl: IOS_STORE_URL,
        fallbackUrl: ANDROID_STORE_URL,
      }),
    });
    const validation = await validateCandidatePackage(fixture.root);
    expect(validation.status).toBe('PASS');
    await fixture.dispose();
  });

  it('rejects missing Android store URL metadata', async () => {
    const fixture = await createCandidateFixture({
      html: createCandidateHtml({
        iosUrl: IOS_STORE_URL,
        fallbackUrl: ANDROID_STORE_URL,
      }),
    });
    const validation = await validateCandidatePackage(fixture.root);
    expect(validation.status).toBe('FAIL');
    expect(validation.errors.join('\n')).toMatch(/Android store URL metadata/);
    await fixture.dispose();
  });

  it('rejects missing iOS store URL metadata', async () => {
    const fixture = await createCandidateFixture({
      html: createCandidateHtml({
        androidUrl: ANDROID_STORE_URL,
        fallbackUrl: ANDROID_STORE_URL,
      }),
    });
    const validation = await validateCandidatePackage(fixture.root);
    expect(validation.status).toBe('FAIL');
    expect(validation.errors.join('\n')).toMatch(/iOS store URL metadata/);
    await fixture.dispose();
  });

  it('rejects forbidden top-window access in candidate HTML', async () => {
    const fixture = await createCandidateFixture({
      html: createCandidateHtml({
        androidUrl: ANDROID_STORE_URL,
        iosUrl: IOS_STORE_URL,
        fallbackUrl: ANDROID_STORE_URL,
      }).replace('</body>', '<script>window.top.location.href="about:blank";</script></body>'),
    });
    const validation = await validateCandidatePackage(fixture.root);
    expect(validation.status).toBe('FAIL');
    expect(validation.errors.join('\n')).toMatch(/Forbidden top-window access detected: window\.top/);
    await fixture.dispose();
  });

  it('rejects missing Unity HTML', async () => {
    const fixture = await createCandidateFixture({ unityHtml: false });
    const validation = await validateCandidatePackage(fixture.root);
    expect(validation.status).toBe('FAIL');
    expect(validation.errors.join('\n')).toMatch(/Unity HTML is missing/);
    await fixture.dispose();
  });

  it('rejects missing AppLovin HTML', async () => {
    const fixture = await createCandidateFixture({ applovinHtml: false });
    const validation = await validateCandidatePackage(fixture.root);
    expect(validation.status).toBe('FAIL');
    expect(validation.errors.join('\n')).toMatch(/AppLovin HTML is missing/);
    await fixture.dispose();
  });

  it('rejects missing checksum file', async () => {
    const fixture = await createCandidateFixture({ checksums: false });
    const validation = await validateCandidatePackage(fixture.root);
    expect(validation.status).toBe('FAIL');
    expect(validation.errors.join('\n')).toMatch(/Checksum file is missing/);
    await fixture.dispose();
  });

  it('rejects forbidden raw or source folders', async () => {
    const fixture = await createCandidateFixture({ forbiddenFolder: true });
    const validation = await validateCandidatePackage(fixture.root);
    expect(validation.status).toBe('FAIL');
    expect(validation.errors.join('\n')).toMatch(/Forbidden package path/);
    await fixture.dispose();
  });

  it('requires formal solvability to remain NOT YET PROVEN', async () => {
    const fixture = await createCandidateFixture({ formalSolvability: 'PROVEN' });
    const validation = await validateCandidatePackage(fixture.root);
    expect(validation.status).toBe('FAIL');
    expect(validation.errors.join('\n')).toMatch(/Formal solvability/);
    await fixture.dispose();
  });

  it('requires final approval disclaimer', async () => {
    const fixture = await createCandidateFixture({ finalApprovalDisclaimer: '' });
    const validation = await validateCandidatePackage(fixture.root);
    expect(validation.status).toBe('FAIL');
    expect(validation.errors.join('\n')).toMatch(/Final approval disclaimer/);
    await fixture.dispose();
  });
});

async function createCandidateFixture(options = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tilepyramid-candidate-'));
  await mkdir(path.join(root, 'unity'), { recursive: true });
  await mkdir(path.join(root, 'applovin'), { recursive: true });

  const html =
    options.html ??
    createCandidateHtml({
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
  const manifest = {
    projectId: 'TilePyramid_PL01',
    build: 'BUILD-21',
    candidateType: 'polished-candidate-reupload',
    polishedRuntimeBuild: 'BUILD-20',
    storeUrls: {
      androidUrl: ANDROID_STORE_URL,
      iosUrl: IOS_STORE_URL,
      fallbackUrl: ANDROID_STORE_URL,
    },
    outputs: {
      unity: {
        path: 'unity/TilePyramid_PL01_unity.html',
        sizeBytes: Buffer.byteLength(html),
        sha256: unitySha,
      },
      applovin: {
        path: 'applovin/TilePyramid_PL01_applovin.html',
        sizeBytes: Buffer.byteLength(html),
        sha256: applovinSha,
      },
    },
    formalSolvability: options.formalSolvability ?? FORMAL_SOLVABILITY,
    finalApprovalDisclaimer: options.finalApprovalDisclaimer ?? FINAL_APPROVAL_DISCLAIMER,
  };
  await writeFile(path.join(root, 'package-manifest.json'), JSON.stringify(manifest, null, 2));
  if (options.checksums !== false) {
    await writeFile(
      path.join(root, 'checksums.sha256'),
      `${unitySha}  unity/TilePyramid_PL01_unity.html\n${applovinSha}  applovin/TilePyramid_PL01_applovin.html\n`
    );
  }
  await writeFile(path.join(root, 'QA_SUMMARY.md'), 'QA summary');
  await writeFile(path.join(root, 'unity/UPLOAD_NOTES_UNITY.md'), 'Unity notes');
  await writeFile(path.join(root, 'applovin/UPLOAD_NOTES_APPLOVIN.md'), 'AppLovin notes');
  if (options.forbiddenFolder) {
    await mkdir(path.join(root, 'src'), { recursive: true });
    await writeFile(path.join(root, 'src/source.ts'), 'forbidden');
  }

  return {
    root,
    dispose: () => rm(root, { recursive: true, force: true }),
  };
}

function createCandidateHtml(storeUrls) {
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
