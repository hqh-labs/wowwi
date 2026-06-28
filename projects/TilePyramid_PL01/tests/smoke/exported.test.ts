import { expect, test, type Page } from '@playwright/test';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DESIGN_ASPECT = 9 / 16;
const PREVIEW_IDS = ['L2:-1.5:2.5', 'L2:-0.5:2.5', 'L2:0.5:2.5'];
const ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.skl.pyramid.quest.match3.tile.puzzle.games';

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

test.describe('Build-10 exported HTML compliance smoke tests', () => {
  test.describe.configure({ mode: 'serial', timeout: 80_000 });

  for (const exported of EXPORTS) {
    test(`${exported.network} export file exists, is under limit, and has no local references`, async () => {
      const filePath = path.resolve(exported.file);
      const [stats, html] = await Promise.all([stat(filePath), readFile(filePath, 'utf8')]);
      expect(stats.size).toBeGreaterThan(1_000_000);
      expect(stats.size).toBeLessThanOrEqual(5 * 1024 * 1024);
      expect(html).toContain('__PLAYABLE_NETWORK__');
      expect(html).toContain('__PLAYABLE_STORE_OPEN__');
      expect(html).toContain('__PLAYABLE_STORE_OPEN_DIAGNOSTICS__');
      expect(html).toContain('NOT YET PROVEN');
      expect(html).not.toContain('window.top');
      expect(html).not.toContain('top.location');
      expect(html).not.toContain('window.parent.top');
      expect(html).not.toMatch(/(?:src|href)=["']https?:\/\//i);
      expect(html).not.toMatch(/(?:src|href)=["'][^"']*(?:assets\/|config\/|dist\/)/i);
      expect(html).not.toMatch(/sourceMappingURL\s*=|(?:src|href)=["'][^"']+\.map(?:[?#][^"']*)?["']/i);
      expect(html).not.toMatch(/<script\b[^>]*\bsrc=["'][^"']+\.(?:m?js|css)/i);
      expect(html).not.toMatch(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["'][^"']+\.css/i);
    });

    test(`${exported.network} export boots visually from file URL`, async ({ page }) => {
      const diagnostics = await loadExport(page, exported.file);
      expect(diagnostics.pageErrors).toEqual([]);
      expect(diagnostics.externalFailures).toEqual([]);
      expect(diagnostics.snapshot?.remainingBoardCount).toBe(72);
      expect(diagnostics.snapshot?.ctaVisible).toBe(true);
      expect(diagnostics.snapshot?.formalSolvability).toBe('NOT YET PROVEN');
      expect(diagnostics.network?.network).toBe(exported.network);
      expect(diagnostics.bridgeType).toBe('function');
      expect(diagnostics.bridgeDiagnostics?.network).toBe(exported.network);
      expect(diagnostics.backgroundImage).toContain('blob:');
      expect(diagnostics.canvasVisible).toBe(true);
      expect(diagnostics.visuallyNonBlank).toBe(true);
      expect(diagnostics.audioEnabled).toBe(true);
    });

    test(`${exported.network} export CTA records store-open safely without mutating gameplay`, async ({ page }) => {
      await loadExport(page, exported.file);
      const before = await page.evaluate(() => window.__TILEPYRAMID_BUILD09__);

      await clickDesignPoint(page, 540, 1775);
      await page.waitForFunction(() => window.__TILEPYRAMID_BUILD09__?.storeOpenCallCount === 1);
      const result = await page.evaluate(() => ({
        storeOpenCallCount: window.__TILEPYRAMID_BUILD09__?.storeOpenCallCount,
        source: window.__PLAYABLE_STORE_OPEN_DIAGNOSTICS__?.source,
        method: window.__PLAYABLE_STORE_OPEN_DIAGNOSTICS__?.methodUsed,
        attemptedUrl: window.__PLAYABLE_STORE_OPEN_DIAGNOSTICS__?.attemptedUrl,
        remainingBoardCount: window.__TILEPYRAMID_BUILD09__?.remainingBoardCount,
        trayCount: window.__TILEPYRAMID_BUILD09__?.trayCount,
        timerStarted: window.__TILEPYRAMID_BUILD09__?.timerStarted,
        tutorialDismissed: window.__TILEPYRAMID_BUILD09__?.tutorialDismissed,
      }));
      expect(result.storeOpenCallCount).toBe(1);
      expect(result.source).toBe('gameplay-cta');
      expect(result.method).toBe('record-only');
      expect(result.attemptedUrl).toBe(ANDROID_URL);
      expect(result.remainingBoardCount).toBe(before?.remainingBoardCount);
      expect(result.trayCount).toBe(before?.trayCount);
      expect(result.timerStarted).toBe(false);
      expect(result.tutorialDismissed).toBe(false);
    });

    test(`${exported.network} export valid and blocked tile interactions preserve timer/tutorial rules`, async ({ page }) => {
      await loadExport(page, exported.file);
      const blockedTile = await page.evaluate(() => window.__TILEPYRAMID_BUILD09__?.tiles.find(tile => !tile.selectable)?.id);
      expect(blockedTile).toBeDefined();
      if (blockedTile) await clickTileById(page, blockedTile);
      await page.waitForTimeout(300);
      let snapshot = await page.evaluate(() => window.__TILEPYRAMID_BUILD09__);
      expect(snapshot?.timerStarted).toBe(false);
      expect(snapshot?.tutorialDismissed).toBe(false);

      await clickTileById(page, PREVIEW_IDS[0]);
      await page.waitForFunction(() => window.__TILEPYRAMID_BUILD09__?.timerStarted === true);
      snapshot = await page.evaluate(() => window.__TILEPYRAMID_BUILD09__);
      expect(snapshot?.timerStarted).toBe(true);
      expect(snapshot?.tutorialDismissed).toBe(true);
      expect(snapshot?.audioEnabled).toBe(true);
    });

    test(`${exported.network} export match-three still clears preview tiles`, async ({ page }) => {
      await loadExport(page, exported.file);
      for (const tileId of PREVIEW_IDS) {
        await clickTileById(page, tileId);
        await page.waitForTimeout(550);
      }
      await page.waitForFunction(
        () => window.__TILEPYRAMID_BUILD09__?.remainingBoardCount === 69 && window.__TILEPYRAMID_BUILD09__?.trayCount === 0,
        null,
        { timeout: 5_000 }
      );
      const snapshot = await page.evaluate(() => window.__TILEPYRAMID_BUILD09__);
      expect(snapshot?.lastMatchedTileType).toBe(1);
    });

    test(`${exported.network} export landscape keeps portrait gameplay centered and side areas inert`, async ({ page }) => {
      await page.setViewportSize({ width: 844, height: 390 });
      await loadExport(page, exported.file);
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
        bridgeMethod: window.__PLAYABLE_STORE_OPEN_DIAGNOSTICS__?.methodUsed,
      }));
      expect(snapshot.remainingBoardCount).toBe(72);
      expect(snapshot.trayCount).toBe(0);
      expect(snapshot.timerStarted).toBe(false);
      expect(snapshot.storeOpenCallCount).toBe(0);
      expect(snapshot.bridgeMethod).toBeNull();
    });

    test(`${exported.network} export fail end-card records store-open safely`, async ({ page }) => {
      await loadExport(page, exported.file);
      await clickTileById(page, PREVIEW_IDS[0]);
      await page.waitForFunction(
        () => window.__TILEPYRAMID_BUILD09__?.gameState === 'failed' && window.__TILEPYRAMID_BUILD09__?.endCardVisible === true,
        null,
        { timeout: 40_000 }
      );

      await clickDesignPoint(page, 540, 960);
      await page.waitForFunction(() => window.__TILEPYRAMID_BUILD09__?.endCardClickCount === 1);
      const snapshot = await page.evaluate(() => ({
        timerStarted: window.__TILEPYRAMID_BUILD09__?.timerStarted,
        timerExpired: window.__TILEPYRAMID_BUILD09__?.timerExpired,
        endCardReason: window.__TILEPYRAMID_BUILD09__?.endCardReason,
        source: window.__PLAYABLE_STORE_OPEN_DIAGNOSTICS__?.source,
        method: window.__PLAYABLE_STORE_OPEN_DIAGNOSTICS__?.methodUsed,
      }));
      expect(snapshot.timerStarted).toBe(true);
      expect(snapshot.timerExpired).toBe(true);
      expect(snapshot.endCardReason).toBe('fail');
      expect(snapshot.source).toBe('end-card');
      expect(snapshot.method).toBe('record-only');
    });
  }
});

async function loadExport(page: Page, relativePath: string) {
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => failedRequests.push(request.url()));
  await page.addInitScript(() => {
    window.__PLAYABLE_QA_MODE__ = true;
  });

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
      bridgeDiagnostics: window.__PLAYABLE_STORE_OPEN_DIAGNOSTICS__,
      backgroundImage: background ? getComputedStyle(background).backgroundImage : '',
      canvasVisible: Boolean(box && box.width > 0 && box.height > 0),
      nonBlankCanvas: canvas ? canvasHasNonBlankPixels(canvas) : false,
      audioEnabled: window.__TILEPYRAMID_BUILD09__?.audioEnabled ?? false,
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
