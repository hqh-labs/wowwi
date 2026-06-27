import { gzipSync } from 'node:zlib';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ASSET_PLAN,
  BUILD_06_IMAGE_BASELINE_BYTES,
  BUILD_06_TOTAL_BASELINE_BYTES,
} from './asset-plan.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

const files = await listFiles(dist);
const fileRows = await Promise.all(
  files.map(async file => {
    const size = (await stat(file)).size;
    return {
      file: path.relative(dist, file).replaceAll('\\', '/'),
      size,
    };
  })
);

const jsRows = fileRows.filter(row => row.file.endsWith('.js'));
const cssRows = fileRows.filter(row => row.file.endsWith('.css'));
const imageRows = fileRows.filter(row => /\.(png|jpe?g|webp|gif|avif)$/i.test(row.file));

let jsGzipBytes = 0;
for (const row of jsRows) {
  const buffer = await readFile(path.join(dist, row.file));
  jsGzipBytes += gzipSync(buffer).length;
}

const assetRows = [];
for (const item of ASSET_PLAN) {
  const sourcePath = path.resolve(root, item.source);
  const outputPath = path.resolve(root, item.output);
  const sourceBytes = (await stat(sourcePath)).size;
  const optimizedBytes = (await stat(outputPath)).size;
  assetRows.push({
    id: item.id,
    sourceBytes,
    optimizedBytes,
    deltaBytes: sourceBytes - optimizedBytes,
    output: item.output,
  });
}

const totalDistBytes = sum(fileRows);
const imageBytes = sum(imageRows);
const jsBytes = sum(jsRows);
const cssBytes = sum(cssRows);
const optimizedSourceBytes = assetRows.reduce((total, row) => total + row.sourceBytes, 0);
const optimizedOutputBytes = assetRows.reduce((total, row) => total + row.optimizedBytes, 0);

console.log('Production size summary');
console.table([
  { metric: 'dist total bytes', value: totalDistBytes },
  { metric: 'javascript raw bytes', value: jsBytes },
  { metric: 'javascript gzip bytes', value: jsGzipBytes },
  { metric: 'css bytes', value: cssBytes },
  { metric: 'runtime image bytes', value: imageBytes },
  { metric: 'BUILD-06 dist baseline bytes', value: BUILD_06_TOTAL_BASELINE_BYTES },
  { metric: 'BUILD-06 runtime image baseline bytes', value: BUILD_06_IMAGE_BASELINE_BYTES },
  { metric: 'dist bytes saved vs BUILD-06', value: BUILD_06_TOTAL_BASELINE_BYTES - totalDistBytes },
  { metric: 'image bytes saved vs BUILD-06', value: BUILD_06_IMAGE_BASELINE_BYTES - imageBytes },
  { metric: 'planned source image bytes', value: optimizedSourceBytes },
  { metric: 'planned optimized image bytes', value: optimizedOutputBytes },
  { metric: 'planned image bytes saved', value: optimizedSourceBytes - optimizedOutputBytes },
]);

console.log('Optimized asset deltas');
console.table(assetRows);

console.log('Largest dist files');
console.table([...fileRows].sort((a, b) => b.size - a.size).slice(0, 12));

function sum(rows) {
  return rows.reduce((total, row) => total + row.size, 0);
}

async function listFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listFiles(fullPath)));
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}
