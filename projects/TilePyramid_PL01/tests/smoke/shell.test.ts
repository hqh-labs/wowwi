import { expect, test, type Page } from '@playwright/test';

const DESIGN_ASPECT = 9 / 16;

async function waitForBoard(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('canvas', { timeout: 20_000 });
  await page.waitForFunction(() => window.__TILEPYRAMID_BUILD02__?.tileCount === 72, null, {
    timeout: 20_000,
  });
}

test.describe('Build-02 board smoke tests', () => {
  test('app loads without uncaught JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto('/');
    await waitForBoard(page);

    expect(errors, `Uncaught errors: ${errors.join('; ')}`).toHaveLength(0);
  });

  test('exactly 72 tile sprites exist', async ({ page }) => {
    await page.goto('/');
    await waitForBoard(page);

    const spriteCount = await page.evaluate(() => window.__TILEPYRAMID_BUILD02__?.spriteCount);
    expect(spriteCount).toBe(72);
  });

  test('board is visible inside gameplay viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await waitForBoard(page);

    const snapshot = await page.evaluate(() => window.__TILEPYRAMID_BUILD02__);
    expect(snapshot?.boardBounds.left).toBeGreaterThanOrEqual(0);
    expect(snapshot?.boardBounds.right).toBeLessThanOrEqual(1080);
    expect(snapshot?.boardBounds.top).toBeGreaterThanOrEqual(0);
    expect(snapshot?.boardBounds.bottom).toBeLessThanOrEqual(1920);
  });

  test('portrait shell remains correct', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await waitForBoard(page);

    const box = await page.locator('canvas').first().boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    expect(box.width / box.height).toBeGreaterThan(DESIGN_ASPECT * 0.98);
    expect(box.width / box.height).toBeLessThan(DESIGN_ASPECT * 1.02);
    expect(box.width).toBeLessThanOrEqual(391);
    expect(box.height).toBeLessThanOrEqual(845);
  });

  test('landscape still uses centered portrait gameplay viewport', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');
    await waitForBoard(page);

    const box = await page.locator('canvas').first().boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    expect(box.height).toBeGreaterThan(box.width);
    expect(box.width / box.height).toBeGreaterThan(DESIGN_ASPECT * 0.98);
    expect(box.width / box.height).toBeLessThan(DESIGN_ASPECT * 1.02);
    expect(Math.abs(box.x + box.width / 2 - 422)).toBeLessThan(5);
  });

  test('board does not move into landscape side-background areas', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');
    await waitForBoard(page);

    const canvasBox = await page.locator('canvas').first().boundingBox();
    const snapshot = await page.evaluate(() => window.__TILEPYRAMID_BUILD02__);
    expect(canvasBox).not.toBeNull();
    expect(snapshot).toBeDefined();
    if (!canvasBox || !snapshot) return;

    const scale = canvasBox.width / 1080;
    const boardLeft = canvasBox.x + snapshot.boardBounds.left * scale;
    const boardRight = canvasBox.x + snapshot.boardBounds.right * scale;
    expect(boardLeft).toBeGreaterThanOrEqual(canvasBox.x);
    expect(boardRight).toBeLessThanOrEqual(canvasBox.x + canvasBox.width);
  });

  test('debug diagnostics report 72 tiles', async ({ page }) => {
    await page.goto('/');
    await waitForBoard(page);

    const tileCount = await page.evaluate(() => window.__TILEPYRAMID_BUILD02__?.tileCount);
    expect(tileCount).toBe(72);
  });

  test('formal solvability is shown as not yet proven', async ({ page }) => {
    await page.goto('/');
    await waitForBoard(page);

    const solvability = await page.evaluate(() => window.__TILEPYRAMID_BUILD02__?.formalSolvability);
    expect(solvability).toBe('NOT YET PROVEN');
  });

  test('background layer covers the full viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await waitForBoard(page);

    const bgBox = await page.locator('#bg-layer').first().boundingBox();
    expect(bgBox).not.toBeNull();
    if (!bgBox) return;

    expect(bgBox.width).toBeCloseTo(390, 0);
    expect(bgBox.height).toBeCloseTo(844, 0);
  });
});
