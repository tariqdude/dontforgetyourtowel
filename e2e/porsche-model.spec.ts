import { test, expect } from '@playwright/test';

type ModelFetchInfo = {
  url: string;
  ok: boolean;
  status: number;
  contentLength: string | null;
  contentType: string | null;
  error?: string;
};

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

    await page.goto('./gallery/', { waitUntil: 'domcontentloaded' });

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

    // Switch to Porsche scene using the gallery's debug hook.
    await expect
      .poll(
        async () => page.evaluate(() => typeof window.__goToSceneOriginal),
        {
          timeout: 10_000,
        }
      )
      .toBe('function');

    await page.evaluate(() => {
      window.__goToSceneOriginal?.(17);
    });

    // Sanity-check that the model URL is actually reachable (helps pinpoint base-path issues).
    const modelFetchInfo: ModelFetchInfo = await page.evaluate(async () => {
      const pathname = window.location.pathname;
      const idx = pathname.indexOf('/gallery');
      const basePath = idx >= 0 ? pathname.slice(0, idx + 1) : '/';
      const url = `${basePath}models/porsche-911-gt3rs.glb`;
      try {
        const res = await fetch(url, { cache: 'no-store' });
        return {
          url,
          ok: res.ok,
          status: res.status,
          contentLength: res.headers.get('content-length'),
          contentType: res.headers.get('content-type'),
        };
      } catch (e) {
        return {
          url,
          ok: false,
          status: -1,
          contentLength: null,
          contentType: null,
          error: String(e),
        };
      }
    });
    expect(
      modelFetchInfo.ok,
      `Expected Porsche GLB to be fetchable. Info: ${JSON.stringify(modelFetchInfo)}`
    ).toBeTruthy();

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

    // Ensure the Porsche scene lifecycle hook ran (some builds may init scenes lazily).
    await expect
      .poll(
        async () =>
          page.evaluate(
            () => document.documentElement.dataset.porscheSceneInit ?? '0'
          ),
        { timeout: 15_000 }
      )
      .toBe('1');

    // Confirm the external model actually loaded (or fail fast on parse/load error).
    await page.waitForFunction(
      () => {
        const ds = document.documentElement.dataset;
        return (
          ds.porscheModelLoaded === '1' ||
          ds.porscheModelError === '1' ||
          ds.porscheModelMissing === '1'
        );
      },
      null,
      { timeout: 45_000 }
    );

    const breadcrumbs = await page.evaluate(() => ({
      requested: document.documentElement.dataset.porscheModelRequested ?? '0',
      url: document.documentElement.dataset.porscheModelUrl ?? '',
      loaded: document.documentElement.dataset.porscheModelLoaded ?? '0',
      error: document.documentElement.dataset.porscheModelError ?? '0',
      errorMessage:
        document.documentElement.dataset.porscheModelErrorMessage ?? '',
      missing: document.documentElement.dataset.porscheModelMissing ?? '0',
    }));

    expect(
      breadcrumbs.error,
      `Porsche model parse/load error breadcrumb set: ${JSON.stringify(breadcrumbs)}`
    ).not.toBe('1');
    expect(
      breadcrumbs.missing,
      `Porsche model was reported missing: ${JSON.stringify(breadcrumbs)}`
    ).not.toBe('1');
    expect(
      breadcrumbs.loaded,
      `Porsche model never reported as loaded: ${JSON.stringify(breadcrumbs)}`
    ).toBe('1');

    // Should not show the error overlay.
    await expect(page.locator('.tower3d-error-overlay')).toHaveCount(0);

    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  });
});
