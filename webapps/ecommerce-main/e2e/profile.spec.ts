import { test, expect } from '@playwright/test';

const EVIDENCE_DIR = '../../.runs/ecommerce-main/20260813-102201-profile';

test('profile page loads and shows personal info', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByTestId('profile-page')).toBeVisible();
  await expect(page.getByText('TIE ZHU')).toBeVisible();
  await expect(page.getByText('123456789@gmail.com')).toBeVisible();
  await expect(page.getByTestId('edit-address-button')).toBeVisible();
  await page.screenshot({ path: `${EVIDENCE_DIR}/web-profile.png` });
});

test('navigate to orders and view order details', async ({ page }) => {
  await page.goto('/profile');
  await page.getByTestId('orders-section-button').click();
  await expect(page.getByTestId('order-list-page')).toBeVisible();
  await expect(page.getByTestId('order-card').first()).toBeVisible();
  await page.screenshot({ path: `${EVIDENCE_DIR}/web-orders-list.png` });

  await page.getByTestId('order-card').first().click();
  await expect(page.getByTestId('order-details-page')).toBeVisible();
  await expect(page.getByText(/N°/)).toBeVisible();
  await page.screenshot({ path: `${EVIDENCE_DIR}/web-order-detail.png` });
});

test('edit personal information and return', async ({ page }) => {
  await page.goto('/profile');
  await page.getByTestId('edit-personal-info-button').click();
  await expect(page.getByTestId('edit-personal-info-page')).toBeVisible();
  await expect(page.getByText('Personal Information')).toBeVisible();

  const firstNameInput = page.locator('input').first();
  await firstNameInput.fill('Janet');
  await page.screenshot({ path: `${EVIDENCE_DIR}/web-edit-personal-info.png` });

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByTestId('profile-page')).toBeVisible();
  await expect(page.getByText('JANET ZHU')).toBeVisible();
});

test('edit shipping address and save', async ({ page }) => {
  await page.goto('/profile');
  await page.getByTestId('edit-address-button').click();
  await expect(page.getByTestId('shipping-address-form')).toBeVisible();

  await page.getByLabel('Street Number').fill('235');
  await page.getByLabel('Street Name').fill('Oxford Street');
  await page.getByLabel('Postal Code').fill('W1D 1BS');
  await page.getByLabel('Town').fill('Paris');
  await page.getByLabel('Country').fill('United Kingdom');
  await page.screenshot({ path: `${EVIDENCE_DIR}/web-edit-address.png` });

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByTestId('profile-page')).toBeVisible();
  await expect(page.getByText('Paris')).toBeVisible();
});

test('app settings placeholder is shown', async ({ page }) => {
  await page.goto('/profile');
  await page.getByTestId('app-settings-section-button').click();
  await expect(page.getByTestId('app-settings-page')).toBeVisible();
  await page.screenshot({ path: `${EVIDENCE_DIR}/web-app-settings.png` });
});

test('sign out from profile returns to store', async ({ page }) => {
  await page.goto('/profile');
  await page.getByTestId('profile-menu-button').click();
  await page.getByTestId('sign-out-option').click();
  await expect(page.getByTestId('store-landing')).toBeVisible();
  await expect(page.getByRole('heading', { name: /store/i })).toBeVisible();
  await page.screenshot({ path: `${EVIDENCE_DIR}/web-sign-out-store.png` });
});
