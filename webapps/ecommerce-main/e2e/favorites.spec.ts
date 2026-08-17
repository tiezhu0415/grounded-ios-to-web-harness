import { test, expect } from '@playwright/test';

const EVIDENCE_DIR = '../../.runs/2026-08-11';

async function waitForProducts(page) {
  await expect(page.getByTestId('product-card').first()).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/store/products');
  await page.evaluate(() => localStorage.clear());
  await waitForProducts(page);
});

test('toggles favorite on product card', async ({ page }) => {
  const button = page.getByTestId('product-card').first().getByTestId('favorite-button');
  await expect(button).toHaveAttribute('aria-pressed', 'false');

  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');

  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'false');
});

test('shows favorites list', async ({ page }) => {
  const cards = page.getByTestId('product-card');
  await cards.nth(0).getByTestId('favorite-button').click();
  await expect(cards.nth(0).getByTestId('favorite-button')).toHaveAttribute('aria-pressed', 'true');
  await cards.nth(2).getByTestId('favorite-button').click();
  await expect(cards.nth(2).getByTestId('favorite-button')).toHaveAttribute('aria-pressed', 'true');

  await page.getByTestId('tab-favorites').click();
  await expect(page).toHaveURL(/\/favorites$/);
  await expect(page.getByTestId('favorites-view')).toBeVisible();

  const items = page.getByTestId('favorite-item');
  await expect(items).toHaveCount(2);
  await page.screenshot({ path: `${EVIDENCE_DIR}/web-favorites-list.png` });
});

test('navigates from favorite to detail', async ({ page }) => {
  const firstCard = page.getByTestId('product-card').first();
  const name = await firstCard.getByTestId('product-name').textContent();
  await firstCard.getByTestId('favorite-button').click();

  await page.getByTestId('tab-favorites').click();
  await page.getByTestId('favorite-item').first().click();

  await expect(page.getByTestId('product-detail')).toBeVisible();
  await expect(page.getByTestId('product-detail-name')).toHaveText(name ?? '');
});

test('removes favorite from detail and updates list', async ({ page }) => {
  const firstCard = page.getByTestId('product-card').first();
  await firstCard.getByTestId('favorite-button').click();

  await page.getByTestId('tab-favorites').click();
  await expect(page.getByTestId('favorite-item')).toHaveCount(1);

  await page.getByTestId('favorite-item').first().click();
  await page.getByTestId('product-detail').getByTestId('favorite-button').click();
  await page.getByTestId('back-button').click();

  await expect(page.getByTestId('favorites-empty')).toBeVisible();
});

test('shows empty state when no favorites', async ({ page }) => {
  await page.getByTestId('tab-favorites').click();
  await expect(page.getByTestId('favorites-empty')).toBeVisible();
  await expect(page.getByTestId('favorites-empty')).toContainText('Your favorite list is empty');
  await page.screenshot({ path: `${EVIDENCE_DIR}/web-favorites-empty.png` });
});

test('persists favorites across reload', async ({ page }) => {
  const firstCard = page.getByTestId('product-card').first();
  await firstCard.getByTestId('favorite-button').click();

  await page.reload();
  await waitForProducts(page);

  await expect(firstCard.getByTestId('favorite-button')).toHaveAttribute('aria-pressed', 'true');

  await page.getByTestId('tab-favorites').click();
  await expect(page.getByTestId('favorite-item')).toHaveCount(1);
});
