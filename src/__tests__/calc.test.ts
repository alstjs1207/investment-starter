import { describe, it, expect } from 'vitest';
import {
  getSectorBudget,
  getCompanyBudget,
  getTotalPurchaseAmount,
  getTotalQuantity,
  getBuyableQuantity,
  getSectorCompanyWeightSum,
  getTotalSectorWeightSum,
  validateSectorWeights,
  validateCompanyWeights,
  calculateWeights,
  calculateRebalance,
  calculateStockReturn,
  formatCurrency,
  formatNumber,
} from '@/utils/calc';
import type { Portfolio, Sector, Company } from '@/types';

// ─── Test Helpers ───

const mockCompany = (overrides: Partial<Company> = {}): Company => ({
  id: 'com_1',
  name: '삼성전자',
  ticker: '005930',
  market: 'KRX',
  targetWeight: 50,
  purchased: true,
  purchases: [
    { id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 75000, currency: 'KRW' },
  ],
  ...overrides,
});

const mockSector = (overrides: Partial<Sector> = {}): Sector => ({
  id: 'sec_1',
  name: 'IT',
  targetWeight: 30,
  companies: [mockCompany()],
  ...overrides,
});

const mockPortfolio = (overrides: Partial<Portfolio> = {}): Portfolio => ({
  totalBudget: 10_000_000,
  sectors: [mockSector()],
  ...overrides,
});

// ─── getSectorBudget ───

describe('getSectorBudget', () => {
  it('예산 × 섹터 가중치로 계산', () => {
    const portfolio = mockPortfolio();
    const sector = portfolio.sectors[0];
    expect(getSectorBudget(portfolio, sector)).toBe(3_000_000);
  });

  it('가중치 100%이면 전체 예산 반환', () => {
    const portfolio = mockPortfolio();
    const sector = mockSector({ targetWeight: 100 });
    expect(getSectorBudget(portfolio, sector)).toBe(10_000_000);
  });

  it('가중치 0%이면 0 반환', () => {
    const portfolio = mockPortfolio();
    const sector = mockSector({ targetWeight: 0 });
    expect(getSectorBudget(portfolio, sector)).toBe(0);
  });

  it('예산이 0이면 0 반환', () => {
    const portfolio = mockPortfolio({ totalBudget: 0 });
    const sector = portfolio.sectors[0];
    expect(getSectorBudget(portfolio, sector)).toBe(0);
  });
});

// ─── getCompanyBudget ───

describe('getCompanyBudget', () => {
  it('총 예산 × 기업 비중으로 계산', () => {
    const portfolio = mockPortfolio();
    const sector = portfolio.sectors[0];
    const company = sector.companies[0]; // 50%
    // 10,000,000 × 50% = 5,000,000
    expect(getCompanyBudget(portfolio, sector, company)).toBe(5_000_000);
  });

  it('기업 비중 30%이면 총 예산의 30%', () => {
    const company = mockCompany({ targetWeight: 30 });
    const sector = mockSector({ companies: [company] });
    const portfolio = mockPortfolio({ sectors: [sector] });
    // 10,000,000 × 30% = 3,000,000
    expect(getCompanyBudget(portfolio, sector, company)).toBe(3_000_000);
  });
});

// ─── getTotalPurchaseAmount ───

describe('getTotalPurchaseAmount', () => {
  it('단일 매수 내역 합산', () => {
    const company = mockCompany();
    // 10 × 75,000 = 750,000
    expect(getTotalPurchaseAmount(company)).toBe(750_000);
  });

  it('매수 내역이 없으면 0', () => {
    const company = mockCompany({ purchases: [] });
    expect(getTotalPurchaseAmount(company)).toBe(0);
  });

  it('여러 건 합산', () => {
    const company = mockCompany({
      purchases: [
        { id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 75000, currency: 'KRW' },
        { id: 'p2', type: 'buy', date: '2026-03-11', quantity: 5, pricePerShare: 76000, currency: 'KRW' },
      ],
    });
    expect(getTotalPurchaseAmount(company)).toBe(750_000 + 380_000);
  });

  it('USD 매수도 동일하게 합산', () => {
    const company = mockCompany({
      market: 'NASDAQ',
      purchases: [
        { id: 'p1', type: 'buy', date: '2026-03-10', quantity: 5, pricePerShare: 150, currency: 'USD' },
        { id: 'p2', type: 'buy', date: '2026-03-11', quantity: 3, pricePerShare: 155, currency: 'USD' },
      ],
    });
    // 5×150 + 3×155 = 750 + 465 = 1,215
    expect(getTotalPurchaseAmount(company)).toBe(1_215);
  });
});

// ─── getTotalQuantity ───

describe('getTotalQuantity', () => {
  it('단일 건 수량', () => {
    const company = mockCompany();
    expect(getTotalQuantity(company)).toBe(10);
  });

  it('여러 건 수량 합산', () => {
    const company = mockCompany({
      purchases: [
        { id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 75000, currency: 'KRW' },
        { id: 'p2', type: 'buy', date: '2026-03-11', quantity: 5, pricePerShare: 76000, currency: 'KRW' },
      ],
    });
    expect(getTotalQuantity(company)).toBe(15);
  });

  it('매수 내역 없으면 0', () => {
    expect(getTotalQuantity(mockCompany({ purchases: [] }))).toBe(0);
  });
});

// ─── getBuyableQuantity ───

