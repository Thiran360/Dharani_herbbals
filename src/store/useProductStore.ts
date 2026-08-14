import { create } from 'zustand';
import { apiClient } from '../api/client';
import { useAuthStore } from './useAuthStore';

export interface Product {
  id: string | number;
  product_code?: string;
  barcode?: string;
  category?: string | number;
  category_name?: string;
  brand?: string;
  brand_id?: string | number;
  name: string;
  tamil_name?: string;
  description?: string;
  product_type?: string;
  unit?: string;
  weight_volume?: string;
  stock?: number | string;
  mrp?: string;
  price: string;
  gst_percentage?: string;
  image: string;
  extra_images?: string[];
  is_new?: boolean;
  is_public?: boolean;
  created_at?: string;
}

export interface Category {
  id: string | number;
  name: string;
  image: string;
  color?: string;
  status?: string;
}

export interface Brand {
  id: string | number;
  name: string;
  logo: string;
  status?: string;
}

interface ProductState {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  mostLovedProducts: Product[];
  isLoading: boolean;
  error: string | null;
  fetchData: (options?: { force?: boolean }) => Promise<void>;
  addProduct: (data: { name: string; category: number; price: string; description: string; stock: number; imageFile?: any }) => Promise<void>;
  addCategory: (data: { name: string; imageFile?: any }) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  editProduct: (id: string, data: { name: string; category: number; price: string; description: string; stock: number; imageFile?: any }) => Promise<void>;
}

