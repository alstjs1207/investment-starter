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