describe('getBuyableQuantity', () => {
  it('정확히 나누어 떨어지는 경우', () => {
    expect(getBuyableQuantity(1_500_000, 75_000)).toBe(20);
  });

  it('나누어 떨어지지 않으면 내림 (소수점 주식 불가)', () => {
    expect(getBuyableQuantity(1_500_000, 76_000)).toBe(19);
  });

  it('현재가가 0이면 0 반환', () => {
    expect(getBuyableQuantity(1_500_000, 0)).toBe(0);
  });

  it('현재가가 음수이면 0 반환', () => {
    expect(getBuyableQuantity(1_500_000, -100)).toBe(0);
  });

  it('배정금액이 현재가보다 작으면 0', () => {
    expect(getBuyableQuantity(50_000, 75_000)).toBe(0);
  });

  it('배정금액이 0이면 0', () => {
    expect(getBuyableQuantity(0, 75_000)).toBe(0);
  });
});

// ─── 비중 합계 헬퍼 ───

describe('getSectorCompanyWeightSum', () => {
  it('기업 비중 합산', () => {
    const sector = mockSector({
      companies: [
        mockCompany({ id: 'c1', targetWeight: 40 }),
        mockCompany({ id: 'c2', targetWeight: 35 }),
        mockCompany({ id: 'c3', targetWeight: 25 }),
      ],
    });
    expect(getSectorCompanyWeightSum(sector)).toBe(100);
  });

  it('기업이 없으면 0', () => {
    expect(getSectorCompanyWeightSum(mockSector({ companies: [] }))).toBe(0);
  });
});

describe('getTotalSectorWeightSum', () => {
  it('섹터 비중 합산', () => {
    const portfolio = mockPortfolio({
      sectors: [
        mockSector({ targetWeight: 30 }),
        mockSector({ id: 's2', targetWeight: 45 }),
        mockSector({ id: 's3', targetWeight: 25 }),
      ],
    });
    expect(getTotalSectorWeightSum(portfolio)).toBe(100);
  });

  it('섹터가 없으면 0', () => {
    expect(getTotalSectorWeightSum(mockPortfolio({ sectors: [] }))).toBe(0);
  });
});

// ─── validateSectorWeights ───

describe('validateSectorWeights', () => {
  it('합계 100%이면 valid', () => {
    const portfolio = mockPortfolio({
      sectors: [
        mockSector({ targetWeight: 60 }),
        mockSector({ id: 'sec_2', targetWeight: 40 }),
      ],
    });
    const result = validateSectorWeights(portfolio);
    expect(result.isValid).toBe(true);
    expect(result.total).toBe(100);
    expect(result.diff).toBe(0);
  });

  it('합계 미달이면 invalid + 음수 diff', () => {
    const portfolio = mockPortfolio({
      sectors: [mockSector({ targetWeight: 30 })],
    });
    const result = validateSectorWeights(portfolio);
    expect(result.isValid).toBe(false);
    expect(result.total).toBe(30);
    expect(result.diff).toBe(-70);
  });

  it('합계 초과이면 invalid + 양수 diff', () => {
    const portfolio = mockPortfolio({
      sectors: [
        mockSector({ targetWeight: 60 }),
        mockSector({ id: 'sec_2', targetWeight: 50 }),
      ],
    });
    const result = validateSectorWeights(portfolio);
    expect(result.isValid).toBe(false);
    expect(result.total).toBe(110);
    expect(result.diff).toBe(10);
  });

  it('섹터가 없으면 invalid (합계 0)', () => {
    const result = validateSectorWeights(mockPortfolio({ sectors: [] }));
    expect(result.isValid).toBe(false);
    expect(result.total).toBe(0);
  });

  it('소수점 비중도 허용 (99.99 + 0.01 = 100)', () => {
    const portfolio = mockPortfolio({
      sectors: [
        mockSector({ targetWeight: 99.99 }),
        mockSector({ id: 's2', targetWeight: 0.01 }),
      ],
    });
    expect(validateSectorWeights(portfolio).isValid).toBe(true);
  });
});

// ─── validateCompanyWeights ───

describe('validateCompanyWeights', () => {
  it('합계가 섹터 비중과 같으면 valid', () => {
    const sector = mockSector({
      targetWeight: 30,
      companies: [
        mockCompany({ id: 'c1', targetWeight: 18 }),
        mockCompany({ id: 'c2', targetWeight: 12 }),
      ],
    });
    expect(validateCompanyWeights(sector).isValid).toBe(true);
  });

  it('합계 미달이면 invalid', () => {
    const sector = mockSector({
      targetWeight: 50,
      companies: [
        mockCompany({ id: 'c1', targetWeight: 15 }),
        mockCompany({ id: 'c2', targetWeight: 10 }),
      ],
    });
    const result = validateCompanyWeights(sector);
    expect(result.isValid).toBe(false);
    expect(result.total).toBe(25);
    expect(result.diff).toBe(-25);
  });

  it('기업이 없으면 invalid', () => {
    const sector = mockSector({ targetWeight: 30, companies: [] });
    expect(validateCompanyWeights(sector).isValid).toBe(false);
  });
});

// ─── calculateWeights ───

