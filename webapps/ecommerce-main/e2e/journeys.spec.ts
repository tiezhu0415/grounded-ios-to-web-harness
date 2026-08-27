import { test, expect } from '@playwright/test';

test('journey-browse-store', async ({ page }) => {
  await page.goto('/store');
  await expect(page.getByText('Store').first()).toBeVisible();

  await page.getByText('Clothing').first().click();
  await expect(page.getByText('Clothing').first()).toBeVisible();

  await page.getByText('Dresses').first().click();
  await expect(page.getByText('Dresses').first()).toBeVisible();

  const firstProduct = page.locator('button').filter({ has: page.locator('img') }).first();
  await firstProduct.click();
  await expect(page.getByText('Select your size').first()).toBeVisible();

  await page.getByText('M').first().click();
  await page.getByText('Add to Cart').first().click();

  await page.goto('/cart');
  await expect(page.getByText('Cart').first()).toBeVisible();
  await expect(page.getByText('Checkout').first()).toBeVisible();
});

test('journey-sign-in', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByText('Profile').first()).toBeVisible();
  await page.getByText('Sign out').first().click();

  await page.goto('/signin');
  await expect(page.getByText('Sign In').first()).toBeVisible();

  await page.getByPlaceholder('Email').fill('test@example.com');
  await page.getByPlaceholder('Password').fill('password123');
  await page.getByText('Sign In').filter({ hasText: /^Sign In$/ }).first().click();

  await expect(page.getByText('SUMMER SALE').first()).toBeVisible();

  await page.goto('/profile');
  await expect(page.getByText('Profile').first()).toBeVisible();

  await page.getByText('MY ORDERS').first().click();
  await expect(page.getByText('My Orders').first()).toBeVisible();
});

test('journey-toggle-favorite', async ({ page }) => {
  await page.goto('/store');
  await expect(page.getByText('Store').first()).toBeVisible();

  await page.getByText('Clothing').first().click();
  await expect(page.getByText('Clothing').first()).toBeVisible();

  await page.getByText('Dresses').first().click();
  await expect(page.getByText('Dresses').first()).toBeVisible();

  const firstProduct = page.locator('button').filter({ has: page.locator('img') }).first();
  await firstProduct.click();
  await expect(page.getByText('Select your size').first()).toBeVisible();

  await page.locator('button').filter({ has: page.locator('svg') }).nth(1).click();

  await page.goto('/favorites');
  await expect(page.getByText('Favorites').first()).toBeVisible();
});
