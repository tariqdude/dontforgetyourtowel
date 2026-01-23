import { test } from '@playwright/test';

test.describe.skip('Shop Demo (skipped after homepage rework)', () => {
  test('placeholder', async ({ page }) => {
    await page.goto('./shop-demo/');
  });
});
