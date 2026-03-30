import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Product } from "@entry/types";
import { toast } from "sonner";

interface CompareState {
  compareItems: Product[];
  isLoading: boolean;
  isPopupOpen: boolean;
  recentAddedProduct: Product | null;
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  setPopupOpen: (isOpen: boolean) => void;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      compareItems: [],
      isLoading: false,
      isPopupOpen: false,
      recentAddedProduct: null,

      addToCompare: (product) => {
        const state = get();
        if (state.compareItems.length >= 4) {
          toast.error("Maximum 4 products allowed to compare");
          return;
        }

        if (!state.compareItems.some((item) => item._id === product._id)) {
          set({
            compareItems: [...state.compareItems, product],
            isPopupOpen: true,
            recentAddedProduct: product,
          });
          // Note: we removed the toast here because we have the popup now.
        }
      },

      removeFromCompare: (productId) => {
        set((state) => ({
          compareItems: state.compareItems.filter(
            (item) => item._id !== productId,
          ),
        }));
        toast.success("Removed from compare");
      },

      clearCompare: () => {
        set({ compareItems: [] });
      },

      isInCompare: (productId) => {
        const state = get();
        return state.compareItems.some((item) => item._id === productId);
      },

      setPopupOpen: (isOpen: boolean) => {
        set({ isPopupOpen: isOpen });
      },
    }),
    {
      name: "compare-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ compareItems: state.compareItems }),
    },
  ),
);
