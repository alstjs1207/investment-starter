import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import type { Portfolio, Sector, Company, Purchase } from '@/types';
import { getTotalQuantity } from '@/utils/calc';
import { idbStorage, genId } from '@/utils/storage';

/** localStorage → IndexedDB 일회성 마이그레이션 */
async function migrateFromLocalStorage() {
  const key = 'investment-portfolio';
  try {
    const existing = await idbGet(key);
    if (existing) return; // 이미 IndexedDB에 데이터 있음

    const lsData = localStorage.getItem(key);
    if (lsData) {
      await idbSet(key, lsData);
      localStorage.removeItem(key);
    }
  } catch {
    // localStorage 또는 IndexedDB 접근 불가 (SSR 등)
  }
}
migrateFromLocalStorage();

/** 기존 데이터 마이그레이션 */
function migratePortfolio(portfolio: Portfolio & { totalBudgetKRW?: number; totalBudgetUSD?: number }): Portfolio {
  // 구 버전 dual-budget → 단일 totalBudget 마이그레이션
  const totalBudget = portfolio.totalBudget ??
    (portfolio.totalBudgetKRW ?? 0);

  return {
    totalBudget,
    sectors: portfolio.sectors.map((sec) => ({
      ...sec,
      companies: sec.companies.map((com) => ({
        ...com,
        purchases: com.purchases.map((p) => ({
          ...p,
          type: (p as Purchase).type ?? 'buy',
        })),
      })),
    })),
  };
}

interface PortfolioState {
  portfolio: Portfolio;

  // Budget
  setBudget: (budget: number) => void;

  // Sector CRUD
  addSector: (name: string, targetWeight: number) => void;
  updateSector: (id: string, patch: Partial<Pick<Sector, 'name' | 'targetWeight'>>) => void;
  deleteSector: (id: string) => void;

  // Company CRUD
  addCompany: (sectorId: string, company: Omit<Company, 'id' | 'purchased' | 'purchases'>) => void;
  updateCompany: (sectorId: string, companyId: string, patch: Partial<Pick<Company, 'name' | 'ticker' | 'market' | 'targetWeight'>>) => void;
  deleteCompany: (sectorId: string, companyId: string) => void;

  // Purchase CRUD
  addPurchase: (sectorId: string, companyId: string, purchase: Omit<Purchase, 'id'>) => void;
  deletePurchase: (sectorId: string, companyId: string, purchaseId: string) => void;

  // Mark purchased
  togglePurchased: (sectorId: string, companyId: string) => void;

  // Data export/import
  exportData: () => string;
  importData: (json: string) => boolean;
}

const initialPortfolio: Portfolio = {
  totalBudget: 0,
  sectors: [],
};

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      portfolio: initialPortfolio,

      setBudget: (budget) =>
        set((s) => ({
          portfolio: { ...s.portfolio, totalBudget: budget },
        })),

      addSector: (name, targetWeight) =>
        set((s) => ({
          portfolio: {
            ...s.portfolio,
            sectors: [
              ...s.portfolio.sectors,
              { id: genId('sec'), name, targetWeight, companies: [] },
            ],
          },
        })),

      updateSector: (id, patch) =>
        set((s) => ({
          portfolio: {
            ...s.portfolio,
            sectors: s.portfolio.sectors.map((sec) =>
              sec.id === id ? { ...sec, ...patch } : sec,
            ),
          },
        })),

      deleteSector: (id) =>
        set((s) => ({
          portfolio: {
            ...s.portfolio,
            sectors: s.portfolio.sectors.filter((sec) => sec.id !== id),
          },
        })),

      addCompany: (sectorId, company) =>
        set((s) => ({
          portfolio: {
            ...s.portfolio,
            sectors: s.portfolio.sectors.map((sec) =>
              sec.id === sectorId
                ? {
                    ...sec,
                    companies: [
                      ...sec.companies,
                      { ...company, id: genId('com'), purchased: false, purchases: [] },
                    ],
                  }
                : sec,
            ),
          },
        })),

      updateCompany: (sectorId, companyId, patch) =>
        set((s) => ({
          portfolio: {
            ...s.portfolio,
            sectors: s.portfolio.sectors.map((sec) =>
              sec.id === sectorId
                ? {
                    ...sec,
                    companies: sec.companies.map((com) =>
                      com.id === companyId ? { ...com, ...patch } : com,
                    ),
                  }
                : sec,
            ),
          },
        })),

      deleteCompany: (sectorId, companyId) =>
        set((s) => ({
          portfolio: {
            ...s.portfolio,
            sectors: s.portfolio.sectors.map((sec) =>
              sec.id === sectorId
                ? {
                    ...sec,
                    companies: sec.companies.filter((com) => com.id !== companyId),
                  }
                : sec,
            ),
          },
        })),

      addPurchase: (sectorId, companyId, purchase) =>
        set((s) => {
          // 매도 시 보유 수량 초과 검증
          if (purchase.type === 'sell') {
            for (const sec of s.portfolio.sectors) {
              if (sec.id !== sectorId) continue;
              const com = sec.companies.find((c) => c.id === companyId);
              if (com) {
                const currentQty = getTotalQuantity(com);
                if (purchase.quantity > currentQty) return s;
              }
            }
          }

          return {
            portfolio: {
              ...s.portfolio,
              sectors: s.portfolio.sectors.map((sec) =>
                sec.id === sectorId
                  ? {
                      ...sec,
                      companies: sec.companies.map((com) => {
                        if (com.id !== companyId) return com;
                        const newPurchases = [...com.purchases, { ...purchase, id: genId('pur') }];
                        const hasBuys = newPurchases.some((p) => p.type === 'buy');
                        return {
                          ...com,
                          purchased: hasBuys,
                          purchases: newPurchases,
                        };
                      }),
                    }
                  : sec,
              ),
            },
          };
        }),

      deletePurchase: (sectorId, companyId, purchaseId) =>
        set((s) => ({
          portfolio: {
            ...s.portfolio,
            sectors: s.portfolio.sectors.map((sec) =>
              sec.id === sectorId
                ? {
                    ...sec,
                    companies: sec.companies.map((com) => {
                      if (com.id !== companyId) return com;
                      const remaining = com.purchases.filter((p) => p.id !== purchaseId);
                      return {
                        ...com,
                        purchases: remaining,
                        purchased: remaining.some((p) => p.type === 'buy'),
                      };
                    }),
                  }
                : sec,
            ),
          },
        })),

      togglePurchased: (sectorId, companyId) =>
        set((s) => ({
          portfolio: {
            ...s.portfolio,
            sectors: s.portfolio.sectors.map((sec) =>
              sec.id === sectorId
                ? {
                    ...sec,
                    companies: sec.companies.map((com) =>
                      com.id === companyId ? { ...com, purchased: !com.purchased } : com,
                    ),
                  }
                : sec,
            ),
          },
        })),

      exportData: () => JSON.stringify(get().portfolio, null, 2),

      importData: (json) => {
        try {
          const data = JSON.parse(json) as Portfolio;
          if (!data.sectors || typeof data.totalBudget !== 'number') return false;
          set({ portfolio: migratePortfolio(data) });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'investment-portfolio',
      storage: idbStorage,
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<PortfolioState>) };
        if (merged.portfolio) {
          merged.portfolio = migratePortfolio(merged.portfolio);
        }
        return merged;
      },
    },
  ),
);
