  import { create } from 'zustand';
import { apiClient } from '../api/client';
import { useAuthStore } from './useAuthStore'; // We need user info

export interface Product {
  id: string | number;
  name: string;
  price: number | string;
  image: string;
  category?: string | number;
  brand?: string;
  description?: string;
}

export interface CartItem {
  id: number; // The cart item PK
  user?: number;
  user_id?: number | string;
  product?: Product | any; // Fallback if nested
  product_id?: number | string;
  product_name?: string;
  product_image?: string;
  category_name?: string;
  variation_id?: number | string | null;
  variation_name?: string | null;
  price?: number | string;
  quantity: number;
  item_total?: number | string;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  productTotal: number;
  deliveryCharge: number;
  taxTotal: number;
  grandTotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  cartAddress: any;
  cartUserId: number | string | null;
  resetCart: () => void;
  fetchCart: (userId: number | string, stateName?: string) => Promise<void>;
  addToCart: (product: Product | any, userId: number | string) => Promise<void>;
  buyNow: (product: Product | any, userId: number | string) => Promise<void>;
  removeFromCart: (cartItemId: number) => Promise<void>;
  increaseQuantity: (cartItem: CartItem) => Promise<void>;
  decreaseQuantity: (cartItem: CartItem) => Promise<void>;
  clearCart: (userId: number | string) => Promise<void>;
  checkout: (checkoutData: any) => Promise<any>;
  verifyPayment: (paymentData: any) => Promise<void>;
  createPaytmOrder: (userId: number | string, amount?: number, orderDetails?: any) => Promise<any>;
  verifyPaytmCallback: (callbackData: any) => Promise<any>;
  getPaytmStatus: (orderId: string | number) => Promise<any>;
  refundPaytmPayment: (refundData: any) => Promise<any>;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,
  productTotal: 0,
  deliveryCharge: 0,
  taxTotal: 0,
  grandTotal: 0,
  cgst: 0,
  sgst: 0,
  igst: 0,
  cartAddress: null,
  cartUserId: null,

  resetCart: () => {
    set({
      items: [],
      isLoading: false,
      productTotal: 0,
      deliveryCharge: 0,
      taxTotal: 0,
      grandTotal: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      cartAddress: null,
      cartUserId: null,
    });
  },

