import { create } from 'zustand';
import { fetchStockPrice, fetchExchangeRate } from '@/utils/api';

interface StockQuote {
  price: number;
  currency: 'KRW' | 'USD';
  name: string;
  change: number;
  changePercent: number;
  updatedAt: string;
}

interface MarketState {
  quotes: Record<string, StockQuote>;
  exchangeRate: number | null;
  exchangeRateUpdatedAt: string | null;
  loading: boolean;
  error: string | null;

  fetchQuote: (ticker: string, market: 'KRX' | 'NYSE' | 'NASDAQ') => Promise<void>;
  fetchAllQuotes: (stocks: { ticker: string; market: 'KRX' | 'NYSE' | 'NASDAQ' }[]) => Promise<void>;
  fetchRate: () => Promise<void>;
}

export const useMarketStore = create<MarketState>()((set, get) => ({
  quotes: {},
  exchangeRate: null,
  exchangeRateUpdatedAt: null,
  loading: false,
  error: null,

  fetchQuote: async (ticker, market) => {
    set({ loading: true, error: null });
    try {
      const quote = await fetchStockPrice(ticker, market);
      set((s) => ({
        quotes: { ...s.quotes, [ticker]: quote },
        loading: false,
      }));
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : '주가 조회 실패' });
    }
  },

  fetchAllQuotes: async (stocks) => {
    set({ loading: true, error: null });
    const results = { ...get().quotes };
    for (const { ticker, market } of stocks) {
      try {
        results[ticker] = await fetchStockPrice(ticker, market);
      } catch {
        // skip
      }
      // Yahoo Finance rate limit 회피
      if (stocks.length > 1) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }
    set({ quotes: results, loading: false });
  },

  fetchRate: async () => {
    try {
      const { rate, updatedAt } = await fetchExchangeRate();
      set({ exchangeRate: rate, exchangeRateUpdatedAt: updatedAt });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '환율 조회 실패' });
    }
  },
}));
