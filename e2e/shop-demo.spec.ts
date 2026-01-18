import { test, expect } from '@playwright/test';

test.describe('Shop Demo', () => {
  test('should load and render heading', async ({ page }) => {
    await page.goto('./shop-demo/');
    await expect(
      page.getByRole('heading', { name: /^shop demo$/i })
    ).toBeVisible();
  });

  test('should add items to cart and persist after reload', async ({
    page,
  }) => {
    await page.goto('./shop-demo/');
    await expect(
      page.getByRole('heading', { name: /^shop demo$/i })
    ).toBeVisible();

    const cartButton = page.locator('[data-ecom="cart-button"]');
    await expect(cartButton).toBeVisible();

    // Add a product to cart.
    const addButton = page.locator('[data-ecom="add-to-cart"]').first();
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Cart should open and show at least one item.
    const cart = page.locator('[data-ecom="cart"]');
    if (await cart.count()) {
      await expect(cart).toBeVisible();
    } else {
      await cartButton.click();
      await expect(cart).toBeVisible();
    }
    await expect(page.getByText(/\b1\sitem\b/i)).toBeVisible();

    // Close cart.
    await page.getByRole('button', { name: /^close$/i }).click();
    await expect(cart).toBeHidden();

    // Reload and re-open cart; item count should persist.
    await page.reload();
    await expect(cartButton).toBeVisible();
    await cartButton.click();

    const cartAfter = page.locator('[data-ecom="cart"]');
    await expect(cartAfter).toBeVisible();
    await expect(page.getByText(/\b1\sitem\b/i)).toBeVisible();
  });

  test('should allow comparing products', async ({ page }) => {
    await page.goto('./shop-demo/');

    // Add first two products to compare.
    await page.locator('[data-ecom="compare-toggle"]').nth(0).click();
    await page.locator('[data-ecom="compare-toggle"]').nth(1).click();

    await page.locator('[data-ecom="compare-open"]').click();

    const compare = page.locator('[data-ecom="compare"]');
    await expect(compare).toBeVisible();

    // Should show at least a price row.
    await expect(compare.getByText(/^Price$/)).toBeVisible();

    await compare.getByRole('button', { name: /^close$/i }).click();
    await expect(compare).toBeHidden();
  });
});
