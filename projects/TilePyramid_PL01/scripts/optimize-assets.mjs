import { chromium } from '@playwright/test';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ASSET_PLAN } from './asset-plan.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const browser = await chromium.launch();
const page = await browser.newPage();

const rows = [];

try {
  for (const item of ASSET_PLAN) {
    const sourcePath = path.resolve(root, item.source);
    const outputPath = path.resolve(root, item.output);
    const sourceStat = await stat(sourcePath).catch(() => {
      throw new Error(`Missing optimization source for ${item.id}: ${sourcePath}`);
    });
    const sourceBuffer = await readFile(sourcePath);
    const dataUrl = `data:image/png;base64,${sourceBuffer.toString('base64')}`;
    const result = await page.evaluate(
      async ({ dataUrl, width, height, maxWidth, maxHeight, quality }) => {
        const image = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error('Image decode failed'));
          img.src = dataUrl;
        });

        const sourceWidth = image.naturalWidth;
        const sourceHeight = image.naturalHeight;
        let targetWidth = width ?? sourceWidth;
        let targetHeight = height ?? Math.round((targetWidth / sourceWidth) * sourceHeight);

        if (!width && !height && (maxWidth || maxHeight)) {
          const scale = Math.min(
            maxWidth ? maxWidth / sourceWidth : 1,
            maxHeight ? maxHeight / sourceHeight : 1,
            1
          );
          targetWidth = Math.round(sourceWidth * scale);
          targetHeight = Math.round(sourceHeight * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context unavailable');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
        const encoded = canvas.toDataURL('image/webp', quality);
        return { sourceWidth, sourceHeight, targetWidth, targetHeight, encoded };
      },
      {
        dataUrl,
        width: item.width,
        height: item.height,
        maxWidth: item.maxWidth,
        maxHeight: item.maxHeight,
        quality: item.quality,
      }
    );

    if (!result.encoded.startsWith('data:image/webp;base64,')) {
      throw new Error(`Browser did not produce WebP output for ${item.id}`);
    }

    const outputBuffer = Buffer.from(result.encoded.split(',')[1], 'base64');
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, outputBuffer);

    rows.push({
      id: item.id,
      source: path.relative(root, sourcePath).replaceAll('\\', '/'),
      output: path.relative(root, outputPath).replaceAll('\\', '/'),
      sourceBytes: sourceStat.size,
      optimizedBytes: outputBuffer.length,
      deltaBytes: sourceStat.size - outputBuffer.length,
      sourceDimensions: `${result.sourceWidth}x${result.sourceHeight}`,
      optimizedDimensions: `${result.targetWidth}x${result.targetHeight}`,
      format: 'webp',
    });
  }
} finally {
  await browser.close();
}

const totalSource = rows.reduce((sum, row) => sum + row.sourceBytes, 0);
const totalOptimized = rows.reduce((sum, row) => sum + row.optimizedBytes, 0);

console.table(rows);
console.log(`Optimized ${rows.length} assets.`);
console.log(`Source image bytes: ${totalSource}`);
console.log(`Optimized image bytes: ${totalOptimized}`);
console.log(`Saved bytes: ${totalSource - totalOptimized}`);
