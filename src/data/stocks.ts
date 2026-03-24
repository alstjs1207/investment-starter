export interface StockInfo {
  name: string;
  ticker: string;
  market: 'KRX' | 'NYSE' | 'NASDAQ';
  sector: string;
}

export const STOCKS: StockInfo[] = [
  // 반도체
  { name: '엔비디아', ticker: 'NVDA', market: 'NASDAQ', sector: '반도체' },
  { name: '브로드컴', ticker: 'AVGO', market: 'NASDAQ', sector: '반도체' },
  { name: 'TSMC', ticker: 'TSM', market: 'NYSE', sector: '반도체' },
  { name: '삼성전자', ticker: '005930', market: 'KRX', sector: '반도체' },
  { name: 'SK하이닉스', ticker: '000660', market: 'KRX', sector: '반도체' },
  { name: '삼성전기', ticker: '009150', market: 'KRX', sector: '반도체' },
  { name: '샌디스크', ticker: 'SNDK', market: 'NASDAQ', sector: '반도체' },
  // 소프트웨어 / 클라우드
  { name: '오라클', ticker: 'ORCL', market: 'NYSE', sector: 'SW·클라우드' },
  { name: '구글', ticker: 'GOOGL', market: 'NASDAQ', sector: 'SW·클라우드' },
  { name: '마이크로소프트', ticker: 'MSFT', market: 'NASDAQ', sector: 'SW·클라우드' },
  { name: '팔란티어', ticker: 'PLTR', market: 'NASDAQ', sector: 'SW·클라우드' },
  { name: '메타', ticker: 'META', market: 'NASDAQ', sector: 'SW·클라우드' },
  // 에너지 / 전력
  { name: 'LS일렉트릭', ticker: '010120', market: 'KRX', sector: '에너지·전력' },
  { name: '한국전력공사', ticker: '015760', market: 'KRX', sector: '에너지·전력' },
  { name: '센트러스 에너지', ticker: 'LEU', market: 'NYSE', sector: '에너지·전력' },
  { name: '블룸에너지', ticker: 'BE', market: 'NYSE', sector: '에너지·전력' },
  // 방산
  { name: 'LIG넥스원', ticker: '079550', market: 'KRX', sector: '방산' },
  { name: '헌팅턴 잉걸스 인더스트리즈', ticker: 'HII', market: 'NYSE', sector: '방산' },
  { name: '한국항공우주산업', ticker: '047810', market: 'KRX', sector: '방산' },
  { name: 'RTX', ticker: 'RTX', market: 'NYSE', sector: '방산' },
  // 소재
  { name: 'MP머티리얼즈', ticker: 'MP', market: 'NYSE', sector: '소재' },
  { name: '고려아연', ticker: '010130', market: 'KRX', sector: '소재' },
  { name: '두산', ticker: '000150', market: 'KRX', sector: '소재' },
];

export const STOCK_SECTORS = [...new Set(STOCKS.map((s) => s.sector))];

/** 기본 종목 티커 Set (커스텀 종목과 중복 체크용) */
export const DEFAULT_TICKERS = new Set(STOCKS.map((s) => s.ticker));

/** JSON 파일에서 종목 배열을 파싱하고 유효성을 검증 */
export function parseStockJson(raw: string): { stocks: StockInfo[]; errors: string[] } {
  const errors: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { stocks: [], errors: ['유효한 JSON 형식이 아닙니다.'] };
  }

  const arr = Array.isArray(parsed) ? parsed : (parsed as Record<string, unknown>).stocks;
  if (!Array.isArray(arr)) {
    return { stocks: [], errors: ['JSON은 배열이거나 { "stocks": [...] } 형식이어야 합니다.'] };
  }

  const validMarkets = new Set(['KRX', 'NYSE', 'NASDAQ']);
  const stocks: StockInfo[] = [];

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];
    if (!item || typeof item !== 'object') {
      errors.push(`[${i}] 유효하지 않은 항목입니다.`);
      continue;
    }
    const { name, ticker, market, sector } = item as Record<string, unknown>;
    if (typeof name !== 'string' || !name.trim()) {
      errors.push(`[${i}] name이 누락되었습니다.`);
      continue;
    }
    if (typeof ticker !== 'string' || !ticker.trim()) {
      errors.push(`[${i}] ticker가 누락되었습니다.`);
      continue;
    }
    if (typeof market !== 'string' || !validMarkets.has(market)) {
      errors.push(`[${i}] market은 KRX, NYSE, NASDAQ 중 하나여야 합니다.`);
      continue;
    }
    if (typeof sector !== 'string' || !sector.trim()) {
      errors.push(`[${i}] sector가 누락되었습니다.`);
      continue;
    }
    if (DEFAULT_TICKERS.has(ticker.trim())) {
      errors.push(`[${i}] "${name}" (${ticker})는 기본 종목에 이미 존재합니다.`);
      continue;
    }
    stocks.push({
      name: name.trim(),
      ticker: ticker.trim(),
      market: market as StockInfo['market'],
      sector: sector.trim(),
    });
  }

  return { stocks, errors };
}
