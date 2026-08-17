import { products } from '../data/products';
import { discounts } from '../data/discounts';

export interface CartItem {
  id: string;
  name: string;
  brand: string;
  size: string;
  price: number;
  discountPercent: number;
  quantity: number;
  colorName: string;
  imageUrl: string;
  dateAdded: number;
  productId: string;
}

export interface Cart {
  freightCosts: number;
  discountAmount: number;
  totalAmount: number;
}

const STORAGE_KEY = 'ecommerce_cart_items';

function loadItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveItems(items: CartItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getCartItems(): CartItem[] {
  return loadItems().sort((a, b) => b.dateAdded - a.dateAdded);
}

export function getCart(): Cart {
  const items = getCartItems();
  const subTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const freightCosts = 0;
  const discountAmount = 0;
  return {
    freightCosts,
    discountAmount,
    totalAmount: subTotal + freightCosts - discountAmount,
  };
}

export function addToCart(
  productId: string,
  variantIndex: number,
  sizeIndex: number,
  quantity: number
): void {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const variant = product.variants[variantIndex];
  const size = product.sizes[sizeIndex];
  if (!variant || !size) return;

  const id = `${productId}-${variantIndex}-${sizeIndex}`;
  const items = loadItems();
  const existing = items.find((item) => item.id === id);

  if (existing) {
    existing.quantity += quantity;
    existing.dateAdded = Date.now();
  } else {
    items.push({
      id,
      name: product.name,
      brand: product.brand,
      size,
      price: product.price,
      discountPercent: discounts.find((d) => d.id === productId)?.discountPercent ?? 0,
      quantity,
      colorName: variant.colorName,
      imageUrl: variant.imageUrl,
      dateAdded: Date.now(),
      productId,
    });
  }
  saveItems(items);
}

export function removeFromCart(itemId: string): void {
  const items = loadItems().filter((item) => item.id !== itemId);
  saveItems(items);
}

export function increaseQuantity(itemId: string): void {
  const items = loadItems();
  const item = items.find((i) => i.id === itemId);
  if (item) {
    item.quantity += 1;
    saveItems(items);
  }
}

export function decreaseQuantity(itemId: string): void {
  const items = loadItems();
  const item = items.find((i) => i.id === itemId);
  if (!item) return;

  if (item.quantity > 1) {
    item.quantity -= 1;
    saveItems(items);
  } else {
    removeFromCart(itemId);
  }
}

export function clearCart(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function getProductIdFromCartItem(item: CartItem): string {
  return item.productId;
}
