import { createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';

export const idbStorage = createJSONStorage(() => ({
  getItem: async (name: string) => (await idbGet(name)) ?? null,
  setItem: async (name: string, value: string) => { await idbSet(name, value); },
  removeItem: async (name: string) => { await idbDel(name); },
}));

let _nextId = Date.now();
export const genId = (prefix: string) => `${prefix}_${(_nextId++).toString(36)}`;