const PRODUCT_CACHE_MS = 60000;
let lastFetchAt = 0;

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: [],
  brands: [],
  mostLovedProducts: [],
  isLoading: false,
  error: null,

  fetchData: async (options = {}) => {
    const state = get();
    const hasData = Array.isArray(state.products) && state.products.length > 0 && Array.isArray(state.categories) && state.categories.length > 0 && Array.isArray(state.brands) && state.brands.length > 0;
    const isFresh = Date.now() - lastFetchAt < PRODUCT_CACHE_MS;

    if (!options.force && (state.isLoading || (hasData && isFresh))) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const authState = useAuthStore.getState();
      const token = authState.token;
      const loginType = authState.loginType;
      const headers: Record<string, string> = (token && token.length > 20 && !token.startsWith('token-')) ? { Authorization: `Bearer ${token}` } : {};

      const endpoint = loginType === 'store' ? '/store/products/' : '/products/';

      const fetchPublic = async (url: string, sendHeaders: boolean = true) => {
        try {
          const res = await apiClient(url, sendHeaders ? { headers } : {});
          if (res) return res;
        } catch (err) {}
        try {
          return await apiClient(url);
        } catch (err2) {
          return null;
        }
      };

      // Fetch products, categories, brands, and most-loved independently using Promise.allSettled
      const [productsSettled, categoriesSettled, brandsSettled, mostLovedSettled] = await Promise.allSettled([
        fetchPublic(endpoint),
        fetchPublic('/categories/'),
        fetchPublic('/brands/'),
        fetchPublic('/most-loved/')
      ]);

      const productsRes = productsSettled.status === 'fulfilled' ? productsSettled.value : null;
      const categoriesRes = categoriesSettled.status === 'fulfilled' ? categoriesSettled.value : null;
      const brandsRes = brandsSettled.status === 'fulfilled' ? brandsSettled.value : null;
      const mostLovedRes = mostLovedSettled.status === 'fulfilled' ? mostLovedSettled.value : null;
      
      const extractArray = (res: any): any[] => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.data)) return res.data;
        if (Array.isArray(res.products)) return res.products;
        if (Array.isArray(res.results)) return res.results;
        if (Array.isArray(res.categories)) return res.categories;
        if (Array.isArray(res.brands)) return res.brands;
        if (Array.isArray(res.items)) return res.items;
        if (Array.isArray(res.most_loved)) return res.most_loved;
        if (res.data && typeof res.data === 'object') {
          if (Array.isArray(res.data.products)) return res.data.products;
          if (Array.isArray(res.data.results)) return res.data.results;
          if (Array.isArray(res.data.items)) return res.data.items;
        }
        return [];
      };

      const rawProducts = extractArray(productsRes);

      const mappedProducts = rawProducts.map((p: any) => ({
        ...p,
        price: loginType === 'store' 
          ? (p.store_price !== undefined && p.store_price !== null ? String(p.store_price) : String(p.price || '0'))
          : (p.customer_price !== undefined && p.customer_price !== null ? String(p.customer_price) : String(p.price || '0'))
      }));

      const rawCategories = extractArray(categoriesRes);
      const rawBrands = extractArray(brandsRes);
      const rawMostLoved = extractArray(mostLovedRes);

      const mappedMostLoved = rawMostLoved.map((p: any) => ({
        ...p,
        price: loginType === 'store' 
          ? (p.store_price !== undefined && p.store_price !== null ? String(p.store_price) : String(p.price || '0'))
          : (p.customer_price !== undefined && p.customer_price !== null ? String(p.customer_price) : String(p.price || '0'))
      }));

      set((state) => ({
        products: mappedProducts.length > 0 ? mappedProducts : state.products,
        categories: rawCategories.length > 0 ? rawCategories : state.categories,
        brands: rawBrands.length > 0 ? rawBrands : state.brands,
        mostLovedProducts: mappedMostLoved.length > 0 ? mappedMostLoved : state.mostLovedProducts,
        isLoading: false,
        error: null,
      }));
      lastFetchAt = Date.now();
    } catch (error: any) {
      console.warn("Notice fetching data:", error);
      set({ error: error.message, isLoading: false });
    }
  },

  addProduct: async ({ name, category, price, description, stock, imageFile }) => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('category', String(category));
      formData.append('price', String(price));
      formData.append('description', description || '');
      formData.append('stock', String(stock ?? 0));
      if (imageFile?.uri) {
        formData.append('image', {
          uri: imageFile.uri,
          type: imageFile.type || 'image/jpeg',
          name: imageFile.fileName || 'product.jpg',
        } as any);
      }
      const { useAuthStore } = await import('../store/useAuthStore');
      const authState = useAuthStore.getState();
      const token = authState.token;
      const loginType = authState.loginType;
      
      const endpoint = loginType === 'store'
        ? 'https://api.codingboss.in/herbal/store/products/'
        : 'https://api.codingboss.in/herbal/products/';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // Do NOT set Content-Type — fetch sets it automatically with multipart boundary
        },
        body: formData,
      });
      const text = await response.text();
      if (!response.ok) throw new Error(text);
      const newProduct = JSON.parse(text);
      newProduct.price = loginType === 'store' ? newProduct.store_price : newProduct.customer_price;
      set((state) => ({ products: [...state.products, newProduct] }));
    } catch (error: any) {
      console.error('Failed to add product', error);
      throw error;
    }
  },

  addCategory: async ({ name, imageFile }) => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (imageFile?.uri) {
        formData.append('image', {
          uri: imageFile.uri,
          type: imageFile.type || 'image/jpeg',
          name: imageFile.fileName || 'category.jpg',
        } as any);
      }
      const { useAuthStore } = await import('../store/useAuthStore');
      const token = useAuthStore.getState().token;
      const response = await fetch('https://api.codingboss.in/herbal/categories/', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      const text = await response.text();
      if (!response.ok) throw new Error(text);
      const res = JSON.parse(text);
      const newCategory = res?.data || res;
      set((state) => ({ categories: [...(Array.isArray(state.categories) ? state.categories : []), newCategory] }));
    } catch (error: any) {
      console.error('Failed to add category', error);
      throw error;
    }
  },

  deleteProduct: async (id: string) => {
    try {
      const { useAuthStore } = await import('../store/useAuthStore');
      const loginType = useAuthStore.getState().loginType;
      const endpoint = loginType === 'store' ? `/store/products/${id}/` : `/products/${id}/`;
      
      await apiClient(endpoint, { method: 'DELETE' });
      set((state) => ({ products: state.products.filter((p) => String(p.id) !== String(id)) }));
    } catch (error: any) {
      console.error('Failed to delete product', error);
      throw error;
    }
  },

  editProduct: async (id: string, { name, category, price, description, stock, imageFile }) => {
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('category', String(category));
      formData.append('price', String(price));
      formData.append('description', description || '');
      formData.append('stock', String(stock ?? 0));
      if (imageFile?.uri) {
        formData.append('image', {
          uri: imageFile.uri,
          type: imageFile.type || 'image/jpeg',
          name: imageFile.fileName || 'product.jpg',
        } as any);
      }
      const { useAuthStore } = await import('../store/useAuthStore');
      const authState = useAuthStore.getState();
      const token = authState.token;
      const loginType = authState.loginType;
      
      const endpoint = loginType === 'store'
        ? `https://api.codingboss.in/herbal/store/productedit/${id}/`
        : `https://api.codingboss.in/herbal/productedit/${id}/`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      const text = await response.text();
      if (!response.ok) throw new Error(text);
      
      const updatedProduct = JSON.parse(text);
      updatedProduct.price = loginType === 'store' ? updatedProduct.store_price : updatedProduct.customer_price;
      set((state) => ({ 
        products: state.products.map(p => String(p.id) === String(id) ? updatedProduct : p) 
      }));
    } catch (error: any) {
      console.error('Failed to edit product', error);
      throw error;
    }
  },
}));
