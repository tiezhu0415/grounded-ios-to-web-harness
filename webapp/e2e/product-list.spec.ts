import { test, expect } from '@playwright/test';

const EVIDENCE_DIR = '../.runs/2026-08-10';

async function waitForProducts(page) {
  await expect(page.getByTestId('product-card').first()).toBeVisible();
}

test('page loads and displays product list heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /store/i })).toBeVisible();
  await expect(page.getByTestId('product-list')).toBeVisible();
  await expect(page.getByTestId('product-card').first()).toBeVisible();
  await page.screenshot({ path: `${EVIDENCE_DIR}/web-normal-state.png` });
});

test('category filter shows only products from selected category', async ({ page }) => {
  await page.goto('/');
  await waitForProducts(page);
  await page.getByRole('button', { name: 'Shoes' }).click();
  await expect(page.getByTestId('active-category')).toHaveText('Shoes');

  const cards = page.getByTestId('product-card');
  await expect(cards.first()).toBeVisible();
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    await expect(cards.nth(i).getByTestId('product-category')).toHaveText('Shoes');
  }
  await page.screenshot({ path: `${EVIDENCE_DIR}/web-filtered-state.png` });
});

test('subcategory filter narrows results', async ({ page }) => {
  await page.goto('/');
  await waitForProducts(page);
  await page.getByRole('button', { name: 'Clothing' }).click();
  await page.getByRole('button', { name: 'Dresses' }).click();

  const cards = page.getByTestId('product-card');
  await expect(cards.first()).toBeVisible();
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(cards.nth(i).getByTestId('product-subcategory')).toHaveText('Dresses');
  }
  await page.screenshot({ path: `${EVIDENCE_DIR}/web-subcategory-state.png` });
});

test('empty state is shown when no products match', async ({ page }) => {
  await page.goto('/?empty=1');
  await expect(page.getByTestId('empty-state')).toBeVisible();
  await page.screenshot({ path: `${EVIDENCE_DIR}/web-empty-state.png` });
});

test('error state is shown when data fails to load', async ({ page }) => {
  await page.goto('/?error=1');
  await expect(page.getByTestId('error-state')).toBeVisible();
  await page.screenshot({ path: `${EVIDENCE_DIR}/web-error-state.png` });
});

test('loads more products on scroll', async ({ page }) => {
  await page.goto('/');
  await waitForProducts(page);
  const firstCount = await page.getByTestId('product-card').count();
  await page.getByTestId('load-more-button').click();
  await expect(async () => {
    const count = await page.getByTestId('product-card').count();
    expect(count).toBeGreaterThan(firstCount);
  }).toPass();
});

test('shows discount and NEW IN labels', async ({ page }) => {
  await page.goto('/');
  await waitForProducts(page);
  await page.getByRole('button', { name: 'Shoes' }).click();
  await expect(page.locator('.discount-tag').first()).toBeVisible();
  await expect(page.locator('.new-in-tag').first()).toBeVisible();
});
