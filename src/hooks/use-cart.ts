// Zustand Cart Store for Maison VIII
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, OrderItem } from '../types';

export interface CartItem {
  cartId: string; // combination of product.id + stringified variant choices
  product: Product;
  quantity: number;
  variantChoices: Record<string, string>;
  singleUnitPrice: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number, variantChoices: Record<string, string>) => void;
  removeItem: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity, variantChoices) => {
        // Calculate adjusted price based on selected variants
        let priceAdjust = 0;
        product.variants.forEach(variant => {
          const chosenOptionName = variantChoices[variant.name];
          if (chosenOptionName) {
            const option = variant.options.find(opt => opt.name === chosenOptionName);
            if (option) {
              priceAdjust += option.price_adjust;
            }
          }
        });
        
        const singleUnitPrice = product.price + priceAdjust;
        
        // Generate stable cart id based on product and variant selection
        const choicesKey = Object.entries(variantChoices)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([k, v]) => `${k}:${v}`)
          .join('|');
        const cartId = choicesKey ? `${product.id}[${choicesKey}]` : product.id;
        
        const existingItems = get().items;
        const existingItemIdx = existingItems.findIndex(item => item.cartId === cartId);
        
        if (existingItemIdx > -1) {
          const updatedItems = [...existingItems];
          updatedItems[existingItemIdx].quantity += quantity;
          set({ items: updatedItems });
        } else {
          set({
            items: [...existingItems, {
              cartId,
              product,
              quantity,
              variantChoices,
              singleUnitPrice
            }]
          });
        }
      },
      
      removeItem: (cartId) => {
        set({ items: get().items.filter(item => item.cartId !== cartId) });
      },
      
      updateQuantity: (cartId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartId);
          return;
        }
        const updatedItems = get().items.map(item => 
          item.cartId === cartId ? { ...item, quantity } : item
        );
        set({ items: updatedItems });
      },
      
      clearCart: () => set({ items: [] }),
      
      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
      
      getSubtotal: () => {
        return get().items.reduce((total, item) => total + (item.singleUnitPrice * item.quantity), 0);
      }
    }),
    {
      name: 'maison-viii-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