describe('calculateWeights', () => {
  // --- 매수 기준 비중 ---

  it('단일 섹터 단일 기업이면 비중 100%', () => {
    const portfolio = mockPortfolio({
      totalBudget: 750_000, // 10 × 75,000 = 750,000 매수금액과 동일
      sectors: [mockSector({ targetWeight: 100, companies: [mockCompany()] })],
    });
    const result = calculateWeights(portfolio, {}, 1300);
    expect(result[0].purchaseWeight).toBe(100);
    expect(result[0].companies[0].purchaseWeight).toBe(100);
  });

  it('동일 섹터 내 두 기업의 매수 기준 비중', () => {
    const company1 = mockCompany({
      id: 'c1', ticker: '005930', targetWeight: 50,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 75000, currency: 'KRW' }],
    });
    const company2 = mockCompany({
      id: 'c2', name: 'SK하이닉스', ticker: '000660', targetWeight: 50,
      purchases: [{ id: 'p2', type: 'buy', date: '2026-03-10', quantity: 5, pricePerShare: 150000, currency: 'KRW' }],
    });
    const portfolio = mockPortfolio({
      totalBudget: 1_500_000, // 750,000 + 750,000
      sectors: [mockSector({ companies: [company1, company2] })],
    });

    const result = calculateWeights(portfolio, {}, 1300);
    // 750,000 vs 750,000 → 50:50
    expect(result[0].companies[0].purchaseWeight).toBe(50);
    expect(result[0].companies[1].purchaseWeight).toBe(50);
  });

  it('두 섹터 간 매수 기준 비중', () => {
    const sectorA = mockSector({
      id: 's1', name: 'IT', targetWeight: 60,
      companies: [mockCompany({
        id: 'c1', purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 60000, currency: 'KRW' }],
      })],
    });
    const sectorB = mockSector({
      id: 's2', name: '금융', targetWeight: 40,
      companies: [mockCompany({
        id: 'c2', ticker: '055550',
        purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 40000, currency: 'KRW' }],
      })],
    });
    const portfolio = mockPortfolio({ totalBudget: 1_000_000, sectors: [sectorA, sectorB] });
    const result = calculateWeights(portfolio, {}, 1300);
    // IT: 600,000, 금융: 400,000, 예산: 1,000,000
    expect(result[0].purchaseWeight).toBe(60);
    expect(result[1].purchaseWeight).toBe(40);
  });

  // --- 시가 기준 비중 ---

  it('시가 기준 비중 계산 (주가 변동 반영)', () => {
    const company1 = mockCompany({
      id: 'c1', ticker: '005930', targetWeight: 50,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 75000, currency: 'KRW' }],
    });
    const company2 = mockCompany({
      id: 'c2', name: 'SK하이닉스', ticker: '000660', targetWeight: 50,
      purchases: [{ id: 'p2', type: 'buy', date: '2026-03-10', quantity: 5, pricePerShare: 150000, currency: 'KRW' }],
    });
    const portfolio = mockPortfolio({
      totalBudget: 1_500_000, // 시가 총합과 동일하게 설정
      sectors: [mockSector({ companies: [company1, company2] })],
    });

    const quotes = { '005930': { price: 80000 }, '000660': { price: 140000 } };
    const result = calculateWeights(portfolio, quotes, 1300);

    // 시가: 삼성 10×80,000=800,000 vs SK 5×140,000=700,000, 예산: 1,500,000
    expect(result[0].companies[0].marketWeight).toBeCloseTo((800_000 / 1_500_000) * 100, 1);
    expect(result[0].companies[1].marketWeight).toBeCloseTo((700_000 / 1_500_000) * 100, 1);
  });

  it('quotes가 없으면 시가 기준 marketValue는 0', () => {
    const portfolio = mockPortfolio();
    const result = calculateWeights(portfolio, {}, 1300);
    expect(result[0].companies[0].marketValue).toBe(0);
  });

  it('일부 종목만 quote가 있으면 해당 종목만 시가 반영', () => {
    const company1 = mockCompany({
      id: 'c1', ticker: '005930', targetWeight: 50,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 75000, currency: 'KRW' }],
    });
    const company2 = mockCompany({
      id: 'c2', ticker: '000660', targetWeight: 50,
      purchases: [{ id: 'p2', type: 'buy', date: '2026-03-10', quantity: 5, pricePerShare: 150000, currency: 'KRW' }],
    });
    const portfolio = mockPortfolio({
      sectors: [mockSector({ companies: [company1, company2] })],
    });

    // 삼성만 quote 있음
    const quotes = { '005930': { price: 80000 } };
    const result = calculateWeights(
      { ...portfolio, totalBudget: 800_000 }, // 시가 있는 종목 시가와 동일
      quotes, 1300,
    );

    expect(result[0].companies[0].marketValue).toBe(800_000);
    expect(result[0].companies[1].marketValue).toBe(0); // quote 없음
    // 시가 기준 비중: 삼성 800k/800k=100%, SK 0%
    expect(result[0].companies[0].marketWeight).toBe(100);
    expect(result[0].companies[1].marketWeight).toBe(0);
  });

  // --- KRX + US 혼합 ---

  it('KRX + US 혼합 포트폴리오 매수 기준 환율 반영', () => {
    const krxCompany = mockCompany({
      id: 'c1', ticker: '005930', market: 'KRX', targetWeight: 50,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 75000, currency: 'KRW' }],
    });
    const usCompany = mockCompany({
      id: 'c2', name: 'Apple', ticker: 'AAPL', market: 'NASDAQ', targetWeight: 50,
      purchases: [{ id: 'p2', type: 'buy', date: '2026-03-10', quantity: 5, pricePerShare: 150, currency: 'USD' }],
    });
    const portfolio = mockPortfolio({
      sectors: [
        mockSector({ id: 's1', name: '한국IT', targetWeight: 50, companies: [krxCompany] }),
        mockSector({ id: 's2', name: '미국IT', targetWeight: 50, companies: [usCompany] }),
      ],
    });

    const rate = 1300;
    // KRX: 10×75,000 = 750,000 KRW
    // US: 5×150 = 750 USD → 750×1300 = 975,000 KRW
    // 예산: 1,725,000
    const result = calculateWeights({ ...portfolio, totalBudget: 1_725_000 }, {}, rate);
    expect(result[0].purchaseWeight).toBeCloseTo((750_000 / 1_725_000) * 100, 1);
    expect(result[1].purchaseWeight).toBeCloseTo((975_000 / 1_725_000) * 100, 1);
  });

  it('KRX + US 혼합 시가 기준도 환율 반영', () => {
    const krxCompany = mockCompany({
      id: 'c1', ticker: '005930', market: 'KRX', targetWeight: 50,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 75000, currency: 'KRW' }],
    });
    const usCompany = mockCompany({
      id: 'c2', name: 'Apple', ticker: 'AAPL', market: 'NASDAQ', targetWeight: 50,
      purchases: [{ id: 'p2', type: 'buy', date: '2026-03-10', quantity: 5, pricePerShare: 150, currency: 'USD' }],
    });
    const portfolio = mockPortfolio({
      totalBudget: 2_100_000, // 시가 총합과 동일
      sectors: [
        mockSector({ id: 's1', targetWeight: 50, companies: [krxCompany] }),
        mockSector({ id: 's2', targetWeight: 50, companies: [usCompany] }),
      ],
    });

    const rate = 1300;
    const quotes = { '005930': { price: 80000 }, 'AAPL': { price: 200 } };
    const result = calculateWeights(portfolio, quotes, rate);

    // 시가: 삼성 10×80,000 = 800,000 KRW, Apple 5×200 = 1,000 USD → 1,300,000 KRW
    // 예산: 2,100,000
    expect(result[0].marketWeight).toBeCloseTo((800_000 / 2_100_000) * 100, 1);
    expect(result[1].marketWeight).toBeCloseTo((1_300_000 / 2_100_000) * 100, 1);
  });

  // --- 이탈 상태 ---

  it('목표 대비 초과면 over, 미달이면 under, 정상이면 normal', () => {
    const sectorA = mockSector({
      id: 's1', targetWeight: 40,
      companies: [mockCompany({
        id: 'c1', targetWeight: 40,
        purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 60000, currency: 'KRW' }],
      })],
    });
    const sectorB = mockSector({
      id: 's2', targetWeight: 60,
      companies: [mockCompany({
        id: 'c2', ticker: '000660', targetWeight: 60,
        purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 40000, currency: 'KRW' }],
      })],
    });
    const portfolio = mockPortfolio({ totalBudget: 1_000_000, sectors: [sectorA, sectorB] });
    const result = calculateWeights(portfolio, {}, 1300);
    // A: 600,000/1,000,000 = 60%, 목표 40% → over +20%p
    // B: 400,000/1,000,000 = 40%, 목표 60% → under -20%p
    expect(result[0].purchaseStatus).toBe('over');
    expect(result[0].purchaseDiff).toBeCloseTo(20, 1);
    expect(result[1].purchaseStatus).toBe('under');
    expect(result[1].purchaseDiff).toBeCloseTo(-20, 1);
  });

  it('비중이 정확히 목표와 일치하면 normal', () => {
    const sector = mockSector({
      targetWeight: 100,
      companies: [
        mockCompany({
          id: 'c1', targetWeight: 50,
          purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 100, currency: 'KRW' }],
        }),
        mockCompany({
          id: 'c2', ticker: '000660', targetWeight: 50,
          purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 100, currency: 'KRW' }],
        }),
      ],
    });
    const portfolio = mockPortfolio({ totalBudget: 2_000, sectors: [sector] });
    const result = calculateWeights(portfolio, {}, 1300);
    expect(result[0].purchaseStatus).toBe('normal');
    expect(result[0].companies[0].purchaseStatus).toBe('normal');
    expect(result[0].companies[1].purchaseStatus).toBe('normal');
  });

  // --- 통화별 소계 ---

  it('KRW/USD 소계가 올바르게 분리됨', () => {
    const krxCompany = mockCompany({
      id: 'c1', market: 'KRX', targetWeight: 50,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 50000, currency: 'KRW' }],
    });
    const usCompany = mockCompany({
      id: 'c2', name: 'MSFT', ticker: 'MSFT', market: 'NYSE', targetWeight: 50,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 3, pricePerShare: 400, currency: 'USD' }],
    });
    const portfolio = mockPortfolio({
      sectors: [
        mockSector({ id: 's1', companies: [krxCompany] }),
        mockSector({ id: 's2', companies: [usCompany] }),
      ],
    });

    const quotes = { '005930': { price: 55000 }, 'MSFT': { price: 420 } };
    const result = calculateWeights(portfolio, quotes, 1300);

    // s1 (KRX): purchaseAmountKRW=500,000, marketValueKRW=550,000, USD=0
    expect(result[0].purchaseAmountKRW).toBe(500_000);
    expect(result[0].purchaseAmountUSD).toBe(0);
    expect(result[0].marketValueKRW).toBe(550_000);
    expect(result[0].marketValueUSD).toBe(0);

    // s2 (NYSE): purchaseAmountUSD=1,200, marketValueUSD=1,260, KRW=0
    expect(result[1].purchaseAmountKRW).toBe(0);
    expect(result[1].purchaseAmountUSD).toBe(1_200);
    expect(result[1].marketValueKRW).toBe(0);
    expect(result[1].marketValueUSD).toBe(1_260);
  });

  // --- 엣지 케이스 ---

  it('매수 내역 없으면 비중 0', () => {
    const portfolio = mockPortfolio({
      sectors: [mockSector({ companies: [mockCompany({ purchases: [] })] })],
    });
    const result = calculateWeights(portfolio, {}, 1300);
    expect(result[0].purchaseWeight).toBe(0);
    expect(result[0].companies[0].purchaseWeight).toBe(0);
  });

  it('섹터 없으면 빈 배열', () => {
    const result = calculateWeights(mockPortfolio({ sectors: [] }), {}, 1300);
    expect(result).toHaveLength(0);
  });

  it('exchangeRate가 null이면 fallback 1300 사용', () => {
    const usCompany = mockCompany({
      id: 'c1', market: 'NASDAQ', ticker: 'AAPL', targetWeight: 30,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 1, pricePerShare: 100, currency: 'USD' }],
    });
    const portfolio = mockPortfolio({
      sectors: [mockSector({ companies: [usCompany] })],
    });

    const resultNull = calculateWeights(portfolio, {}, null);
    const result1300 = calculateWeights(portfolio, {}, 1300);
    // 둘 다 동일해야 함
    expect(resultNull[0].purchaseWeight).toBe(result1300[0].purchaseWeight);
  });

  it('3개 섹터 5개 기업 복잡 시나리오', () => {
    const portfolio = mockPortfolio({
      sectors: [
        mockSector({
          id: 's1', name: 'IT', targetWeight: 50,
          companies: [
            mockCompany({ id: 'c1', ticker: 'A', targetWeight: 30,
              purchases: [{ id: 'p1', type: 'buy', date: '2026-01-01', quantity: 30, pricePerShare: 100, currency: 'KRW' }],
            }),
            mockCompany({ id: 'c2', ticker: 'B', targetWeight: 20,
              purchases: [{ id: 'p1', type: 'buy', date: '2026-01-01', quantity: 20, pricePerShare: 100, currency: 'KRW' }],
            }),
          ],
        }),
        mockSector({
          id: 's2', name: '금융', targetWeight: 30,
          companies: [
            mockCompany({ id: 'c3', ticker: 'C', targetWeight: 15,
              purchases: [{ id: 'p1', type: 'buy', date: '2026-01-01', quantity: 15, pricePerShare: 100, currency: 'KRW' }],
            }),
            mockCompany({ id: 'c4', ticker: 'D', targetWeight: 15,
              purchases: [{ id: 'p1', type: 'buy', date: '2026-01-01', quantity: 15, pricePerShare: 100, currency: 'KRW' }],
            }),
          ],
        }),
        mockSector({
          id: 's3', name: '헬스케어', targetWeight: 20,
          companies: [
            mockCompany({ id: 'c5', ticker: 'E', targetWeight: 20,
              purchases: [{ id: 'p1', type: 'buy', date: '2026-01-01', quantity: 20, pricePerShare: 100, currency: 'KRW' }],
            }),
          ],
        }),
      ],
    });

    const result = calculateWeights({ ...portfolio, totalBudget: 10_000 }, {}, 1300);
    // 총 매수: 3000+2000+1500+1500+2000 = 10,000, 예산: 10,000
    // IT: 5000/10000 = 50%, 금융: 3000/10000 = 30%, 헬스케어: 2000/10000 = 20%
    expect(result[0].purchaseWeight).toBeCloseTo(50, 1);
    expect(result[1].purchaseWeight).toBeCloseTo(30, 1);
    expect(result[2].purchaseWeight).toBeCloseTo(20, 1);

    // 포트폴리오 전체 대비: A=3000/10000=30%, B=2000/10000=20%
    expect(result[0].companies[0].purchaseWeight).toBeCloseTo(30, 1);
    expect(result[0].companies[1].purchaseWeight).toBeCloseTo(20, 1);

    // 목표와 정확히 일치 → 이탈 없음
    expect(result[0].purchaseStatus).toBe('normal');
    expect(result[1].purchaseStatus).toBe('normal');
    expect(result[2].purchaseStatus).toBe('normal');
  });
});

