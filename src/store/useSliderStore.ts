import { create } from 'zustand';
import { apiClient } from '../api/client';
import { useAuthStore } from './useAuthStore';

export interface Slider {
  id: string | number;
  image: string;
  overlay_text: string;
}

interface SliderState {
  sliders: Slider[];
  isLoading: boolean;
  error: string | null;
  fetchSliders: (options?: { force?: boolean }) => Promise<void>;
  addSlider: (data: { overlay_text: string; imageFile?: any }) => Promise<void>;
  deleteSlider: (id: string) => Promise<void>;
}

const SLIDER_CACHE_MS = 60000;
let lastSliderFetchAt = 0;

export const useSliderStore = create<SliderState>((set, get) => ({
  sliders: [],
  isLoading: false,
  error: null,

  fetchSliders: async (options = {}) => {
    const state = get();
    const isFresh = Date.now() - lastSliderFetchAt < SLIDER_CACHE_MS;

    if (!options.force && (state.isLoading || (state.sliders.length > 0 && isFresh))) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await apiClient('/sliders/');
      set({ sliders: response || [], isLoading: false });
      lastSliderFetchAt = Date.now();
    } catch (error: any) {
      console.warn("Notice fetching sliders:", error);
      set({ error: error.message, isLoading: false });
    }
  },

  addSlider: async ({ overlay_text, imageFile }) => {
    try {
      const formData = new FormData();
      formData.append('overlay_text', overlay_text || '');
      if (imageFile?.uri) {
        formData.append('image', {
          uri: imageFile.uri,
          type: imageFile.type || 'image/jpeg',
          name: imageFile.fileName || 'slider.jpg',
        } as any);
      }
      
      const token = useAuthStore.getState().token;
      
      const response = await fetch('https://api.codingboss.in/herbal/sliders/', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      
      const text = await response.text();
      if (!response.ok) throw new Error(text);
      
      const newSlider = JSON.parse(text);
      set((state) => ({ sliders: [...state.sliders, newSlider] }));
    } catch (error: any) {
      console.error('Failed to add slider', error);
      throw error;
    }
  },

  deleteSlider: async (id: string) => {
    try {
      await apiClient(`/sliders/${id}/`, { method: 'DELETE' });
      set((state) => ({ sliders: state.sliders.filter((s) => String(s.id) !== String(id)) }));
    } catch (error: any) {
      console.error('Failed to delete slider', error);
      throw error;
    }
  },
}));
