import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DESIGN_ASPECT = 9 / 16;
const PREVIEW_IDS = ['L2:-1.5:2.5', 'L2:-0.5:2.5', 'L2:0.5:2.5'];

const EXPORTS = [
  {
    network: 'unity',
    file: 'exports/latest/unity/TilePyramid_PL01_unity.html',
  },
  {
    network: 'applovin',
    file: 'exports/latest/applovin/TilePyramid_PL01_applovin.html',
  },
] as const;

declare global {
  interface Window {
    __EXPORT_TEST_STORE_OPEN__?: {
      count: number;
      payload: { source: string; url: string; network?: string };
    };
  }
}

test.describe('Build-09 exported HTML smoke tests', () => {
  test.describe.configure({ mode: 'serial', timeout: 80_000 });

  for (const exported of EXPORTS) {
    test(`${exported.network} export boots visually from file URL`, async ({ page }) => {
      const diagnostics = await loadExport(page, exported.file);
      expect(diagnostics.pageErrors).toEqual([]);
      expect(diagnostics.externalFailures).toEqual([]);
      expect(diagnostics.snapshot?.remainingBoardCount).toBe(72);
      expect(diagnostics.snapshot?.ctaVisible).toBe(true);
      expect(diagnostics.snapshot?.formalSolvability).toBe('NOT YET PROVEN');
      expect(diagnostics.network?.network).toBe(exported.network);
      expect(diagnostics.bridgeType).toBe('function');
      expect(diagnostics.backgroundImage).toContain('blob:');
      expect(diagnostics.canvasVisible).toBe(true);
      expect(diagnostics.visuallyNonBlank).toBe(true);
    });

    test(`${exported.network} export CTA records store-open without crashing`, async ({ page }) => {
      await loadExport(page, exported.file);
      await page.evaluate(() => {
        window.__PLAYABLE_STORE_OPEN__ = payload => {
          window.__EXPORT_TEST_STORE_OPEN__ = {
            count: (window.__EXPORT_TEST_STORE_OPEN__?.count ?? 0) + 1,
            payload,
          };
          return { handled: true, method: 'record-only' };
        };
      });

      await clickDesignPoint(page, 540, 1775);
      await page.waitForFunction(() => window.__TILEPYRAMID_BUILD09__?.storeOpenCallCount === 1);
      const result = await page.evaluate(() => ({
        storeOpenCallCount: window.__TILEPYRAMID_BUILD09__?.storeOpenCallCount,
        bridgeCallCount: window.__EXPORT_TEST_STORE_OPEN__?.count ?? 0,
        source: window.__EXPORT_TEST_STORE_OPEN__?.payload?.source,
      }));
      expect(result.storeOpenCallCount).toBe(1);
      expect(result.bridgeCallCount).toBe(1);
      expect(result.source).toBe('gameplay-cta');
    });

    test(`${exported.network} export landscape keeps portrait gameplay centered and side areas inert`, async ({ page }) => {
      await page.setViewportSize({ width: 844, height: 390 });
      await loadExport(page, exported.file);
      await page.evaluate(() => {
        window.__PLAYABLE_STORE_OPEN__ = payload => {
          window.__EXPORT_TEST_STORE_OPEN__ = {
            count: (window.__EXPORT_TEST_STORE_OPEN__?.count ?? 0) + 1,
            payload,
          };
          return { handled: true, method: 'record-only' };
        };
      });

      const box = await page.locator('canvas').first().boundingBox();
      expect(box).not.toBeNull();
      if (!box) return;

      expect(box.height).toBeGreaterThan(box.width);
      expect(box.width / box.height).toBeGreaterThan(DESIGN_ASPECT * 0.98);
      expect(box.width / box.height).toBeLessThan(DESIGN_ASPECT * 1.02);
      expect(Math.abs(box.x + box.width / 2 - 422)).toBeLessThan(5);

      await page.mouse.click(Math.max(2, box.x - 20), box.y + box.height / 2);
      await page.waitForTimeout(300);

      const snapshot = await page.evaluate(() => ({
        remainingBoardCount: window.__TILEPYRAMID_BUILD09__?.remainingBoardCount,
        trayCount: window.__TILEPYRAMID_BUILD09__?.trayCount,
        timerStarted: window.__TILEPYRAMID_BUILD09__?.timerStarted,
        storeOpenCallCount: window.__TILEPYRAMID_BUILD09__?.storeOpenCallCount,
        bridgeCallCount: window.__EXPORT_TEST_STORE_OPEN__?.count ?? 0,
      }));
      expect(snapshot.remainingBoardCount).toBe(72);
      expect(snapshot.trayCount).toBe(0);
      expect(snapshot.timerStarted).toBe(false);
      expect(snapshot.storeOpenCallCount).toBe(0);
      expect(snapshot.bridgeCallCount).toBe(0);
    });
  }

  test('Unity export fail path shows end card after timer expiry', async ({ page }) => {
    await loadExport(page, EXPORTS[0].file);
    await clickTileById(page, PREVIEW_IDS[0]);
    await page.waitForFunction(
      () => window.__TILEPYRAMID_BUILD09__?.gameState === 'failed' && window.__TILEPYRAMID_BUILD09__?.endCardVisible === true,
      null,
      { timeout: 40_000 }
    );

    const snapshot = await page.evaluate(() => window.__TILEPYRAMID_BUILD09__);
    expect(snapshot?.timerStarted).toBe(true);
    expect(snapshot?.timerExpired).toBe(true);
    expect(snapshot?.endCardReason).toBe('fail');
  });
});

