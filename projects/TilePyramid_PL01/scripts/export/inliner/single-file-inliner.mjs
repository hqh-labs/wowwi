import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createStoreOpenBridgeScript } from '../bridge/store-open-bridge.mjs';

const MIME_TYPES = new Map([
  ['.html', 'text/html'],
  ['.js', 'text/javascript'],
  ['.json', 'application/json'],
  ['.webp', 'image/webp'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.svg', 'image/svg+xml'],
  ['.mp3', 'audio/mpeg'],
  ['.wav', 'audio/wav'],
  ['.ogg', 'audio/ogg'],
  ['.css', 'text/css'],
]);

export async function inlineSingleFileHtml(options) {
  const { distDir, publicDir, profile, generatedAt = new Date().toISOString() } = options;
  const htmlPath = path.join(distDir, 'index.html');
  let html = await readFile(htmlPath, 'utf8');

  const publicConfig = JSON.parse(await readFile(path.join(publicDir, 'config/game.config.json'), 'utf8'));
  const publicManifest = JSON.parse(await readFile(path.join(publicDir, 'config/asset-manifest.json'), 'utf8'));

  const config = createExportConfig(publicConfig);
  const { manifest, inlinedAssets } = await createInlinedManifest(publicManifest, publicDir);

  html = html.replace(/<link\b[^>]*rel=["']modulepreload["'][^>]*>\s*/gi, '');
  html = await inlineScriptTags(html, distDir);
  html = await inlineStylesheetLinks(html, distDir);
  html = replaceInjectedConfig(html, config, manifest, profile, generatedAt);
  html = injectExportMetadata(html, profile);

  return {
    html,
    inlinedAssets,
    sourceIndex: htmlPath,
    generatedAt,
  };
}

export async function createInlinedManifest(manifest, publicDir) {
  const inlinedAssets = [];
  const assets = [];

  for (const asset of manifest.assets) {
    const runtimePath = path.resolve(publicDir, asset.path);
    const file = await readFile(runtimePath);
    const size = (await stat(runtimePath)).size;
    const dataUrl = `data:${mimeTypeFor(runtimePath)};base64,${file.toString('base64')}`;
    inlinedAssets.push({
      id: asset.id,
      type: asset.type,
      sourcePath: asset.path,
      bytes: size,
      dataUrlBytes: Buffer.byteLength(dataUrl, 'utf8'),
    });
    assets.push({
      ...asset,
      path: dataUrl,
    });
  }

  return {
    manifest: { ...manifest, assets },
    inlinedAssets,
  };
}

export function createExportConfig(config) {
  return {
    ...config,
    app: {
      ...config.app,
      storeOpenMode: 'navigate',
      safeDevelopmentNavigation: false,
    },
  };
}

async function inlineScriptTags(html, distDir) {
  const scriptTagPattern = /<script([^>]*)\bsrc=["']([^"']+)["']([^>]*)><\/script>/gi;
  let result = '';
  let lastIndex = 0;

  for (const match of html.matchAll(scriptTagPattern)) {
    const [fullTag, beforeSrc, src, afterSrc] = match;
    result += html.slice(lastIndex, match.index);
    const scriptPath = path.resolve(distDir, stripRelative(src));
    const code = await readFile(scriptPath, 'utf8');
    const attrs = `${beforeSrc}${afterSrc}`.replace(/\s*crossorigin\b/gi, '');
    result += `<script${attrs}>${code}\n</script>`;
    lastIndex = match.index + fullTag.length;
  }

  return result + html.slice(lastIndex);
}

async function inlineStylesheetLinks(html, distDir) {
  const linkPattern = /<link([^>]*)\brel=["']stylesheet["']([^>]*)\bhref=["']([^"']+)["']([^>]*)>/gi;
  let result = '';
  let lastIndex = 0;

  for (const match of html.matchAll(linkPattern)) {
    const [fullTag, attrsA, attrsB, href] = match;
    result += html.slice(lastIndex, match.index);
    const css = await readFile(path.resolve(distDir, stripRelative(href)), 'utf8');
    result += `<style data-inlined-stylesheet="${escapeHtml(href)}">${css}</style>`;
    lastIndex = match.index + fullTag.length;
    void attrsA;
    void attrsB;
  }

  return result + html.slice(lastIndex);
}

function replaceInjectedConfig(html, config, manifest, profile, generatedAt) {
  const injected = `<script>window.__GAME_CONFIG__=${JSON.stringify(config)};window.__ASSET_MANIFEST__=${JSON.stringify(
    manifest
  )};preparePlayableManifestBlobs();function preparePlayableManifestBlobs(){var manifest=window.__ASSET_MANIFEST__;if(!manifest||!Array.isArray(manifest.assets)||!window.URL||!window.Blob||!window.atob)return;for(var i=0;i<manifest.assets.length;i++){var asset=manifest.assets[i];if(!asset||typeof asset.path!=="string"||asset.path.indexOf("data:")!==0)continue;asset.path=dataUrlToBlobUrl(asset.path);}function dataUrlToBlobUrl(dataUrl){var comma=dataUrl.indexOf(",");var meta=dataUrl.slice(5,comma);var mime=meta.split(";")[0]||"application/octet-stream";var encoded=dataUrl.slice(comma+1);var binary=meta.indexOf(";base64")>=0?atob(encoded):decodeURIComponent(encoded);var length=binary.length;var bytes=new Uint8Array(length);for(var j=0;j<length;j++)bytes[j]=binary.charCodeAt(j);return URL.createObjectURL(new Blob([bytes],{type:mime}));}}</script>\n${createStoreOpenBridgeScript(profile, generatedAt)}`;

  const pattern = /<script>window\.__GAME_CONFIG__=[\s\S]*?window\.__ASSET_MANIFEST__=[\s\S]*?;<\/script>/;
  if (pattern.test(html)) {
    return html.replace(pattern, injected);
  }
  return html.replace('</head>', `${injected}</head>`);
}

function injectExportMetadata(html, profile) {
  const tags = [
    `<meta name="playable-export-profile" content="${escapeHtml(profile.id)}">`,
    `<meta name="playable-network" content="${escapeHtml(profile.network)}">`,
    `<meta name="playable-orientation-policy" content="${escapeHtml(profile.orientationPolicy)}">`,
    `<meta name="playable-timer-first-interaction" content="${profile.timerFirstInteractionRequired ? 'true' : 'false'}">`,
    `<meta name="playable-formal-solvability" content="NOT YET PROVEN">`,
  ].join('\n  ');
  return html.replace('</head>', `  ${tags}\n</head>`);
}

function stripRelative(value) {
  return value.replace(/^\.\//, '');
}

function mimeTypeFor(filePath) {
  return MIME_TYPES.get(path.extname(filePath).toLowerCase()) ?? 'application/octet-stream';
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}
