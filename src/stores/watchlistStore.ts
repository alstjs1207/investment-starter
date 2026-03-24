import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WatchlistItem } from '@/types';
import { idbStorage, genId } from '@/utils/storage';

interface WatchlistState {
  items: WatchlistItem[];

  addItem: (item: Omit<WatchlistItem, 'id' | 'createdAt'>) => void;
  updateItem: (id: string, patch: Partial<Omit<WatchlistItem, 'id' | 'createdAt'>>) => void;
  deleteItem: (id: string) => void;

  exportData: () => string;
  importData: (json: string) => boolean;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((s) => ({
          items: [
            ...s.items,
            { ...item, id: genId('wl'), createdAt: new Date().toISOString() },
          ],
        })),

      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
        })),

      deleteItem: (id) =>
        set((s) => ({
          items: s.items.filter((it) => it.id !== id),
        })),

      exportData: () => JSON.stringify(get().items, null, 2),

      importData: (json) => {
        try {
          const data = JSON.parse(json) as WatchlistItem[];
          if (!Array.isArray(data)) return false;
          set({ items: data });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'investment-watchlist',
      storage: idbStorage,
    },
  ),
);
