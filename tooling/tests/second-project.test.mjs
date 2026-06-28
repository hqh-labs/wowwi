/**
 * Tests for SecondPlayable_PL01 — BUILD-25 intake (tests 1–14)
 * and BUILD-26 gitkeep hotfix (tests 15–22).
 */

import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createPlayableProject, copyTemplateForTests } from '../project-creation/create-playable-project.mjs';
import { runAssetAudit } from '../asset-audit/asset-audit.mjs';

const execFileAsync = promisify(execFile);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = process.env.WOWWI_REPO_ROOT ?? path.join(HERE, '..', '..');
const REGISTRY_PATH = process.env.WOWWI_REGISTRY_PATH ?? path.join(REPO_ROOT, 'tooling/project-registry/projects.json');
const TEMPLATE_ROOT = path.join(REPO_ROOT, 'tooling/templates/playable-project');
const PROJECT_ID = 'SecondPlayable_PL01';
const PROJECT_FOLDER = `projects/${PROJECT_ID}`;

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

// ─── BUILD-25: registry and project structure ─────────────────────────────────

test('1. SecondPlayable_PL01 is registered in the registry', async () => {
  const text = await readFile(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(text);
  const entry = registry.projects.find(p => p.projectId === PROJECT_ID);
  assert.ok(entry, `${PROJECT_ID} must be in projects.json`);
});

test('2. SecondPlayable_PL01 registry entry has status development', async () => {
  const text = await readFile(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(text);
  const entry = registry.projects.find(p => p.projectId === PROJECT_ID);
  assert.equal(entry?.status, 'development');
});

test('3. SecondPlayable_PL01 registry entry has correct folder', async () => {
  const text = await readFile(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(text);
  const entry = registry.projects.find(p => p.projectId === PROJECT_ID);
  assert.equal(entry?.folder, PROJECT_FOLDER);
});

test('4. SecondPlayable_PL01 registry entry has empty supportedNetworks', async () => {
  const text = await readFile(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(text);
  const entry = registry.projects.find(p => p.projectId === PROJECT_ID);
  assert.deepEqual(entry?.supportedNetworks, []);
});

test('5. SecondPlayable_PL01 registry entry has not-started deliveryCandidateStatus', async () => {
  const text = await readFile(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(text);
  const entry = registry.projects.find(p => p.projectId === PROJECT_ID);
  assert.equal(entry?.deliveryCandidateStatus, 'not-started');
});

test('6. SecondPlayable_PL01 registry entry has NOT_APPLICABLE formalSolvability', async () => {
  const text = await readFile(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(text);
  const entry = registry.projects.find(p => p.projectId === PROJECT_ID);
  assert.equal(entry?.formalSolvability, 'NOT_APPLICABLE');
});

test('7. SecondPlayable_PL01 required skeleton dirs exist on disk', async () => {
  const requiredDirs = ['docs', 'input', 'src', 'tests'];
  for (const rel of requiredDirs) {
    const ok = await exists(path.join(REPO_ROOT, PROJECT_FOLDER, rel));
    assert.ok(ok, `${PROJECT_FOLDER}/${rel} must exist`);
  }
});

test('8. SecondPlayable_PL01 intake subfolders all exist', async () => {
  const intakeDirs = ['input/raw-assets', 'input/extracted-assets', 'input/references', 'input/brief'];
  for (const rel of intakeDirs) {
    const ok = await exists(path.join(REPO_ROOT, PROJECT_FOLDER, rel));
    assert.ok(ok, `${PROJECT_FOLDER}/${rel} must exist`);
  }
});

test('9. SecondPlayable_PL01 skeleton files exist', async () => {
  const files = ['README.md', 'PROJECT_BRIEF.md', 'ASSET_INTAKE.md', 'project.config.json', 'package.json', 'input/README.md'];
  for (const rel of files) {
    const ok = await exists(path.join(REPO_ROOT, PROJECT_FOLDER, rel));
    assert.ok(ok, `${PROJECT_FOLDER}/${rel} must exist`);
  }
});

test('10. wowwi:validate passes for SecondPlayable_PL01', async () => {
  const { stdout, stderr } = await execFileAsync(process.execPath, [
    path.join(REPO_ROOT, 'tooling/commands/validate-projects.mjs'),
  ], { env: { ...process.env, WOWWI_REPO_ROOT: REPO_ROOT, WOWWI_REGISTRY_PATH: REGISTRY_PATH } });
  const out = stdout + stderr;
  assert.ok(out.includes('PASS  SecondPlayable_PL01'), `validate output must include PASS for ${PROJECT_ID}`);
});

test('11. wowwi:validate still passes for TilePyramid_PL01', async () => {
  const { stdout, stderr } = await execFileAsync(process.execPath, [
    path.join(REPO_ROOT, 'tooling/commands/validate-projects.mjs'),
  ], { env: { ...process.env, WOWWI_REPO_ROOT: REPO_ROOT, WOWWI_REGISTRY_PATH: REGISTRY_PATH } });
  const out = stdout + stderr;
  assert.ok(out.includes('PASS  TilePyramid_PL01'), 'validate output must include PASS for TilePyramid_PL01');
});

test('12. asset audit dry-run runs for SecondPlayable_PL01 without writing files', async () => {
  const text = await readFile(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(text);
  const project = registry.projects.find(p => p.projectId === PROJECT_ID);
  assert.ok(project, `${PROJECT_ID} must be in registry`);
  const result = await runAssetAudit({ repoRoot: REPO_ROOT, project, dryRun: true });
  assert.equal(result.written, false);
  assert.equal(typeof result.audit.totals.fileCount, 'number');
  assert.ok(result.audit.totals.fileCount >= 0);
});

test('13. asset audit scanner ignores .gitkeep files in intake folders', async () => {
  const text = await readFile(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(text);
  const project = registry.projects.find(p => p.projectId === PROJECT_ID);
  assert.ok(project, `${PROJECT_ID} must be in registry`);
  const result = await runAssetAudit({ repoRoot: REPO_ROOT, project, dryRun: true });
  const hasGitkeep = (result.audit.files ?? []).some(f => f.name === '.gitkeep');
  assert.ok(!hasGitkeep, '.gitkeep files must not appear in asset audit results');
});

test('14. preview build generates index page for development project', async () => {
  const distDir = path.join(REPO_ROOT, 'apps/internal-preview/dist');
  const devIndexPath = path.join(distDir, `projects/${PROJECT_ID}/index.html`);
  const ok = await exists(devIndexPath);
  assert.ok(ok, `dist/projects/${PROJECT_ID}/index.html must exist after preview build`);
  if (ok) {
    const html = await readFile(devIndexPath, 'utf8');
    assert.ok(html.includes('development') || html.includes('not playable'), 'development project page must indicate intake status');
  }
});

// ─── BUILD-26: gitkeep hotfix ─────────────────────────────────────────────────

test('15. each intake folder contains a .gitkeep placeholder file', async () => {
  const intakeDirs = ['input/raw-assets', 'input/extracted-assets', 'input/references', 'input/brief'];
  for (const rel of intakeDirs) {
    const gitkeepPath = path.join(REPO_ROOT, PROJECT_FOLDER, rel, '.gitkeep');
    const ok = await exists(gitkeepPath);
    assert.ok(ok, `${PROJECT_FOLDER}/${rel}/.gitkeep must exist for git directory tracking`);
  }
});

test('16. .gitkeep files are not git-ignored', async () => {
  const intakeDirs = ['input/raw-assets', 'input/extracted-assets', 'input/references', 'input/brief'];
  for (const rel of intakeDirs) {
    const gitkeepRel = `${PROJECT_FOLDER}/${rel}/.gitkeep`;
    try {
      await execFileAsync('git', ['-C', REPO_ROOT, 'check-ignore', '--quiet', gitkeepRel]);
      assert.fail(`${gitkeepRel} should NOT be git-ignored but git check-ignore returned 0`);
    } catch (err) {
      assert.equal(err.code, 1, `git check-ignore exit 1 means the file is not ignored`);
    }
  }
});

test('17. real asset files are still git-ignored inside intake folders', async () => {
  const cases = [
    `${PROJECT_FOLDER}/input/raw-assets/client_assets.zip`,
    `${PROJECT_FOLDER}/input/raw-assets/logo.png`,
    `${PROJECT_FOLDER}/input/brief/brief.pdf`,
  ];
  for (const rel of cases) {
    const { exitCode } = await execFileAsync('git', ['-C', REPO_ROOT, 'check-ignore', '--quiet', rel])
      .then(() => ({ exitCode: 0 }))
      .catch(err => ({ exitCode: err.code ?? 1 }));
    assert.equal(exitCode, 0, `${rel} must be git-ignored`);
  }
});

test('18. create-project dry-run planned files include .gitkeep for intake subdirs', async () => {
  const tmpDir = await mkdtemp(path.join((await import('node:os')).default.tmpdir(), 'wowwi-build26-'));
  try {
    const tmpRegistry = path.join(tmpDir, 'projects.json');
    const templateDst = path.join(tmpDir, 'tooling/templates/playable-project');
    await mkdir(path.join(tmpDir, 'tooling/templates'), { recursive: true });
    await copyTemplateForTests(TEMPLATE_ROOT, templateDst);
    await writeFile(tmpRegistry, JSON.stringify({ registryVersion: '1', projects: [] }, null, 2));
    const result = await createPlayableProject({
      projectId: 'TestPlayable_PL01',
      displayName: 'Test Playable',
      dryRun: true,
      repoRoot: tmpDir,
      registryPath: tmpRegistry,
      templateRoot: templateDst,
    });
    const gitkeepFiles = result.plannedFiles.filter(f => f.endsWith('.gitkeep'));
    assert.ok(gitkeepFiles.length >= 4, `dry-run must show at least 4 .gitkeep files; got ${gitkeepFiles.join(', ')}`);
    const intakeDirs = ['raw-assets', 'extracted-assets', 'references', 'brief'];
    for (const dir of intakeDirs) {
      const has = gitkeepFiles.some(f => f.includes(`input/${dir}/.gitkeep`));
      assert.ok(has, `dry-run must include input/${dir}/.gitkeep in plannedFiles`);
    }
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
});

test('19. create-project real creation places .gitkeep files in intake folders', async () => {
  const tmpDir = await mkdtemp(path.join((await import('node:os')).default.tmpdir(), 'wowwi-build26-'));
  try {
    const tmpRegistry = path.join(tmpDir, 'projects.json');
    const templateDst = path.join(tmpDir, 'tooling/templates/playable-project');
    await mkdir(path.join(tmpDir, 'tooling/templates'), { recursive: true });
    await copyTemplateForTests(TEMPLATE_ROOT, templateDst);
    await writeFile(tmpRegistry, JSON.stringify({ registryVersion: '1', projects: [] }, null, 2));
    await createPlayableProject({
      projectId: 'TestPlayable_PL01',
      displayName: 'Test Playable',
      dryRun: false,
      repoRoot: tmpDir,
      registryPath: tmpRegistry,
      templateRoot: templateDst,
    });
    const intakeDirs = ['raw-assets', 'extracted-assets', 'references', 'brief'];
    for (const dir of intakeDirs) {
      const gitkeepPath = path.join(tmpDir, 'projects/TestPlayable_PL01/input', dir, '.gitkeep');
      const ok = await exists(gitkeepPath);
      assert.ok(ok, `create-project must place .gitkeep in input/${dir}/`);
    }
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
});

test('20. project template contains .gitkeep files in intake subdirs', async () => {
  const intakeDirs = ['raw-assets', 'extracted-assets', 'references', 'brief'];
  for (const dir of intakeDirs) {
    const gitkeepPath = path.join(TEMPLATE_ROOT, 'input', dir, '.gitkeep');
    const ok = await exists(gitkeepPath);
    assert.ok(ok, `template input/${dir}/.gitkeep must exist for future project creation`);
  }
});

test('21. wowwi:validate passes for all projects after gitkeep fix', async () => {
  const { stdout, stderr } = await execFileAsync(process.execPath, [
    path.join(REPO_ROOT, 'tooling/commands/validate-projects.mjs'),
  ], { env: { ...process.env, WOWWI_REPO_ROOT: REPO_ROOT, WOWWI_REGISTRY_PATH: REGISTRY_PATH } });
  const out = stdout + stderr;
  assert.ok(!out.includes('FAIL'), `validate must not report any FAILs; got:\n${out}`);
  assert.ok(out.includes('Registry validation: PASS'), 'registry validation must PASS');
});

test('22. preview home page lists all registered projects', async () => {
  const distDir = path.join(REPO_ROOT, 'apps/internal-preview/dist');
  const homeIndexPath = path.join(distDir, 'index.html');
  const ok = await exists(homeIndexPath);
  assert.ok(ok, 'dist/index.html must exist after preview build');
  if (ok) {
    const html = await readFile(homeIndexPath, 'utf8');
    assert.ok(html.includes(PROJECT_ID), `home page must list ${PROJECT_ID}`);
    assert.ok(html.includes('TilePyramid_PL01'), 'home page must list TilePyramid_PL01');
  }
});
