'use client';

import { create } from 'zustand';
import type { FilterState } from '@/types';

interface FilterStore extends FilterState {
  setGender: (gender: FilterState['gender']) => void;
  toggleSize: (size: string) => void;
  toggleColor: (color: string) => void;
  setPriceRange: (min: number, max: number) => void;
  setCategory: (category: string | null) => void;
  setSortBy: (sort: FilterState['sortBy']) => void;
  setSearch: (search: string) => void;
  resetFilters: () => void;
}

const defaultState: FilterState = {
  gender: 'all',
  sizes: [],
  colors: [],
  priceMin: 0,
  priceMax: 100000,
  category: null,
  sortBy: 'newest',
  search: '',
};

export const useFilterStore = create<FilterStore>((set) => ({
  ...defaultState,

  setGender: (gender) => set({ gender }),

  toggleSize: (size) =>
    set((state) => ({
      sizes: state.sizes.includes(size)
        ? state.sizes.filter((s) => s !== size)
        : [...state.sizes, size],
    })),

  toggleColor: (color) =>
    set((state) => ({
      colors: state.colors.includes(color)
        ? state.colors.filter((c) => c !== color)
        : [...state.colors, color],
    })),

  setPriceRange: (min, max) => set({ priceMin: min, priceMax: max }),
  setCategory: (category) => set({ category }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSearch: (search) => set({ search }),
  resetFilters: () => set(defaultState),
}));