// ─── calculateRebalance ───

describe('calculateRebalance', () => {
  it('초과 종목은 매도, 미달 종목은 매수 추천', () => {
    const company1 = mockCompany({
      id: 'c1', ticker: '005930', targetWeight: 50,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 20, pricePerShare: 75000, currency: 'KRW' }],
    });
    const company2 = mockCompany({
      id: 'c2', name: 'SK하이닉스', ticker: '000660', targetWeight: 50,
      purchases: [{ id: 'p2', type: 'buy', date: '2026-03-10', quantity: 5, pricePerShare: 150000, currency: 'KRW' }],
    });
    const portfolio = mockPortfolio({
      // 총 시가: 20×100,000 + 5×100,000 = 2,500,000
      totalBudget: 2_500_000,
      sectors: [mockSector({ targetWeight: 100, companies: [company1, company2] })],
    });

    const quotes = { '005930': { price: 100000 }, '000660': { price: 100000 } };
    const items = calculateRebalance(portfolio, quotes, 1300);

    // 예산 2,500,000, 목표 50:50 → 각 1,250,000
    // 삼성 목표 수량: floor(1,250,000/100,000) = 12 → 현재 20 → 매도 8
    // SK 목표 수량: floor(1,250,000/100,000) = 12 → 현재 5 → 매수 7
    const sellItem = items.find((i) => i.action === 'sell');
    const buyItem = items.find((i) => i.action === 'buy');

    expect(sellItem).toBeDefined();
    expect(sellItem!.ticker).toBe('005930');
    expect(sellItem!.deltaQuantity).toBe(8);
    expect(sellItem!.currentQuantity).toBe(20);
    expect(sellItem!.targetQuantity).toBe(12);
    expect(sellItem!.estimatedAmount).toBe(800_000); // 8 × 100,000
    expect(sellItem!.currency).toBe('KRW');

    expect(buyItem).toBeDefined();
    expect(buyItem!.ticker).toBe('000660');
    expect(buyItem!.deltaQuantity).toBe(7);
    expect(buyItem!.currentQuantity).toBe(5);
    expect(buyItem!.targetQuantity).toBe(12);
    expect(buyItem!.estimatedAmount).toBe(700_000); // 7 × 100,000
  });

  it('매수 기록이 없으면 빈 배열 반환', () => {
    const portfolio = mockPortfolio({
      sectors: [mockSector({ companies: [mockCompany({ purchases: [] })] })],
    });
    const items = calculateRebalance(portfolio, { '005930': { price: 75000 } }, 1300);
    expect(items).toHaveLength(0);
  });

  it('비중이 정상이면 빈 배열 반환', () => {
    const company1 = mockCompany({
      id: 'c1', ticker: '005930', targetWeight: 50,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 75000, currency: 'KRW' }],
    });
    const company2 = mockCompany({
      id: 'c2', ticker: '000660', targetWeight: 50,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 75000, currency: 'KRW' }],
    });
    // 총 시가: 10×75,000 + 10×75,000 = 1,500,000
    const portfolio = mockPortfolio({
      totalBudget: 1_500_000,
      sectors: [mockSector({ targetWeight: 100, companies: [company1, company2] })],
    });

    const quotes = { '005930': { price: 75000 }, '000660': { price: 75000 } };
    const items = calculateRebalance(portfolio, quotes, 1300);
    expect(items).toHaveLength(0);
  });

  it('매도가 매수보다 앞에 정렬됨', () => {
    const company1 = mockCompany({
      id: 'c1', ticker: '005930', targetWeight: 50,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 20, pricePerShare: 75000, currency: 'KRW' }],
    });
    const company2 = mockCompany({
      id: 'c2', ticker: '000660', targetWeight: 50,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 5, pricePerShare: 75000, currency: 'KRW' }],
    });
    // 총 시가: 20×75,000 + 5×75,000 = 1,875,000
    const portfolio = mockPortfolio({
      totalBudget: 1_875_000,
      sectors: [mockSector({ targetWeight: 100, companies: [company1, company2] })],
    });

    const quotes = { '005930': { price: 75000 }, '000660': { price: 75000 } };
    const items = calculateRebalance(portfolio, quotes, 1300);

    const sellIndex = items.findIndex((i) => i.action === 'sell');
    const buyIndex = items.findIndex((i) => i.action === 'buy');
    if (sellIndex !== -1 && buyIndex !== -1) {
      expect(sellIndex).toBeLessThan(buyIndex);
    }
  });

  it('quote가 없는 종목은 리밸런싱에서 제외', () => {
    const company1 = mockCompany({
      id: 'c1', ticker: '005930', targetWeight: 50,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 20, pricePerShare: 75000, currency: 'KRW' }],
    });
    const company2 = mockCompany({
      id: 'c2', ticker: '000660', targetWeight: 50,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 5, pricePerShare: 75000, currency: 'KRW' }],
    });
    // 총 시가: 20×75,000 + 5×75,000 = 1,875,000
    const portfolio = mockPortfolio({
      totalBudget: 1_875_000,
      sectors: [mockSector({ targetWeight: 100, companies: [company1, company2] })],
    });

    // 삼성만 quote 있음
    const quotes = { '005930': { price: 75000 } };
    const items = calculateRebalance(portfolio, quotes, 1300);
    // 000660은 quote 없으므로 결과에 포함되지 않음
    expect(items.every((i) => i.ticker !== '000660')).toBe(true);
  });

  it('섹터 전체가 초과/미달이면 sectorAction이 설정됨', () => {
    // IT 섹터에 몰빵, 금융 섹터 비중 미달
    const itCompany = mockCompany({
      id: 'c1', ticker: '005930', targetWeight: 50,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 30, pricePerShare: 100000, currency: 'KRW' }],
    });
    const finCompany = mockCompany({
      id: 'c2', ticker: '055550', targetWeight: 50,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 5, pricePerShare: 100000, currency: 'KRW' }],
    });
    const portfolio = mockPortfolio({
      totalBudget: 3_500_000, // 시가 총합과 동일
      sectors: [
        mockSector({ id: 's1', name: 'IT', targetWeight: 50, companies: [itCompany] }),
        mockSector({ id: 's2', name: '금융', targetWeight: 50, companies: [finCompany] }),
      ],
    });

    const quotes = { '005930': { price: 100000 }, '055550': { price: 100000 } };
    const items = calculateRebalance(portfolio, quotes, 1300);

    // IT: 시가 3,000,000/3,500,000 ≈ 85.7%, 목표 50% → 초과 → sell
    // 금융: 시가 500,000/3,500,000 ≈ 14.3%, 목표 50% → 미달 → buy
    const itItem = items.find((i) => i.sectorId === 's1');
    const finItem = items.find((i) => i.sectorId === 's2');

    expect(itItem).toBeDefined();
    expect(itItem!.sectorAction).toBe('sell');
    expect(itItem!.action).toBe('sell');

    expect(finItem).toBeDefined();
    expect(finItem!.sectorAction).toBe('buy');
    expect(finItem!.action).toBe('buy');
  });

  it('KRX + US 혼합 리밸런싱에서 통화가 올바르게 설정됨', () => {
    const krxCompany = mockCompany({
      id: 'c1', ticker: '005930', market: 'KRX', targetWeight: 50,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 20, pricePerShare: 75000, currency: 'KRW' }],
    });
    const usCompany = mockCompany({
      id: 'c2', name: 'Apple', ticker: 'AAPL', market: 'NASDAQ', targetWeight: 50,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 2, pricePerShare: 150, currency: 'USD' }],
    });
    const rate = 1300;
    // KRX 시가: 20×75,000 = 1,500,000, US 시가: 2×200×1300 = 520,000
    const portfolio = mockPortfolio({
      totalBudget: 1_500_000 + 520_000,
      sectors: [
        mockSector({ id: 's1', targetWeight: 50, companies: [krxCompany] }),
        mockSector({ id: 's2', targetWeight: 50, companies: [usCompany] }),
      ],
    });
    const quotes = { '005930': { price: 75000 }, 'AAPL': { price: 200 } };
    const items = calculateRebalance(portfolio, quotes, rate);

    const krxItem = items.find((i) => i.ticker === '005930');
    const usItem = items.find((i) => i.ticker === 'AAPL');

    if (krxItem) expect(krxItem.currency).toBe('KRW');
    if (usItem) expect(usItem.currency).toBe('USD');
  });

  it('US 종목의 목표 수량이 USD 기준으로 정확히 계산됨', () => {
    // 모든 포트폴리오를 US 종목 하나로 단순화
    const usCompany = mockCompany({
      id: 'c1', name: 'Apple', ticker: 'AAPL', market: 'NASDAQ', targetWeight: 100,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 200, currency: 'USD' }],
    });
    const rate = 1300;
    // 시가: 10 × $200 × 1300 = 2,600,000
    const portfolio = mockPortfolio({
      totalBudget: 2_600_000,
      sectors: [mockSector({ targetWeight: 100, companies: [usCompany] }),],
    });

    const quotes = { 'AAPL': { price: 200 } };
    const items = calculateRebalance(portfolio, quotes, rate);

    // 단일 종목, 단일 섹터 100% → 이미 균형 → 빈 배열
    expect(items).toHaveLength(0);
  });

  it('다중 섹터 다중 기업 복합 리밸런싱', () => {
    // 총 시가: 10,000 + 10,000 + 10,000 = 30,000
    const portfolio = mockPortfolio({
      totalBudget: 30_000,
      sectors: [
        mockSector({
          id: 's1', name: 'IT', targetWeight: 60,
          companies: [
            mockCompany({ id: 'c1', ticker: 'A', targetWeight: 42,
              purchases: [{ id: 'p1', type: 'buy', date: '2026-01-01', quantity: 10, pricePerShare: 1000, currency: 'KRW' }],
            }),
            mockCompany({ id: 'c2', ticker: 'B', targetWeight: 18,
              purchases: [{ id: 'p1', type: 'buy', date: '2026-01-01', quantity: 10, pricePerShare: 1000, currency: 'KRW' }],
            }),
          ],
        }),
        mockSector({
          id: 's2', name: '금융', targetWeight: 40,
          companies: [
            mockCompany({ id: 'c3', ticker: 'C', targetWeight: 40,
              purchases: [{ id: 'p1', type: 'buy', date: '2026-01-01', quantity: 10, pricePerShare: 1000, currency: 'KRW' }],
            }),
          ],
        }),
      ],
    });

    // 모두 동일 가격
    const quotes = { 'A': { price: 1000 }, 'B': { price: 1000 }, 'C': { price: 1000 } };
    const items = calculateRebalance(portfolio, quotes, 1300);

    // 예산 30,000
    // A 목표: 30,000×42% = 12,600 → 12주
    // B 목표: 30,000×18% = 5,400 → 5주
    // C 목표: 30,000×40% = 12,000 → 12주

    // A: 현재 10 → 목표 12 → 매수 2
    const itemA = items.find((i) => i.ticker === 'A');
    expect(itemA).toBeDefined();
    expect(itemA!.action).toBe('buy');
    expect(itemA!.deltaQuantity).toBe(2);

    // B: 현재 10 → 목표 5 → 매도 5
    const itemB = items.find((i) => i.ticker === 'B');
    expect(itemB).toBeDefined();
    expect(itemB!.action).toBe('sell');
    expect(itemB!.deltaQuantity).toBe(5);

    // C: 현재 10 → 목표 12 → 매수 2
    const itemC = items.find((i) => i.ticker === 'C');
    expect(itemC).toBeDefined();
    expect(itemC!.action).toBe('buy');
    expect(itemC!.deltaQuantity).toBe(2);
  });

  it('estimatedAmount = deltaQuantity × currentPrice', () => {
    const company1 = mockCompany({
      id: 'c1', ticker: '005930', targetWeight: 50,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 30, pricePerShare: 75000, currency: 'KRW' }],
    });
    const company2 = mockCompany({
      id: 'c2', ticker: '000660', targetWeight: 50,
      purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 5, pricePerShare: 75000, currency: 'KRW' }],
    });
    // 총 시가: 30×80,000 + 5×80,000 = 2,800,000
    const portfolio = mockPortfolio({
      totalBudget: 2_800_000,
      sectors: [mockSector({ targetWeight: 100, companies: [company1, company2] })],
    });

    const quotes = { '005930': { price: 80000 }, '000660': { price: 80000 } };
    const items = calculateRebalance(portfolio, quotes, 1300);

    for (const item of items) {
      expect(item.estimatedAmount).toBe(item.deltaQuantity * item.currentPrice);
    }
  });

  it('포트폴리오가 비어있으면 빈 배열', () => {
    const portfolio = mockPortfolio({ sectors: [] });
    expect(calculateRebalance(portfolio, {}, 1300)).toHaveLength(0);
  });

  it('quotes가 비어있으면 빈 배열 (시가 계산 불가)', () => {
    const portfolio = mockPortfolio({
      sectors: [mockSector({
        targetWeight: 100,
        companies: [mockCompany({
          purchases: [{ id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 75000, currency: 'KRW' }],
        })],
      })],
    });
    expect(calculateRebalance(portfolio, {}, 1300)).toHaveLength(0);
  });
});