  fetchCart: async (userId, stateName = '') => {
    let targetUserId = userId;
    if (!targetUserId || targetUserId === 'guest') {
      set({
        items: [],
        isLoading: false,
        productTotal: 0,
        deliveryCharge: 0,
        taxTotal: 0,
        grandTotal: 0,
        cartAddress: null,
        cartUserId: null,
      });
      return;
    }

    let numId = Number(targetUserId);
    if (isNaN(numId) || numId > 1000000000 || numId <= 0) {
      try {
        const currentUser = useAuthStore.getState().user;
        const uEmail = (currentUser?.email || '').toLowerCase().trim();
        const uPhone = (currentUser?.phone || currentUser?.mobile || '').replace(/\D/g, '').slice(-10);
        if (uEmail || uPhone) {
          const listRes = await apiClient('/customers/');
          const list = listRes?.data || (Array.isArray(listRes) ? listRes : []);
          const matched = list.find((c: any) => {
            const cEmail = (c?.email || '').toLowerCase().trim();
            const cPhone = (c?.phone || c?.mobile || c?.phone_number || '').replace(/\D/g, '').slice(-10);
            return (uEmail && cEmail === uEmail) || (uPhone && cPhone && cPhone === uPhone);
          });
          if (matched?.id) {
            targetUserId = matched.id;
            numId = Number(matched.id);
            useAuthStore.getState().updateProfile({ id: matched.id });
          }
        }
      } catch (err) {}
    }

    const currentCartUser = get().cartUserId;

    // If user changed, clear previous user's cart immediately
    if (String(currentCartUser) !== String(targetUserId)) {
      set({
        items: [],
        isLoading: true,
        productTotal: 0,
        deliveryCharge: 0,
        taxTotal: 0,
        grandTotal: 0,
        cartAddress: null,
        cartUserId: targetUserId,
      });
    } else {
      set({ isLoading: true });
    }

    try {
      let response: any;
      const stateQuery = stateName ? `&state=${encodeURIComponent(stateName)}` : '';
      
      const tryFetch = async (url: string, options?: RequestInit) => {
        try {
          return await apiClient(url, options);
        } catch (err: any) {
          const errMsg = String(err?.raw || err?.message || err);
          if (errMsg.includes('User matching query does not exist')) {
            useAuthStore.getState().logout().catch(() => {});
          }
          return null;
        }
      };

      response = await tryFetch(`/carts/?user_id=${targetUserId}${stateQuery}`);
      if (!response) response = await tryFetch(`/carts/?user=${targetUserId}${stateQuery}`);
      if (!response) response = await tryFetch(`/cart/?user_id=${targetUserId}${stateQuery}`);
      if (!response) response = await tryFetch(`/carts/${targetUserId}/`);
      if (!response) response = await tryFetch(`/cart/${targetUserId}/`);
      if (!response) response = await tryFetch(`/carts/`, { method: 'POST', body: JSON.stringify({ user_id: targetUserId, user: targetUserId }) });
      if (!response) response = await tryFetch(`/cart/`, { method: 'POST', body: JSON.stringify({ user_id: targetUserId, user: targetUserId }) });

      if (response) {
        const rawItems = response?.data || response?.cart || response?.items || (Array.isArray(response) ? response : []);
        const apiItems = Array.isArray(rawItems) ? rawItems : [];
        const items = apiItems;

        const calcProductTotal = items.reduce((sum: number, i: any) => {
          const itemTot = i.item_total ? parseFloat(String(i.item_total)) : (parseFloat(String(i.price || '0')) * (i.quantity || 1));
          return sum + (isNaN(itemTot) ? 0 : itemTot);
        }, 0);

        const prodTotal = response?.product_total !== undefined ? parseFloat(String(response.product_total)) : calcProductTotal;
        const delCharge = response?.delivery_charge !== undefined ? parseFloat(String(response.delivery_charge)) : 0;
        const taxTot = response?.tax_total !== undefined ? parseFloat(String(response.tax_total)) : 0;
        const gTotal = response?.grand_total !== undefined ? parseFloat(String(response.grand_total)) : (prodTotal + delCharge + taxTot);
        
        const fetchedAddress = response?.address || (Array.isArray(response?.addresses) && response.addresses.length > 0 ? response.addresses[0] : null);

        set({ 
          items, 
          isLoading: false,
          cartUserId: targetUserId,
          productTotal: isNaN(prodTotal) ? calcProductTotal : prodTotal,
          deliveryCharge: isNaN(delCharge) ? 0 : delCharge,
          taxTotal: isNaN(taxTot) ? 0 : taxTot,
          grandTotal: isNaN(gTotal) ? calcProductTotal : gTotal,
          cgst: response?.cgst !== undefined ? parseFloat(String(response.cgst)) : 0,
          sgst: response?.sgst !== undefined ? parseFloat(String(response.sgst)) : 0,
          igst: response?.igst !== undefined ? parseFloat(String(response.igst)) : 0,
          cartAddress: fetchedAddress || get().cartAddress,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error: any) {
      console.warn("Cart API notice:", error);
      set({ isLoading: false });
    }
  },

  addToCart: async (product, userId) => {
    set({ isLoading: true });
    const rawUserId = userId || useAuthStore.getState().user?.id;
    let targetUserId = rawUserId;
    let numericUserId = Number(targetUserId);

    if (isNaN(numericUserId) || numericUserId > 1000000000 || numericUserId <= 0) {
      try {
        const currentUser = useAuthStore.getState().user;
        const uEmail = (currentUser?.email || '').toLowerCase().trim();
        const uPhone = (currentUser?.phone || currentUser?.mobile || '').replace(/\D/g, '').slice(-10);
        if (uEmail || uPhone) {
          const listRes = await apiClient('/customers/');
          const list = listRes?.data || (Array.isArray(listRes) ? listRes : []);
          const matched = list.find((c: any) => {
            const cEmail = (c?.email || '').toLowerCase().trim();
            const cPhone = (c?.phone || c?.mobile || c?.phone_number || '').replace(/\D/g, '').slice(-10);
            return (uEmail && cEmail === uEmail) || (uPhone && cPhone && cPhone === uPhone);
          });
          if (matched?.id) {
            targetUserId = matched.id;
            numericUserId = Number(matched.id);
            useAuthStore.getState().updateProfile({ id: matched.id });
          }
        }
      } catch (err) {}
    }

    const isValidUser = targetUserId && targetUserId !== 'guest';
    const productId = product.id || product.product_id;

    try {
      const existingItem = get().items.find(
        (item) => String(item.product_id || item.product?.id) === String(productId)
      );

      if (existingItem) {
        await get().increaseQuantity(existingItem);
      } else {
        let apiData: any = null;
        if (isValidUser) {
          const tryAddToCart = async (url: string) => {
            try {
              return await apiClient(url, {
                method: 'POST',
                body: JSON.stringify({
                  product_id: Number(productId) || productId,
                  product: Number(productId) || productId,
                  quantity: 1,
                  user_id: numericUserId,
                  user: numericUserId,
                }),
              });
            } catch (err: any) {
              const errMsg = String(err?.raw || err?.message || err);
              if (errMsg.includes('User matching query does not exist')) {
                useAuthStore.getState().logout().catch(() => {});
              }
              return null;
            }
          };

          let res = await tryAddToCart('/carts/');
          if (!res) res = await tryAddToCart('/cart/');
          if (!res) res = await tryAddToCart(`/carts/${numericUserId}/`);
          if (!res) res = await tryAddToCart(`/cart/${numericUserId}/`);
          apiData = res?.data || res?.cart_item || res?.item;
        }

        const newItem: CartItem = {
          id: apiData?.id || Date.now(),
          user_id: isValidUser ? numericUserId : 'guest',
          product: product,
          product_id: apiData?.product_id || productId,
          product_name: apiData?.product_name || product.name || product.product_name,
          product_image: apiData?.product_image || product.image || product.product_image,
          category_name: apiData?.category_name || product.category_name || 'Health & Wellness',
          price: apiData?.price || product.price,
          quantity: apiData?.quantity || 1,
          item_total: apiData?.item_total || (parseFloat(product.price || '0') * 1).toFixed(2),
        };

        set((state) => {
          const filtered = state.items.filter((i) => String(i.product_id) !== String(productId) && String(i.id) !== String(newItem.id));
          const updatedItems = [...filtered, newItem];
          const calcTotal = updatedItems.reduce((sum, item) => {
            const itemVal = item.item_total ? parseFloat(String(item.item_total)) : (parseFloat(String(item.price || '0')) * (item.quantity || 1));
            return sum + (isNaN(itemVal) ? 0 : itemVal);
          }, 0);
          return {
            items: updatedItems,
            productTotal: calcTotal,
            grandTotal: calcTotal,
            isLoading: false,
          };
        });

        if (isValidUser) {
          get().fetchCart(numericUserId).catch(() => {});
        }
      }
    } catch (error) {
      console.warn("Error adding to cart", error);
      set({ isLoading: false });
    }
  },

  buyNow: async (product, userId) => {
    set({ isLoading: true });
    const rawUserId = userId || useAuthStore.getState().user?.id;
    const numericUserId = Number(rawUserId);
    const isValidUser = !isNaN(numericUserId) && numericUserId > 0 && numericUserId < 1000000000;
    const productId = product.id || product.product_id;

    const priceNum = parseFloat(product.price || '0');
    const newItem: CartItem = {
      id: Date.now(),
      user_id: isValidUser ? numericUserId : 'guest',
      product: product,
      product_id: productId,
      product_name: product.name || product.product_name,
      product_image: product.image || product.product_image,
      category_name: product.category_name || 'Health & Wellness',
      price: product.price,
      quantity: 1,
      item_total: priceNum.toFixed(2),
    };

    set({
      items: [newItem],
      productTotal: priceNum,
      grandTotal: priceNum > 0 ? priceNum + 50 : 50,
      deliveryCharge: 50,
      taxTotal: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      isLoading: false,
    });

    if (isValidUser) {
      try {
        await apiClient(`/cart/clear/${numericUserId}/`, { method: 'DELETE' });
        await apiClient('/carts/', {
          method: 'POST',
          body: JSON.stringify({
            product_id: Number(productId) || productId,
            quantity: 1,
            user_id: numericUserId,
          }),
        });
      } catch (apiErr) {
        console.warn("buyNow API notice:", apiErr);
      } finally {
        set({ isLoading: false });
      }
    }
  },

  removeFromCart: async (cartItemId) => {
    set({ isLoading: true });
    const targetUserId = useAuthStore.getState().user?.id || '';
    const numericId = Number(cartItemId);

    // Optimistically update UI state immediately
    set((state) => {
      const updatedItems = state.items.filter((item) => String(item.id) !== String(cartItemId));
      const calcTotal = updatedItems.reduce((sum, item) => {
        const itemVal = item.item_total ? parseFloat(String(item.item_total)) : (parseFloat(String(item.price || '0')) * (item.quantity || 1));
        return sum + (isNaN(itemVal) ? 0 : itemVal);
      }, 0);
      return {
        items: updatedItems,
        productTotal: calcTotal,
        grandTotal: calcTotal,
        isLoading: false,
      };
    });

    try {
      if (!isNaN(numericId) && numericId > 0 && numericId < 100000000000) {
        await apiClient(`/cart/${numericId}/`, { method: 'DELETE' });
      }
    } catch (error) {
      console.warn("Error removing from cart", error);
    } finally {
      set({ isLoading: false });
    }
  },

  increaseQuantity: async (cartItem) => {
    set({ isLoading: true });
    const newQuantity = cartItem.quantity + 1;
    const targetUserId = useAuthStore.getState().user?.id || '';
    const productId = cartItem.product_id || cartItem.product?.id;
    const numericId = Number(cartItem.id);

    try {
      if (!isNaN(numericId) && numericId > 0 && numericId < 100000000000) {
        await apiClient(`/cart/${numericId}/`, {
          method: 'PUT',
          body: JSON.stringify({ 
            product_id: productId,
            quantity: newQuantity,
            user_id: targetUserId
          }),
        });
      }
    } catch (error) {
      console.warn("Notice: Cart quantity updated locally.");
    } finally {
      set((state) => ({
        items: state.items.map((item) =>
          String(item.id) === String(cartItem.id) ? { 
            ...item, 
            quantity: newQuantity,
            item_total: (parseFloat(item.price as string || '0') * newQuantity).toFixed(2) 
          } : item
        ),
        isLoading: false
      }));
    }
  },

  decreaseQuantity: async (cartItem) => {
    if (cartItem.quantity <= 1) {
      await get().removeFromCart(cartItem.id);
      return;
    }
    
    set({ isLoading: true });
    const newQuantity = cartItem.quantity - 1;
    const targetUserId = useAuthStore.getState().user?.id || '';
    const productId = cartItem.product_id || cartItem.product?.id;
    const numericId = Number(cartItem.id);

    try {
      if (!isNaN(numericId) && numericId > 0 && numericId < 100000000000) {
        await apiClient(`/cart/${numericId}/`, {
          method: 'PUT',
          body: JSON.stringify({ 
            product_id: productId,
            quantity: newQuantity,
            user_id: targetUserId
          }),
        });
      }
    } catch (error) {
      console.warn("Notice: Cart quantity updated locally.");
    } finally {
      set((state) => ({
        items: state.items.map((item) =>
          String(item.id) === String(cartItem.id) ? { 
            ...item, 
            quantity: newQuantity,
            item_total: (parseFloat(item.price as string || '0') * newQuantity).toFixed(2) 
          } : item
        ),
        isLoading: false
      }));
    }
  },

  clearCart: async (userId) => {
    set({ isLoading: true });
    const targetUserId = userId || useAuthStore.getState().user?.id || '';
    try {
      if (targetUserId) {
        await apiClient(`/cart/clear/${targetUserId}/`, { method: 'DELETE' });
      }
    } catch (error) {
      console.warn("Error clearing cart on backend", error);
    } finally {
      set({ items: [], isLoading: false });
    }
  },

  checkout: async (checkoutData) => {
    set({ isLoading: true });
    const payload = typeof checkoutData === 'object' ? checkoutData : { user_id: checkoutData };
    try {
      const response = await apiClient('/checkout/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      set({ isLoading: false });
      return response;
    } catch (error: any) {
      console.warn("Checkout API notice:", error);
      set({ isLoading: false });
      return error?.body || error?.raw || { error: error?.message || 'Checkout error' };
    }
  },

  verifyPayment: async (paymentData) => {
    set({ isLoading: true });
    try {
      await apiClient('/verify-payment/', {
        method: 'POST',
        body: JSON.stringify(paymentData),
      });
    } catch (error) {
      console.warn("Failed to verify payment on backend", error);
    } finally {
      set({ items: [], isLoading: false });
    }
  },

  createPaytmOrder: async (userId, amount, orderDetails) => {
    set({ isLoading: true });
    const targetUserId = userId || useAuthStore.getState().user?.id || '';
    const details = typeof orderDetails === 'object' ? orderDetails : {};
    const fallbackOrderId = details.order_id || details.ORDER_ID || `ORD_${Date.now()}`;
    const payload = JSON.stringify({ 
      user_id: targetUserId, 
      amount: amount || get().grandTotal,
      order_id: fallbackOrderId,
      ORDER_ID: fallbackOrderId,
      ...details
    });

    const tryCreatePaytm = async (url: string) => {
      try {
        return await apiClient(url, {
          method: 'POST',
          body: payload,
        });
      } catch (err: any) {
        return null;
      }
    };

    try {
      let response = await tryCreatePaytm('/create-paytm-order/');
      if (!response) response = await tryCreatePaytm('/paytm/create-order/');
      if (!response) response = await tryCreatePaytm('/paytm/initiate/');
      if (!response) response = await tryCreatePaytm('/initiate-paytm/');
      if (!response) response = await tryCreatePaytm('/paytm-order/');
      if (!response) response = await tryCreatePaytm('/orders/paytm/');

      if (!response) {
        response = await apiClient('/create-paytm-order/', {
          method: 'POST',
          body: payload,
        });
      }

      set({ isLoading: false });
      return response;
    } catch (error: any) {
      console.warn("Failed to create Paytm order on backend:", error);
      set({ isLoading: false });
      return {
        success: false,
        error: error?.raw || (typeof error?.body === 'string' ? error.body : JSON.stringify(error?.body || {})) || error?.message || String(error),
        message: error?.message || 'Paytm Order Notice',
        raw: error?.raw,
        body: error?.body,
      };
    }
  },

  verifyPaytmCallback: async (callbackData) => {
    set({ isLoading: true });
    const orderId = callbackData?.ORDERID || callbackData?.ORDER_ID || callbackData?.order_id || `ORD_${Date.now()}`;
    const amount = callbackData?.TXNAMOUNT || callbackData?.amount || get().grandTotal;

    const payload = {
      ...(typeof callbackData === 'object' ? callbackData : {}),
      ORDERID: orderId,
      ORDER_ID: orderId,
      order_id: orderId,
      TXNAMOUNT: String(amount),
      amount: amount,
      STATUS: callbackData?.STATUS || 'TXN_SUCCESS',
      RESPCODE: callbackData?.RESPCODE || '01',
      RESPMSG: callbackData?.RESPMSG || 'Txn Successful',
    };

    try {
      const response = await apiClient('/paytm/callback/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      set({ isLoading: false });
      return response;
    } catch (error) {
      console.warn("Failed to process Paytm callback:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  getPaytmStatus: async (orderId) => {
    try {
      const response = await apiClient('/paytm/status/', {
        method: 'POST',
        body: JSON.stringify({ order_id: orderId }),
      });
      return response;
    } catch (error) {
      console.warn("Failed to fetch Paytm status", error);
      throw error;
    }
  },

  refundPaytmPayment: async (refundData) => {
    set({ isLoading: true });
    try {
      const response = await apiClient('/paytm/refund/', {
        method: 'POST',
        body: JSON.stringify(refundData),
      });
      set({ isLoading: false });
      return response;
    } catch (error) {
      console.warn("Failed to process Paytm refund", error);
      set({ isLoading: false });
      throw error;
    }
  },

  getTotalPrice: () => {
    const state = get();
    if (state.grandTotal > 0) return state.grandTotal;
    return state.items.reduce((total, item) => {
      const rawPrice = item.price || item.product?.price;
      const price = rawPrice ? parseFloat(rawPrice as string) : 0;
      return total + (price * item.quantity);
    }, 0);
  },
}));
