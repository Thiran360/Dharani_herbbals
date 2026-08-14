import { create } from 'zustand';
import { apiClient } from '../api/client';

export interface ShippingChargeRule {
  id: number;
  state_name: string;
  state_code: string;
  shipping_amount: number;
  free_above: number;
  min_order: number;
}

export interface ShippingCalculationResult {
  shippingFee: number;
  freeAbove: number;
  minOrder: number;
  matchedState: string;
  isFreeShipping: boolean;
  amountNeededForFreeShipping: number;
  isBelowMinOrder: boolean;
  minOrderDeficit: number;
  ruleFound: boolean;
}

const DEFAULT_FALLBACK_RULES: ShippingChargeRule[] = [
  { id: 1, state_name: 'Tamil Nadu', state_code: 'TN', shipping_amount: 50, free_above: 750, min_order: 110 },
  { id: 2, state_name: 'Andhra Pradesh', state_code: 'AP', shipping_amount: 150, free_above: 1000, min_order: 400 },
  { id: 8, state_name: 'Kerala', state_code: 'KL', shipping_amount: 150, free_above: 1000, min_order: 400 },
  { id: 12, state_name: 'Karnataka', state_code: 'KA', shipping_amount: 150, free_above: 1000, min_order: 400 },
  { id: 16, state_name: 'Maharashtra', state_code: 'MH', shipping_amount: 250, free_above: 1200, min_order: 500 },
  { id: 21, state_name: 'Delhi', state_code: 'DL', shipping_amount: 250, free_above: 1000, min_order: 500 },
  { id: 31, state_name: 'Puducherry', state_code: 'PY', shipping_amount: 200, free_above: 1000, min_order: 400 },
];

const DEFAULT_STATE_LIST = DEFAULT_FALLBACK_RULES.map((r) => r.state_name);

interface ShippingState {
  shippingRules: ShippingChargeRule[];
  stateList: string[];
  isLoading: boolean;
  isFetched: boolean;
  error: string | null;
  fetchShippingRules: () => Promise<void>;
  fetchShippingRuleById: (id: number) => Promise<ShippingChargeRule | null>;
  updateShippingRule: (id: number, ruleData: Partial<ShippingChargeRule>) => Promise<any>;
  deleteShippingRule: (id: number) => Promise<any>;
  calculateShipping: (subtotal: number, stateOrAddress?: string) => ShippingCalculationResult;
}

