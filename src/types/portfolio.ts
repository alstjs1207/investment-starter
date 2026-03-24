export interface Purchase {
  id: string;
  type: 'buy' | 'sell';
  date: string;
  quantity: number;
  pricePerShare: number;
  currency: 'KRW' | 'USD';
  exchangeRate?: number;
}

export interface Company {
  id: string;
  name: string;
  ticker: string;
  market: 'KRX' | 'NYSE' | 'NASDAQ';
  targetWeight: number;
  purchased: boolean;
  purchases: Purchase[];
}

export interface Sector {
  id: string;
  name: string;
  targetWeight: number;
  companies: Company[];
}

export interface Portfolio {
  totalBudget: number; // 전체 예산 (KRW)
  sectors: Sector[];
}

export type EntryZoneStatus = 'entry_ok' | 'waiting' | 'below_zone' | 'not_set';

export interface WatchlistItem {
  id: string;                          // "wl_" prefix
  name: string;                        // 종목명 (필수)
  ticker: string;                      // 티커 (필수)
  market: 'KRX' | 'NYSE' | 'NASDAQ';  // 시장
  targetSectorId: string;              // 편입 예정 섹터 (Sector.id 참조)
  targetWeight: number;                // 편입 예정 비중 (%)
  buyZoneLower?: number;               // 매수 희망 하단가
  buyZoneUpper?: number;               // 매수 희망 상단가
  createdAt: string;                   // ISO date
}