// ─── buy/sell 혼합 계산 ───

describe('buy/sell 혼합 보유수량 및 수익률', () => {
  it('보유수량 = buy 합계 - sell 합계', () => {
    const company = mockCompany({
      purchases: [
        { id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 75000, currency: 'KRW' },
        { id: 'p2', type: 'buy', date: '2026-03-12', quantity: 5, pricePerShare: 76000, currency: 'KRW' },
        { id: 'p3', type: 'sell', date: '2026-03-15', quantity: 3, pricePerShare: 80000, currency: 'KRW' },
      ],
    });
    expect(getTotalQuantity(company)).toBe(12); // 10+5-3
  });

  it('매수금액은 buy 거래만 합산', () => {
    const company = mockCompany({
      purchases: [
        { id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 75000, currency: 'KRW' },
        { id: 'p2', type: 'sell', date: '2026-03-15', quantity: 3, pricePerShare: 80000, currency: 'KRW' },
      ],
    });
    // buy만: 10 × 75,000 = 750,000 (sell은 제외)
    expect(getTotalPurchaseAmount(company)).toBe(750_000);
  });

  it('전량 매도 시 보유수량 0', () => {
    const company = mockCompany({
      purchases: [
        { id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 75000, currency: 'KRW' },
        { id: 'p2', type: 'sell', date: '2026-03-15', quantity: 10, pricePerShare: 80000, currency: 'KRW' },
      ],
    });
    expect(getTotalQuantity(company)).toBe(0);
  });

  it('sell만 있으면 보유수량 음수 (비정상 상태)', () => {
    const company = mockCompany({
      purchases: [
        { id: 'p1', type: 'sell', date: '2026-03-15', quantity: 5, pricePerShare: 80000, currency: 'KRW' },
      ],
    });
    expect(getTotalQuantity(company)).toBe(-5);
  });

  it('calculateStockReturn은 보유수량 0이면 null', () => {

    const company = mockCompany({
      purchases: [
        { id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 75000, currency: 'KRW' },
        { id: 'p2', type: 'sell', date: '2026-03-15', quantity: 10, pricePerShare: 80000, currency: 'KRW' },
      ],
    });
    expect(calculateStockReturn(company, 80000)).toBeNull();
  });

  it('calculateStockReturn: 매수 후 일부 매도, 수익률 계산', () => {

    const company = mockCompany({
      purchases: [
        { id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 75000, currency: 'KRW' },
        { id: 'p2', type: 'sell', date: '2026-03-15', quantity: 3, pricePerShare: 80000, currency: 'KRW' },
      ],
    });
    // 보유 7주, 매수 평균 단가: 750,000/10 = 75,000
    // 평가금액: 80,000 × 7 = 560,000
    // 매수금액(보유기준): 75,000 × 7 = 525,000
    // 수익률: (560,000-525,000)/525,000 × 100 ≈ 6.67%
    const ret = calculateStockReturn(company, 80000);
    expect(ret).not.toBeNull();
    expect(ret!.quantity).toBe(7);
    expect(ret!.avgPrice).toBe(75000);
    expect(ret!.returnRate).toBeCloseTo(6.67, 1);
  });

  it('calculateWeights에서 sell 반영된 보유수량으로 시가 계산', () => {
    const company = mockCompany({
      id: 'c1', ticker: '005930', targetWeight: 100,
      purchases: [
        { id: 'p1', type: 'buy', date: '2026-03-10', quantity: 10, pricePerShare: 75000, currency: 'KRW' },
        { id: 'p2', type: 'sell', date: '2026-03-15', quantity: 4, pricePerShare: 80000, currency: 'KRW' },
      ],
    });
    const portfolio = mockPortfolio({
      sectors: [mockSector({ targetWeight: 100, companies: [company] })],
    });
    const quotes = { '005930': { price: 80000 } };
    const result = calculateWeights(portfolio, quotes, 1300);
    // 보유 6주 × 80,000 = 480,000
    expect(result[0].companies[0].marketValue).toBe(480_000);
  });
});

// ─── 포맷팅 ───

describe('formatCurrency', () => {
  it('KRW 포맷', () => {
    expect(formatCurrency(1500000, 'KRW')).toBe('1,500,000원');
  });

  it('KRW 소수점 반올림', () => {
    expect(formatCurrency(1500000.7, 'KRW')).toBe('1,500,001원');
    expect(formatCurrency(1500000.3, 'KRW')).toBe('1,500,000원');
  });

  it('USD 포맷', () => {
    expect(formatCurrency(1500.5, 'USD')).toBe('$1,500.50');
  });

  it('0원', () => {
    expect(formatCurrency(0, 'KRW')).toBe('0원');
    expect(formatCurrency(0, 'USD')).toBe('$0.00');
  });
});

describe('formatNumber', () => {
  it('천 단위 콤마', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('소수점 지정', () => {
    expect(formatNumber(1234.5, 2)).toBe('1,234.50');
  });

  it('0', () => {
    expect(formatNumber(0)).toBe('0');
  });
});
