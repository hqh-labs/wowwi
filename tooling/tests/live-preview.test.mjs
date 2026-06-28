/**
 * BUILD-19 live preview QA lock tests — 8 static tests
 *
 * All tests are local and static — no network calls are made.
 * Validates documentation and registry metadata only.
 *
 * Runner: node:test (no extra dependencies)
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadRegistry } from '../utils/registry-loader.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(HERE, '..', '..');
const LIVE_PREVIEW_BASE_URL = 'https://wowwi.vercel.app';

// ─────────────────────────────────────────────────────────────────────────────
// Tests 1–5: LIVE_PREVIEW_QA.md content
// ─────────────────────────────────────────────────────────────────────────────

test('1. Live preview QA doc exists', () => {
  const docPath = path.join(REPO_ROOT, 'docs/LIVE_PREVIEW_QA.md');
  assert.ok(existsSync(docPath), 'docs/LIVE_PREVIEW_QA.md must exist');
});

test('2. Live preview QA doc contains the base URL', async () => {
  const text = await readFile(path.join(REPO_ROOT, 'docs/LIVE_PREVIEW_QA.md'), 'utf8');
  assert.ok(
    text.includes(LIVE_PREVIEW_BASE_URL),
    `LIVE_PREVIEW_QA.md must contain the base URL: ${LIVE_PREVIEW_BASE_URL}`
  );
});

test('3. Live preview QA doc contains Unity preview URL', async () => {
  const text = await readFile(path.join(REPO_ROOT, 'docs/LIVE_PREVIEW_QA.md'), 'utf8');
  assert.ok(
    text.includes('/projects/TilePyramid_PL01/unity'),
    'LIVE_PREVIEW_QA.md must contain the Unity preview URL path'
  );
});

test('4. Live preview QA doc contains AppLovin preview URL', async () => {
  const text = await readFile(path.join(REPO_ROOT, 'docs/LIVE_PREVIEW_QA.md'), 'utf8');
  assert.ok(
    text.includes('/projects/TilePyramid_PL01/applovin'),
    'LIVE_PREVIEW_QA.md must contain the AppLovin preview URL path'
  );
});

test('5. Live preview QA doc records formal solvability as NOT YET PROVEN', async () => {
  const text = await readFile(path.join(REPO_ROOT, 'docs/LIVE_PREVIEW_QA.md'), 'utf8');
  assert.ok(
    text.includes('NOT YET PROVEN'),
    'LIVE_PREVIEW_QA.md must record formal solvability as NOT YET PROVEN'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests 6–7: INTERNAL_PREVIEW_ACCESS_NOTES.md content
// ─────────────────────────────────────────────────────────────────────────────

test('6. Internal preview access notes doc exists', () => {
  const docPath = path.join(REPO_ROOT, 'docs/INTERNAL_PREVIEW_ACCESS_NOTES.md');
  assert.ok(existsSync(docPath), 'docs/INTERNAL_PREVIEW_ACCESS_NOTES.md must exist');
});

test('7. Access notes doc states no auth or login is implemented', async () => {
  const text = await readFile(
    path.join(REPO_ROOT, 'docs/INTERNAL_PREVIEW_ACCESS_NOTES.md'),
    'utf8'
  );
  const lower = text.toLowerCase();
  assert.ok(
    lower.includes('no') && (lower.includes('auth') || lower.includes('login')),
    'INTERNAL_PREVIEW_ACCESS_NOTES.md must state that no auth/login is currently implemented'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 8: Registry live preview metadata is valid
// ─────────────────────────────────────────────────────────────────────────────

test('8. Registry live preview metadata is valid for TilePyramid_PL01', async () => {
  const registry = await loadRegistry();
  const project = registry.projects.find(p => p.projectId === 'TilePyramid_PL01');
  assert.ok(project, 'TilePyramid_PL01 must be in the registry');

  assert.ok(
    project.livePreviewUrl?.startsWith('https://'),
    `livePreviewUrl must be an https URL, got: ${project.livePreviewUrl}`
  );
  assert.ok(
    project.livePreviewStatus === 'verified',
    `livePreviewStatus must be "verified", got: ${project.livePreviewStatus}`
  );
  assert.ok(
    project.livePreviewLastVerifiedAt,
    'livePreviewLastVerifiedAt must be set'
  );
  assert.ok(project.livePreviewPages?.home, 'livePreviewPages.home must be set');
  assert.ok(project.livePreviewPages?.detail, 'livePreviewPages.detail must be set');
  assert.ok(project.livePreviewPages?.unity, 'livePreviewPages.unity must be set');
  assert.ok(project.livePreviewPages?.applovin, 'livePreviewPages.applovin must be set');
  assert.ok(
    project.livePreviewPages.unity.includes('TilePyramid_PL01'),
    'Unity page URL must include project ID'
  );
  assert.ok(
    project.livePreviewPages.applovin.includes('TilePyramid_PL01'),
    'AppLovin page URL must include project ID'
  );
});
