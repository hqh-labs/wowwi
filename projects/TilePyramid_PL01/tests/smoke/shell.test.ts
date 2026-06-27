import { expect, test, type Page } from '@playwright/test';

const DESIGN_ASPECT = 9 / 16;

async function waitForRuntime(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('canvas', { timeout: 20_000 });
  await page.waitForFunction(() => window.__TILEPYRAMID_BUILD03__?.remainingBoardCount === 72, null, {
    timeout: 20_000,
  });
}

async function clickDesignPoint(page: Page, x: number, y: number): Promise<void> {
  const box = await page.locator('canvas').first().boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  await page.mouse.click(box.x + (x / 1080) * box.width, box.y + (y / 1920) * box.height);
}

test.describe('Build-03 tray smoke tests', () => {
  test('app loads without uncaught JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto('/');
    await waitForRuntime(page);

    expect(errors, `Uncaught errors: ${errors.join('; ')}`).toHaveLength(0);
  });

  test('initial board has 72 tiles', async ({ page }) => {
    await page.goto('/');
    await waitForRuntime(page);

    const count = await page.evaluate(() => window.__TILEPYRAMID_BUILD03__?.remainingBoardCount);
    expect(count).toBe(72);
  });

  test('tray has 5 slots', async ({ page }) => {
    await page.goto('/');
    await waitForRuntime(page);

    const slotCount = await page.evaluate(() => window.__TILEPYRAMID_BUILD03__?.traySlotCount);
    expect(slotCount).toBe(5);
  });

  test('tapping a selectable tile moves one tile to tray', async ({ page }) => {
    await page.goto('/');
    await waitForRuntime(page);

    const tile = await page.evaluate(() =>
      window.__TILEPYRAMID_BUILD03__?.tiles.find(candidate => candidate.selectable)
    );
    expect(tile).toBeDefined();
    if (!tile) return;

    await clickDesignPoint(page, tile.screenX, tile.screenY);
    await page.waitForFunction(() => window.__TILEPYRAMID_BUILD03__?.trayCount === 1, null, {
      timeout: 5_000,
    });

    const snapshot = await page.evaluate(() => window.__TILEPYRAMID_BUILD03__);
    expect(snapshot?.remainingBoardCount).toBe(71);
    expect(snapshot?.trayCount).toBe(1);
    expect(snapshot?.inputLocked).toBe(false);
  });

  test('tapping a blocked tile does not add to tray', async ({ page }) => {
    await page.goto('/');
    await waitForRuntime(page);

    const tile = await page.evaluate(() =>
      window.__TILEPYRAMID_BUILD03__?.tiles.find(candidate => !candidate.selectable)
    );
    expect(tile).toBeDefined();
    if (!tile) return;

    await clickDesignPoint(page, tile.screenX, tile.screenY);
    await page.waitForTimeout(500);

    const snapshot = await page.evaluate(() => window.__TILEPYRAMID_BUILD03__);
    expect(snapshot?.remainingBoardCount).toBe(72);
    expect(snapshot?.trayCount).toBe(0);
  });

  test('portrait shell remains correct', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await waitForRuntime(page);

    const box = await page.locator('canvas').first().boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    expect(box.width / box.height).toBeGreaterThan(DESIGN_ASPECT * 0.98);
    expect(box.width / box.height).toBeLessThan(DESIGN_ASPECT * 1.02);
    expect(box.width).toBeLessThanOrEqual(391);
    expect(box.height).toBeLessThanOrEqual(845);
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

    const snapshot = await page.evaluate(() => window.__TILEPYRAMID_BUILD03__);
    expect(snapshot?.remainingBoardCount).toBe(72);
    expect(snapshot?.trayCount).toBe(0);
  });

  test('formal solvability remains not yet proven', async ({ page }) => {
    await page.goto('/');
    await waitForRuntime(page);

    const solvability = await page.evaluate(() => window.__TILEPYRAMID_BUILD03__?.formalSolvability);
    expect(solvability).toBe('NOT YET PROVEN');
  });
});
