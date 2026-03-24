import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StockInfo } from '@/data/stocks';
import { idbStorage } from '@/utils/storage';

interface StockDirectoryState {
  customStocks: StockInfo[];
  addStocks: (stocks: StockInfo[]) => { added: number; skipped: number };
  removeStock: (ticker: string) => void;
  clearCustomStocks: () => void;
}

export const useStockDirectoryStore = create<StockDirectoryState>()(
  persist(
    (set, get) => ({
      customStocks: [],

      addStocks: (stocks) => {
        const existing = get().customStocks;
        const existingTickers = new Set(existing.map((s) => s.ticker));
        const newStocks = stocks.filter((s) => !existingTickers.has(s.ticker));
        set({ customStocks: [...existing, ...newStocks] });
        return { added: newStocks.length, skipped: stocks.length - newStocks.length };
      },

      removeStock: (ticker) => {
        set({ customStocks: get().customStocks.filter((s) => s.ticker !== ticker) });
      },

      clearCustomStocks: () => {
        set({ customStocks: [] });
      },
    }),
    {
      name: 'investment-stock-directory',
      storage: idbStorage,
    },
  ),
);