export const useShippingStore = create<ShippingState>((set, get) => ({
  shippingRules: DEFAULT_FALLBACK_RULES,
  stateList: DEFAULT_STATE_LIST,
  isLoading: false,
  isFetched: false,
  error: null,

  fetchShippingRules: async () => {
    if (get().isLoading) return;
    
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient('/shipping-charge/');
      const rawData = response?.data || (Array.isArray(response) ? response : []);
      
      if (Array.isArray(rawData) && rawData.length > 0) {
        const parsedRules: ShippingChargeRule[] = rawData.map((item: any) => ({
          id: Number(item.id) || Date.now(),
          state_name: String(item.state_name || '').trim(),
          state_code: String(item.state_code || '').trim(),
          shipping_amount: parseFloat(String(item.shipping_amount || 0)) || 0,
          free_above: parseFloat(String(item.free_above || 0)) || 0,
          min_order: parseFloat(String(item.min_order || 0)) || 0,
        }));

        const states = parsedRules.map((r) => r.state_name);

        set({
          shippingRules: parsedRules,
          stateList: states,
          isLoading: false,
          isFetched: true,
        });
      } else {
        set({ isLoading: false, isFetched: true });
      }
    } catch (err: any) {
      console.warn('Error fetching shipping rules:', err);
      set({ 
        error: err?.message || 'Failed to load shipping charges', 
        isLoading: false 
      });
    }
  },

  fetchShippingRuleById: async (id: number): Promise<ShippingChargeRule | null> => {
    try {
      const response = await apiClient(`/shipping-charge/${id}/`);
      const item = response?.data || response;
      if (item && (item.state_name || item.id)) {
        const rule: ShippingChargeRule = {
          id: Number(item.id) || id,
          state_name: String(item.state_name || '').trim(),
          state_code: String(item.state_code || '').trim(),
          shipping_amount: parseFloat(String(item.shipping_amount || 0)) || 0,
          free_above: parseFloat(String(item.free_above || 0)) || 0,
          min_order: parseFloat(String(item.min_order || 0)) || 0,
        };
        return rule;
      }
    } catch (err) {
      console.warn(`Notice fetching shipping charge by id ${id}:`, err);
    }
    const existing = get().shippingRules.find((r) => Number(r.id) === Number(id));
    return existing || null;
  },

  updateShippingRule: async (id: number, ruleData: Partial<ShippingChargeRule>): Promise<any> => {
    set({ isLoading: true });
    try {
      const res = await apiClient(`/shipping-charge/${id}/`, {
        method: 'PUT',
        body: JSON.stringify(ruleData),
      });
      await get().fetchShippingRules();
      return res;
    } catch (err: any) {
      console.warn(`Error updating shipping charge ${id}:`, err);
      set({ isLoading: false });
      throw err;
    }
  },

  deleteShippingRule: async (id: number): Promise<any> => {
    set({ isLoading: true });
    try {
      const res = await apiClient(`/shipping-charge/${id}/`, {
        method: 'DELETE',
      });
      await get().fetchShippingRules();
      return res;
    } catch (err: any) {
      console.warn(`Error deleting shipping charge ${id}:`, err);
      set({ isLoading: false });
      throw err;
    }
  },

  calculateShipping: (subtotal: number, stateOrAddress?: string): ShippingCalculationResult => {
    const rules = get().shippingRules;
    const input = (stateOrAddress || '').trim().toLowerCase();

    // If no address or state has been provided yet, default shipping fee to 0
    if (!input) {
      return {
        shippingFee: 0,
        freeAbove: 0,
        minOrder: 0,
        matchedState: 'Select Address',
        isFreeShipping: false,
        amountNeededForFreeShipping: 0,
        isBelowMinOrder: false,
        minOrderDeficit: 0,
        ruleFound: false,
      };
    }

    let matchedRule: ShippingChargeRule | undefined;

    if (rules.length > 0) {
      // 1. Exact match by state_name or state_code
      matchedRule = rules.find((r) => 
        r.state_name.toLowerCase() === input || 
        r.state_code.toLowerCase() === input
      );

      // 2. Substring match if input contains state_name or vice versa
      if (!matchedRule) {
        matchedRule = rules.find((r) => 
          input.includes(r.state_name.toLowerCase()) || 
          (r.state_code && input.includes(r.state_code.toLowerCase()))
        );
      }

      // 3. Fallback for common Tamil Nadu city names if full address string was passed
      if (!matchedRule) {
        const tnCities = ['chennai', 'coimbatore', 'madurai', 'erode', 'salem', 'gobichettipalayam', 'tirupur', 'trichy', 'thanjavur', 'karur', 'vellore', 'tirunelveli', 'kanyakumari', 'tuticorin', 'thoothukudi'];
        if (tnCities.some((city) => input.includes(city))) {
          matchedRule = rules.find((r) => r.state_name.toLowerCase() === 'tamil nadu');
        }
      }
    }

    const ruleFound = Boolean(matchedRule);
    const ruleToUse = matchedRule || rules.find((r) => r.state_name.toLowerCase() === 'tamil nadu') || rules[0] || DEFAULT_FALLBACK_RULES[0];

    const shippingAmount = typeof ruleToUse.shipping_amount === 'number' ? ruleToUse.shipping_amount : parseFloat(String(ruleToUse.shipping_amount || 0));
    const freeAbove = typeof ruleToUse.free_above === 'number' ? ruleToUse.free_above : parseFloat(String(ruleToUse.free_above || 0));
    const minOrder = typeof ruleToUse.min_order === 'number' ? ruleToUse.min_order : parseFloat(String(ruleToUse.min_order || 0));

    const isFreeShipping = subtotal >= freeAbove;
    const shippingFee = (subtotal > 0 && isFreeShipping) ? 0 : shippingAmount;
    const amountNeededForFreeShipping = isFreeShipping ? 0 : Math.max(0, freeAbove - subtotal);
    const isBelowMinOrder = subtotal > 0 && subtotal < minOrder;
    const minOrderDeficit = isBelowMinOrder ? Math.max(0, minOrder - subtotal) : 0;

    return {
      shippingFee,
      freeAbove,
      minOrder,
      matchedState: ruleToUse.state_name,
      isFreeShipping,
      amountNeededForFreeShipping,
      isBelowMinOrder,
      minOrderDeficit,
      ruleFound,
    };
  },
}));
