import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  buildAssetAudit,
  classifyExtension,
  parseAuditArgs,
  runAssetAudit,
  validateAssetAudit,
} from '../asset-audit/asset-audit.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(HERE, '..', '..');
const AUDIT_COMMAND = path.join(REPO_ROOT, 'tooling/commands/audit-assets.mjs');
const VALIDATE_COMMAND = path.join(REPO_ROOT, 'tooling/commands/validate-asset-audit.mjs');

async function makeTempProject() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'wowwi-asset-audit-'));
  const project = {
    projectId: 'SamplePlayable_PL01',
    displayName: 'Sample Playable',
    folder: 'projects/SamplePlayable_PL01',
    status: 'development',
  };
  const projectRoot = path.join(root, project.folder);
  await mkdir(path.join(projectRoot, 'input/raw-assets'), { recursive: true });
  await mkdir(path.join(projectRoot, 'input/extracted-assets'), { recursive: true });
  await mkdir(path.join(projectRoot, 'input/references'), { recursive: true });
  await mkdir(path.join(projectRoot, 'input/brief'), { recursive: true });
  await mkdir(path.join(projectRoot, 'docs'), { recursive: true });
  const registryPath = path.join(root, 'registry.json');
  await writeFile(
    registryPath,
    JSON.stringify({ registryVersion: '1', projects: [project] }, null, 2),
    'utf8'
  );
  return { root, project, projectRoot, registryPath };
}

function runNode(script, args, env) {
  return new Promise(resolve => {
    execFile(
      process.execPath,
      [script, ...args],
      { env: { ...process.env, ...env }, timeout: 20_000 },
      (error, stdout, stderr) => {
        resolve({
          code: error ? (typeof error.code === 'number' ? error.code : 1) : 0,
          stdout,
          stderr,
        });
      }
    );
  });
}

test('parseAuditArgs parses --project and --dry-run flags', () => {
  const result = parseAuditArgs(['--project', 'TestProject_PL01', '--dry-run']);
  assert.equal(result.projectId, 'TestProject_PL01');
  assert.equal(result.dryRun, true);
});

test('extension/category classifier recognizes image files', () => {
  assert.deepEqual(classifyExtension('hero.PNG'), { extension: '.png', category: 'image' });
});

test('extension/category classifier recognizes audio files', () => {
  assert.deepEqual(classifyExtension('click.mp3'), { extension: '.mp3', category: 'audio' });
});

test('extension/category classifier recognizes archive files', () => {
  assert.deepEqual(classifyExtension('source.zip'), { extension: '.zip', category: 'archive' });
});

test('extension/category classifier returns unknown for unsupported extension', () => {
  assert.deepEqual(classifyExtension('asset.xyz'), { extension: '.xyz', category: 'unknown' });
});

test('extension/category classifier handles .tar.gz as archive', () => {
  assert.deepEqual(classifyExtension('source.tar.gz'), { extension: '.tar.gz', category: 'archive' });
});

test('extension/category classifier returns (none) for files with no extension', () => {
  assert.deepEqual(classifyExtension('LICENSE'), { extension: '(none)', category: 'unknown' });
});

