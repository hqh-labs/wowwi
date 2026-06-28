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
  const allRequests = [];

  page.on('console', message => {
    if (message.type() === 'error') consoleMessages.push(message.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('request', request => allRequests.push(request.url()));
  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      errorText: request.failure()?.errorText ?? 'unknown',
    });
  });

  try {
    await page.addInitScript(() => {
      window.__PLAYABLE_QA_MODE__ = true;
    });
    await page.goto(pathToFileURL(path.resolve(filePath)).href);
    await page.waitForSelector('canvas', { timeout: 20_000 });
    await page.waitForFunction(
      () => window.__TILEPYRAMID_BUILD09__?.remainingBoardCount === 72,
      null,
      { timeout: 20_000 }
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
        bridgeDiagnostics: window.__PLAYABLE_STORE_OPEN_DIAGNOSTICS__ ?? null,
        backgroundImage: background ? getComputedStyle(background).backgroundImage : '',
        backgroundPointerEvents: background ? getComputedStyle(background).pointerEvents : '',
        containerPointerEvents: document.getElementById('game-container')
          ? getComputedStyle(document.getElementById('game-container')).pointerEvents
          : '',
        canvasPointerEvents: canvas ? getComputedStyle(canvas).pointerEvents : '',
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

    const ctaResult = await clickDesignPoint(page, 540, 1775);
    if (ctaResult.clicked) {
      await page.waitForTimeout(200);
    }
    const storeOpenDetails = await page.evaluate(() => ({
      diagnostics: window.__PLAYABLE_STORE_OPEN_DIAGNOSTICS__ ?? null,
      snapshot: window.__TILEPYRAMID_BUILD09__ ?? null,
    }));

    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(300);
    const landscapeDetails = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const box = canvas?.getBoundingClientRect();
      return {
        canvasVisible: Boolean(box && box.width > 0 && box.height > 0),
        aspect: box ? box.width / box.height : 0,
        centeredX: box ? Math.abs(box.x + box.width / 2 - window.innerWidth / 2) < 6 : false,
        tallerThanWide: box ? box.height > box.width : false,
      };
    });

    const errors = [];
    if (pageErrors.length > 0) errors.push(`Page errors: ${pageErrors.join('; ')}`);
    if (consoleMessages.length > 0) errors.push(`Console errors: ${consoleMessages.join('; ')}`);
    const externalFailures = failedRequests.filter(request => /^https?:\/\//i.test(request.url));
    if (externalFailures.length > 0) errors.push(`External request failures: ${JSON.stringify(externalFailures)}`);
    const externalRequests = allRequests.filter(url => /^https?:\/\//i.test(url));
    if (externalRequests.length > 0) errors.push(`External requests occurred during boot: ${JSON.stringify(externalRequests)}`);
    if (!details.canvasExists || !details.canvasVisible) errors.push('Phaser canvas is missing or not visible.');
    if (!visuallyNonBlank) errors.push('Export screenshot appears blank.');
    if (!details.build09Exists) errors.push('BUILD-09 diagnostics snapshot is missing.');
    if (details.remainingBoardCount !== 72) errors.push('Expected initial board count of 72.');
    if (!details.ctaVisible) errors.push('Gameplay CTA is not visible in diagnostics.');
    if (details.bridgeType !== 'function') errors.push('Store-open bridge is missing.');
    if (!details.bridgeDiagnostics) errors.push('Store-open diagnostics are missing.');
    if (details.networkMetadata?.network !== network) errors.push('Network metadata does not match export.');
    if (details.networkMetadata?.hostCloseButtonSafeZone?.corner !== 'top-right') {
      errors.push('Host close-button safe-zone metadata is missing or invalid.');
    }
    if (details.backgroundPointerEvents !== 'none') errors.push('Background layer must not intercept pointer events.');
    if (details.containerPointerEvents !== 'none') errors.push('Game container must not intercept side-area pointer events.');
    if (details.canvasPointerEvents !== 'auto') errors.push('Canvas must remain the only gameplay pointer surface.');
    if (storeOpenDetails.diagnostics?.methodUsed !== 'record-only') errors.push('QA-mode CTA store-open did not record safely.');
    if (storeOpenDetails.snapshot?.remainingBoardCount !== 72 || storeOpenDetails.snapshot?.trayCount !== 0) {
      errors.push('CTA click mutated board or tray state during visual validation.');
    }
    if (storeOpenDetails.snapshot?.timerStarted !== false) errors.push('CTA click started the timer before a valid tile tap.');
    if (!landscapeDetails.canvasVisible || !landscapeDetails.tallerThanWide || !landscapeDetails.centeredX) {
      errors.push('Landscape validation failed to keep portrait playable centered.');
    }
    if (details.formalSolvability !== 'NOT YET PROVEN') errors.push('Formal solvability marker is not NOT YET PROVEN.');

    return {
      status: errors.length === 0 ? 'PASS' : 'FAIL',
      errors,
      warnings: [],
      details: {
        ...details,
        portrait: { canvasVisible: details.canvasVisible, visuallyNonBlank },
        landscape: landscapeDetails,
        storeOpen: storeOpenDetails.diagnostics,
      },
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

async function clickDesignPoint(page, x, y) {
  const box = await page.locator('canvas').first().boundingBox();
  if (!box) return { clicked: false };
  await page.mouse.click(box.x + (x / 1080) * box.width, box.y + (y / 1920) * box.height);
  return { clicked: true };
}
