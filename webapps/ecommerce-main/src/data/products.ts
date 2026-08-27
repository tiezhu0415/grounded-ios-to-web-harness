import type { Product, Discount } from '@/types';
import productsJson from '../../public/data/products.json';
import discountsJson from '../../public/data/discounts.json';
import newInsJson from '../../public/data/newIns.json';

export const products: Product[] = productsJson as Product[];
export const discounts: Discount[] = discountsJson as Discount[];
export const newInIds: string[] = newInsJson as string[];

export const productById = new Map(products.map((p) => [p.id, p]));
export const discountById = new Map(discounts.map((d) => [d.id, d]));

export function getDiscount(productId: string): Discount | undefined {
  return discountById.get(productId);
}

export function isNewIn(productId: string): boolean {
  return newInIds.includes(productId);
}

export const categories = [
  { key: 'Clothing', image: '/images/clothing.png' },
  { key: 'Shoes', image: '/images/shoes.png' },
  { key: 'Accessories', image: '/images/accessories.png' },
];

export const subCategoriesByCategory: Record<string, string[]> = {
  Clothing: ['Dresses', 'T-Shirts', 'Shirts', 'Sweatshirts', 'Trousers', 'Jeans', 'Shorts', 'Skirts', 'Jackets', 'Coats'],
  Shoes: ['Trainers', 'Sandals', 'Pumps', 'Boots', 'Ballerinas'],
  Accessories: ['Bags', 'Sunglasses', 'Watches', 'Belts'],
};

export const categoryDisplay: Record<string, string> = {
  Clothes: 'Clothing',
  Clothing: 'Clothing',
  Shoes: 'Shoes',
  Accessories: 'Accessories',
};
