import { test, expect } from '@playwright/test';

test.describe('Car Showroom Bug', () => {
  test('should display the 3D model', async ({ page }) => {
    await page.goto('./car-showroom/');

    await expect
      .poll(
        async () =>
          page.evaluate(
            () => document.documentElement.dataset.carShowroomBoot ?? '0'
          ),
        { timeout: 15_000 }
      )
      .toBe('1');

    const webglBoot = await page.evaluate(
      () => document.documentElement.dataset.carShowroomWebgl ?? '0'
    );
    if (webglBoot !== '1') {
      test.skip(
        true,
        'WebGL renderer could not initialize in this environment'
      );
    }

    // Wait for the canvas to be visible
    const canvas = page.locator('[data-sr-canvas]');
    await expect(canvas).toBeVisible({ timeout: 15000 });

    // Check if the model is loaded by inspecting the dataset attribute
    await expect
      .poll(
        async () => {
          const root = await page.locator('[data-sr-root]');
          const isReady = await root.getAttribute('data-car-showroom-ready');
          return isReady === '1';
        },
        { timeout: 30000 }
      )
      .toBe(true);
  });
});
