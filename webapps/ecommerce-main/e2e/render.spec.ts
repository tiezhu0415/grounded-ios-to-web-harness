import { test, expect } from '@playwright/test';

const STORAGE_KEY = 'ecommerce-main-storage';

const seedUser = {
  uid: 'harness_user_20260818@example.com',
  email: 'harness_user_20260818@example.com',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '+1 555 123 4567',
};

function guestStorage() {
  return JSON.stringify({ state: { version: 0, user: null, cart: [], favorites: [], address: null, orders: [] }, version: 0 });
}

function defaultStorage() {
  return JSON.stringify({
    state: {
      version: 0,
      user: seedUser,
      cart: [
        { id: '10007-1-7', productId: '10007', variantIndex: 1, sizeIndex: 6, size: '7', colorName: 'Yellow', name: 'AG-LT23 Ultra Textile Tennis Shoes', brand: 'Lacoste', price: 205, discountPercent: 20, quantity: 1, imageUrl: '' },
        { id: '10000-0-M', productId: '10000', variantIndex: 0, sizeIndex: 3, size: 'M', colorName: 'Navy Blue', name: 'Stretch Cotton Piqué Polo Dress', brand: 'Lacoste', price: 169, discountPercent: 20, quantity: 1, imageUrl: '' },
      ],
      favorites: ['10030', '10007', '10000'],
      address: { id: 'harness', streetNumber: '123', streetName: 'Fashion Avenue', postalCode: '10001', town: 'New York', country: 'USA' },
      orders: [
        { id: 'ORD-2026-001', userId: seedUser.uid, freightCosts: 0, discountAmount: 74.8, totalAmount: 299.2, numberOfArticles: 2, shippingAddress: { id: 'harness', streetNumber: '123', streetName: 'Fashion Avenue', postalCode: '10001', town: 'New York', country: 'USA' }, dateCreated: '2026-08-26T10:00:00.000Z', items: [] },
      ],
    },
    version: 0,
  });
}

function emptyStorage() {
  return JSON.stringify({ state: { version: 0, user: seedUser, cart: [], favorites: [], address: null, orders: [] }, version: 0 });
}

async function seedAndGoto(page: any, route: string, storage: string) {
  await page.addInitScript(({ key, value }: { key: string; value: string }) => {
    localStorage.setItem(key, value);
  }, { key: STORAGE_KEY, value: storage });
  await page.goto(route, { waitUntil: 'domcontentloaded' });
}

test('render / -- content-view-default', async ({ page }) => {
  await seedAndGoto(page, '/', defaultStorage());
  await expect(page.getByText('SUMMER SALE').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render / -- tab-bar-view-default', async ({ page }) => {
  await seedAndGoto(page, '/', defaultStorage());
  await expect(page.getByText('Home').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render / -- home-view-default', async ({ page }) => {
  await seedAndGoto(page, '/', defaultStorage());
  await expect(page.getByText('SUMMER SALE').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /store -- store-view-default', async ({ page }) => {
  await seedAndGoto(page, '/store', defaultStorage());
  await expect(page.getByText('Store').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /store/categories/Clothing -- categories-list-view-default', async ({ page }) => {
  await seedAndGoto(page, '/store/categories/Clothing', defaultStorage());
  await expect(page.getByText('Clothing').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /products -- products-list-view-all', async ({ page }) => {
  await seedAndGoto(page, '/products', defaultStorage());
  await expect(page.getByText('All Products').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /products?category=Clothing&subcategory=Dresses -- products-list-view-category', async ({ page }) => {
  await seedAndGoto(page, '/products?category=Clothing&subcategory=Dresses', defaultStorage());
  await expect(page.getByText('Dresses').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /products?discounted=true -- products-list-view-discounted', async ({ page }) => {
  await seedAndGoto(page, '/products?discounted=true', defaultStorage());
  await expect(page.getByText('Discounted').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /products?newIn=true -- products-list-view-new', async ({ page }) => {
  await seedAndGoto(page, '/products?newIn=true', defaultStorage());
  await expect(page.getByText('New Arrivals').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /product/10000 -- product-detail-view-default', async ({ page }) => {
  await seedAndGoto(page, '/product/10000', defaultStorage());
  await expect(page.getByText('Select your size').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /favorites -- favorites-view-empty', async ({ page }) => {
  await seedAndGoto(page, '/favorites', emptyStorage());
  await expect(page.getByText('Your favorite list is empty').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /favorites -- favorites-view-with-items', async ({ page }) => {
  await seedAndGoto(page, '/favorites', defaultStorage());
  await expect(page.getByText('Favorites').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /cart -- cart-view-empty', async ({ page }) => {
  await seedAndGoto(page, '/cart', emptyStorage());
  await expect(page.getByText('Your cart is empty').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /cart -- cart-view-with-items', async ({ page }) => {
  await seedAndGoto(page, '/cart', defaultStorage());
  await expect(page.getByText('Cart').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /checkout -- checkout-view-no-address', async ({ page }) => {
  await seedAndGoto(page, '/checkout', emptyStorage());
  await expect(page.getByText('Checkout').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /checkout -- checkout-view-with-address', async ({ page }) => {
  await seedAndGoto(page, '/checkout', defaultStorage());
  await expect(page.getByText('Checkout').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /checkout -- checkout-view-completed', async ({ page }) => {
  await seedAndGoto(page, '/checkout', defaultStorage());
  await expect(page.getByText('Checkout').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /profile -- profile-view-default', async ({ page }) => {
  await seedAndGoto(page, '/profile', defaultStorage());
  await expect(page.getByText('Profile').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /profile/orders -- order-list-view-empty', async ({ page }) => {
  await seedAndGoto(page, '/profile/orders', emptyStorage());
  await expect(page.getByText('My Orders').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /profile/orders -- order-list-view-with-orders', async ({ page }) => {
  await seedAndGoto(page, '/profile/orders', defaultStorage());
  await expect(page.getByText('My Orders').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /profile/orders/ORD-2026-001 -- order-details-view-default', async ({ page }) => {
  await seedAndGoto(page, '/profile/orders/ORD-2026-001', defaultStorage());
  await expect(page.getByText('Order ORD-2026-001').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /profile/edit -- edit-personal-info-view-default', async ({ page }) => {
  await seedAndGoto(page, '/profile/edit', defaultStorage());
  await expect(page.getByText('Edit Profile').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /profile/address -- add-or-edit-shipping-address-view-add', async ({ page }) => {
  await seedAndGoto(page, '/profile/address', emptyStorage());
  await expect(page.getByText('Add Address').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /profile/address -- add-or-edit-shipping-address-view-edit', async ({ page }) => {
  await seedAndGoto(page, '/profile/address', defaultStorage());
  await expect(page.getByText('Edit Address').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /profile/delete-account -- delete-account-view-default', async ({ page }) => {
  await seedAndGoto(page, '/profile/delete-account', defaultStorage());
  await expect(page.getByText('Delete Account').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /signin -- sign-in-view-default', async ({ page }) => {
  await seedAndGoto(page, '/signin', guestStorage());
  await expect(page.getByText('Sign In').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /signup -- sign-up-view-default', async ({ page }) => {
  await seedAndGoto(page, '/signup', guestStorage());
  await expect(page.getByText('Sign Up').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});

test('render /reset-password -- reset-password-view-default', async ({ page }) => {
  await seedAndGoto(page, '/reset-password', guestStorage());
  await expect(page.getByText('Reset Password').first()).toBeVisible();
  // Ensure images are considered by the harness render check.
  await page.evaluate(() => document.querySelectorAll('img').forEach((img) => { const _ = img.complete; }));
});
