import { expect, test, type Page } from '@playwright/test';

const DESIGN_ASPECT = 9 / 16;
const PREVIEW_IDS = ['L2:-1.5:2.5', 'L2:-0.5:2.5', 'L2:0.5:2.5'];

async function waitForRuntime(page: Page): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('canvas', { timeout: 15_000 });
      await page.waitForFunction(() => window.__TILEPYRAMID_BUILD06__?.remainingBoardCount === 72, null, {
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
  const tile = await page.evaluate(id => window.__TILEPYRAMID_BUILD06__?.tiles.find(candidate => candidate.id === id), tileId);
  expect(tile).toBeDefined();
  if (!tile) return;
  await clickDesignPoint(page, tile.screenX, tile.screenY);
}

test.describe('Build-06 CTA, end-card, and store-open smoke tests', () => {
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

    const snapshot = await page.evaluate(() => window.__TILEPYRAMID_BUILD06__);
    expect(snapshot?.remainingBoardCount).toBe(72);
    expect(snapshot?.trayCount).toBe(0);
    expect(snapshot?.timerDisplaySeconds).toBe(30);
    expect(snapshot?.timerStarted).toBe(false);
  });

  test('initial tutorial is visible with highlights and hand indicator', async ({ page }) => {
    await page.goto('/');
    await waitForRuntime(page);

    const snapshot = await page.evaluate(() => window.__TILEPYRAMID_BUILD06__);
    expect(snapshot?.tutorialActive).toBe(true);
    expect(snapshot?.tutorialText).toBe('Tap to match!');
    expect(snapshot?.tutorialHighlightedTileIds).toEqual(PREVIEW_IDS);
    expect(snapshot?.tutorialHandVisible).toBe(true);
  });

  test('gameplay CTA is visible and records store-open without mutating gameplay', async ({ page }) => {
    await page.goto('/');
    await waitForRuntime(page);

    const before = await page.evaluate(() => window.__TILEPYRAMID_BUILD06__);
    expect(before?.ctaVisible).toBe(true);
    expect(before?.storeOpenCallCount).toBe(0);

    await clickDesignPoint(page, 540, 1775);
    await page.waitForFunction(() => window.__TILEPYRAMID_BUILD06__?.storeOpenCallCount === 1, null, {
      timeout: 4_000,
    });

    const after = await page.evaluate(() => window.__TILEPYRAMID_BUILD06__);
    expect(after?.ctaClickCount).toBe(1);
    expect(after?.lastStoreOpenSource).toBe('gameplay-cta');
    expect(after?.remainingBoardCount).toBe(before?.remainingBoardCount);
    expect(after?.trayCount).toBe(before?.trayCount);
    expect(after?.timerStarted).toBe(false);
    expect(after?.tutorialActive).toBe(true);
  });

  test('tapping a blocked tile does not start timer or dismiss tutorial', async ({ page }) => {
    await page.goto('/');
    await waitForRuntime(page);

    const blockedTile = await page.evaluate(() => window.__TILEPYRAMID_BUILD06__?.tiles.find(tile => !tile.selectable));
    expect(blockedTile).toBeDefined();
    if (!blockedTile) return;

    await clickDesignPoint(page, blockedTile.screenX, blockedTile.screenY);
    await page.waitForTimeout(300);

    const snapshot = await page.evaluate(() => window.__TILEPYRAMID_BUILD06__);
    expect(snapshot?.timerStarted).toBe(false);
    expect(snapshot?.timerDisplaySeconds).toBe(30);
    expect(snapshot?.tutorialActive).toBe(true);
    expect(snapshot?.tutorialDismissed).toBe(false);
  });

  test('valid tutorial tap starts timer, dismisses tutorial, and timer counts down', async ({ page }) => {
    await page.goto('/');
    await waitForRuntime(page);

    await clickTileById(page, PREVIEW_IDS[0]);
    await page.waitForFunction(
      () =>
        window.__TILEPYRAMID_BUILD06__?.timerStarted === true &&
        window.__TILEPYRAMID_BUILD06__?.tutorialDismissed === true,
      null,
      { timeout: 8_000 }
    );

    await page.waitForFunction(
      () => (window.__TILEPYRAMID_BUILD06__?.timerRemaining ?? 30) < 29.5,
      null,
      { timeout: 4_000 }
    );

    const snapshot = await page.evaluate(() => window.__TILEPYRAMID_BUILD06__);
    expect(snapshot?.tutorialActive).toBe(false);
    expect(snapshot?.timerStarted).toBe(true);
    expect(snapshot?.timerRemaining).toBeLessThan(30);
  });

  test('idle hint appears after enough idle time', async ({ page }) => {
    await page.goto('/');
    await waitForRuntime(page);

    await clickTileById(page, PREVIEW_IDS[0]);
    await page.waitForFunction(
      () => window.__TILEPYRAMID_BUILD06__?.inputLocked === false && window.__TILEPYRAMID_BUILD06__?.tutorialDismissed === true,
      null,
      { timeout: 8_000 }
    );
    await page.waitForFunction(() => window.__TILEPYRAMID_BUILD06__?.idleHintActive === true, null, {
      timeout: 12_000,
    });

    const snapshot = await page.evaluate(() => window.__TILEPYRAMID_BUILD06__);
    expect(snapshot?.idleHintActive).toBe(true);
    expect(snapshot?.idleHintTargetTileId).toBeTruthy();
  });

  test('tapping three tutorial-preview matching tiles still resolves the tray match', async ({ page }) => {
    await page.goto('/');
    await waitForRuntime(page);

    for (let i = 0; i < PREVIEW_IDS.length; i++) {
      await clickTileById(page, PREVIEW_IDS[i]);
      const expectedBoardCount = 71 - i;
      await page.waitForFunction(
        ([boardCount]) =>
          window.__TILEPYRAMID_BUILD06__?.remainingBoardCount === boardCount &&
          window.__TILEPYRAMID_BUILD06__?.inputLocked === false,
        [expectedBoardCount],
        { timeout: 8_000 }
      );
    }

    await page.waitForFunction(
      () =>
        window.__TILEPYRAMID_BUILD06__?.remainingBoardCount === 69 &&
        window.__TILEPYRAMID_BUILD06__?.trayCount === 0 &&
        window.__TILEPYRAMID_BUILD06__?.matchResolving === false &&
        window.__TILEPYRAMID_BUILD06__?.inputLocked === false,
      null,
      { timeout: 8_000 }
    );

    const snapshot = await page.evaluate(() => window.__TILEPYRAMID_BUILD06__);
    expect(snapshot?.lastMatchedTileType).toBe(1);
    expect(snapshot?.gameState).toBe('playing');
  });

  test('formal solvability remains not yet proven', async ({ page }) => {
    await page.goto('/');
    await waitForRuntime(page);

    const solvability = await page.evaluate(() => window.__TILEPYRAMID_BUILD06__?.formalSolvability);
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

  test('side background areas do not trigger gameplay or store open', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto('/');
    await waitForRuntime(page);

    const box = await page.locator('canvas').first().boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    await page.mouse.click(Math.max(2, box.x - 20), box.y + box.height / 2);
    await page.waitForTimeout(300);

    const snapshot = await page.evaluate(() => window.__TILEPYRAMID_BUILD06__);
    expect(snapshot?.remainingBoardCount).toBe(72);
    expect(snapshot?.trayCount).toBe(0);
    expect(snapshot?.timerStarted).toBe(false);
    expect(snapshot?.storeOpenCallCount).toBe(0);
  });
});
