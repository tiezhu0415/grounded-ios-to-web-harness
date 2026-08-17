import { test, expect } from '@playwright/test';

const EVIDENCE_DIR = '../../.runs/2026-08-11';

async function waitForProducts(page) {
  await expect(page.getByTestId('product-card').first()).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/store/products');
  await waitForProducts(page);
});

test('opens product detail from its direct URL', async ({ page }) => {
  await page.goto('/products/10000');
  await expect(page.getByTestId('product-detail')).toBeVisible();
  await expect(page.getByTestId('product-detail-name')).toHaveText('Stretch Cotton Piqué Polo Dress');
  await expect(page.getByTestId('product-detail-brand')).toHaveText('Lacoste');
  await expect(page).toHaveURL(/\/products\/10000$/);
  await page.screenshot({ path: `${EVIDENCE_DIR}/web-product-detail.png` });
});

test('switches variant image and color label', async ({ page }) => {
  await page.getByTestId('product-card').first().click();
  await expect(page).toHaveURL(/\/products\/10000$/);
  await expect(page.getByTestId('product-detail')).toBeVisible();

  const firstColor = await page.getByTestId('selected-variant-color').textContent();
  const thumbnails = page.getByTestId('variant-thumbnail');
  await expect(thumbnails.first()).toHaveClass(/selected/);

  await thumbnails.nth(1).click();
  await expect(thumbnails.nth(1)).toHaveClass(/selected/);

  const newColor = await page.getByTestId('selected-variant-color').textContent();
  expect(newColor).not.toBe(firstColor);

  const firstImage = page.getByTestId('product-detail-image');
  await expect(firstImage).toHaveAttribute('src', /.+/);
});

test('selects and deselects size', async ({ page }) => {
  await page.getByTestId('product-card').first().click();
  const sizeChip = page.getByTestId('size-chip').first();

  await sizeChip.click();
  await expect(sizeChip).toHaveAttribute('aria-pressed', 'true');

  await sizeChip.click();
  await expect(sizeChip).toHaveAttribute('aria-pressed', 'false');
});

test('shows discounted price with strikethrough original', async ({ page }) => {
  const discountedCard = page.locator('[data-testid="product-card"]:has(.discount-tag)').first();
  await expect(discountedCard).toBeVisible();
  await discountedCard.click();

  await expect(page.getByTestId('product-detail')).toBeVisible();
  await expect(page.getByTestId('product-detail-original-price')).toBeVisible();
  await expect(page.getByTestId('product-detail-discounted-price')).toBeVisible();
});

test('shows NEW IN tag when applicable', async ({ page }) => {
  const newInCard = page.locator('[data-testid="product-card"]:has(.new-in-tag)').first();
  await expect(newInCard).toBeVisible();
  await newInCard.click();

  await expect(page.getByTestId('product-detail')).toBeVisible();
  await expect(page.getByTestId('product-detail-new-in-tag')).toBeVisible();
});

test('returns to store list with back button', async ({ page }) => {
  await page.getByTestId('product-card').first().click();
  await expect(page.getByTestId('product-detail')).toBeVisible();

  await page.getByTestId('back-button').click();
  await expect(page).toHaveURL(/\/store\/products$/);
  await expect(page.getByTestId('product-list')).toBeVisible();
});