async function loadExport(page: Page, relativePath: string) {
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => failedRequests.push(request.url()));

  await page.goto(pathToFileURL(path.resolve(relativePath)).href);
  await page.waitForSelector('canvas', { timeout: 20_000 });
  await page.waitForFunction(() => window.__TILEPYRAMID_BUILD09__?.remainingBoardCount === 72, null, {
    timeout: 20_000,
  });
  await page.waitForTimeout(300);

  const diagnostics = await page.evaluate(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    const box = canvas?.getBoundingClientRect();
    const background = document.getElementById('bg-layer');
    return {
      snapshot: window.__TILEPYRAMID_BUILD09__,
      network: window.__PLAYABLE_NETWORK__,
      bridgeType: typeof window.__PLAYABLE_STORE_OPEN__,
      backgroundImage: background ? getComputedStyle(background).backgroundImage : '',
      canvasVisible: Boolean(box && box.width > 0 && box.height > 0),
      nonBlankCanvas: canvas ? canvasHasNonBlankPixels(canvas) : false,
    };

    function canvasHasNonBlankPixels(canvas: HTMLCanvasElement): boolean {
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const context = gl as WebGLRenderingContext;
        const pixels = new Uint8Array(4 * 25);
        let offset = 0;
        for (let y = 0; y < 5; y++) {
          for (let x = 0; x < 5; x++) {
            context.readPixels(
              Math.round((x + 0.5) * context.drawingBufferWidth / 5),
              Math.round((y + 0.5) * context.drawingBufferHeight / 5),
              1,
              1,
              context.RGBA,
              context.UNSIGNED_BYTE,
              pixels.subarray(offset, offset + 4)
            );
            offset += 4;
          }
        }
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i] > 8 || pixels[i + 1] > 8 || pixels[i + 2] > 8) return true;
        }
      }
      return false;
    }
  });
  const screenshot = await page.screenshot({ fullPage: true });

  return {
    ...diagnostics,
    screenshotBytes: screenshot.length,
    visuallyNonBlank: diagnostics.nonBlankCanvas || screenshot.length > 20_000,
    pageErrors,
    externalFailures: failedRequests.filter(url => /^https?:\/\//i.test(url)),
  };
}

async function clickDesignPoint(page: Page, x: number, y: number): Promise<void> {
  const box = await page.locator('canvas').first().boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await page.mouse.click(box.x + (x / 1080) * box.width, box.y + (y / 1920) * box.height);
}

async function clickTileById(page: Page, tileId: string): Promise<void> {
  const tile = await page.evaluate(id => window.__TILEPYRAMID_BUILD09__?.tiles.find(candidate => candidate.id === id), tileId);
  expect(tile).toBeDefined();
  if (!tile) return;
  await clickDesignPoint(page, tile.screenX, tile.screenY);
}
