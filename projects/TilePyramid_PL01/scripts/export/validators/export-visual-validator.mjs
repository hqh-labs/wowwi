import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { stat } from 'node:fs/promises';

export async function validateExportVisualFile({ filePath, network, screenshotPath }) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];

  page.on('console', message => {
    if (message.type() === 'error') consoleMessages.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      errorText: request.failure()?.errorText ?? 'unknown',
    });
  });

  try {
    await page.goto(pathToFileURL(path.resolve(filePath)).href);
    await page.waitForSelector('canvas', { timeout: 10_000 });
    await page.waitForFunction(
      () => window.__TILEPYRAMID_BUILD09__?.remainingBoardCount === 72,
      null,
      { timeout: 10_000 }
    );
    await page.waitForTimeout(300);

    const details = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const snapshot = window.__TILEPYRAMID_BUILD09__ ?? window.__TILEPYRAMID_BUILD08__;
      const background = document.getElementById('bg-layer');
      return {
        canvasExists: Boolean(canvas),
        canvasWidth: canvas?.width ?? 0,
        canvasHeight: canvas?.height ?? 0,
        canvasVisible: Boolean(canvas && canvas.getBoundingClientRect().width > 0 && canvas.getBoundingClientRect().height > 0),
        nonBlankCanvas: canvas ? canvasHasNonBlankPixels(canvas) : false,
        build09Exists: Boolean(window.__TILEPYRAMID_BUILD09__),
        remainingBoardCount: snapshot?.remainingBoardCount ?? null,
        ctaVisible: snapshot?.ctaVisible ?? false,
        formalSolvability: snapshot?.formalSolvability ?? null,
        networkMetadata: window.__PLAYABLE_NETWORK__ ?? null,
        bridgeType: typeof window.__PLAYABLE_STORE_OPEN__,
        backgroundImage: background ? getComputedStyle(background).backgroundImage : '',
      };

      function canvasHasNonBlankPixels(canvas) {
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const context = gl;
          const width = context.drawingBufferWidth;
          const height = context.drawingBufferHeight;
          const pixels = new Uint8Array(4 * 25);
          let offset = 0;
          for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 5; x++) {
              const px = Math.max(0, Math.min(width - 1, Math.round((x + 0.5) * width / 5)));
              const py = Math.max(0, Math.min(height - 1, Math.round((y + 0.5) * height / 5)));
              context.readPixels(px, py, 1, 1, context.RGBA, context.UNSIGNED_BYTE, pixels.subarray(offset, offset + 4));
              offset += 4;
            }
          }
          for (let i = 0; i < pixels.length; i += 4) {
            if (pixels[i] > 8 || pixels[i + 1] > 8 || pixels[i + 2] > 8) return true;
          }
          return false;
        }

        const twoD = canvas.getContext('2d');
        if (!twoD) return false;
        const sample = twoD.getImageData(0, 0, Math.min(canvas.width, 64), Math.min(canvas.height, 64)).data;
        for (let i = 0; i < sample.length; i += 4) {
          if (sample[i] > 8 || sample[i + 1] > 8 || sample[i + 2] > 8) return true;
        }
        return false;
      }
    });

    let screenshotBytes = 0;
    if (screenshotPath) {
      await page.screenshot({ path: screenshotPath, fullPage: true });
      screenshotBytes = (await stat(screenshotPath)).size;
    }
    const visuallyNonBlank = details.nonBlankCanvas || screenshotBytes > 20_000;
    details.screenshotBytes = screenshotBytes;
    details.visuallyNonBlank = visuallyNonBlank;

    const errors = [];
    if (pageErrors.length > 0) errors.push(`Page errors: ${pageErrors.join('; ')}`);
    if (consoleMessages.length > 0) errors.push(`Console errors: ${consoleMessages.join('; ')}`);
    const externalFailures = failedRequests.filter(request => /^https?:\/\//i.test(request.url));
    if (externalFailures.length > 0) errors.push(`External request failures: ${JSON.stringify(externalFailures)}`);
    if (!details.canvasExists || !details.canvasVisible) errors.push('Phaser canvas is missing or not visible.');
    if (!visuallyNonBlank) errors.push('Export screenshot appears blank.');
    if (!details.build09Exists) errors.push('BUILD-09 diagnostics snapshot is missing.');
    if (details.remainingBoardCount !== 72) errors.push('Expected initial board count of 72.');
    if (!details.ctaVisible) errors.push('Gameplay CTA is not visible in diagnostics.');
    if (details.bridgeType !== 'function') errors.push('Store-open bridge is missing.');
    if (details.networkMetadata?.network !== network) errors.push('Network metadata does not match export.');
    if (details.formalSolvability !== 'NOT YET PROVEN') errors.push('Formal solvability marker is not NOT YET PROVEN.');

    return {
      status: errors.length === 0 ? 'PASS' : 'FAIL',
      errors,
      warnings: [],
      details,
      pageErrors,
      failedRequests,
      screenshotPath,
    };
  } catch (error) {
    return {
      status: 'FAIL',
      errors: [error instanceof Error ? error.message : String(error)],
      warnings: [],
      details: null,
      pageErrors,
      failedRequests,
      screenshotPath,
    };
  } finally {
    await browser.close();
  }
}
