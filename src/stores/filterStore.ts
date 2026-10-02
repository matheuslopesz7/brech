import { create } from "zustand";

export interface CategoryFilter {
  gender: "masculino" | "feminino" | null;
  category: string | null; // e.g. "camisetas", "acessorios"
  label: string;
}

interface FilterStore {
  search: string;
  size: string | null;
  category: CategoryFilter | null;
  setSearch: (s: string) => void;
  setSize: (s: string | null) => void;
  setCategory: (c: CategoryFilter | null) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  search: "",
  size: null,
  category: null,
  setSearch: (search) => set({ search }),
  setSize: (size) => set({ size }),
  setCategory: (category) => set({ category }),
}));

export const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
