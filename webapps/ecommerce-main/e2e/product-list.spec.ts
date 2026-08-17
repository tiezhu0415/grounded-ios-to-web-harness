import { test, expect } from '@playwright/test';

const EVIDENCE_DIR = '../../.runs/ecommerce-main/20260814-151419-catalog-fidelity';

async function waitForProducts(page) {
  await expect(page.getByTestId('product-card').first()).toBeVisible();
}

test('store landing matches the native category hierarchy', async ({ page }) => {
  await page.goto('/store');
  await expect(page.getByRole('heading', { name: /store/i })).toBeVisible();
  await expect(page.getByTestId('store-landing')).toBeVisible();
  await expect(page.locator('.store-category-card')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'Clothing' }).locator('img')).toHaveAttribute('src', '/categories/clothing.png');
  await page.screenshot({ path: `${EVIDENCE_DIR}/web-store-categories.png` });
});

test('category opens native-style subcategories and All shows its products', async ({ page }) => {
  await page.goto('/store');
  await page.getByRole('button', { name: 'Shoes' }).click();
  await expect(page).toHaveURL(/\/store\/categories\/Shoes$/);
  await expect(page.getByTestId('store-subcategories')).toBeVisible();
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page).toHaveURL(/\/store\/products\?category=Shoes$/);

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
  await page.goto('/store');
  await page.getByRole('button', { name: 'Clothing' }).click();
  await expect(page.getByTestId('store-subcategories')).toBeVisible();
  await page.getByRole('button', { name: 'Dresses' }).click();
  await expect(page).toHaveURL(/category=Clothing&subCategory=Dresses$/);

  const cards = page.getByTestId('product-card');
  await expect(cards.first()).toBeVisible();
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(cards.nth(i).getByTestId('product-subcategory')).toHaveText('Dresses');
  }
  await page.screenshot({ path: `${EVIDENCE_DIR}/web-clothing-dresses.png` });
});

test('empty state is shown when no products match', async ({ page }) => {
  await page.goto('/store/products?empty=1');
  await expect(page.getByTestId('empty-state')).toBeVisible();
  await page.screenshot({ path: `${EVIDENCE_DIR}/web-empty-state.png` });
});

test('error state is shown when data fails to load', async ({ page }) => {
  await page.goto('/store/products?error=1');
  await expect(page.getByTestId('error-state')).toBeVisible();
  await page.screenshot({ path: `${EVIDENCE_DIR}/web-error-state.png` });
});

test('loads more products on scroll', async ({ page }) => {
  await page.goto('/store/products');
  await waitForProducts(page);
  const firstCount = await page.getByTestId('product-card').count();
  await page.getByTestId('load-more-button').click();
  await expect(async () => {
    const count = await page.getByTestId('product-card').count();
    expect(count).toBeGreaterThan(firstCount);
  }).toPass();
});

test('shows discount and NEW IN labels', async ({ page }) => {
  await page.goto('/store/products?category=Shoes');
  await waitForProducts(page);
  await expect(page.locator('.discount-tag').first()).toBeVisible();
  await expect(page.locator('.new-in-tag').first()).toBeVisible();
});
