/**
 * BUILD-15 Preview Site Builder
 *
 * Reads the project registry and delivery manifest, copies delivery HTMLs,
 * and generates a static preview site under apps/internal-preview/dist/.
 *
 * Usage: node apps/internal-preview/scripts/build-preview.mjs
 */

import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(HERE, '..');
const REPO_ROOT = path.join(APP_ROOT, '..', '..');

const REGISTRY_PATH = path.join(REPO_ROOT, 'tooling/project-registry/projects.json');
const DIST = path.join(APP_ROOT, 'dist');
const PUBLIC = path.join(APP_ROOT, 'public');

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtBytes(n) {
  if (n == null) return 'unknown';
  return `${n.toLocaleString()} bytes (${(n / 1024 / 1024).toFixed(2)} MB)`;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function tryReadJson(filePath) {
  try {
    const text = await readFile(filePath, 'utf8');
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function statusBadge(status) {
  const colours = {
    'delivery-locked': '#0a7c42',
    candidate: '#b56f00',
    development: '#4a5568',
    archived: '#6b7280',
  };
  const bg = colours[status] ?? '#4a5568';
  return `<span class="badge" style="background:${bg}">${esc(status)}</span>`;
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;color:#1a202c;background:#f7f8fa;min-height:100vh}
header{background:#111827;color:#f9fafb;padding:1.25rem 2rem;display:flex;align-items:center;gap:1rem}
header h1{font-size:1.25rem;font-weight:700;letter-spacing:.05em}
header .sub{font-size:.8rem;opacity:.65;margin-left:.5rem}
main{max-width:900px;margin:2rem auto;padding:0 1.5rem}
h2{font-size:1.05rem;font-weight:600;color:#374151;margin:2rem 0 .75rem}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:.5rem;padding:1.25rem;margin-bottom:1rem;text-decoration:none;color:inherit;display:block}
.card:hover{box-shadow:0 2px 8px rgba(0,0,0,.1)}
.card-title{font-size:1rem;font-weight:600;color:#111827;margin-bottom:.35rem}
.card-meta{font-size:.8rem;color:#6b7280;display:flex;flex-wrap:wrap;gap:.5rem;align-items:center}
.badge{display:inline-block;padding:.15rem .55rem;border-radius:99px;font-size:.7rem;font-weight:600;color:#fff;white-space:nowrap}
table{width:100%;border-collapse:collapse;font-size:.85rem;margin-bottom:1.5rem}
th{text-align:left;padding:.5rem .75rem;background:#f3f4f6;color:#374151;font-weight:600;border-bottom:2px solid #e5e7eb}
td{padding:.5rem .75rem;border-bottom:1px solid #f3f4f6;vertical-align:top}
td:first-child{white-space:nowrap;color:#374151;font-weight:500;width:200px}
a{color:#1d4ed8}
a:hover{text-decoration:underline}
.preview-box{background:#fff;border:1px solid #e5e7eb;border-radius:.5rem;padding:1.25rem;margin-bottom:1rem}
.preview-box h3{font-size:.9rem;font-weight:600;margin-bottom:.65rem;color:#374151}
.preview-link{display:inline-flex;align-items:center;gap:.4rem;background:#1d4ed8;color:#fff;padding:.5rem 1rem;border-radius:.375rem;text-decoration:none;font-size:.85rem;margin-right:.5rem;margin-bottom:.5rem}
.preview-link:hover{background:#1e40af;text-decoration:none}
.lim-list{list-style:disc;padding-left:1.25rem;font-size:.85rem;color:#4b5563}
.lim-list li{margin-bottom:.25rem}
.notice{background:#fef3c7;border:1px solid #fcd34d;border-radius:.375rem;padding:.75rem 1rem;font-size:.8rem;color:#92400e;margin-bottom:1rem}
.ok{color:#0a7c42;font-weight:600}
.mono{font-family:monospace;font-size:.82rem;word-break:break-all}
nav{margin-bottom:1.5rem}nav a{color:#1d4ed8;font-size:.875rem}
footer{text-align:center;padding:2rem;font-size:.75rem;color:#9ca3af}
`;

function page(title, bodyContent, breadcrumb = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Wowwi Internal Preview</title>
<style>${CSS}</style>
</head>
<body>
<header>
  <h1>Wowwi</h1><span class="sub">Internal Preview</span>
</header>
<main>
${breadcrumb}
${bodyContent}
</main>
<footer>Wowwi Internal Preview — BUILD-15 — local only, do not distribute</footer>
</body>
</html>`;
}

// ─── home page ────────────────────────────────────────────────────────────────

function buildHomePage(projects, previewData) {
  const cards = projects
    .map(p => {
      const href = `projects/${p.projectId}/index.html`;
      const networks = (p.supportedNetworks ?? []).join(', ');
      return `
<a class="card" href="${esc(href)}">
  <div class="card-title">${esc(p.displayName)} <span class="mono" style="font-size:.75rem;color:#6b7280">${esc(p.projectId)}</span></div>
  <div class="card-meta">
    ${statusBadge(p.status)}
    <span>${esc(networks)}</span>
    <span>${esc(p.folder)}</span>
    ${p.formalSolvability ? `<span>Solvability: ${esc(p.formalSolvability)}</span>` : ''}
  </div>
</a>`;
    })
    .join('\n');

  const body = `
<h2>${projects.length} Registered Project${projects.length === 1 ? '' : 's'}</h2>
${cards}
<p style="font-size:.8rem;color:#9ca3af;margin-top:2rem">Preview data generated: ${esc(previewData.generatedAt)}</p>
`;
  return page('Projects', body);
}

// ─── project detail page ──────────────────────────────────────────────────────

function buildProjectPage(project, manifest) {
  const networks = (project.supportedNetworks ?? []).join(', ');
  const limitations = (project.knownLimitations ?? [])
    .map(l => `<li>${esc(l)}</li>`)
    .join('');

  const unityOutput = manifest?.outputs?.unity;
  const applovinOutput = manifest?.outputs?.applovin;
  const storeUrls = manifest?.storeUrls ?? project.storeUrls;

  const rows = [
    ['Project ID', `<span class="mono">${esc(project.projectId)}</span>`],
    ['Display name', esc(project.displayName)],
    ['Status', statusBadge(project.status)],
    ['Folder', `<span class="mono">${esc(project.folder)}</span>`],
    ['Networks', esc(networks)],
    ['Unity profile', esc(project.defaultNetworkProfiles?.unity ?? '—')],
    ['AppLovin profile', esc(project.defaultNetworkProfiles?.applovin ?? '—')],
    ['Delivery status', esc(project.deliveryCandidateStatus ?? '—')],
    ['Unity size', esc(fmtBytes(project.lastKnownUnitySizeBytes))],
    ['AppLovin size', esc(fmtBytes(project.lastKnownAppLovinSizeBytes))],
    ['Formal solvability', `<strong>${esc(project.formalSolvability)}</strong>`],
  ];

  if (unityOutput?.sha256) {
    rows.push(['Unity SHA256', `<span class="mono">${esc(unityOutput.sha256)}</span>`]);
  }
  if (applovinOutput?.sha256) {
    rows.push(['AppLovin SHA256', `<span class="mono">${esc(applovinOutput.sha256)}</span>`]);
  }

  if (storeUrls?.androidUrl) {
    rows.push(['Android URL', `<a href="${esc(storeUrls.androidUrl)}" target="_blank" rel="noopener">${esc(storeUrls.androidUrl)}</a>`]);
  }
  if (storeUrls?.iosUrl) {
    rows.push(['iOS URL', `<a href="${esc(storeUrls.iosUrl)}" target="_blank" rel="noopener">${esc(storeUrls.iosUrl)}</a>`]);
  }

  const qaRows = Object.entries(project.networkQaEvidence ?? {})
    .map(([net, status]) => `<tr><td>${esc(net)}</td><td class="ok">${esc(status)}</td></tr>`)
    .join('');

  const tableRows = rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');

  // Absolute paths are required for Vercel compatibility.
  // With cleanUrls:true + trailingSlash:false the detail page is served at
  // /projects/TilePyramid_PL01 (no trailing slash). A relative "unity.html"
  // from that URL resolves to /projects/unity.html → cleanUrls → /projects/unity → 404.
  const unityPreviewPath = `/projects/${project.projectId}/unity.html`;
  const applovinPreviewPath = `/projects/${project.projectId}/applovin.html`;

  const body = `
<nav><a href="../../index.html">← All Projects</a></nav>

<h2>${esc(project.displayName)}</h2>

<table>
  <thead><tr><th>Field</th><th>Value</th></tr></thead>
  <tbody>${tableRows}</tbody>
</table>

${
  qaRows
    ? `<h2>Network QA Evidence</h2>
<table>
  <thead><tr><th>Network</th><th>Status</th></tr></thead>
  <tbody>${qaRows}</tbody>
</table>`
    : ''
}

${
  limitations
    ? `<h2>Known Limitations</h2>
<ul class="lim-list">${limitations}</ul>`
    : ''
}

<h2>Playable Preview</h2>
<div class="preview-box">
  <h3>Delivery HTML previews (local copy — not production)</h3>
  <div class="notice">These files are copies of the delivery-locked HTML export. They are for local preview only. Do not distribute them directly.</div>
  <a class="preview-link" href="${esc(unityPreviewPath)}" target="_blank">Open Unity Preview</a>
  <a class="preview-link" href="${esc(applovinPreviewPath)}" target="_blank" style="background:#b45309">Open AppLovin Preview</a>
</div>

${
  project.notes
    ? `<h2>Notes</h2><p style="font-size:.85rem;color:#4b5563">${esc(project.notes)}</p>`
    : ''
}
`;

  const breadcrumb = `<nav><a href="../../index.html">← All Projects</a></nav>`;
  return page(project.displayName, body, '');
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\nWowwi Preview Build — BUILD-15');
  console.log('─'.repeat(50));

  // Load registry
  const registryText = await readFile(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(registryText);
  const { projects } = registry;
  console.log(`Loaded registry: ${projects.length} project(s)`);

  // Prepare dist
  await mkdir(DIST, { recursive: true });

  const previewableProjects = projects.filter(project => project.status === 'delivery-locked');

  // Per-project: load manifest, copy delivery HTMLs, build detail page
  const previewData = {
    generatedAt: new Date().toISOString(),
    registryVersion: registry.registryVersion,
    projects: [],
  };

  for (const project of previewableProjects) {
    const projectFolder = path.join(REPO_ROOT, project.folder);

    // Prefer Vercel-generated preview delivery; fall back to real delivery package
    const previewDeliveryRoot = path.join(projectFolder, 'delivery/preview');
    const realDeliveryRoot = path.join(projectFolder, 'delivery/latest');

    let manifest = await tryReadJson(path.join(previewDeliveryRoot, 'delivery-manifest.json'));
    let deliveryRoot = previewDeliveryRoot;
    if (!manifest) {
      manifest = await tryReadJson(path.join(realDeliveryRoot, 'delivery-manifest.json'));
      deliveryRoot = realDeliveryRoot;
    }

    if (!manifest) {
      console.error(`\nERROR: Delivery manifest not found for ${project.projectId}`);
      console.error(`  Expected (Vercel): ${previewDeliveryRoot}/delivery-manifest.json`);
      console.error(`  Expected (local):  ${realDeliveryRoot}/delivery-manifest.json`);
      console.error(`  Run: npm run vercel:generate-delivery  (Vercel path)`);
      console.error(`  OR:  cd ${project.folder} && npm run package:delivery  (local path)`);
      process.exit(1);
    }

    // Copy delivery HTMLs
    const projectDist = path.join(DIST, 'projects', project.projectId);
    await mkdir(projectDist, { recursive: true });

    const unitySrc = path.join(deliveryRoot, manifest.outputs.unity.path);
    const applovinSrc = path.join(deliveryRoot, manifest.outputs.applovin.path);
    const unityDst = path.join(projectDist, 'unity.html');
    const applovinDst = path.join(projectDist, 'applovin.html');

    await copyFile(unitySrc, unityDst);
    await copyFile(applovinSrc, applovinDst);
    console.log(`Copied Unity HTML    → dist/projects/${project.projectId}/unity.html`);
    console.log(`Copied AppLovin HTML → dist/projects/${project.projectId}/applovin.html`);

    // Build detail page
    const detailHtml = buildProjectPage(project, manifest);
    await writeFile(path.join(projectDist, 'index.html'), detailHtml, 'utf8');
    console.log(`Generated            → dist/projects/${project.projectId}/index.html`);

    previewData.projects.push({
      projectId: project.projectId,
      displayName: project.displayName,
      status: project.status,
      supportedNetworks: project.supportedNetworks,
      folder: project.folder,
      formalSolvability: project.formalSolvability,
      storeUrls: manifest.storeUrls ?? project.storeUrls,
      deliveryChecksums: {
        unity: manifest.outputs?.unity?.sha256 ?? null,
        applovin: manifest.outputs?.applovin?.sha256 ?? null,
      },
      lastKnownUnitySizeBytes: project.lastKnownUnitySizeBytes,
      lastKnownAppLovinSizeBytes: project.lastKnownAppLovinSizeBytes,
      networkQaEvidence: project.networkQaEvidence,
      knownLimitations: project.knownLimitations,
    });
  }

  // Write preview data JSON
  const previewDataPath = path.join(DIST, 'preview-data.json');
  await writeFile(previewDataPath, JSON.stringify(previewData, null, 2), 'utf8');
  console.log('Generated            → dist/preview-data.json');

  // Build home page
  const homeHtml = buildHomePage(previewableProjects, previewData);
  await writeFile(path.join(DIST, 'index.html'), homeHtml, 'utf8');
  console.log('Generated            → dist/index.html');

  console.log(`\nPreview build complete. Output: apps/internal-preview/dist/`);
  console.log('Serve with: npm run preview:serve');
  console.log('');
}

main().catch(err => {
  console.error('Preview build failed:', err.message);
  process.exit(1);
});
