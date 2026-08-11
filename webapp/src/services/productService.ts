import { products as allProducts, type Product } from '../data/products';
import { discounts } from '../data/discounts';
import { newInProductIds } from '../data/newins';

export const PAGE_SIZE = 10;

export interface ProductFilter {
  category?: string | null;
  subCategory?: string | null;
  simulateError?: boolean;
  simulateEmpty?: boolean;
}

export interface PaginatedProducts {
  products: ProductWithMeta[];
  total: number;
  hasMore: boolean;
}

export interface ProductWithMeta extends Product {
  discountPercent?: number;
  isNewIn: boolean;
  displayImageUrl: string;
}

const discountMap = new Map(discounts.map((d) => [d.id, d.discountPercent]));
const newInSet = new Set(newInProductIds);

function enrich(product: Product): ProductWithMeta {
  return {
    ...product,
    discountPercent: discountMap.get(product.id),
    isNewIn: newInSet.has(product.id),
    displayImageUrl: product.variants[0]?.imageUrl ?? '',
  };
}

export function getCategories(): { id: string; label: string }[] {
  return [
    { id: 'all', label: 'All' },
    { id: 'Clothing', label: 'Clothing' },
    { id: 'Shoes', label: 'Shoes' },
    { id: 'Accessories', label: 'Accessories' },
  ];
}

export function getSubCategories(category: string): { id: string; label: string }[] {
  const subs = Array.from(
    new Set(allProducts.filter((p) => p.category === category).map((p) => p.subCategory))
  ).sort();
  return subs.map((s) => ({ id: s, label: s }));
}

export async function fetchProducts(
  filter: ProductFilter,
  page: number
): Promise<PaginatedProducts> {
  await new Promise((resolve) => setTimeout(resolve, 150));

  if (filter.simulateError) {
    throw new Error('Simulated data loading failure');
  }

  if (filter.simulateEmpty) {
    return { products: [], total: 0, hasMore: false };
  }

  let filtered = allProducts;

  if (filter.category && filter.category !== 'all') {
    filtered = filtered.filter((p) => p.category === filter.category);
  }

  if (filter.subCategory) {
    filtered = filtered.filter((p) => p.subCategory === filter.subCategory);
  }

  const total = filtered.length;
  const start = 0;
  const end = page * PAGE_SIZE;
  const paginated = filtered.slice(start, end).map(enrich);

  return {
    products: paginated,
    total,
    hasMore: end < total,
  };
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function formatDiscountedPrice(price: number, discountPercent?: number): string | null {
  if (!discountPercent) return null;
  return `$${(price * (1 - discountPercent / 100)).toFixed(2)}`;
}
