export interface ProductVariant {
  colorKey: string;
  colorName: string;
  imageUrl: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  brand: string;
  gender: string;
  category: string;
  subCategory: string;
  description: string;
  sizes: string[];
  variants: ProductVariant[];
  discountPercent: number;
  isNewIn: boolean;
}

export interface Discount {
  id: string;
  discountPercent: number;
}

export interface CartItem {
  id: string;
  productId: string;
  variantIndex: number;
  sizeIndex: number;
  size: string;
  colorName: string;
  name: string;
  brand: string;
  price: number;
  discountPercent: number;
  quantity: number;
  imageUrl: string;
}

export interface ShippingAddress {
  id: string;
  streetNumber: string;
  streetName: string;
  postalCode: string;
  town: string;
  country: string;
}

export interface OrderItem {
  id: string;
  name: string;
  brand: string;
  size: string;
  price: number;
  discountPercent: number;
  quantity: number;
  colorName: string;
  imageUrl: string;
}

export interface Order {
  id: string;
  userId: string;
  freightCosts: number;
  discountAmount: number;
  totalAmount: number;
  numberOfArticles: number;
  shippingAddress: ShippingAddress;
  dateCreated: string;
  items: OrderItem[];
}

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export type TabKey = 'home' | 'store' | 'favorites' | 'cart' | 'profile';
