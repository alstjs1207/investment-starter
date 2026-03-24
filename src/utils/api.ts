const YAHOO_BASE = '/api/yahoo';

interface StockQuote {
  price: number;
  currency: 'KRW' | 'USD';
  name: string;
  change: number;
  changePercent: number;
  updatedAt: string;
}

interface ExchangeRate {
  rate: number;
  updatedAt: string;
}

// --- Stock Price (Yahoo Finance via proxy) ---

function buildYahooTicker(ticker: string, market: 'KRX' | 'NYSE' | 'NASDAQ'): string {
  if (market === 'KRX') {
    return `${ticker}.KS`;
  }
  return ticker;
}

export async function fetchStockPrice(
  ticker: string,
  market: 'KRX' | 'NYSE' | 'NASDAQ',
): Promise<StockQuote> {
  const yahooTicker = buildYahooTicker(ticker, market);
  const url = `${YAHOO_BASE}/v8/finance/chart/${encodeURIComponent(yahooTicker)}?interval=1d&range=1d`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`주가 조회 실패: ${res.status}`);

  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error('주가 데이터 없음');

  const meta = result.meta;
  const price = meta.regularMarketPrice ?? 0;
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = price - prevClose;
  const changePercent = prevClose ? (change / prevClose) * 100 : 0;

  return {
    price,
    currency: market === 'KRX' ? 'KRW' : 'USD',
    name: meta.shortName ?? meta.symbol ?? ticker,
    change,
    changePercent,
    updatedAt: new Date().toISOString(),
  };
}

// --- Batch fetch ---

export async function fetchMultipleStockPrices(
  stocks: { ticker: string; market: 'KRX' | 'NYSE' | 'NASDAQ' }[],
): Promise<Map<string, StockQuote>> {
  const results = new Map<string, StockQuote>();
  const promises = stocks.map(async ({ ticker, market }) => {
    try {
      const quote = await fetchStockPrice(ticker, market);
      results.set(ticker, quote);
    } catch {
      // skip failed
    }
  });
  await Promise.all(promises);
  return results;
}

// --- Exchange Rate ---

const EXCHANGE_RATE_CACHE_KEY = 'exchange-rate-cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

interface CachedRate {
  rate: number;
  fetchedAt: number;
}

function getCachedRate(): CachedRate | null {
  try {
    const raw = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedRate;
    if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached;
    return null;
  } catch {
    return null;
  }
}

function setCachedRate(rate: number) {
  try {
    const cached: CachedRate = { rate, fetchedAt: Date.now() };
    localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify(cached));
  } catch {
    // localStorage unavailable (e.g. Node test env)
  }
}

export async function fetchExchangeRate(): Promise<ExchangeRate> {
  const cached = getCachedRate();
  if (cached) {
    return { rate: cached.rate, updatedAt: new Date(cached.fetchedAt).toISOString() };
  }

  // Primary: open.er-api.com
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      const rate = data?.rates?.KRW;
      if (typeof rate === 'number') {
        setCachedRate(rate);
        return { rate, updatedAt: new Date().toISOString() };
      }
    }
  } catch {
    // fallback
  }

  // Fallback: fawazahmed0
  const res = await fetch(
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
  );
  if (!res.ok) throw new Error('환율 조회 실패');
  const data = await res.json();
  const rate = data?.usd?.krw;
  if (typeof rate !== 'number') throw new Error('환율 데이터 없음');
  setCachedRate(rate);
  return { rate, updatedAt: new Date().toISOString() };
}
