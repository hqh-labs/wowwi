import { test, expect, type Page } from '@playwright/test';

const DESIGN_ASPECT = 9 / 16; // width / height ≈ 0.5625

async function waitForCanvas(page: Page): Promise<void> {
  await page.waitForSelector('canvas', { timeout: 10_000 });
  // Allow Phaser to complete its boot sequence.
  await page.waitForTimeout(1500);
}

test.describe('Shell smoke tests', () => {
  test('loads without uncaught JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    await page.goto('/');
    await waitForCanvas(page);

    expect(errors, `Uncaught errors: ${errors.join('; ')}`).toHaveLength(0);
  });

  test('canvas is visible in portrait (390×844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await waitForCanvas(page);

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
  });

  test('canvas is approximately 9:16 in portrait (390×844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await waitForCanvas(page);

    const box = await page.locator('canvas').first().boundingBox();
    expect(box, 'canvas bounding box must exist').not.toBeNull();
    if (!box) return;

    const ratio = box.width / box.height;
    // Allow ±2% tolerance for sub-pixel rounding.
    expect(ratio).toBeGreaterThan(DESIGN_ASPECT * 0.98);
    expect(ratio).toBeLessThan(DESIGN_ASPECT * 1.02);
  });

  test('canvas fits within the portrait viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await waitForCanvas(page);

    const box = await page.locator('canvas').first().boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    expect(box.width).toBeLessThanOrEqual(391);
    expect(box.height).toBeLessThanOrEqual(845);
  });

  test('canvas remains portrait-oriented in landscape (844×390)', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');
    await waitForCanvas(page);

    const box = await page.locator('canvas').first().boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    // Canvas must be taller than wide (portrait orientation preserved).
    expect(box.height).toBeGreaterThan(box.width);
  });

  test('canvas is approximately 9:16 in landscape (844×390)', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');
    await waitForCanvas(page);

    const box = await page.locator('canvas').first().boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    const ratio = box.width / box.height;
    expect(ratio).toBeGreaterThan(DESIGN_ASPECT * 0.98);
    expect(ratio).toBeLessThan(DESIGN_ASPECT * 1.02);
  });

  test('canvas fits within the landscape viewport', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');
    await waitForCanvas(page);

    const box = await page.locator('canvas').first().boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    expect(box.width).toBeLessThanOrEqual(845);
    expect(box.height).toBeLessThanOrEqual(391);
  });

  test('canvas is horizontally centered in landscape (844×390)', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');
    await waitForCanvas(page);

    const box = await page.locator('canvas').first().boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    const centerX = box.x + box.width / 2;
    expect(Math.abs(centerX - 422)).toBeLessThan(5); // 844/2 = 422
  });

  test('background layer covers the full viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await waitForCanvas(page);

    const bgBox = await page.locator('#bg-layer').first().boundingBox();
    expect(bgBox).not.toBeNull();
    if (!bgBox) return;

    expect(bgBox.width).toBeCloseTo(390, 0);
    expect(bgBox.height).toBeCloseTo(844, 0);
  });

  test('background layer covers the full landscape viewport', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');
    await waitForCanvas(page);

    const bgBox = await page.locator('#bg-layer').first().boundingBox();
    expect(bgBox).not.toBeNull();
    if (!bgBox) return;

    expect(bgBox.width).toBeCloseTo(844, 0);
    expect(bgBox.height).toBeCloseTo(390, 0);
  });
});
