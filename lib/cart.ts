'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CartItem, Product, ProductColor } from '@/types';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (product: Product, size: string, color: ProductColor, qty?: number) => void;
  removeItem: (productId: string, size: string, colorName: string) => void;
  updateQuantity: (productId: string, size: string, colorName: string, qty: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Computed
  totalItems: () => number;
  subtotal: () => number;
  itemCount: (productId: string, size: string, colorName: string) => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, size, color, qty = 1) => {
        set((state) => {
          const existing = state.items.find(
            (item) =>
              item.product.id === product.id &&
              item.selectedSize === size &&
              item.selectedColor.name === color.name
          );

          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id &&
                item.selectedSize === size &&
                item.selectedColor.name === color.name
                  ? { ...item, quantity: Math.min(item.quantity + qty, 10) }
                  : item
              ),
            };
          }

          return {
            items: [
              ...state.items,
              { product, quantity: qty, selectedSize: size, selectedColor: color },
            ],
          };
        });
      },

      removeItem: (productId, size, colorName) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.product.id === productId &&
                item.selectedSize === size &&
                item.selectedColor.name === colorName
              )
          ),
        }));
      },

      updateQuantity: (productId, size, colorName, qty) => {
        if (qty <= 0) {
          get().removeItem(productId, size, colorName);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId &&
            item.selectedSize === size &&
            item.selectedColor.name === colorName
              ? { ...item, quantity: Math.min(qty, 10) }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      subtotal: () =>
        get().items.reduce(
          (sum, item) =>
            sum +
            (item.product.sale_price ?? item.product.price) * item.quantity,
          0
        ),

      itemCount: (productId, size, colorName) => {
        const item = get().items.find(
          (i) =>
            i.product.id === productId &&
            i.selectedSize === size &&
            i.selectedColor.name === colorName
        );
        return item?.quantity ?? 0;
      },
    }),
    {
      name: 'vee-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
