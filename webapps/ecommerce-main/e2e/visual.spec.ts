import { test } from '@playwright/test';

test.setTimeout(60000);
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STORAGE_KEY = 'ecommerce-main-storage';

const seedUser = {
  uid: 'harness_user_20260818@example.com',
  email: 'harness_user_20260818@example.com',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '+1 555 123 4567',
};

const seedAddress = {
  id: 'harness',
  streetNumber: '123',
  streetName: 'Fashion Avenue',
  postalCode: '10001',
  town: 'New York',
  country: 'USA',
};

const seedCart = [
  {
    id: '10007-1-7',
    productId: '10007',
    variantIndex: 1,
    sizeIndex: 6,
    size: '7',
    colorName: 'Yellow',
    name: 'AG-LT23 Ultra Textile Tennis Shoes',
    brand: 'Lacoste',
    price: 205,
    discountPercent: 20,
    quantity: 1,
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ecommerceapp-b752b.appspot.com/o/10007-2.png?alt=media&token=759a6687-096e-4fce-bba9-01c1610f0415',
  },
  {
    id: '10000-0-M',
    productId: '10000',
    variantIndex: 0,
    sizeIndex: 3,
    size: 'M',
    colorName: 'Navy Blue',
    name: 'Stretch Cotton Piqué Polo Dress',
    brand: 'Lacoste',
    price: 169,
    discountPercent: 20,
    quantity: 1,
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ecommerceapp-b752b.appspot.com/o/10000-1.png?alt=media&token=fa4fad4c-e573-4d47-865c-f4b49d56ae5c',
  },
];

function storage(state: any) {
  return JSON.stringify({ state: { version: 0, ...state }, version: 0 });
}

const seedState = {
  user: seedUser,
  cart: seedCart,
  favorites: ['10030', '10007', '10000'],
  address: seedAddress,
  orders: [
    {
      id: 'ORD-2026-001',
      userId: seedUser.uid,
      freightCosts: 0,
      discountAmount: 74.8,
      totalAmount: 299.2,
      numberOfArticles: 2,
      shippingAddress: seedAddress,
      dateCreated: '2026-08-26T10:00:00.000Z',
      items: seedCart.map((item) => ({ ...item })),
    },
  ],
};

const states: { id: string; route: string; state: any; waitFor?: string }[] = [
  { id: 'home-view-default', route: '/', state: seedState, waitFor: 'text=SUMMER SALE' },
  { id: 'store-view-default', route: '/store', state: seedState, waitFor: 'text=Store' },
  { id: 'products-list-view-category', route: '/products?category=Clothing&subcategory=Dresses', state: seedState, waitFor: 'text=Dresses' },
  { id: 'product-detail-view-default', route: '/product/10000', state: seedState, waitFor: 'text=Select your size' },
  { id: 'favorites-view-empty', route: '/favorites', state: { ...seedState, favorites: [] }, waitFor: 'text=Your favorite list is empty' },
  { id: 'favorites-view-with-items', route: '/favorites', state: seedState, waitFor: 'text=Favorites' },
  { id: 'cart-view-empty', route: '/cart', state: { ...seedState, cart: [] }, waitFor: 'text=Your cart is empty' },
  { id: 'cart-view-with-items', route: '/cart', state: seedState, waitFor: 'text=Cart' },
  { id: 'checkout-view-no-address', route: '/checkout', state: { ...seedState, address: seedAddress }, waitFor: 'text=Checkout' },
  { id: 'profile-view-default', route: '/profile', state: seedState, waitFor: 'text=Profile' },
];

const specDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(specDir, '../../..');
const runDir = process.env.HARNESS_RUN_DIR
  || path.join(repositoryRoot, '.runs', 'ecommerce-main', '20260826-200915-full-app');
const outDir = path.join(runDir, 'web');
fs.mkdirSync(outDir, { recursive: true });

for (const visualState of states) {
  test(`visual:${visualState.id}`, async ({ page }) => {
    const value = storage(visualState.state);
    await page.addInitScript(({ key, value }: { key: string; value: string }) => {
      localStorage.setItem(key, value);
    }, { key: STORAGE_KEY, value });
    // Freeze the home carousel so the feature banner stays on the first slide.
    await page.addInitScript(() => {
      try { localStorage.setItem('harness-visual', '1'); } catch {}
    });
    await page.goto(visualState.route, { waitUntil: 'domcontentloaded' });
    if (visualState.waitFor) {
      await page.locator(visualState.waitFor).first().waitFor({ state: 'visible' });
    }
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.screenshot({ path: path.join(outDir, `${visualState.id}.png`), fullPage: false });
  });
}
