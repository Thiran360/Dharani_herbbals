import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';

export interface WishlistItem {
  id: string | number;
  name: string;
  price: number | string;
  image: string;
  category?: string | number;
  brand?: string;
  description?: string;
}

interface WishlistState {
  wishlistItems: WishlistItem[];
  isLoading: boolean;
  fetchWishlist: (userId?: string | number) => Promise<void>;
  toggleWishlist: (product: WishlistItem | any, userId?: string | number) => Promise<void>;
  isInWishlist: (productId: string | number) => boolean;
  removeFromWishlist: (productId: string | number, userId?: string | number) => Promise<void>;
  clearWishlist: () => Promise<void>;
}

const WISHLIST_STORAGE_KEY = '@dharani_wishlist_items';

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlistItems: [],
  isLoading: false,

  fetchWishlist: async (userId?: string | number) => {
    set({ isLoading: true });
    try {
      const numericUserId = Number(userId);
      let items: WishlistItem[] = [];

      // 1. Load local stored items first
      const stored = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) {
        try {
          items = JSON.parse(stored);
        } catch (e) {}
      }

      // 2. Fetch directly from backend endpoint: herbal/wishlist/<int:user_id>/
      if (!isNaN(numericUserId) && numericUserId > 0) {
        try {
          const res = await apiClient(`/wishlist/${numericUserId}/`);
          let apiItems: any[] = [];
          if (Array.isArray(res)) {
            apiItems = res;
          } else if (res && Array.isArray(res.wishlist)) {
            apiItems = res.wishlist;
          } else if (res && Array.isArray(res.items)) {
            apiItems = res.items;
          } else if (res && Array.isArray(res.data)) {
            apiItems = res.data;
          }

          if (apiItems.length > 0) {
            const map = new Map<string | number, WishlistItem>();
            items.forEach((item) => map.set(String(item.id), item));
            
            apiItems.forEach((item: any) => {
              const prod = item.product || item;
              const prodId = prod.id || item.id || item.product_id;
              if (prodId) {
                map.set(String(prodId), {
                  id: prodId,
                  name: prod.name || item.name || item.product_name || 'Herbal Product',
                  price: prod.price || item.price || 0,
                  image: prod.image || item.image || item.product_image || '',
                  description: prod.description || item.description || '',
                });
              }
            });
            items = Array.from(map.values());
          }
        } catch (e) {
          console.warn("Notice fetching backend wishlist:", e);
        }
      }

      set({ wishlistItems: items });
      await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn("Error fetching wishlist:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleWishlist: async (product: WishlistItem | any, userId?: string | number) => {
    if (!product || !product.id) return;
    const current = get().wishlistItems;
    const prodIdStr = String(product.id);
    const exists = current.some((item) => String(item.id) === prodIdStr);

    let updated: WishlistItem[];
    if (exists) {
      updated = current.filter((item) => String(item.id) !== prodIdStr);
    } else {
      const newItem: WishlistItem = {
        id: product.id,
        name: product.name || product.title || 'Herbal Product',
        price: product.price || 0,
        image: product.image || product.product_image || '',
        category: product.category,
        brand: product.brand,
        description: product.description,
      };
      updated = [newItem, ...current];
    }

    set({ wishlistItems: updated });
    await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updated));

    // Async sync with API if logged in
    const numericUserId = Number(userId);
    if (!isNaN(numericUserId) && numericUserId > 0) {
      try {
        if (exists) {
          await apiClient(`/wishlist/${numericUserId}/`, {
            method: 'DELETE',
            body: JSON.stringify({ product_id: product.id, id: product.id }),
          });
        } else {
          await apiClient(`/wishlist/${numericUserId}/`, {
            method: 'POST',
            body: JSON.stringify({ product_id: product.id, product: product.id }),
          });
        }
      } catch (err) {
        // Silent catch API error
      }
    }
  },

  isInWishlist: (productId: string | number) => {
    if (!productId) return false;
    return get().wishlistItems.some((item) => String(item.id) === String(productId));
  },

  removeFromWishlist: async (productId: string | number, userId?: string | number) => {
    const prodIdStr = String(productId);
    const updated = get().wishlistItems.filter((item) => String(item.id) !== prodIdStr);
    set({ wishlistItems: updated });
    await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(updated));

    const numericUserId = Number(userId);
    if (!isNaN(numericUserId) && numericUserId > 0) {
      try {
        await apiClient(`/wishlist/${numericUserId}/`, {
          method: 'DELETE',
          body: JSON.stringify({ product_id: productId, id: productId }),
        });
      } catch (err) {}
    }
  },

  clearWishlist: async () => {
    set({ wishlistItems: [] });
    await AsyncStorage.removeItem(WISHLIST_STORAGE_KEY);
  },
}));

// Auto-initialize store from AsyncStorage on module load
useWishlistStore.getState().fetchWishlist();
