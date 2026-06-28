/**
 * Shared preview validation logic.
 * Used by validate-preview.mjs (CLI) and preview-build.test.mjs (tests).
 */

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readText(filePath) {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

/**
 * Validates a preview dist directory.
 * @param {string} distPath - Absolute path to the dist directory.
 * @returns {{ pass: boolean, errors: string[] }}
 */
export async function validatePreviewDist(distPath) {
  const errors = [];

  const homeExists = await exists(path.join(distPath, 'index.html'));
  if (!homeExists) errors.push('Home page not found (dist/index.html)');

  const previewDataPath = path.join(distPath, 'preview-data.json');
  const previewDataExists = await exists(previewDataPath);
  if (!previewDataExists) {
    errors.push('preview-data.json not found');
  }

  let previewData = null;
  if (previewDataExists) {
    try {
      previewData = JSON.parse(await readFile(previewDataPath, 'utf8'));
    } catch {
      errors.push('preview-data.json is not valid JSON');
    }
  }

  const tp = previewData?.projects?.find(p => p.projectId === 'TilePyramid_PL01');

  const tpPageExists = await exists(path.join(distPath, 'projects/TilePyramid_PL01/index.html'));
  if (!tpPageExists) errors.push('TilePyramid project page not found');

  const unityPath = path.join(distPath, 'projects/TilePyramid_PL01/unity.html');
  const unityExists = await exists(unityPath);
  if (!unityExists) errors.push('Unity preview HTML not found (projects/TilePyramid_PL01/unity.html)');

  const applovinPath = path.join(distPath, 'projects/TilePyramid_PL01/applovin.html');
  const applovinExists = await exists(applovinPath);
  if (!applovinExists) errors.push('AppLovin preview HTML not found (projects/TilePyramid_PL01/applovin.html)');

  if (!tp?.storeUrls?.androidUrl) errors.push('Android store URL missing from preview-data');
  if (!tp?.storeUrls?.iosUrl) errors.push('iOS store URL missing from preview-data');
  if (tp?.formalSolvability !== 'NOT YET PROVEN') {
    errors.push('Formal solvability must be NOT YET PROVEN in preview-data');
  }
  if (!tp?.deliveryChecksums?.unity) errors.push('Unity delivery checksum missing from preview-data');
  if (!tp?.deliveryChecksums?.applovin) errors.push('AppLovin delivery checksum missing from preview-data');

  const rawInDist = await exists(path.join(distPath, 'project-input'));
  if (rawInDist) errors.push('project-input directory found in dist — must not be copied');

  if (unityExists) {
    const unityText = await readText(unityPath);
    if (unityText != null && /window\s*\.\s*top\b/.test(unityText)) {
      errors.push('window.top found in Unity preview HTML');
    }
  }

  if (applovinExists) {
    const applovinText = await readText(applovinPath);
    if (applovinText != null && /window\s*\.\s*top\b/.test(applovinText)) {
      errors.push('window.top found in AppLovin preview HTML');
    }
  }

  // Forbidden directories that must never appear in dist
  const forbiddenDirs = [
    'project-input/raw-assets',
    'project-input/extracted-assets',
    'projects/TilePyramid_PL01/src',
    'node_modules',
  ];
  for (const rel of forbiddenDirs) {
    if (await exists(path.join(distPath, rel))) {
      errors.push(`Forbidden path found in dist: ${rel}`);
    }
  }

  return { pass: errors.length === 0, errors };
}

/**
 * Validates the Vercel config (vercel.json) at repoRoot.
 * @param {string} repoRoot
 * @returns {{ pass: boolean, errors: string[], config: object|null }}
 */
export async function validateVercelConfig(repoRoot) {
  const errors = [];
  const configPath = path.join(repoRoot, 'vercel.json');
  const configExists = await exists(configPath);
  if (!configExists) {
    return { pass: false, errors: ['vercel.json not found at repo root'], config: null };
  }

  let config = null;
  try {
    config = JSON.parse(await readFile(configPath, 'utf8'));
  } catch {
    return { pass: false, errors: ['vercel.json is not valid JSON'], config: null };
  }

  if (!config.buildCommand) {
    errors.push('vercel.json missing buildCommand');
  } else if (!config.buildCommand.includes('vercel:build-preview')) {
    errors.push(`vercel.json buildCommand must include vercel:build-preview, got: ${config.buildCommand}`);
  }

  if (!config.outputDirectory) {
    errors.push('vercel.json missing outputDirectory');
  } else if (config.outputDirectory !== 'apps/internal-preview/dist') {
    errors.push(
      `vercel.json outputDirectory must be apps/internal-preview/dist, got: ${config.outputDirectory}`
    );
  }

  return { pass: errors.length === 0, errors, config };
}
