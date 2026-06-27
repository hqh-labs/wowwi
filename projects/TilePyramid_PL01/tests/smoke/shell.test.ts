import { expect, test, type Page } from '@playwright/test';

const DESIGN_ASPECT = 9 / 16;
const PREVIEW_IDS = ['L2:-1.5:2.5', 'L2:-0.5:2.5', 'L2:0.5:2.5'];

async function waitForRuntime(page: Page): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('canvas', { timeout: 15_000 });
      await page.waitForFunction(() => window.__TILEPYRAMID_BUILD04__?.remainingBoardCount === 72, null, {
        timeout: 15_000,
      });
      return;
    } catch (error) {
      lastError = error;
      await page.reload({ waitUntil: 'domcontentloaded' });
    }
  }

  throw lastError;
}

async function clickDesignPoint(page: Page, x: number, y: number): Promise<void> {
  const box = await page.locator('canvas').first().boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await page.mouse.click(box.x + (x / 1080) * box.width, box.y + (y / 1920) * box.height);
}

async function clickTileById(page: Page, tileId: string): Promise<void> {
  const tile = await page.evaluate(id => window.__TILEPYRAMID_BUILD04__?.tiles.find(candidate => candidate.id === id), tileId);
  expect(tile).toBeDefined();
  if (!tile) return;
  await clickDesignPoint(page, tile.screenX, tile.screenY);
}

test.describe('Build-04 match smoke tests', () => {
  test.describe.configure({ timeout: 90_000 });

  test('app loads without uncaught JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto('/');
    await waitForRuntime(page);

    expect(errors, `Uncaught errors: ${errors.join('; ')}`).toHaveLength(0);
  });

  test('initial board has 72 tiles and tray starts empty', async ({ page }) => {
    await page.goto('/');
    await waitForRuntime(page);

    const snapshot = await page.evaluate(() => window.__TILEPYRAMID_BUILD04__);
    expect(snapshot?.remainingBoardCount).toBe(72);
    expect(snapshot?.trayCount).toBe(0);
  });

  test('tapping three tutorial-preview matching tiles resolves the tray match', async ({ page }) => {
    await page.goto('/');
    await waitForRuntime(page);

    for (let i = 0; i < PREVIEW_IDS.length; i++) {
      await clickTileById(page, PREVIEW_IDS[i]);
      const expectedBoardCount = 71 - i;
      await page.waitForFunction(
        ([boardCount]) =>
          window.__TILEPYRAMID_BUILD04__?.remainingBoardCount === boardCount &&
          window.__TILEPYRAMID_BUILD04__?.inputLocked === false,
        [expectedBoardCount],
        { timeout: 8_000 }
      );
    }

    await page.waitForFunction(
      () =>
        window.__TILEPYRAMID_BUILD04__?.remainingBoardCount === 69 &&
        window.__TILEPYRAMID_BUILD04__?.trayCount === 0 &&
        window.__TILEPYRAMID_BUILD04__?.matchResolving === false &&
        window.__TILEPYRAMID_BUILD04__?.inputLocked === false,
      null,
      { timeout: 8_000 }
    );

    const snapshot = await page.evaluate(() => window.__TILEPYRAMID_BUILD04__);
    expect(snapshot?.lastMatchedTileType).toBe(1);
    expect(snapshot?.gameState).toBe('playing');
  });

  test('formal solvability remains not yet proven', async ({ page }) => {
    await page.goto('/');
    await waitForRuntime(page);

    const solvability = await page.evaluate(() => window.__TILEPYRAMID_BUILD04__?.formalSolvability);
    expect(solvability).toBe('NOT YET PROVEN');
  });

  test('landscape still keeps portrait gameplay centered', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');
    await waitForRuntime(page);

    const box = await page.locator('canvas').first().boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    expect(box.height).toBeGreaterThan(box.width);
    expect(box.width / box.height).toBeGreaterThan(DESIGN_ASPECT * 0.98);
    expect(box.width / box.height).toBeLessThan(DESIGN_ASPECT * 1.02);
    expect(Math.abs(box.x + box.width / 2 - 422)).toBeLessThan(5);
  });

  test('side background areas do not trigger gameplay', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');
    await waitForRuntime(page);

    const box = await page.locator('canvas').first().boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    await page.mouse.click(Math.max(2, box.x - 20), box.y + box.height / 2);
    await page.waitForTimeout(300);

    const snapshot = await page.evaluate(() => window.__TILEPYRAMID_BUILD04__);
    expect(snapshot?.remainingBoardCount).toBe(72);
    expect(snapshot?.trayCount).toBe(0);
  });
});