test('asset audit validator rejects rawAssetsModified: true', async () => {
  const { root, project, projectRoot } = await makeTempProject();
  try {
    await mkdir(path.join(projectRoot, 'docs'), { recursive: true });
    await writeFile(path.join(projectRoot, 'docs/ASSET_AUDIT.md'), '# Asset Audit\n');
    await writeFile(
      path.join(projectRoot, 'docs/asset-audit.json'),
      JSON.stringify({
        projectId: 'SamplePlayable_PL01',
        rawAssetsModified: true,
        scannedFolders: [{ label: 'input/raw-assets', exists: true, fileCount: 0 }],
        totals: { fileCount: 0, totalBytes: 0 },
        categories: {},
        warnings: [],
        recommendations: [],
      })
    );
    const result = await validateAssetAudit({ repoRoot: root, project });
    assert.equal(result.pass, false);
    assert.ok(result.errors.some(error => error.includes('rawAssetsModified')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('scanner ignores system noise files', async () => {
  const { root, project, projectRoot } = await makeTempProject();
  try {
    await writeFile(path.join(projectRoot, 'input/raw-assets/.DS_Store'), 'noise');
    await writeFile(path.join(projectRoot, 'input/raw-assets/Thumbs.db'), 'noise');
    await writeFile(path.join(projectRoot, 'input/raw-assets/icon.png'), Buffer.alloc(10));
    const audit = await buildAssetAudit({ repoRoot: root, project });
    assert.equal(audit.totals.fileCount, 1);
    assert.equal(audit.largestFiles[0].name, 'icon.png');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('scanner counts files and bytes correctly in temp directory', async () => {
  const { root, project, projectRoot } = await makeTempProject();
  try {
    await writeFile(path.join(projectRoot, 'input/raw-assets/a.png'), Buffer.alloc(7));
    await writeFile(path.join(projectRoot, 'input/extracted-assets/b.mp3'), Buffer.alloc(13));
    const audit = await buildAssetAudit({ repoRoot: root, project });
    assert.equal(audit.totals.fileCount, 2);
    assert.equal(audit.totals.totalBytes, 20);
    assert.equal(audit.categories.image.count, 1);
    assert.equal(audit.categories.audio.bytes, 13);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('scanner detects largest files', async () => {
  const { root, project, projectRoot } = await makeTempProject();
  try {
    await writeFile(path.join(projectRoot, 'input/raw-assets/small.png'), Buffer.alloc(3));
    await writeFile(path.join(projectRoot, 'input/raw-assets/large.png'), Buffer.alloc(30));
    const audit = await buildAssetAudit({ repoRoot: root, project });
    assert.equal(audit.largestFiles[0].name, 'large.png');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('scanner detects duplicate filenames', async () => {
  const { root, project, projectRoot } = await makeTempProject();
  try {
    await writeFile(path.join(projectRoot, 'input/raw-assets/logo.png'), Buffer.alloc(3));
    await writeFile(path.join(projectRoot, 'input/references/logo.png'), Buffer.alloc(4));
    const audit = await buildAssetAudit({ repoRoot: root, project });
    assert.equal(audit.duplicateNames.length, 1);
    assert.equal(audit.duplicateNames[0].name, 'logo.png');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('dry-run writes no report files', async () => {
  const { root, project, projectRoot } = await makeTempProject();
  try {
    await writeFile(path.join(projectRoot, 'input/raw-assets/icon.png'), Buffer.alloc(10));
    const result = await runAssetAudit({ repoRoot: root, project, dryRun: true });
    assert.equal(result.written, false);
    await assert.rejects(readFile(path.join(projectRoot, 'docs/ASSET_AUDIT.md'), 'utf8'));
    await assert.rejects(readFile(path.join(projectRoot, 'docs/asset-audit.json'), 'utf8'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('non-dry-run writes ASSET_AUDIT.md and asset-audit.json', async () => {
  const { root, project, projectRoot } = await makeTempProject();
  try {
    await writeFile(path.join(projectRoot, 'input/raw-assets/icon.png'), Buffer.alloc(10));
    const result = await runAssetAudit({ repoRoot: root, project, dryRun: false });
    assert.equal(result.written, true);
    assert.ok((await readFile(path.join(projectRoot, 'docs/ASSET_AUDIT.md'), 'utf8')).includes('Asset Audit'));
    const json = JSON.parse(await readFile(path.join(projectRoot, 'docs/asset-audit.json'), 'utf8'));
    assert.equal(json.rawAssetsModified, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('asset audit validator rejects missing asset-audit.json', async () => {
  const { root, project } = await makeTempProject();
  try {
    const result = await validateAssetAudit({ repoRoot: root, project });
    assert.equal(result.pass, false);
    assert.ok(result.errors.some(error => error.includes('asset-audit.json')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('asset audit validator rejects mismatched projectId', async () => {
  const { root, project, projectRoot } = await makeTempProject();
  try {
    await mkdir(path.join(projectRoot, 'docs'), { recursive: true });
    await writeFile(path.join(projectRoot, 'docs/ASSET_AUDIT.md'), '# Asset Audit\n');
    await writeFile(
      path.join(projectRoot, 'docs/asset-audit.json'),
      JSON.stringify({
        projectId: 'WrongProject',
        rawAssetsModified: false,
        scannedFolders: [],
        totals: { fileCount: 0, totalBytes: 0 },
        categories: {},
        warnings: [],
        recommendations: [],
      })
    );
    const result = await validateAssetAudit({ repoRoot: root, project });
    assert.equal(result.pass, false);
    assert.ok(result.errors.some(error => error.includes('projectId mismatch')));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('asset audit CLI dry-run writes no files', async () => {
  const { root, registryPath, projectRoot } = await makeTempProject();
  try {
    await writeFile(path.join(projectRoot, 'input/raw-assets/icon.png'), Buffer.alloc(10));
    const result = await runNode(AUDIT_COMMAND, ['--project', 'SamplePlayable_PL01', '--dry-run'], {
      WOWWI_REPO_ROOT: root,
      WOWWI_REGISTRY_PATH: registryPath,
    });
    assert.equal(result.code, 0, result.stderr || result.stdout);
    assert.match(result.stdout, /Dry run only/);
    await assert.rejects(readFile(path.join(projectRoot, 'docs/asset-audit.json'), 'utf8'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('asset audit CLI writes reports and validation CLI passes', async () => {
  const { root, registryPath, projectRoot } = await makeTempProject();
  try {
    await writeFile(path.join(projectRoot, 'input/raw-assets/icon.png'), Buffer.alloc(10));
    const audit = await runNode(AUDIT_COMMAND, ['--project', 'SamplePlayable_PL01'], {
      WOWWI_REPO_ROOT: root,
      WOWWI_REGISTRY_PATH: registryPath,
    });
    assert.equal(audit.code, 0, audit.stderr || audit.stdout);
    const validation = await runNode(VALIDATE_COMMAND, ['--project', 'SamplePlayable_PL01'], {
      WOWWI_REPO_ROOT: root,
      WOWWI_REGISTRY_PATH: registryPath,
    });
    assert.equal(validation.code, 0, validation.stderr || validation.stdout);
    assert.match(validation.stdout, /PASS/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

