import { test, expect } from '@playwright/test';

test.describe('Porsche model (scene17)', () => {
  test('should load the external GLB when present', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      // Keep the suite resilient to unrelated optional-asset 404 noise.
      const isOptional404 =
        text.includes('404') || text.includes('Failed to load resource');
      if (!isOptional404) consoleErrors.push(text);
    });

    await page.goto('./gallery/?scene=scene17', {
      waitUntil: 'domcontentloaded',
    });

    // Wait for the gallery boot module to run and UI wiring to be attached.
    await expect
      .poll(
        async () =>
          page.evaluate(
            () => document.documentElement.dataset.galleryBoot ?? '0'
          ),
        { timeout: 15_000 }
      )
      .toBe('1');

    await expect(page.locator('[data-gallery-loader]')).toHaveCount(0, {
      timeout: 15_000,
    });

    // Ensure auto-play can't fight the test.
    await page.evaluate(() => {
      window.__galleryAutoPlay?.stop?.();
    });

    // Confirm director switched scenes.
    await expect
      .poll(
        async () =>
          page.evaluate(
            () =>
              document.querySelector<HTMLElement>('[data-tower3d-root]')
                ?.dataset.towerScene ?? ''
          ),
        { timeout: 20_000 }
      )
      .toBe('scene17');

    // Confirm the external model actually loaded.
    await expect
      .poll(
        async () =>
          page.evaluate(
            () => document.documentElement.dataset.porscheModelLoaded ?? '0'
          ),
        { timeout: 20_000 }
      )
      .toBe('1');

    // Should not show the error overlay.
    await expect(page.locator('.tower3d-error-overlay')).toHaveCount(0);

    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  });
});
