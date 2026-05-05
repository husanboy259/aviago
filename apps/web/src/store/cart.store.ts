import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CartState {
  restaurantId: string | null;
  restaurantName: string | null;
  items: CartItem[];
  addItem: (restaurantId: string, restaurantName: string, item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: null,
      items: [],

      addItem: (restaurantId, restaurantName, item) => {
        const state = get();

        // If adding from a different restaurant, clear cart first
        if (state.restaurantId && state.restaurantId !== restaurantId) {
          set({ items: [], restaurantId, restaurantName });
        } else if (!state.restaurantId) {
          set({ restaurantId, restaurantName });
        }

        set((s) => {
          const existing = s.items.find((i) => i.menuItemId === item.menuItemId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: 1 }] };
        });
      },

      removeItem: (menuItemId) =>
        set((s) => ({ items: s.items.filter((i) => i.menuItemId !== menuItemId) })),

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        set((s) => ({
          items: s.items.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity } : i)),
        }));
      },

      clearCart: () => set({ items: [], restaurantId: null, restaurantName: null }),

      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'delidrone-cart' },
  ),
);
