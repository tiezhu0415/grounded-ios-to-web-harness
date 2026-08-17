import { products } from '../data/products';

export interface Profile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface ShippingAddress {
  id: string;
  streetNumber: string;
  streetName: string;
  postalCode: string;
  town: string;
  country: string;
}

export interface Order {
  id: string;
  userId: string;
  freightCosts: number;
  discountAmount: number;
  totalAmount: number;
  numberOfArticles: number;
  dateCreated: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  name: string;
  brand: string;
  size: string;
  price: number;
  quantity: number;
  colorName: string;
  imageUrl: string;
}

let profile: Profile = {
  uid: 'user-1',
  email: '123456789@gmail.com',
  firstName: 'Tie',
  lastName: 'Zhu',
  phoneNumber: '',
};

let shippingAddress: ShippingAddress | null = null;

let isAuthenticated = true;

const orderDate = new Date('2026-08-10T10:30:00');

const orders: Order[] = [
  {
    id: 'GT69F40HK4Z5',
    userId: 'user-1',
    freightCosts: 0,
    discountAmount: 22.5,
    totalAmount: 221.5,
    numberOfArticles: 2,
    dateCreated: orderDate,
  },
  {
    id: 'ORD-20260809',
    userId: 'user-1',
    freightCosts: 12,
    discountAmount: 0,
    totalAmount: 769.6,
    numberOfArticles: 10,
    dateCreated: new Date(orderDate.getTime() - 24 * 60 * 60 * 1000),
  },
];

function makeItem(orderId: string, productIndex: number, size: string, quantity: number, variantIndex: number): OrderItem {
  const product = products[productIndex];
  const variant = product.variants[variantIndex] ?? product.variants[0];
  return {
    id: `${orderId}-${productIndex}`,
    orderId,
    name: product.name,
    brand: product.brand,
    size,
    price: product.price,
    quantity,
    colorName: variant.colorName,
    imageUrl: variant.imageUrl,
  };
}

const orderItemsMap: Record<string, OrderItem[]> = {
  'GT69F40HK4Z5': [
    makeItem('GT69F40HK4Z5', 0, 'M', 1, 0),
    makeItem('GT69F40HK4Z5', 7, '7', 1, 1),
  ],
  'ORD-20260809': [
    makeItem('ORD-20260809', 12, 'S', 2, 0),
    makeItem('ORD-20260809', 3, 'M', 3, 2),
    makeItem('ORD-20260809', 8, 'One Size', 1, 0),
    makeItem('ORD-20260809', 20, '8', 2, 0),
    makeItem('ORD-20260809', 25, 'One Size', 2, 1),
  ],
};

const orderShippingAddress: ShippingAddress = {
  id: 'addr-order',
  streetNumber: '235',
  streetName: 'Oxford Street',
  postalCode: 'W1D 1BS',
  town: 'London',
  country: 'United Kingdom',
};

export function getProfile(): Profile {
  return { ...profile };
}

export function updateProfile(next: Partial<Profile>): Profile {
  profile = { ...profile, ...next };
  return { ...profile };
}

export function getShippingAddress(): ShippingAddress | null {
  return shippingAddress ? { ...shippingAddress } : null;
}

export function saveShippingAddress(address: ShippingAddress): ShippingAddress {
  shippingAddress = { ...address, id: shippingAddress?.id ?? address.id ?? 'addr-1' };
  return { ...shippingAddress };
}

export function removeShippingAddress(): void {
  shippingAddress = null;
}

export function getOrders(): Order[] {
  return [...orders].sort((a, b) => b.dateCreated.getTime() - a.dateCreated.getTime());
}

export function getOrderItems(orderId: string): OrderItem[] {
  return [...(orderItemsMap[orderId] ?? [])];
}

export function getShippingAddressForOrder(): ShippingAddress {
  return { ...(shippingAddress ?? orderShippingAddress) };
}

export function isUserAuthenticated(): boolean {
  return isAuthenticated;
}

export function signOut(): void {
  isAuthenticated = false;
}

export function signIn(): void {
  isAuthenticated = true;
}

export function requestEmailUpdate(_email: string, _password: string): boolean {
  return true;
}

export function confirmEmailUpdate(): void {
  // no-op in mock
}

export function updatePassword(_password: string): boolean {
  return true;
}

export function deleteAccount(): void {
  isAuthenticated = false;
  profile = {
    uid: 'user-1',
    email: '123456789@gmail.com',
    firstName: 'Tie',
    lastName: 'Zhu',
    phoneNumber: '',
  };
  shippingAddress = null;
}

export function formatOrderDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}
