import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Order, ShippingAddress, UserProfile } from '@/types';

interface AppState {
  user: UserProfile | null;
  cart: CartItem[];
  favorites: string[];
  address: ShippingAddress | null;
  orders: Order[];
  hydrated: boolean;
}

interface AppActions {
  signIn: (email: string, password: string) => boolean;
  signUp: (profile: Omit<UserProfile, 'uid'> & { password: string }) => boolean;
  signOut: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  setAddress: (address: ShippingAddress | null) => void;
  addToCart: (item: CartItem) => void;
  updateCartQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  toggleFavorite: (productId: string) => void;
  addOrder: (order: Order) => void;
  deleteAccount: () => void;
  setHydrated: () => void;
}

const seedUser: UserProfile = {
  uid: 'harness_user_20260818@example.com',
  email: 'harness_user_20260818@example.com',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '+1 555 123 4567',
};

const seedAddress: ShippingAddress = {
  id: 'harness',
  streetNumber: '123',
  streetName: 'Fashion Avenue',
  postalCode: '10001',
  town: 'New York',
  country: 'USA',
};

const seedCart: CartItem[] = [
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
  {
    id: '10007-1-7',
    productId: '10007',
    variantIndex: 1,
    sizeIndex: 6,
    size: '7',
    colorName: 'Light Orange',
    name: 'AG-LT23 Ultra Textile Tennis Shoes',
    brand: 'Lacoste',
    price: 205,
    discountPercent: 20,
    quantity: 1,
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/ecommerceapp-b752b.appspot.com/o/10007-2.png?alt=media&token=903641a7-f8d2-4fad-8344-3684bf8c9955',
  },
];

const seedFavorites = ['10000', '10007', '10030'];

const seedOrders: Order[] = [
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
];

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      user: seedUser,
      cart: seedCart,
      favorites: seedFavorites,
      address: seedAddress,
      orders: seedOrders,
      hydrated: false,

      signIn: (email, password) => {
        // Demo auth: accept any non-empty password for existing or seed user
        const existing = email.trim().toLowerCase();
        if (!password.trim()) return false;
        const u = get().user;
        if (u && u.email.toLowerCase() === existing) {
          return true;
        }
        set({ user: { uid: existing, email: existing, firstName: '', lastName: '', phoneNumber: '' } });
        return true;
      },

      signUp: ({ password, ...profile }) => {
        if (!password.trim() || !profile.email.trim()) return false;
        const uid = profile.email.trim().toLowerCase();
        set({
          user: { uid, ...profile },
          cart: [],
          favorites: [],
          address: null,
          orders: [],
        });
        return true;
      },

      signOut: () => {
        set({ user: null });
      },

      updateProfile: (profile) => {
        set((state) => ({ user: state.user ? { ...state.user, ...profile } : null }));
      },

      setAddress: (address) => set({ address }),

      addToCart: (item) => {
        set((state) => {
          const existing = state.cart.find((i) => i.id === item.id);
          if (existing) {
            return {
              cart: state.cart.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i)),
            };
          }
          return { cart: [...state.cart, item] };
        });
      },

      updateCartQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(id);
          return;
        }
        set((state) => ({ cart: state.cart.map((i) => (i.id === id ? { ...i, quantity } : i)) }));
      },

      removeFromCart: (id) => {
        set((state) => ({ cart: state.cart.filter((i) => i.id !== id) }));
      },

      clearCart: () => set({ cart: [] }),

      toggleFavorite: (productId) => {
        set((state) => ({
          favorites: state.favorites.includes(productId)
            ? state.favorites.filter((id) => id !== productId)
            : [...state.favorites, productId],
        }));
      },

      addOrder: (order) => {
        set((state) => ({ orders: [order, ...state.orders] }));
      },

      deleteAccount: () => {
        set({ user: null, cart: [], favorites: [], address: null, orders: [] });
      },

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'ecommerce-main-storage',
      partialize: (state) => ({ user: state.user, cart: state.cart, favorites: state.favorites, address: state.address, orders: state.orders }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
